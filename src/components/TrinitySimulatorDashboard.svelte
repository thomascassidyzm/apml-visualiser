<script>
  import { onMount, onDestroy } from 'svelte';
  import { apmlSpec, flowScenes, apmlStore } from '../stores/apmlStore.js';
  import MermaidPanel from './MermaidPanel.svelte';
  import ValidationPanel from './ValidationPanel.svelte';

  let websocket = null;
  let connectionStatus = 'disconnected';
  let messages = [];
  let chatInput = '';
  let selectedScreen = null;
  let currentApml = null;
  let simulatorScreens = [];
  let technicalDetails = false;
  let flowDiagram = '';
  let messageSequence = [];
  let availableApmlFiles = [];
  let showFileSelector = false;
  let mermaidLoaded = false;
  let activeTransition = null; // Track active transition for animation
  let transitionHistory = []; // Track recent transitions
  let screenSnapshots = []; // Store screen snapshots for pixel change detection
  let detectedShowNodes = []; // Track dynamically detected SHOW nodes
  let pixelChangeThreshold = 0.1; // Threshold for detecting meaningful visual changes
  let lastScreenChecksum = null; // Checksum of last screen state
  
  // Runtime Trinity State Monitoring
  let trinityStateMonitor = {
    isActive: false,
    currentFlow: null,
    flowState: 'idle', // 'show', 'do', 'process', 'complete', 'error'
    stateHistory: [],
    performanceMetrics: {
      totalFlows: 0,
      completedFlows: 0,
      brokenFlows: 0,
      averageFlowTime: 0
    },
    realTimeScore: 0,
    lastUpdate: null
  };
  let monitoringInterval = null;

  // Subscribe to stores
  const unsubscribeApml = apmlSpec.subscribe(value => {
    if (value.parsedFlows && value.parsedFlows.length > 0) {
      // Convert APML flows to simulator format
      generateSimulatorFromApml(value);
    }
  });

  const unsubscribeScenes = flowScenes.subscribe(scenes => {
    if (scenes && scenes.length > 0) {
      generateSimulatorFromScenes(scenes);
    }
  });

  onMount(() => {
    connectWebSocket();
    initializeSimulator();
    loadMermaid();
  });
  
  async function loadMermaid() {
    try {
      // Load Mermaid from CDN
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js';
      script.onload = () => {
        window.mermaid.initialize({ 
          theme: 'dark',
          startOnLoad: false,
          flowchart: {
            useMaxWidth: true,
            htmlLabels: true
          }
        });
        mermaidLoaded = true;
        console.log('✅ Mermaid loaded successfully');
        
        // If we already have a diagram, render it
        if (flowDiagram) {
          renderMermaidDiagram();
        }
      };
      document.head.appendChild(script);
    } catch (error) {
      console.error('❌ Failed to load Mermaid:', error);
    }
  }
  
  async function renderMermaidDiagram() {
    if (!mermaidLoaded || !flowDiagram) return;
    
    try {
      const container = document.getElementById('mermaid-container');
      if (container) {
        container.innerHTML = ''; // Clear previous content
        
        const uniqueId = 'mermaid-' + Date.now();
        const { svg } = await window.mermaid.render(uniqueId, flowDiagram);
        container.innerHTML = svg;
        
        // Apply active transition animations to rendered SVG
        applyTransitionAnimations(container);
        
        console.log('✅ Mermaid diagram rendered successfully');
      }
    } catch (error) {
      console.error('❌ Failed to render Mermaid diagram:', error);
      const container = document.getElementById('mermaid-container');
      if (container) {
        container.innerHTML = `<div class="text-red-400 p-4">Failed to render diagram: ${error.message}</div>`;
      }
    }
  }
  
  // Watch for flowDiagram changes and re-render
  $: if (mermaidLoaded && flowDiagram) {
    renderMermaidDiagram();
  }
  
  function applyTransitionAnimations(container) {
    if (!activeTransition || !container) return;
    
    // Find SVG elements and apply active flow animation
    const svg = container.querySelector('svg');
    if (svg) {
      const edges = svg.querySelectorAll('.flowchart-link');
      
      edges.forEach(edge => {
        // Check if this edge represents the active transition
        const edgeElement = edge.closest('.edge');
        if (edgeElement) {
          const edgeId = edgeElement.id;
          
          // If this edge matches our active transition, animate it
          if (activeTransition && edgeId.includes(activeTransition.replace('->', '--'))) {
            edge.classList.add('active-flow');
            console.log('🎨 Applied active flow animation to edge:', edgeId);
          } else {
            edge.classList.remove('active-flow');
          }
        }
      });
    }
  }

  onDestroy(() => {
    if (websocket) {
      websocket.close();
    }
    stopTrinityMonitoring();
    unsubscribeApml();
    unsubscribeScenes();
  });

  function connectWebSocket() {
    try {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${window.location.host}`;
      websocket = new WebSocket(wsUrl);

      websocket.onopen = () => {
        connectionStatus = 'connected';
        addMessage('system', '🎨 Trinity APML Visualiser connected with beautiful simulator aesthetics!');
      };

      websocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      };

      websocket.onclose = () => {
        connectionStatus = 'disconnected';
        addMessage('system', '📱 Connection closed. Attempting to reconnect...');
        setTimeout(connectWebSocket, 3000);
      };

      websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        connectionStatus = 'error';
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      connectionStatus = 'error';
    }
  }

  function handleWebSocketMessage(data) {
    switch (data.type) {
      case 'welcome':
        addMessage('system', data.message);
        break;
      case 'file-changed':
        addMessage('system', `🔄 ${data.filepath} updated - Revalidating...`);
        loadCurrentApml();
        break;
      case 'validation-completed':
        addMessage('system', `✅ Validation complete: ${data.errorCount} errors, ${data.warningCount} warnings`);
        break;
      default:
        console.log('Unknown message type:', data.type);
    }
  }

  function addMessage(type, content) {
    messages = [...messages, {
      id: Date.now() + Math.random(),
      type,
      content,
      timestamp: new Date()
    }];
    
    // Keep only last 50 messages
    if (messages.length > 50) {
      messages = messages.slice(-50);
    }
  }
  
  // MCP Integration Functions
  async function importFromMCP() {
    addMessage('system', '🔌 Attempting MCP connection...');
    
    try {
      // Check if MCP is available (would be provided by Claude Desktop environment)
      if (typeof window !== 'undefined' && window.mcp) {
        addMessage('system', '✅ MCP connection detected');
        
        // Request APML content from MCP server
        const mcpResponse = await window.mcp.request({
          method: 'trinity_apml_import',
          params: {
            request_type: 'apml_specification',
            format: 'raw_content'
          }
        });
        
        if (mcpResponse && mcpResponse.content) {
          addMessage('system', '📄 APML content received via MCP');
          
          // Parse the MCP-provided APML
          const parseSuccess = apmlStore.parseAPML(mcpResponse.content);
          
          if (parseSuccess) {
            addMessage('system', '✨ MCP APML successfully imported and compiled!');
            generateFlowDiagram();
          } else {
            addMessage('system', '❌ Failed to parse MCP-provided APML');
          }
        } else {
          addMessage('system', '⚠️ No APML content received from MCP');
        }
      } else {
        // Fallback: simulate MCP import for demo purposes
        addMessage('system', '⚠️ MCP not available (running outside Claude Desktop)');
        addMessage('system', '🔄 Simulating MCP import with demo APML...');
        
        await loadFirstAvailableApml();
        addMessage('system', '✅ Demo APML loaded (simulating MCP import)');
      }
    } catch (error) {
      console.error('MCP Import Error:', error);
      addMessage('system', `❌ MCP import failed: ${error.message}`);
      addMessage('system', '🔄 Falling back to local APML files...');
      await loadFirstAvailableApml();
    }
  }

  function sendChatMessage() {
    if (!chatInput.trim()) return;
    
    addMessage('user', chatInput);
    
    // Generate intelligent response
    setTimeout(() => {
      const response = generateIntelligentResponse(chatInput);
      addMessage('assistant', response);
    }, 1000);
    
    chatInput = '';
  }

  function generateIntelligentResponse(userMessage) {
    const message = userMessage.toLowerCase();
    
    if (message.includes('beautiful') || message.includes('aesthetic')) {
      return '✨ The simulator aesthetics are inspired by the Railway app - dark theme, iPhone-style layouts, and smooth animations!';
    } else if (message.includes('flow') || message.includes('diagram')) {
      return '🗺️ The Mermaid flow diagram shows your APML screen transitions with beautiful color coding and real-time updates.';
    } else if (message.includes('validation') || message.includes('error')) {
      return '🔍 Trinity validation checks APML structure, syntax, and flow completeness with detailed feedback.';
    } else if (message.includes('compile') || message.includes('generate')) {
      return '🚀 Trinity can compile your APML to Vue, Svelte, or generate beautiful simulator screens automatically!';
    } else {
      return `Thanks for the feedback: "${userMessage}". Trinity combines beautiful design with powerful APML validation and compilation!`;
    }
  }

  function generateSimulatorFromApml(apmlData) {
    // Convert APML flows to simulator screens
    const screens = apmlData.stateNodes.map(node => ({
      id: node.interfaceName,
      name: node.interfaceName.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      description: node.displayContent || `Interface for ${node.interfaceName}`,
      layout: determineLayoutFromName(node.interfaceName),
      actions: node.availableActions.map(action => ({
        id: `${node.interfaceName}_${action}`,
        label: action.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        description: `Perform ${action} action`,
        nextScreenId: findNextScreen(node.interfaceName, action, apmlData.parsedFlows),
        color: getActionColor(action)
      }))
    }));

    simulatorScreens = screens;
    if (screens.length > 0 && !selectedScreen) {
      selectedScreen = screens[0];
    }
    generateFlowDiagram();
  }

  function generateSimulatorFromScenes(scenes) {
    if (!scenes || scenes.length === 0) return;
    
    const mainScene = scenes[0];
    if (mainScene.stateNodes) {
      generateSimulatorFromApml({
        stateNodes: mainScene.stateNodes,
        parsedFlows: mainScene.logicFlows || []
      });
    }
  }

  function findNextScreen(currentInterface, action, flows) {
    const flow = flows.find(f => 
      f.fromInterface === currentInterface && 
      (f.trigger === action || f.actionName === action)
    );
    return flow ? flow.redirectTo : null;
  }

  function determineLayoutFromName(interfaceName) {
    const name = interfaceName.toLowerCase();
    if (name.includes('chat') || name.includes('message')) return 'chat';
    if (name.includes('task') || name.includes('todo')) return 'task';
    if (name.includes('file') || name.includes('document')) return 'file';
    if (name.includes('team') || name.includes('member')) return 'team';
    if (name.includes('form') || name.includes('create')) return 'form';
    if (name.includes('upload')) return 'upload';
    if (name.includes('search')) return 'search';
    if (name.includes('success') || name.includes('complete')) return 'celebration';
    return 'default';
  }

  function loadCurrentApml() {
    // Reload the current APML data
    const currentFile = localStorage.getItem('currentApmlFile');
    if (currentFile) {
      // Trigger reload from server
      fetch(`/api/apml/${currentFile}`)
        .then(response => response.json())
        .then(data => {
          if (data.success && data.parsed) {
            // Convert to simulator format if it has screens
            if (data.parsed.screens) {
              currentApml = data.parsed;
              generateSimulatorScreens();
              generateFlowDiagram();
            }
          }
        })
        .catch(error => console.error('Failed to reload APML:', error));
    }
  }

  function generateSimulatorScreens() {
    if (!currentApml || !currentApml.screens) {
      simulatorScreens = [];
      return;
    }

    simulatorScreens = Object.entries(currentApml.screens).map(([screenId, screen]) => ({
      id: screenId,
      name: screen.name || screenId,
      description: screen.purpose || screen.description || 'Screen description',
      layout: determineLayout(screen),
      actions: (screen.user_actions || []).map((action, index) => ({
        id: `${screenId}_action_${index}`,
        label: action.action || action.description,
        description: action.description,
        nextScreenId: action.next_screen,
        color: getActionColor(action.action)
      }))
    }));

    // Set initial screen
    if (simulatorScreens.length > 0 && !selectedScreen) {
      selectedScreen = simulatorScreens[0];
    }
  }

  function generateFlowDiagram() {
    if (!simulatorScreens || simulatorScreens.length === 0) {
      flowDiagram = 'flowchart TD\n    A[No screens found]';
      return;
    }

    let mermaid = 'flowchart TD\n';
    
    // Add nodes with beautiful styling using simulatorScreens array
    simulatorScreens.forEach((screen, index) => {
      const cleanName = screen.name?.replace(' Screen', '') || screen.id;
      const isSelected = selectedScreen && selectedScreen.id === screen.id;
      
      // All nodes use same basic style - will be colored by class later
      mermaid += `    ${screen.id}["${cleanName}"]\n`;
    });
    
    // Add connections based on screen actions - simplified styling
    simulatorScreens.forEach(screen => {
      if (screen.actions) {
        const connections = new Set();
        screen.actions.forEach(action => {
          if (action.nextScreenId && simulatorScreens.find(s => s.id === action.nextScreenId)) {
            connections.add(action.nextScreenId);
          }
        });
        
        connections.forEach(nextScreen => {
          const transitionKey = `${screen.id}->${nextScreen}`;
          const isRecentTransition = transitionHistory.some(t => t.key === transitionKey && 
            Date.now() - t.timestamp < 3000); // Show as recent for 3 seconds
          
          if (isRecentTransition && nextScreen === selectedScreen?.id) {
            // Dotted yellow arrow for recent transition TO current screen
            mermaid += `    ${screen.id} -.-> ${nextScreen}\n`;
          } else {
            // Normal white arrow
            mermaid += `    ${screen.id} --> ${nextScreen}\n`;
          }
        });
      }
    });
    
    // Simplified styling - only blue and yellow nodes
    mermaid += `
    classDef flowScreen fill:#3b82f6,stroke:#2563eb,stroke-width:2px,color:#fff
    classDef currentScreen fill:#f59e0b,stroke:#d97706,stroke-width:3px,color:#000
`;
    
    // Apply styles: current screen is yellow, all others are blue
    simulatorScreens.forEach(screen => {
      if (selectedScreen && selectedScreen.id === screen.id) {
        mermaid += `    class ${screen.id} currentScreen\n`;
      } else {
        mermaid += `    class ${screen.id} flowScreen\n`;
      }
    });
    
    flowDiagram = mermaid;
  }

  function determineLayout(screen) {
    const screenType = screen.name?.toLowerCase() || screen.purpose?.toLowerCase() || '';
    
    if (screenType.includes('chat') || screenType.includes('message')) return 'chat';
    if (screenType.includes('task') || screenType.includes('todo')) return 'task';
    if (screenType.includes('file') || screenType.includes('document')) return 'file';
    if (screenType.includes('team') || screenType.includes('member')) return 'team';
    if (screenType.includes('form') || screenType.includes('create')) return 'form';
    if (screenType.includes('upload')) return 'upload';
    if (screenType.includes('search')) return 'search';
    if (screenType.includes('complete') || screenType.includes('success')) return 'celebration';
    
    return 'default';
  }

  function getActionColor(actionName) {
    const action = actionName?.toLowerCase() || '';
    
    if (action.includes('chat') || action.includes('message')) return 'blue';
    if (action.includes('task') || action.includes('complete')) return 'green';
    if (action.includes('file') || action.includes('upload')) return 'purple';
    if (action.includes('team') || action.includes('invite')) return 'indigo';
    if (action.includes('create') || action.includes('add')) return 'orange';
    
    return 'blue';
  }

  function selectScreen(screen) {
    selectedScreen = screen;
    generateFlowDiagram(); // Regenerate with current screen highlighted
    
    // Detect pixel changes for dynamic SHOW node generation
    detectPixelChanges();
    
    // Add to message sequence
    addToMessageSequence('app-to-user', `Screen loaded: ${screen.name}`);
  }

  function handleAction(action) {
    console.log('🎯 Trinity Action triggered:', action);
    
    // Add Trinity message logging
    addMessage('user', `Clicked "${action.label}"`);
    addToMessageSequence('user-to-app', action.label);
    
    // Immediate Trinity validation
    const validation = validateTrinityCompleteness();
    console.log('🔍 Trinity Validation:', validation);
    
    // Simulate processing with Trinity flow
    setTimeout(() => {
      addMessage('system', `🔄 Processing ${action.label} action...`);
      addToMessageSequence('app-to-app', `Processing: ${action.label}`);
      
      // Update flow diagram to show active connection with animation
      if (action.nextScreenId) {
        const transitionKey = `${selectedScreen.id}->${action.nextScreenId}`;
        console.log(`🔗 Trinity Flow: ${transitionKey}`);
        
        // Set active transition for animation
        activeTransition = transitionKey;
        
        // Add to transition history
        transitionHistory = [...transitionHistory, {
          key: transitionKey,
          timestamp: Date.now(),
          action: action.label
        }].slice(-10); // Keep only last 10 transitions
        
        // Regenerate diagram with active transition
        generateFlowDiagram();
        
        addMessage('trinity', `🔥 Active transition: ${selectedScreen.name} → ${action.nextScreenId}`);
      }
    }, 300);
    
    // Navigate to next screen if specified
    setTimeout(() => {
      if (action.nextScreenId) {
        const nextScreen = simulatorScreens.find(s => s.id === action.nextScreenId);
        if (nextScreen) {
          selectScreen(nextScreen);
          addMessage('system', `✨ Navigated to ${nextScreen.name}!`);
          addToMessageSequence('app-to-user', `Navigated to ${nextScreen.name}`);
          
          // Clear active transition and regenerate diagram
          activeTransition = null;
          generateFlowDiagram();
          
          // Detect pixel changes after navigation completes
          setTimeout(() => {
            detectPixelChanges();
          }, 100);
          
          // Add Trinity completeness feedback
          if (validation.completenessScore >= 90) {
            addMessage('trinity', `🎯 Trinity Complete! Score: ${validation.completenessScore}%`);
          } else {
            addMessage('trinity', `⚠️ Trinity Issues Found - Score: ${validation.completenessScore}%`);
            if (validation.deadEnds.length > 0) {
              addMessage('trinity', `🚫 Dead ends: ${validation.deadEnds.join(', ')}`);
            }
            if (validation.orphanedScreens.length > 0) {
              addMessage('trinity', `🏝️ Orphaned screens: ${validation.orphanedScreens.join(', ')}`);
            }
          }
        }
      } else {
        addMessage('system', `✅ Action completed: ${action.label}`);
        addToMessageSequence('app-to-user', `Action completed: ${action.label}`);
      }
    }, 800);
  }

  function addToMessageSequence(type, content) {
    messageSequence = [...messageSequence, {
      id: Date.now() + Math.random(),
      type,
      content,
      timestamp: Date.now()
    }];
    
    // Keep only last 20 messages
    if (messageSequence.length > 20) {
      messageSequence = messageSequence.slice(-20);
    }
  }

  function initializeSimulator() {
    addMessage('system', '🎨 Trinity Simulator initialized with beautiful Railway aesthetics');
    addToMessageSequence('app-to-user', 'Trinity APML Visualiser ready - Explore your APML with beautiful simulator design!');
    
    // Initialize dynamic SHOW node detection
    addMessage('trinity', '🔍 Dynamic SHOW node detection system activated');
    addMessage('trinity', `📊 Pixel change threshold: ${(pixelChangeThreshold * 100).toFixed(0)}%`);
    
    // Start runtime Trinity monitoring
    startTrinityMonitoring();
    
    // Try to load the first available APML file
    loadFirstAvailableApml();
  }

  async function loadAvailableApmlFiles() {
    try {
      addMessage('system', '📁 Loading available APML files...');
      const response = await fetch('/api/apml-files');
      const data = await response.json();
      
      if (data.success && data.files.length > 0) {
        availableApmlFiles = data.files;
        showFileSelector = true;
        addMessage('system', `📄 Found ${data.files.length} APML files. Select one to load:`);
        
        // Add interactive file selection to chat
        const fileList = data.files.map(f => `• ${f.name} (${(f.size/1024).toFixed(1)}KB)`).join('\n');
        addMessage('system', `Available files:\n${fileList}`);
      } else {
        addMessage('system', '❌ No APML files found. Creating demo screens...');
        createDemoScreens();
      }
    } catch (error) {
      console.error('Error loading APML files:', error);
      addMessage('system', '❌ Failed to load APML files. Using demo screens...');
      createDemoScreens();
    }
  }

  async function loadSpecificApmlFile(filename) {
    try {
      addMessage('system', `📄 Loading ${filename}...`);
      
      const fileResponse = await fetch(`/api/apml/${filename}`);
      
      if (!fileResponse.ok) {
        throw new Error(`HTTP ${fileResponse.status}: ${fileResponse.statusText}`);
      }
      
      const fileData = await fileResponse.json();
      
      // Enhanced error handling
      if (!fileData.success) {
        addMessage('system', `❌ Failed to load ${filename}: ${fileData.error || 'Unknown error'}`);
        return;
      }
      
      if (!fileData.content || fileData.content.trim().length === 0) {
        addMessage('system', `❌ ${filename} is empty or contains no valid content`);
        return;
      }
      
      if (fileData.success) {
        // Use our APML store parser instead of expecting YAML format
        const parseSuccess = apmlStore.parseAPML(fileData.content);
        
        if (parseSuccess) {
          addMessage('system', `✅ Successfully parsed ${filename}`);
          
          // Get the parsed scenes from the store
          let scenes = [];
          const unsubscribe = flowScenes.subscribe(value => scenes = value);
          unsubscribe();
          
          if (scenes.length > 0) {
            addMessage('system', `🎯 Found ${scenes[0].stateNodes.length} interfaces in ${filename}`);
            // Convert scenes to simulator screens
            simulatorScreens = scenes[0].stateNodes.map((node, index) => ({
              id: node.interfaceName,
              name: node.interfaceName,
              description: node.displayContent,
              layout: 'default',
              actions: node.availableActions.map((action, actionIndex) => {
                // Create navigation flow between screens
                const nextScreenIndex = (index + actionIndex + 1) % scenes[0].stateNodes.length;
                const nextScreen = scenes[0].stateNodes[nextScreenIndex];
                
                return {
                  id: `${node.interfaceName}_${action}`,
                  label: action,
                  description: `${action} action`,
                  nextScreenId: nextScreen.interfaceName,
                  color: ['blue', 'green', 'purple', 'indigo', 'orange'][actionIndex % 5]
                };
              }),
              data: {}
            }));
            
            if (simulatorScreens.length > 0) {
              selectedScreen = simulatorScreens[0];
              generateFlowDiagram();
              addMessage('system', `✨ Successfully loaded ${simulatorScreens.length} interfaces from ${filename}!`);
              addMessage('system', `🔗 Main Visualiser Dashboard updated! Check the Dashboard tab.`);
              showFileSelector = false;
            }
          } else {
            addMessage('system', `⚠️ No interfaces found in ${filename}. Using demo screens...`);
            createDemoScreens();
          }
        } else {
          addMessage('system', `⚠️ Failed to parse ${filename}. Using demo screens...`);
          createDemoScreens();
        }
      } else {
        addMessage('system', `❌ Failed to parse ${filename}. Check YAML syntax.`);
      }
      
      showFileSelector = false;
    } catch (error) {
      console.error('Error loading specific APML file:', error);
      addMessage('system', `❌ Error loading ${filename}: ${error.message}`);
      showFileSelector = false;
    }
  }

  async function loadFirstAvailableApml() {
    try {
      const response = await fetch('/api/apml-files');
      const data = await response.json();
      
      if (data.success && data.files.length > 0) {
        const firstFile = data.files[0];
        await loadSpecificApmlFile(firstFile.name);
      } else {
        // Create demo screens if no APML files found
        createDemoScreens();
      }
    } catch (error) {
      console.error('Error loading APML:', error);
      addMessage('system', '⚠️ Could not load APML files, creating demo screens...');
      createDemoScreens();
    }
  }

  function createDemoScreens() {
    simulatorScreens = [
      {
        id: 'chat_screen',
        name: 'Chat Screen',
        description: 'Main conversation interface',
        layout: 'chat',
        actions: [
          {
            id: 'send_message',
            label: 'Send Message',
            description: 'Send a message to the team',
            color: 'blue',
            nextScreenId: 'task_screen'
          },
          {
            id: 'view_tasks',
            label: 'View Tasks',
            description: 'Check current tasks',
            color: 'green',
            nextScreenId: 'task_screen'
          }
        ]
      },
      {
        id: 'task_screen',
        name: 'Task Screen',
        description: 'Manage your tasks and deadlines',
        layout: 'task',
        actions: [
          {
            id: 'create_task',
            label: 'Create New Task',
            description: 'Add a new task to the project',
            color: 'green',
            nextScreenId: 'file_screen'
          },
          {
            id: 'back_to_chat',
            label: 'Back to Chat',
            description: 'Return to chat',
            color: 'blue',
            nextScreenId: 'chat_screen'
          }
        ]
      },
      {
        id: 'file_screen',
        name: 'File Screen',
        description: 'Browse and manage project files',
        layout: 'file',
        actions: [
          {
            id: 'upload_file',
            label: 'Upload File',
            description: 'Share a new file',
            color: 'purple',
            nextScreenId: 'chat_screen'
          }
        ]
      }
    ];
    
    selectedScreen = simulatorScreens[0];
    generateFlowDiagram();
    addMessage('system', '🎨 Demo screens created with beautiful Railway aesthetics!');
  }

  // Export Functions
  function exportValidatedAPML() {
    const basicValidation = validateTrinityCompleteness();
    const enhancedValidation = validateEnhancedTrinityPatterns();
    
    const exportData = {
      apml_content: currentApml,
      trinity_validation: {
        basic: basicValidation,
        enhanced: enhancedValidation
      },
      simulator_screens: simulatorScreens,
      runtime_monitoring: {
        stateHistory: trinityStateMonitor.stateHistory.slice(-20),
        performanceMetrics: trinityStateMonitor.performanceMetrics,
        detectedShowNodes: detectedShowNodes.slice(-10)
      },
      compilation_metadata: {
        timestamp: new Date().toISOString(),
        version: "Trinity APML Visualiser v2.0.0",
        trinity_completeness_score: basicValidation.completenessScore,
        enhanced_trinity_score: enhancedValidation.overallScore,
        real_world_compatibility: enhancedValidation.realWorldCompatibility
      }
    };
    
    // Create downloadable file
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trinity-enhanced-apml-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    addMessage('system', '📤 Enhanced validated APML exported successfully!');
    addMessage('trinity', `Basic Trinity score: ${basicValidation.completenessScore}%`);
    addMessage('trinity', `Enhanced Trinity score: ${enhancedValidation.overallScore.toFixed(1)}%`);
    addMessage('trinity', `Real-world compatibility: ${enhancedValidation.realWorldCompatibility}%`);
  }
  
  function getActionButtonClass(action) {
    const colorMap = {
      blue: 'bg-blue-500 hover:bg-blue-600',
      green: 'bg-green-500 hover:bg-green-600',
      purple: 'bg-purple-500 hover:bg-purple-600',
      indigo: 'bg-indigo-500 hover:bg-indigo-600',
      orange: 'bg-orange-500 hover:bg-orange-600'
    };
    
    const baseClass = 'w-full p-4 text-white rounded-xl transition-all duration-200 text-left shadow-lg hover:shadow-xl active:scale-95';
    const colorClass = colorMap[action.color] || colorMap.blue;
    
    return `${baseClass} ${colorClass}`;
  }

  $: if (selectedScreen) {
    generateFlowDiagram();
  }
  
  // Trinity Validation Engine
  function validateTrinityCompleteness() {
    if (!simulatorScreens || simulatorScreens.length === 0) {
      return {
        isComplete: false,
        completenessScore: 0,
        deadEnds: [],
        infiniteLoops: [],
        raceConditions: [],
        orphanedScreens: [],
        trinityFlowCoverage: 0
      };
    }
    
    const validation = {
      isComplete: true,
      completenessScore: 0,
      deadEnds: [],
      infiniteLoops: [],
      raceConditions: [],
      orphanedScreens: [],
      trinityFlowCoverage: 0
    };
    
    // 1. Dead-end detection
    const deadEnds = simulatorScreens.filter(screen => 
      !screen.actions || screen.actions.length === 0 || 
      screen.actions.every(action => !action.nextScreenId)
    );
    validation.deadEnds = deadEnds.map(s => s.id);
    
    // 2. Orphaned screen detection
    const reachableScreens = new Set();
    reachableScreens.add(simulatorScreens[0]?.id); // First screen is entry point
    
    let foundNew = true;
    while (foundNew) {
      foundNew = false;
      simulatorScreens.forEach(screen => {
        if (reachableScreens.has(screen.id)) {
          screen.actions?.forEach(action => {
            if (action.nextScreenId && !reachableScreens.has(action.nextScreenId)) {
              reachableScreens.add(action.nextScreenId);
              foundNew = true;
            }
          });
        }
      });
    }
    
    validation.orphanedScreens = simulatorScreens
      .filter(screen => !reachableScreens.has(screen.id))
      .map(s => s.id);
    
    // 3. Infinite loop detection (basic cycle detection)
    const hasInfiniteLoop = detectInfiniteLoops();
    if (hasInfiniteLoop) {
      validation.infiniteLoops.push('Potential infinite loop detected in navigation flow');
    }
    
    // 4. Trinity flow coverage (basic heuristic)
    let trinityFlowCount = 0;
    let totalFlows = 0;
    
    simulatorScreens.forEach(screen => {
      screen.actions?.forEach(action => {
        totalFlows++;
        // Simple heuristic: if action has next screen, it's a valid trinity flow
        if (action.nextScreenId) {
          trinityFlowCount++;
        }
      });
    });
    
    validation.trinityFlowCoverage = totalFlows > 0 ? (trinityFlowCount / totalFlows) * 100 : 0;
    
    // Calculate overall completeness score
    let score = 100;
    score -= validation.deadEnds.length * 20; // -20 per dead end
    score -= validation.orphanedScreens.length * 15; // -15 per orphaned screen
    score -= validation.infiniteLoops.length * 25; // -25 per infinite loop
    score = Math.max(0, score); // Don't go below 0
    
    validation.completenessScore = score;
    validation.isComplete = score >= 90;
    
    return validation;
  }
  
  function detectInfiniteLoops() {
    const visited = new Set();
    const recursionStack = new Set();
    
    function dfs(screenId) {
      if (recursionStack.has(screenId)) return true; // Cycle detected
      if (visited.has(screenId)) return false;
      
      visited.add(screenId);
      recursionStack.add(screenId);
      
      const screen = simulatorScreens.find(s => s.id === screenId);
      if (screen?.actions) {
        for (const action of screen.actions) {
          if (action.nextScreenId && dfs(action.nextScreenId)) {
            return true;
          }
        }
      }
      
      recursionStack.delete(screenId);
      return false;
    }
    
    // Check all screens as potential starting points
    for (const screen of simulatorScreens) {
      if (dfs(screen.id)) {
        return true;
      }
    }
    
    return false;
  }
  
  // Dynamic SHOW Node Detection System
  function captureScreenSnapshot() {
    if (!selectedScreen) return null;
    
    // Create a comprehensive screen state snapshot
    const snapshot = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      screenId: selectedScreen.id,
      screenName: selectedScreen.name,
      layout: selectedScreen.layout,
      visibleContent: extractVisibleContent(),
      actionStates: selectedScreen.actions.map(a => ({
        id: a.id,
        label: a.label,
        visible: true,
        enabled: true
      })),
      visualElements: detectVisualElements(),
      checksum: generateScreenChecksum()
    };
    
    return snapshot;
  }
  
  function extractVisibleContent() {
    // Extract text content and UI state from current screen
    const content = {
      screenTitle: selectedScreen.name,
      screenDescription: selectedScreen.description,
      layoutType: selectedScreen.layout,
      dynamicContent: getDynamicContentState(),
      interactiveElements: selectedScreen.actions.length
    };
    
    return content;
  }
  
  function getDynamicContentState() {
    // Analyze current screen layout and extract dynamic content
    const contentState = {};
    
    switch (selectedScreen.layout) {
      case 'chat':
        contentState.messageCount = 2; // Simulated - could be dynamic
        contentState.inputFieldActive = true;
        contentState.lastMessage = "Looking great with these beautiful aesthetics!";
        break;
      case 'task':
        contentState.taskCount = 2;
        contentState.completedTasks = 1;
        contentState.pendingTasks = 1;
        break;
      case 'file':
        contentState.fileCount = 2;
        contentState.totalSize = "17.6 KB";
        contentState.fileTypes = ["apml", "css"];
        break;
      default:
        contentState.layoutType = selectedScreen.layout;
    }
    
    return contentState;
  }
  
  function detectVisualElements() {
    // Identify distinct visual components
    const elements = [];
    
    // Header elements
    elements.push({
      type: 'header',
      content: selectedScreen.name,
      position: 'top'
    });
    
    // Dynamic content based on layout
    const dynamicElements = mapLayoutToVisualElements(selectedScreen.layout);
    elements.push(...dynamicElements);
    
    // Action buttons
    selectedScreen.actions.forEach((action, index) => {
      elements.push({
        type: 'action_button',
        content: action.label,
        position: `action_${index}`,
        color: action.color,
        interactive: true
      });
    });
    
    return elements;
  }
  
  function mapLayoutToVisualElements(layout) {
    const elements = [];
    
    switch (layout) {
      case 'chat':
        elements.push(
          { type: 'message_bubble', content: 'system_message', position: 'left' },
          { type: 'message_bubble', content: 'user_message', position: 'right' },
          { type: 'input_field', content: 'message_input', position: 'bottom' }
        );
        break;
      case 'task':
        elements.push(
          { type: 'checkbox', content: 'completed_task', position: 'task_1' },
          { type: 'checkbox', content: 'pending_task', position: 'task_2' }
        );
        break;
      case 'file':
        elements.push(
          { type: 'file_icon', content: 'project.apml', position: 'file_1' },
          { type: 'file_icon', content: 'styles.css', position: 'file_2' }
        );
        break;
    }
    
    return elements;
  }
  
  function generateScreenChecksum() {
    // Create a simple checksum of screen state for quick comparison
    const state = {
      screenId: selectedScreen.id,
      layout: selectedScreen.layout,
      actionCount: selectedScreen.actions.length,
      contentHash: JSON.stringify(getDynamicContentState())
    };
    
    return btoa(JSON.stringify(state)).slice(0, 16);
  }
  
  function detectPixelChanges() {
    const currentSnapshot = captureScreenSnapshot();
    if (!currentSnapshot) return;
    
    const currentChecksum = currentSnapshot.checksum;
    
    // Check if this is a meaningful change
    if (lastScreenChecksum && lastScreenChecksum !== currentChecksum) {
      console.log('🔍 Pixel change detected:', {
        from: lastScreenChecksum,
        to: currentChecksum,
        screen: currentSnapshot.screenName
      });
      
      // Generate new SHOW node for this visual change
      generateDynamicShowNode(currentSnapshot);
      
      // Store snapshot for history
      screenSnapshots = [...screenSnapshots, currentSnapshot].slice(-20); // Keep last 20
    }
    
    lastScreenChecksum = currentChecksum;
  }
  
  function generateDynamicShowNode(snapshot) {
    const showNode = {
      id: `dynamic_show_${snapshot.timestamp}`,
      type: 'SHOW',
      generated: true,
      timestamp: snapshot.timestamp,
      screenState: snapshot,
      visualChange: {
        type: 'screen_transition',
        from: screenSnapshots.length > 0 ? screenSnapshots[screenSnapshots.length - 1].screenId : null,
        to: snapshot.screenId,
        elements: snapshot.visualElements,
        significance: calculateChangeSignificance(snapshot)
      },
      trinityPattern: {
        showComponent: snapshot.visibleContent,
        triggeredBy: activeTransition,
        followsPattern: true
      }
    };
    
    detectedShowNodes = [...detectedShowNodes, showNode];
    
    // Add Trinity message about dynamic detection
    addMessage('trinity', `🎯 Dynamic SHOW node detected: ${snapshot.screenName}`);
    addMessage('trinity', `📊 Visual elements: ${snapshot.visualElements.length} components`);
    
    console.log('✨ Generated dynamic SHOW node:', showNode);
    
    // Update flow diagram to include new node
    updateFlowWithDynamicNode(showNode);
  }
  
  function calculateChangeSignificance(snapshot) {
    // Determine how significant this visual change is
    let significance = 0.5; // Base significance
    
    // More significance for layout changes
    if (screenSnapshots.length > 0) {
      const lastSnapshot = screenSnapshots[screenSnapshots.length - 1];
      if (lastSnapshot.layout !== snapshot.layout) {
        significance += 0.3;
      }
      if (lastSnapshot.visibleContent.interactiveElements !== snapshot.visibleContent.interactiveElements) {
        significance += 0.2;
      }
    }
    
    return Math.min(significance, 1.0);
  }
  
  function updateFlowWithDynamicNode(showNode) {
    // Add the dynamic SHOW node to the current flow diagram
    // This will be reflected in the next diagram regeneration
    addToMessageSequence('trinity-detection', `SHOW node: ${showNode.screenState.screenName}`);
    
    // Regenerate flow diagram with dynamic nodes
    generateFlowDiagram();
  }
  
  // Runtime Trinity State Monitoring System
  function startTrinityMonitoring() {
    trinityStateMonitor.isActive = true;
    trinityStateMonitor.lastUpdate = Date.now();
    
    // Start real-time monitoring interval
    monitoringInterval = setInterval(() => {
      updateTrinityRealTimeState();
    }, 500); // Update every 500ms
    
    addMessage('trinity', '🔄 Runtime Trinity monitoring started');
    console.log('🔄 Trinity runtime monitoring activated');
  }
  
  function stopTrinityMonitoring() {
    trinityStateMonitor.isActive = false;
    
    if (monitoringInterval) {
      clearInterval(monitoringInterval);
      monitoringInterval = null;
    }
    
    addMessage('trinity', '⏹️ Runtime Trinity monitoring stopped');
  }
  
  function updateTrinityRealTimeState() {
    if (!trinityStateMonitor.isActive) return;
    
    const currentState = analyzeCurrentTrinityState();
    
    // Update monitoring state
    trinityStateMonitor.flowState = currentState.flowState;
    trinityStateMonitor.realTimeScore = currentState.score;
    trinityStateMonitor.lastUpdate = Date.now();
    
    // Add to state history
    trinityStateMonitor.stateHistory.push({
      timestamp: Date.now(),
      state: currentState,
      screenId: selectedScreen?.id,
      transition: activeTransition
    });
    
    // Keep only last 50 states
    if (trinityStateMonitor.stateHistory.length > 50) {
      trinityStateMonitor.stateHistory = trinityStateMonitor.stateHistory.slice(-50);
    }
    
    // Check for flow state changes
    detectTrinityFlowTransitions(currentState);
  }
  
  function analyzeCurrentTrinityState() {
    const state = {
      flowState: 'idle',
      score: 0,
      activePatterns: [],
      issues: [],
      completeness: 0
    };
    
    if (!selectedScreen) {
      return state;
    }
    
    // Determine current flow state based on activity
    if (activeTransition) {
      state.flowState = 'process'; // Currently processing a transition
      state.activePatterns.push('DO→PROCESS');
    } else if (detectedShowNodes.length > 0 && 
               detectedShowNodes[detectedShowNodes.length - 1].timestamp > Date.now() - 2000) {
      state.flowState = 'show'; // Recently showed new content
      state.activePatterns.push('SHOW');
    } else if (selectedScreen.actions && selectedScreen.actions.length > 0) {
      state.flowState = 'do'; // Ready for user actions
      state.activePatterns.push('DO');
    }
    
    // Calculate real-time Trinity score
    state.score = calculateRealTimeTrinityScore();
    state.completeness = calculateTrinityFlowCompleteness();
    
    // Check for Trinity violations
    state.issues = identifyTrinityViolations();
    
    return state;
  }
  
  function calculateRealTimeTrinityScore() {
    let score = 0;
    
    // Base score from static validation
    const validation = validateTrinityCompleteness();
    score = validation.completenessScore * 0.6; // 60% weight
    
    // Runtime behavior score (40% weight)
    const runtimeScore = calculateRuntimeBehaviorScore();
    score += runtimeScore * 0.4;
    
    return Math.min(100, Math.max(0, score));
  }
  
  function calculateRuntimeBehaviorScore() {
    let behaviorScore = 100;
    
    const metrics = trinityStateMonitor.performanceMetrics;
    
    // Penalize broken flows
    if (metrics.totalFlows > 0) {
      const brokenFlowRatio = metrics.brokenFlows / metrics.totalFlows;
      behaviorScore -= brokenFlowRatio * 40; // Up to -40 for all broken flows
    }
    
    // Reward completed flows
    if (metrics.totalFlows > 0) {
      const completionRatio = metrics.completedFlows / metrics.totalFlows;
      behaviorScore = Math.max(behaviorScore, completionRatio * 60); // Minimum of completion ratio
    }
    
    // Penalize for staying in one state too long
    const stateStagnation = detectStateStagnation();
    behaviorScore -= stateStagnation * 20; // Up to -20 for stagnation
    
    return Math.max(0, behaviorScore);
  }
  
  function calculateTrinityFlowCompleteness() {
    const recentHistory = trinityStateMonitor.stateHistory.slice(-10); // Last 10 states
    
    if (recentHistory.length === 0) return 0;
    
    // Check if we've seen all Trinity patterns recently
    const hasShow = recentHistory.some(h => h.state.flowState === 'show');
    const hasDo = recentHistory.some(h => h.state.flowState === 'do');
    const hasProcess = recentHistory.some(h => h.state.flowState === 'process');
    
    let completeness = 0;
    if (hasShow) completeness += 33.33;
    if (hasDo) completeness += 33.33;
    if (hasProcess) completeness += 33.34;
    
    return completeness;
  }
  
  function identifyTrinityViolations() {
    const issues = [];
    const recentHistory = trinityStateMonitor.stateHistory.slice(-5);
    
    if (recentHistory.length === 0) return issues;
    
    // Check for stagnation in one state
    const lastState = recentHistory[recentHistory.length - 1];
    const sameStateCount = recentHistory.filter(h => 
      h.state.flowState === lastState.state.flowState
    ).length;
    
    if (sameStateCount >= 4) {
      issues.push({
        type: 'stagnation',
        severity: 'medium',
        message: `Stuck in ${lastState.state.flowState} state`,
        suggestion: 'Consider adding navigation or state transitions'
      });
    }
    
    // Check for missing patterns
    const hasShow = recentHistory.some(h => h.state.flowState === 'show');
    const hasDo = recentHistory.some(h => h.state.flowState === 'do');
    const hasProcess = recentHistory.some(h => h.state.flowState === 'process');
    
    if (!hasShow && recentHistory.length >= 3) {
      issues.push({
        type: 'missing_show',
        severity: 'high',
        message: 'No SHOW patterns detected recently',
        suggestion: 'Add visual feedback or state displays'
      });
    }
    
    if (!hasProcess && recentHistory.length >= 3) {
      issues.push({
        type: 'missing_process',
        severity: 'medium',
        message: 'No PROCESS patterns detected recently',
        suggestion: 'Add background processing or state changes'
      });
    }
    
    return issues;
  }
  
  function detectStateStagnation() {
    const recentHistory = trinityStateMonitor.stateHistory.slice(-10);
    
    if (recentHistory.length === 0) return 0;
    
    const lastState = recentHistory[recentHistory.length - 1];
    const sameStateCount = recentHistory.filter(h => 
      h.state.flowState === lastState.state.flowState
    ).length;
    
    return Math.min(1.0, sameStateCount / 10); // 0-1 stagnation ratio
  }
  
  function detectTrinityFlowTransitions(currentState) {
    const history = trinityStateMonitor.stateHistory;
    
    if (history.length < 2) return;
    
    const previousState = history[history.length - 2];
    const currentStateFlow = currentState.flowState;
    const previousStateFlow = previousState.state.flowState;
    
    // Detect state transitions
    if (currentStateFlow !== previousStateFlow) {
      const transition = {
        from: previousStateFlow,
        to: currentStateFlow,
        timestamp: Date.now(),
        screen: selectedScreen?.id
      };
      
      console.log('🔄 Trinity state transition:', transition);
      
      // Check if this follows proper Trinity pattern
      const isValidTransition = validateTrinityTransition(previousStateFlow, currentStateFlow);
      
      if (isValidTransition) {
        trinityStateMonitor.performanceMetrics.completedFlows++;
        addMessage('trinity', `✅ Valid Trinity transition: ${previousStateFlow} → ${currentStateFlow}`);
      } else {
        trinityStateMonitor.performanceMetrics.brokenFlows++;
        addMessage('trinity', `⚠️ Invalid Trinity transition: ${previousStateFlow} → ${currentStateFlow}`);
      }
      
      trinityStateMonitor.performanceMetrics.totalFlows++;
      
      // Start a new flow if entering SHOW state
      if (currentStateFlow === 'show') {
        startNewTrinityFlow(transition);
      }
    }
  }
  
  function validateTrinityTransition(from, to) {
    // Valid Trinity patterns:
    // SHOW → DO (user sees something, then can interact)
    // DO → PROCESS (user interacts, system processes)
    // PROCESS → SHOW (system shows result)
    // idle → SHOW (initial state)
    
    const validTransitions = {
      'idle': ['show', 'do'],
      'show': ['do', 'show'], // Can show multiple things
      'do': ['process', 'show'], // Can do multiple actions or show feedback
      'process': ['show', 'do', 'process'] // Can show results, enable actions, or continue processing
    };
    
    return validTransitions[from]?.includes(to) || false;
  }
  
  function startNewTrinityFlow(transition) {
    const newFlow = {
      id: `trinity_flow_${Date.now()}`,
      startTime: Date.now(),
      startTransition: transition,
      expectedPattern: ['show', 'do', 'process'],
      actualPattern: [transition.to],
      isComplete: false,
      violations: []
    };
    
    trinityStateMonitor.currentFlow = newFlow;
    
    console.log('🎯 Started new Trinity flow:', newFlow);
  }
  
  // Enhanced Trinity Validation for Real App Patterns
  function validateEnhancedTrinityPatterns() {
    const validation = {
      overallScore: 0,
      patternAnalysis: [],
      realWorldCompatibility: 0,
      usabilityScore: 0,
      complexityScore: 0,
      recommendations: [],
      appPatternTemplates: []
    };
    
    // Analyze against real-world app patterns
    validation.patternAnalysis = analyzeRealWorldPatterns();
    validation.realWorldCompatibility = calculateRealWorldCompatibility();
    validation.usabilityScore = calculateUsabilityScore();
    validation.complexityScore = calculateComplexityScore();
    validation.recommendations = generateAdvancedRecommendations();
    
    // Calculate enhanced overall score
    validation.overallScore = calculateEnhancedTrinityScore(validation);
    
    return validation;
  }
  
  function analyzeRealWorldPatterns() {
    const patterns = [];
    
    // Define real-world app pattern templates
    const appPatternTemplates = [
      {
        name: 'Chat Flow',
        expectedSequence: ['show', 'do', 'process', 'show'],
        triggers: ['message', 'send', 'receive'],
        complexity: 'medium',
        commonIn: ['messaging', 'support', 'collaboration']
      },
      {
        name: 'Task Management',
        expectedSequence: ['show', 'do', 'process', 'show', 'do'],
        triggers: ['create', 'complete', 'edit', 'assign'],
        complexity: 'high',
        commonIn: ['productivity', 'project management', 'todo']
      },
      {
        name: 'File Operations',
        expectedSequence: ['show', 'do', 'process'],
        triggers: ['upload', 'download', 'view', 'share'],
        complexity: 'low',
        commonIn: ['storage', 'documents', 'media']
      },
      {
        name: 'Authentication',
        expectedSequence: ['show', 'do', 'process', 'show'],
        triggers: ['login', 'register', 'verify'],
        complexity: 'medium',
        commonIn: ['security', 'user management']
      },
      {
        name: 'E-commerce Checkout',
        expectedSequence: ['show', 'do', 'process', 'show', 'do', 'process', 'show'],
        triggers: ['select', 'add_to_cart', 'checkout', 'payment', 'confirm'],
        complexity: 'high',
        commonIn: ['shopping', 'marketplace', 'payments']
      }
    ];
    
    // Analyze current app against each template
    appPatternTemplates.forEach(template => {
      const match = analyzePatternMatch(template);
      if (match.compatibility > 0.3) {
        patterns.push({
          template: template.name,
          compatibility: match.compatibility,
          coverage: match.coverage,
          missingElements: match.missingElements,
          suggestions: match.suggestions
        });
      }
    });
    
    return patterns;
  }
  
  function analyzePatternMatch(template) {
    const match = {
      compatibility: 0,
      coverage: 0,
      missingElements: [],
      suggestions: []
    };
    
    // Check if our app structure matches this template
    const recentHistory = trinityStateMonitor.stateHistory.slice(-10);
    const stateSequence = recentHistory.map(h => h.state.flowState);
    
    // Calculate sequence similarity
    match.compatibility = calculateSequenceSimilarity(stateSequence, template.expectedSequence);
    
    // Check trigger coverage
    const appActions = simulatorScreens.flatMap(screen => 
      screen.actions?.map(a => a.label.toLowerCase()) || []
    );
    
    const matchingTriggers = template.triggers.filter(trigger => 
      appActions.some(action => action.includes(trigger))
    );
    
    match.coverage = matchingTriggers.length / template.triggers.length;
    
    // Identify missing elements
    template.triggers.forEach(trigger => {
      if (!appActions.some(action => action.includes(trigger))) {
        match.missingElements.push(trigger);
      }
    });
    
    // Generate suggestions
    if (match.compatibility > 0.5 && match.coverage < 0.8) {
      match.suggestions.push(`Consider adding ${template.name} workflow elements`);
      match.missingElements.forEach(element => {
        match.suggestions.push(`Add "${element}" functionality for complete ${template.name} pattern`);
      });
    }
    
    return match;
  }
  
  function calculateSequenceSimilarity(sequence1, sequence2) {
    if (sequence1.length === 0 || sequence2.length === 0) return 0;
    
    // Use dynamic programming to find longest common subsequence
    const dp = Array(sequence1.length + 1).fill(null).map(() => 
      Array(sequence2.length + 1).fill(0)
    );
    
    for (let i = 1; i <= sequence1.length; i++) {
      for (let j = 1; j <= sequence2.length; j++) {
        if (sequence1[i - 1] === sequence2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }
    
    const lcs = dp[sequence1.length][sequence2.length];
    return lcs / Math.max(sequence1.length, sequence2.length);
  }
  
  function calculateRealWorldCompatibility() {
    let compatibility = 0;
    
    // Check for common real-world patterns
    const hasNavigation = simulatorScreens.length > 1;
    const hasUserActions = simulatorScreens.some(screen => 
      screen.actions && screen.actions.length > 0
    );
    const hasStateTransitions = transitionHistory.length > 0;
    const hasAsyncProcessing = trinityStateMonitor.stateHistory.some(h => 
      h.state.flowState === 'process'
    );
    
    // Real-world apps typically have these characteristics
    if (hasNavigation) compatibility += 25;
    if (hasUserActions) compatibility += 25;
    if (hasStateTransitions) compatibility += 25;
    if (hasAsyncProcessing) compatibility += 25;
    
    // Check for proper error handling patterns
    const hasErrorStates = simulatorScreens.some(screen => 
      screen.layout === 'error' || screen.name.toLowerCase().includes('error')
    );
    if (hasErrorStates) compatibility += 10;
    
    // Check for loading states
    const hasLoadingStates = trinityStateMonitor.stateHistory.some(h => 
      h.state.flowState === 'process' && h.timestamp > Date.now() - 5000
    );
    if (hasLoadingStates) compatibility += 10;
    
    return Math.min(100, compatibility);
  }
  
  function calculateUsabilityScore() {
    let usabilityScore = 100;
    
    // Analyze user experience patterns
    const avgActionsPerScreen = simulatorScreens.reduce((sum, screen) => 
      sum + (screen.actions?.length || 0), 0) / simulatorScreens.length;
    
    // Penalize screens with too many or too few actions
    if (avgActionsPerScreen > 5) {
      usabilityScore -= (avgActionsPerScreen - 5) * 5; // Cognitive overload
    }
    if (avgActionsPerScreen < 1) {
      usabilityScore -= 20; // Dead-end screens
    }
    
    // Check for consistent navigation patterns
    const hasConsistentNavigation = checkNavigationConsistency();
    if (!hasConsistentNavigation) {
      usabilityScore -= 15;
    }
    
    // Check for proper feedback loops
    const hasFeedbackLoops = checkFeedbackLoops();
    if (!hasFeedbackLoops) {
      usabilityScore -= 10;
    }
    
    // Check for accessibility patterns
    const hasAccessibilityPatterns = checkAccessibilityPatterns();
    if (hasAccessibilityPatterns) {
      usabilityScore += 10;
    }
    
    return Math.max(0, usabilityScore);
  }
  
  function calculateComplexityScore() {
    // Measure app complexity and appropriate Trinity implementation
    const metrics = {
      screenCount: simulatorScreens.length,
      totalActions: simulatorScreens.reduce((sum, screen) => 
        sum + (screen.actions?.length || 0), 0),
      transitionCount: transitionHistory.length,
      stateVariations: new Set(trinityStateMonitor.stateHistory.map(h => 
        h.state.flowState)).size
    };
    
    // Calculate complexity index
    let complexity = 0;
    complexity += metrics.screenCount * 2;
    complexity += metrics.totalActions * 1;
    complexity += metrics.transitionCount * 0.5;
    complexity += metrics.stateVariations * 5;
    
    // Normalize to 0-100 scale
    const complexityScore = Math.min(100, complexity / 2);
    
    // Higher complexity should have more sophisticated Trinity patterns
    const expectedPatternSophistication = complexityScore / 100;
    const actualPatternSophistication = calculatePatternSophistication();
    
    // Score based on how well Trinity patterns match complexity
    const sophisticationMatch = 1 - Math.abs(expectedPatternSophistication - actualPatternSophistication);
    
    return sophisticationMatch * 100;
  }
  
  function calculatePatternSophistication() {
    // Measure how sophisticated the Trinity patterns are
    const recentHistory = trinityStateMonitor.stateHistory.slice(-20);
    
    // Count unique state transitions
    const transitions = new Set();
    for (let i = 1; i < recentHistory.length; i++) {
      const from = recentHistory[i - 1].state.flowState;
      const to = recentHistory[i].state.flowState;
      transitions.add(`${from}->${to}`);
    }
    
    // More unique transitions = more sophisticated patterns
    const sophistication = Math.min(1, transitions.size / 10);
    
    return sophistication;
  }
  
  function checkNavigationConsistency() {
    // Check if navigation patterns are consistent across screens
    const navigationPatterns = simulatorScreens.map(screen => ({
      id: screen.id,
      actionCount: screen.actions?.length || 0,
      hasBackNavigation: screen.actions?.some(a => 
        a.label.toLowerCase().includes('back') || 
        a.label.toLowerCase().includes('cancel')
      ) || false
    }));
    
    // Consistent if most screens have similar action counts and back navigation
    const avgActionCount = navigationPatterns.reduce((sum, p) => sum + p.actionCount, 0) / navigationPatterns.length;
    const consistentActionCounts = navigationPatterns.filter(p => 
      Math.abs(p.actionCount - avgActionCount) <= 2
    ).length / navigationPatterns.length;
    
    return consistentActionCounts > 0.7;
  }
  
  function checkFeedbackLoops() {
    // Check if user actions provide appropriate feedback
    return trinityStateMonitor.stateHistory.some(h => 
      h.state.flowState === 'show' && h.transition
    );
  }
  
  function checkAccessibilityPatterns() {
    // Basic check for accessibility-friendly patterns
    const hasDescriptiveLabels = simulatorScreens.every(screen => 
      screen.actions?.every(action => 
        action.label && action.description
      ) !== false
    );
    
    const hasKeyboardNavigation = simulatorScreens.some(screen => 
      screen.actions && screen.actions.length > 0
    );
    
    return hasDescriptiveLabels && hasKeyboardNavigation;
  }
  
  function generateAdvancedRecommendations() {
    const recommendations = [];
    const enhancedValidation = validateEnhancedTrinityPatterns();
    
    // Usability recommendations
    if (enhancedValidation.usabilityScore < 70) {
      recommendations.push({
        category: 'Usability',
        priority: 'high',
        title: 'Improve User Experience Patterns',
        description: 'Consider reducing cognitive load and improving navigation consistency',
        actions: [
          'Limit actions per screen to 3-5 items',
          'Add consistent back/cancel navigation',
          'Provide clear feedback for all user actions'
        ]
      });
    }
    
    // Complexity recommendations
    if (enhancedValidation.complexityScore < 60) {
      recommendations.push({
        category: 'Complexity',
        priority: 'medium',
        title: 'Balance App Complexity with Trinity Patterns',
        description: 'Trinity pattern sophistication should match app complexity',
        actions: [
          'Add more state transitions for complex workflows',
          'Implement proper error and loading states',
          'Consider breaking complex flows into smaller steps'
        ]
      });
    }
    
    // Real-world compatibility recommendations
    if (enhancedValidation.realWorldCompatibility < 80) {
      recommendations.push({
        category: 'Real-World Patterns',
        priority: 'high',
        title: 'Enhance Real-World App Compatibility',
        description: 'Add patterns commonly found in production applications',
        actions: [
          'Implement proper loading states during processing',
          'Add error handling and recovery flows',
          'Include confirmation dialogs for destructive actions'
        ]
      });
    }
    
    return recommendations;
  }
  
  function calculateEnhancedTrinityScore(validation) {
    // Weighted average of all validation aspects
    const weights = {
      realWorldCompatibility: 0.3,
      usabilityScore: 0.3,
      complexityScore: 0.2,
      patternCoverage: 0.2
    };
    
    const patternCoverage = validation.patternAnalysis.length > 0 ? 
      validation.patternAnalysis.reduce((sum, p) => sum + p.compatibility, 0) / validation.patternAnalysis.length * 100 : 0;
    
    const enhancedScore = 
      validation.realWorldCompatibility * weights.realWorldCompatibility +
      validation.usabilityScore * weights.usabilityScore +
      validation.complexityScore * weights.complexityScore +
      patternCoverage * weights.patternCoverage;
    
    return Math.min(100, enhancedScore);
  }

</script>

<div class="min-h-screen bg-gray-900 text-white">
  <!-- Connection Status -->
  <div class="fixed top-20 right-4 z-40">
    <div class="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm {connectionStatus === 'connected' ? 'bg-green-900 text-green-300 border border-green-600' : connectionStatus === 'error' ? 'bg-red-900 text-red-300 border border-red-600' : 'bg-yellow-900 text-yellow-300 border border-yellow-600'}">
      <div class="w-2 h-2 rounded-full {connectionStatus === 'connected' ? 'bg-green-400' : connectionStatus === 'error' ? 'bg-red-400' : 'bg-yellow-400'} animate-pulse"></div>
      <span>{connectionStatus === 'connected' ? 'Connected' : connectionStatus === 'error' ? 'Error' : 'Connecting...'}</span>
    </div>
  </div>

  <div class="flex h-screen">
    <!-- Left Panel: Flow Diagram + Chat (70%) -->
    <div class="w-7/10 bg-gray-800 border-r border-gray-700 p-4 overflow-y-auto flex flex-col" style="width: 70%;">
      <!-- Flow Diagram - Much Taller for Complex Apps -->
      <div class="h-4/5">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold">🗺️ Trinity Flow Diagram</h2>
          <div class="flex items-center space-x-2">
            <button on:click={loadAvailableApmlFiles} class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors text-white font-medium">
              📁 Load APML
            </button>
            <button on:click={exportValidatedAPML} class="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-sm transition-colors text-white font-medium">
              📤 Export
            </button>
            <button on:click={importFromMCP} class="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-sm transition-colors text-white font-medium">
              🔌 MCP
            </button>
            <button 
              on:click={() => trinityStateMonitor.isActive ? stopTrinityMonitoring() : startTrinityMonitoring()} 
              class="px-4 py-2 {trinityStateMonitor.isActive ? 'bg-orange-600 hover:bg-orange-700' : 'bg-cyan-600 hover:bg-cyan-700'} rounded text-sm transition-colors text-white font-medium"
            >
              {trinityStateMonitor.isActive ? '⏹️ Stop' : '▶️ Monitor'}
            </button>
            <button on:click={() => technicalDetails = !technicalDetails} class="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded text-sm transition-colors text-white font-medium">
              {technicalDetails ? '👁️ Hide' : '🔧 Tech'}
            </button>
          </div>
        </div>
        
        <div class="h-full p-6 bg-gray-900 rounded-lg border border-gray-600">
          {#if flowDiagram && typeof flowDiagram === 'string'}
            <div class="w-full h-full">
              <div id="mermaid-container" class="w-full h-full flex items-center justify-center bg-gray-800 rounded">
                <!-- Mermaid will render here -->
              </div>
            </div>
          {:else}
            <div class="text-center text-gray-400 mt-20">
              <div class="text-6xl mb-4">🔄</div>
              <p class="mb-6">Load APML to see beautiful flow diagram</p>
              <!-- BIG OBVIOUS LOAD BUTTON -->
              <button 
                on:click={loadAvailableApmlFiles}
                class="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                📁 Load Your APML Files
              </button>
            </div>
          {/if}
        </div>
      </div>
      
      <!-- Trinity Chat Section - Compact -->
      <div class="h-1/5 border-t border-gray-700 pt-4 flex flex-col">
        <h2 class="text-lg font-semibold mb-4">💬 Trinity Assistant</h2>
        
        
        <!-- File Selector -->
        {#if showFileSelector && availableApmlFiles.length > 0}
          <div class="mb-4 p-3 bg-blue-900 rounded border border-blue-600">
            <div class="text-blue-100 font-medium mb-2">📁 Select APML File to Load</div>
            <div class="space-y-2">
              {#each availableApmlFiles as file (file.name)}
                <button
                  on:click={() => loadSpecificApmlFile(file.name)}
                  class="w-full text-left p-2 bg-blue-800 hover:bg-blue-700 rounded text-sm text-blue-100 transition-colors"
                >
                  <div class="font-medium">{file.name}</div>
                  <div class="text-xs text-blue-300">{(file.size/1024).toFixed(1)}KB • Modified {new Date(file.modified).toLocaleDateString()}</div>
                </button>
              {/each}
            </div>
            <button
              on:click={() => showFileSelector = false}
              class="mt-2 px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-sm text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        {/if}

        <!-- Chat History -->
        <div class="space-y-2 mb-4 max-h-32 overflow-y-auto">
          {#each messages as message (message.id)}
            <div class="p-3 rounded text-sm message-box {message.type === 'user' ? 'bg-green-800 text-green-100' : message.type === 'system' ? 'bg-purple-800 text-purple-100' : 'bg-blue-800 text-blue-100'}">
              <div class="font-medium">{message.type === 'user' ? 'You' : message.type === 'system' ? 'System' : 'Trinity'}</div>
              <div style="white-space: pre-line;">{message.content}</div>
            </div>
          {/each}
        </div>
        
        <!-- Chat Input -->
        <div class="flex">
          <input
            bind:value={chatInput}
            on:keydown={(e) => e.key === 'Enter' && sendChatMessage()}
            placeholder="How does the flow feel? Any improvements?"
            class="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-l text-sm text-white focus:outline-none focus:border-blue-500"
          />
          <button
            on:click={sendChatMessage}
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-r text-sm text-white transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
    
    <!-- Right Panel: iPhone Simulator (30%) -->
    <div class="w-3/10 bg-gray-900 p-4 overflow-y-auto flex flex-col" style="width: 30%;">
      <!-- iPhone Simulator -->
      <div class="flex items-center justify-center mb-6">
        {#if !selectedScreen}
          <div class="text-center text-gray-400">
            <div class="text-6xl mb-4">📱</div>
            <p class="mb-4">Load APML to see simulator</p>
            <!-- ANOTHER BIG OBVIOUS LOAD BUTTON -->
            <button 
              on:click={loadAvailableApmlFiles}
              class="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              📁 Load APML Files
            </button>
          </div>
        {:else}
          <!-- Real iPhone 12 Size: 390x844px -->
          <div class="bg-black rounded-3xl shadow-2xl" style="width: 390px; height: 844px; position: relative;">
            <div class="absolute inset-0 bg-black rounded-3xl p-1">
              <!-- Screen -->
              <div class="bg-white rounded-3xl h-full flex flex-col relative overflow-hidden screen-transition">
                <!-- Dynamic Island -->
                <div class="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-10"></div>
                
                <!-- Status Bar -->
                <div class="flex justify-between items-center px-6 py-3 text-sm text-black bg-white">
                  <span class="font-semibold">9:41</span>
                  <div class="flex items-center space-x-1">
                    <div class="w-4 h-2 bg-black rounded-sm"></div>
                    <div class="w-6 h-3 border border-black rounded-sm">
                      <div class="w-full h-full bg-green-500 rounded-sm"></div>
                    </div>
                  </div>
                </div>
                
                <!-- Screen Header -->
                <div class="px-6 py-4 border-b border-gray-200 bg-white">
                  <div class="flex items-center justify-between">
                    <div>
                      <h3 class="text-xl font-bold text-gray-900">{selectedScreen.name}</h3>
                      <p class="text-sm text-gray-600 mt-1">{selectedScreen.description}</p>
                    </div>
                  </div>
                </div>
                
                <!-- Dynamic Screen Content -->
                <div class="flex-1 flex flex-col bg-gray-50">
                  <!-- Main Content Area - Scrollable -->
                  <div class="flex-1 p-6 overflow-y-auto">
                    {#if selectedScreen.layout === 'chat'}
                      <!-- Chat Layout with Beautiful Design -->
                      <div class="h-full flex flex-col">
                        <div class="flex-1 space-y-3 mb-4">
                          <div class="bg-blue-100 p-3 rounded-xl max-w-xs">
                            <div class="text-sm text-gray-800">Hey! How's the APML flow looking?</div>
                            <div class="text-xs text-gray-500 mt-1">Trinity • 2:30 PM</div>
                          </div>
                          <div class="bg-green-500 text-white p-3 rounded-xl max-w-xs ml-auto">
                            <div class="text-sm">Looking great with these beautiful aesthetics!</div>
                            <div class="text-xs opacity-80 mt-1">You • 2:32 PM</div>
                          </div>
                        </div>
                        <div class="flex items-center space-x-2 p-3 bg-white rounded-xl border">
                          <input type="text" placeholder="Type a message..." class="flex-1 outline-none text-gray-700" />
                          <button class="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600">
                            <span class="text-sm">→</span>
                          </button>
                        </div>
                      </div>
                    {:else if selectedScreen.layout === 'task'}
                      <!-- Task Layout -->
                      <div class="space-y-4">
                        <div class="bg-white rounded-xl p-4 space-y-3">
                          <div class="flex items-center space-x-3">
                            <input type="checkbox" class="w-5 h-5 text-green-500" checked />
                            <div class="flex-1">
                              <div class="font-medium text-gray-800">Review APML flow</div>
                              <div class="text-sm text-gray-500">Due today</div>
                            </div>
                          </div>
                          <div class="flex items-center space-x-3">
                            <input type="checkbox" class="w-5 h-5 text-green-500" />
                            <div class="flex-1">
                              <div class="font-medium text-gray-800">Validate screen transitions</div>
                              <div class="text-sm text-gray-500">Due tomorrow</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    {:else if selectedScreen.layout === 'file'}
                      <!-- File Layout -->
                      <div class="space-y-4">
                        <div class="grid grid-cols-2 gap-3">
                          <div class="bg-white p-4 rounded-xl border text-center hover:shadow-lg transition-shadow">
                            <div class="text-2xl mb-2">📄</div>
                            <div class="text-sm font-medium">project.apml</div>
                            <div class="text-xs text-gray-500">2.4 KB</div>
                          </div>
                          <div class="bg-white p-4 rounded-xl border text-center hover:shadow-lg transition-shadow">
                            <div class="text-2xl mb-2">🎨</div>
                            <div class="text-sm font-medium">styles.css</div>
                            <div class="text-xs text-gray-500">15.2 KB</div>
                          </div>
                        </div>
                      </div>
                    {:else}
                      <!-- Default Layout -->
                      <div class="space-y-4">
                        <div class="text-center text-gray-600">
                          <div class="text-4xl mb-4">✨</div>
                          <p>Beautiful {selectedScreen.layout} layout</p>
                        </div>
                      </div>
                    {/if}
                  </div>
                  
                  <!-- Action Buttons - Fixed at Bottom, Always Visible -->
                  <div class="border-t border-gray-200 bg-white p-4 space-y-2 max-h-40 overflow-y-auto">
                    {#each selectedScreen.actions as action (action.id)}
                      <button
                        on:click={() => handleAction(action)}
                        class={getActionButtonClass(action)}
                      >
                        <div class="font-semibold">{action.label}</div>
                        {#if action.description}
                          <div class="text-sm opacity-90 mt-1">{action.description}</div>
                        {/if}
                      </button>
                    {/each}
                  </div>
                </div>
                
                <!-- Bottom Navigation -->
                <div class="border-t border-gray-200 bg-white px-6 py-4">
                  <div class="flex justify-around">
                    {#each simulatorScreens.filter(s => ['chat_screen', 'task_screen', 'file_screen', 'team_screen'].includes(s.id)) as screen (screen.id)}
                      <button 
                        on:click={() => selectScreen(screen)}
                        class="flex flex-col items-center py-3 px-4 rounded-xl text-sm transition-colors {selectedScreen.id === screen.id ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700'}"
                      >
                        <div class="text-2xl mb-2">
                          {screen.id === 'chat_screen' ? '💬' : 
                           screen.id === 'task_screen' ? '✅' : 
                           screen.id === 'file_screen' ? '📁' : '👥'}
                        </div>
                        <div class="font-medium">{screen.name.replace(' Screen', '')}</div>
                      </button>
                    {/each}
                  </div>
                </div>
                
                <!-- Home Indicator -->
                <div class="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-black rounded-full opacity-60"></div>
              </div>
            </div>
          </div>
        {/if}
      </div>
      
      <!-- Technical Details -->
      {#if technicalDetails}
        <div class="border-t border-gray-700 pt-4">
          <h3 class="text-lg font-semibold mb-4">🔧 Technical Details</h3>
          
          <div class="space-y-4">
            <!-- APML Sequence -->
            {#if messageSequence.length > 0}
              <div>
                <h4 class="text-sm font-medium mb-2 text-orange-400">APML Message Sequence</h4>
                <div class="space-y-2 max-h-32 overflow-y-auto">
                  {#each messageSequence as message (message.id)}
                    <div class="p-2 rounded text-xs {message.type === 'user-to-app' ? 'bg-green-900 text-green-100' : message.type === 'app-to-app' ? 'bg-purple-900 text-purple-100' : 'bg-blue-900 text-blue-100'}">
                      <div class="font-medium">{message.type.replace('-', ' → ').toUpperCase()}</div>
                      <div>{message.content}</div>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}
            
            <!-- Screen Data -->
            {#if selectedScreen}
              <div class="p-3 bg-gray-700 rounded">
                <h4 class="text-sm font-medium mb-2 text-blue-400">Current Screen</h4>
                <div class="text-xs text-gray-300 space-y-1">
                  <div><strong>ID:</strong> {selectedScreen.id}</div>
                  <div><strong>Layout:</strong> {selectedScreen.layout}</div>
                  <div><strong>Actions:</strong> {selectedScreen.actions.length}</div>
                </div>
              </div>
            {/if}
            
            <!-- Dynamic SHOW Nodes -->
            {#if detectedShowNodes.length > 0}
              <div class="p-3 bg-gray-700 rounded">
                <h4 class="text-sm font-medium mb-2 text-green-400">🎯 Dynamic SHOW Nodes</h4>
                <div class="text-xs text-gray-300 space-y-2 max-h-32 overflow-y-auto">
                  {#each detectedShowNodes.slice(-5) as showNode (showNode.id)}
                    <div class="border-l-2 border-green-500 pl-2">
                      <div><strong>Screen:</strong> {showNode.screenState.screenName}</div>
                      <div><strong>Elements:</strong> {showNode.visualChange.elements.length}</div>
                      <div><strong>Significance:</strong> {(showNode.visualChange.significance * 100).toFixed(0)}%</div>
                      <div class="text-xs text-gray-400">{new Date(showNode.timestamp).toLocaleTimeString()}</div>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}
            
            <!-- Runtime Trinity Monitor -->
            {#if trinityStateMonitor.isActive}
              <div class="p-3 bg-gray-700 rounded">
                <h4 class="text-sm font-medium mb-2 text-cyan-400">🔄 Trinity Runtime Monitor</h4>
                <div class="text-xs text-gray-300 space-y-1">
                  <div><strong>State:</strong> 
                    <span class="px-2 py-1 rounded text-xs {
                      trinityStateMonitor.flowState === 'show' ? 'bg-cyan-600' :
                      trinityStateMonitor.flowState === 'do' ? 'bg-green-600' :
                      trinityStateMonitor.flowState === 'process' ? 'bg-orange-600' :
                      'bg-gray-600'
                    }">{trinityStateMonitor.flowState.toUpperCase()}</span>
                  </div>
                  <div><strong>Real-Time Score:</strong> {trinityStateMonitor.realTimeScore.toFixed(1)}%</div>
                  <div><strong>Flows:</strong> {trinityStateMonitor.performanceMetrics.completedFlows}/{trinityStateMonitor.performanceMetrics.totalFlows}</div>
                  <div><strong>Success Rate:</strong> {trinityStateMonitor.performanceMetrics.totalFlows > 0 ? 
                    ((trinityStateMonitor.performanceMetrics.completedFlows / trinityStateMonitor.performanceMetrics.totalFlows) * 100).toFixed(0) : 0}%</div>
                  <div class="text-xs text-gray-400">Updated: {trinityStateMonitor.lastUpdate ? 
                    new Date(trinityStateMonitor.lastUpdate).toLocaleTimeString() : 'Never'}</div>
                </div>
              </div>
            {/if}
            
            <!-- Trinity State History -->
            {#if trinityStateMonitor.stateHistory.length > 0}
              <div class="p-3 bg-gray-700 rounded">
                <h4 class="text-sm font-medium mb-2 text-purple-400">📊 Trinity State Flow</h4>
                <div class="text-xs text-gray-300 space-y-1 max-h-24 overflow-y-auto">
                  {#each trinityStateMonitor.stateHistory.slice(-5).reverse() as state (state.timestamp)}
                    <div class="flex items-center space-x-2">
                      <span class="w-12 text-xs text-gray-400">{new Date(state.timestamp).toLocaleTimeString().split(':').slice(1).join(':')}</span>
                      <span class="px-1 py-0.5 rounded text-xs {
                        state.state.flowState === 'show' ? 'bg-cyan-800 text-cyan-200' :
                        state.state.flowState === 'do' ? 'bg-green-800 text-green-200' :
                        state.state.flowState === 'process' ? 'bg-orange-800 text-orange-200' :
                        'bg-gray-800 text-gray-200'
                      }">{state.state.flowState}</span>
                      <span class="text-xs text-gray-400">{state.state.score.toFixed(0)}%</span>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}
            
            <!-- Screen Snapshots -->
            {#if screenSnapshots.length > 0}
              <div class="p-3 bg-gray-700 rounded">
                <h4 class="text-sm font-medium mb-2 text-blue-400">📸 Screen Snapshots</h4>
                <div class="text-xs text-gray-300">
                  <div><strong>Captured:</strong> {screenSnapshots.length}/20</div>
                  <div><strong>Last Checksum:</strong> {lastScreenChecksum || 'None'}</div>
                  <div><strong>Threshold:</strong> {(pixelChangeThreshold * 100).toFixed(0)}%</div>
                </div>
              </div>
            {/if}
            
            <!-- Enhanced Trinity Validation -->
            <div class="p-3 bg-gray-700 rounded">
              <h4 class="text-sm font-medium mb-2 text-purple-400">🏆 Enhanced Trinity Analysis</h4>
              <div class="text-xs text-gray-300 space-y-2">
                {#await validateEnhancedTrinityPatterns() then enhancedValidation}
                  <div class="grid grid-cols-2 gap-2">
                    <div>
                      <div><strong>Overall Score:</strong> {enhancedValidation.overallScore.toFixed(1)}%</div>
                      <div><strong>Usability:</strong> {enhancedValidation.usabilityScore.toFixed(0)}%</div>
                    </div>
                    <div>
                      <div><strong>Real-World:</strong> {enhancedValidation.realWorldCompatibility}%</div>
                      <div><strong>Complexity:</strong> {enhancedValidation.complexityScore.toFixed(0)}%</div>
                    </div>
                  </div>
                  
                  {#if enhancedValidation.patternAnalysis.length > 0}
                    <div class="border-t border-gray-600 pt-2">
                      <div class="text-xs font-medium text-yellow-400 mb-1">Pattern Matches:</div>
                      {#each enhancedValidation.patternAnalysis.slice(0, 3) as pattern}
                        <div class="flex justify-between items-center">
                          <span class="text-xs">{pattern.template}</span>
                          <span class="text-xs {pattern.compatibility > 0.7 ? 'text-green-400' : pattern.compatibility > 0.5 ? 'text-yellow-400' : 'text-red-400'}">
                            {(pattern.compatibility * 100).toFixed(0)}%
                          </span>
                        </div>
                      {/each}
                    </div>
                  {/if}
                  
                  {#if enhancedValidation.recommendations.length > 0}
                    <div class="border-t border-gray-600 pt-2">
                      <div class="text-xs font-medium text-orange-400 mb-1">Top Recommendations:</div>
                      {#each enhancedValidation.recommendations.slice(0, 2) as rec}
                        <div class="text-xs text-gray-400">
                          <span class="text-{rec.priority === 'high' ? 'red' : 'yellow'}-400">●</span>
                          {rec.title}
                        </div>
                      {/each}
                    </div>
                  {/if}
                {/await}
              </div>
            </div>
            
            <!-- Validation Panel -->
            <ValidationPanel />
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .screen-transition {
    transition: all 0.3s ease;
  }

  .message-box {
    animation: messageAppear 0.4s ease;
  }

  @keyframes messageAppear {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* Custom scrollbar */
  :global(*::-webkit-scrollbar) {
    width: 8px;
    height: 8px;
  }

  :global(*::-webkit-scrollbar-track) {
    background: #374151;
    border-radius: 4px;
  }

  :global(*::-webkit-scrollbar-thumb) {
    background: #6b7280;
    border-radius: 4px;
  }

  :global(*::-webkit-scrollbar-thumb:hover) {
    background: #9ca3af;
  }

  /* Simplified Mermaid styling - only yellow dotted arrows for recent transitions */
  :global(.mermaid .edgePath path) {
    stroke: white !important;
    stroke-width: 2px !important;
  }

  /* Dotted yellow arrows for recent transitions */
  :global(.mermaid .edge-pattern-dotted .edgePath path) {
    stroke: #f59e0b !important;
    stroke-width: 3px !important;
    stroke-dasharray: 8,4 !important;
  }
</style>
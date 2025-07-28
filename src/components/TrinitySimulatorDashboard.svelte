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
  });

  onDestroy(() => {
    if (websocket) {
      websocket.close();
    }
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
    if (!currentApml || !currentApml.screens) {
      flowDiagram = 'flowchart TD\n    A[No screens found]';
      return;
    }

    let mermaid = 'flowchart TD\n';
    
    // Add nodes with beautiful styling
    Object.entries(currentApml.screens).forEach(([screenId, screen]) => {
      const cleanName = screen.name?.replace(' Screen', '') || screenId;
      const isMain = ['chat_screen', 'task_screen', 'file_screen', 'team_screen'].includes(screenId);
      
      if (isMain) {
        mermaid += `    ${screenId}["🏠 ${cleanName}"]:::mainScreen\n`;
      } else {
        mermaid += `    ${screenId}["${cleanName}"]:::flowScreen\n`;
      }
    });
    
    // Add connections
    Object.entries(currentApml.screens).forEach(([screenId, screen]) => {
      if (screen.user_actions) {
        const connections = new Set();
        screen.user_actions.forEach(action => {
          if (action.next_screen && currentApml.screens[action.next_screen]) {
            connections.add(action.next_screen);
          }
        });
        
        connections.forEach(nextScreen => {
          mermaid += `    ${screenId} --> ${nextScreen}\n`;
        });
      }
    });
    
    // Add beautiful styling
    mermaid += `
    classDef mainScreen fill:#10b981,stroke:#059669,stroke-width:3px,color:#fff
    classDef flowScreen fill:#3b82f6,stroke:#2563eb,stroke-width:2px,color:#fff
    classDef currentScreen fill:#f59e0b,stroke:#d97706,stroke-width:4px,color:#000
`;
    
    // Highlight current screen
    if (selectedScreen) {
      mermaid += `    class ${selectedScreen.id} currentScreen\n`;
    }
    
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
    
    // Add to message sequence
    addToMessageSequence('app-to-user', `Screen loaded: ${screen.name}`);
  }

  function handleAction(action) {
    addToMessageSequence('user-to-app', action.label);
    
    // Simulate processing
    setTimeout(() => {
      addToMessageSequence('app-to-app', `Processing: ${action.label}`);
    }, 300);
    
    // Navigate to next screen if specified
    setTimeout(() => {
      if (action.nextScreenId) {
        const nextScreen = simulatorScreens.find(s => s.id === action.nextScreenId);
        if (nextScreen) {
          selectScreen(nextScreen);
          addToMessageSequence('app-to-user', `Navigated to ${nextScreen.name}`);
        }
      } else {
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
      const fileData = await fileResponse.json();
      
      if (fileData.success) {
        // Use our APML store parser instead of expecting YAML format
        const parseSuccess = apmlStore.parseAPML(fileData.content);
        
        if (parseSuccess) {
          // Get the parsed scenes from the store
          let scenes = [];
          const unsubscribe = flowScenes.subscribe(value => scenes = value);
          unsubscribe();
          
          if (scenes.length > 0) {
            // Convert scenes to simulator screens
            simulatorScreens = scenes[0].stateNodes.map((node, index) => ({
              id: node.interfaceName,
              name: node.interfaceName,
              description: node.displayContent,
              layout: 'default',
              actions: node.availableActions.map(action => ({
                id: `${node.interfaceName}_${action}`,
                label: action,
                description: `${action} action`,
                nextScreenId: null,
                color: 'blue'
              })),
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
      <!-- Flow Diagram -->
      <div class="flex-1 mb-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold">🗺️ Trinity Flow Diagram</h2>
          <div class="flex items-center space-x-2">
            <div class="px-2 py-1 bg-green-900 text-green-300 rounded text-xs border border-green-600">
              {simulatorScreens.length} screens
            </div>
            <button 
              on:click={loadAvailableApmlFiles}
              class="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors text-white"
            >
              📁 Load APML
            </button>
            <button 
              on:click={() => technicalDetails = !technicalDetails}
              class="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
            >
              {technicalDetails ? '👁️ Hide Tech' : '🔧 Show Tech'}
            </button>
          </div>
        </div>
        
        <div class="h-full p-6 bg-gray-900 rounded-lg border border-gray-600">
          {#if flowDiagram && typeof flowDiagram === 'string'}
            <div class="w-full h-full flex items-center justify-center">
              <div class="text-center">
                <div class="text-4xl mb-4">🔄</div>
                <p class="text-gray-400">Flow diagram generated!</p>
                <div class="mt-4 p-4 bg-gray-800 rounded text-xs text-green-400 font-mono">
                  {flowDiagram.substring(0, 200)}...
                </div>
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
      
      <!-- Trinity Chat Section -->
      <div class="border-t border-gray-700 pt-4">
        <h2 class="text-lg font-semibold mb-4">💬 Trinity Assistant</h2>
        
        <!-- BIG OBVIOUS LOAD BUTTON HERE -->
        <div class="mb-4 text-center">
          <button 
            on:click={loadAvailableApmlFiles}
            class="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-lg font-bold transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            📁 CLICK HERE TO LOAD YOUR APML FILES
          </button>
        </div>
        
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
                <div class="flex-1 p-6 overflow-y-auto bg-gray-50">
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
                  
                  <!-- Action Buttons -->
                  <div class="mt-4 space-y-2">
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
</style>
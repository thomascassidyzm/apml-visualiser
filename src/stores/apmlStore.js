import { writable, derived } from 'svelte/store';

// APML Specification Store
export const apmlSpec = writable({
  rawContent: '',
  parsedFlows: [],
  stateNodes: [],
  messageFlows: [],
  validationStatus: 'parsing',
  parseErrors: []
});

// Flow Scene Store
export const flowScenes = writable([]);

// Current Visualization State
export const visualizationState = writable({
  currentNode: null,
  pathHistory: [],
  availableTransitions: [],
  autoRunActive: false,
  autoRunSpeed: 1.0
});

// Validation Results Store
export const validationResults = writable({
  totalPathsTested: 0,
  successfulPaths: 0,
  failedPaths: 0,
  issues: [],
  unreachableStates: [],
  metrics: {}
});

// Change Requests Store
export const changeRequests = writable([]);

// Derived stores
export const isValidAPML = derived(
  apmlSpec,
  $apmlSpec => $apmlSpec.validationStatus === 'valid'
);

export const isAuthenticated = derived(
  visualizationState,
  $state => $state.currentNode !== null
);

// APML Parser Functions
export const apmlStore = {
  /**
   * Set parsed data from MCP server directly
   */
  setMCPParsedData(astData) {
    console.log('🎯 Setting MCP-parsed data in Trinity store:', astData);
    
    try {
      const { ast, interfaces, logic, data, metadata } = astData;
      
      // Convert MCP AST to Trinity format
      const stateNodes = interfaces.map(iface => ({
        interfaceName: iface.name,
        name: iface.name,
        elements: iface.elements || {},
        definition: JSON.stringify(iface, null, 2)
      }));
      
      const messageFlows = logic.map(flow => ({
        name: flow.name,
        type: 'logic',
        flow: flow,
        definition: JSON.stringify(flow, null, 2)
      }));
      
      // Update all stores with MCP data
      apmlSpec.set({
        rawContent: metadata.originalAPML || '',
        parsedFlows: logic,
        stateNodes: stateNodes,
        messageFlows: messageFlows,
        validationStatus: 'valid',
        parseErrors: [],
        mcpMetadata: metadata
      });
      
      // Generate scenes for simulator
      const scenes = this.generateScenesFromMCPData(interfaces, logic);
      flowScenes.set(scenes);
      
      console.log('✅ Trinity store updated with MCP-parsed data');
      return true;
    } catch (error) {
      console.error('❌ Error setting MCP data:', error);
      return false;
    }
  },
  
  /**
   * Generate scenes from MCP parsed data
   */
  generateScenesFromMCPData(interfaces, logic) {
    const scenes = interfaces.map(iface => ({
      name: iface.name,
      description: `Interface: ${iface.name}`,
      elements: iface.elements || {},
      flows: logic.filter(flow => 
        flow.processes?.some(process => 
          process.target === iface.name
        )
      )
    }));
    
    console.log('📱 Generated scenes from MCP data:', scenes);
    return scenes;
  },
  parseAPML: (content) => {
    try {
      console.log('🔄 Starting APML compilation process...');
      
      // Step 1: Extract APML components
      const interfaces = extractInterfaces(content);
      const dataModels = extractDataModels(content);
      const logicFlows = extractLogicFlows(content);
      
      console.log('📋 Extracted components:', {
        interfaces: interfaces.length,
        dataModels: dataModels.length, 
        logicFlows: logicFlows.length
      });
      
      // Step 2: Generate state nodes for Trinity validation
      const stateNodes = generateStateNodes(interfaces);
      console.log('🎯 Generated state nodes:', stateNodes.length);
      
      // Step 3: Generate message flows for Trinity patterns
      const messageFlows = generateMessageFlows(logicFlows);
      console.log('🔄 Generated message flows:', messageFlows.length);
      
      // Step 4: Create simulator-ready scenes
      const scenes = groupIntoScenes(stateNodes, messageFlows, logicFlows);
      console.log('📱 Generated scenes for simulator:', scenes.length);
      
      // Step 5: Update stores with compiled data
      apmlSpec.update(spec => ({
        ...spec,
        rawContent: content,
        parsedFlows: logicFlows,
        stateNodes,
        messageFlows,
        interfaces,
        dataModels,
        validationStatus: 'valid',
        parseErrors: []
      }));
      
      flowScenes.set(scenes);
      
      console.log('✅ APML compilation complete - Trinity & Simulator ready!');
      return true;
    } catch (error) {
      console.error('❌ APML compilation failed:', error);
      apmlSpec.update(spec => ({
        ...spec,
        validationStatus: 'invalid',
        parseErrors: [error.message]
      }));
      return false;
    }
  },
  
  addChangeRequest: (screenState, note, type = 'ui_change', priority = 'medium') => {
    const cr = {
      id: crypto.randomUUID(),
      screenState,
      userNote: note,
      crType: type,
      priority,
      timestamp: new Date().toISOString()
    };
    
    changeRequests.update(crs => [...crs, cr]);
    return cr;
  },
  
  exportAPMLWithCRs: () => {
    // Implementation to append change requests to APML
    // This would generate downloadable APML with CR comments
  }
};

// Helper functions for APML parsing
function extractInterfaces(content) {
  const interfaces = [];
  
  // Modern APML format: interface name:
  const interfaceRegex = /interface\s+(\w+):(.*?)(?=interface\s+\w+:|logic\s+\w+:|data\s+\w+:|styles\s+\w+:|theme\s+\w+:|animations:|$)/gs;
  let match;
  
  console.log('🔍 Extracting interfaces from APML...');
  
  while ((match = interfaceRegex.exec(content)) !== null) {
    const interfaceName = match[1];
    const definition = match[2].trim();
    
    console.log(`📱 Found interface: ${interfaceName}`, definition.substring(0, 100) + '...');
    
    // Extract layout information
    const layoutMatch = definition.match(/layout:\s*"([^"]+)"/);
    const layout = layoutMatch ? layoutMatch[1] : 'default';
    
    // Extract theme and styling info
    const animationMatch = definition.match(/animation:\s*"([^"]+)"/);
    const animation = animationMatch ? animationMatch[1] : null;
    
    // Enhanced action extraction from various APML patterns
    const actions = extractActionsFromInterface(definition, interfaceName);
    const elements = extractUIElements(definition);
    
    interfaces.push({
      name: interfaceName,
      definition: definition,
      layout: layout,
      animation: animation,
      extractedActions: actions,
      extractedElements: elements,
      complexity: calculateInterfaceComplexity(definition)
    });
  }
  
  console.log(`✅ Extracted ${interfaces.length} interfaces`);
  return interfaces;
}

function calculateInterfaceComplexity(definition) {
  // Count various UI elements to determine complexity
  const showElements = (definition.match(/show\s+\w+:/g) || []).length;
  const actions = (definition.match(/action:/g) || []).length;
  const loops = (definition.match(/for each/g) || []).length;
  
  return showElements + (actions * 2) + (loops * 3);
}

function extractDataModels(content) {
  const models = [];
  const dataRegex = /data\s+(\w+):(.*?)(?=data\s+\w+:|interface\s+\w+:|logic\s+\w+:|theme\s+\w+:|$)/gs;
  let match;
  
  while ((match = dataRegex.exec(content)) !== null) {
    const modelName = match[1];
    const definition = match[2].trim();
    
    // Parse fields from definition
    const fields = {};
    const fieldLines = definition.split('\n').map(line => line.trim()).filter(line => line);
    
    for (const line of fieldLines) {
      if (line.includes(':')) {
        const [fieldName, fieldType] = line.split(':').map(s => s.trim());
        fields[fieldName] = fieldType;
      }
    }
    
    models.push({
      name: modelName,
      definition: definition.trim(),
      fields: fields
    });
  }
  
  return models;
}

function extractLogicFlows(content) {
  const flows = [];
  const logicRegex = /logic\s+(\w+):(.*?)(?=logic\s+\w+:|interface\s+\w+:|data\s+\w+:|styles\s+\w+:|theme\s+\w+:|animations:|$)/gs;
  let match;
  
  console.log('🔍 Extracting logic flows from APML...');
  
  while ((match = logicRegex.exec(content)) !== null) {
    const logicName = match[1];
    const logicContent = match[2].trim();
    
    console.log(`📋 Found logic block: ${logicName}`, logicContent);
    
    // Modern APML patterns
    // Pattern 1: when user clicks element: redirect to screen
    const redirectRegex = /process\s+(\w+):\s*when\s+user\s+clicks\s+(\w+):\s*redirect\s+to\s+(\w+)/g;
    let processMatch;
    
    while ((processMatch = redirectRegex.exec(logicContent)) !== null) {
      const processName = processMatch[1];
      const triggerElement = processMatch[2];
      const targetScreen = processMatch[3];
      
      console.log(`🔗 Found redirect flow: ${processName}, trigger: ${triggerElement}, target: ${targetScreen}`);
      
      flows.push({
        name: logicName,
        processName: processName,
        trigger: triggerElement,
        buttonName: triggerElement,
        fromInterface: inferFromInterface(logicName, triggerElement),
        redirectTo: targetScreen,
        actionName: processName,
        type: 'navigation'
      });
    }
    
    // Pattern 2: when user clicks element: show modal/overlay
    const modalRegex = /process\s+(\w+):\s*when\s+user\s+clicks\s+(\w+):\s*show\s+(modal|overlay):\s*"([^"]+)"/g;
    while ((processMatch = modalRegex.exec(logicContent)) !== null) {
      flows.push({
        name: logicName,
        processName: processMatch[1],
        trigger: processMatch[2],
        buttonName: processMatch[2],
        fromInterface: inferFromInterface(logicName, processMatch[2]),
        redirectTo: null,
        actionName: processMatch[1],
        type: 'modal',
        modalType: processMatch[3],
        modalName: processMatch[4]
      });
    }
    
    // Pattern 3: State changes (toggle, update, etc.)
    const stateRegex = /process\s+(\w+):\s*when\s+user\s+clicks\s+(\w+):\s*(toggle|update|set)\s+(.+)/g;
    while ((processMatch = stateRegex.exec(logicContent)) !== null) {
      flows.push({
        name: logicName,
        processName: processMatch[1],
        trigger: processMatch[2],
        buttonName: processMatch[2],
        fromInterface: inferFromInterface(logicName, processMatch[2]),
        redirectTo: null,
        actionName: processMatch[1],
        type: 'state_change',
        operation: processMatch[3],
        target: processMatch[4]
      });
    }
    
    // Pattern 4: Animation/effect triggers
    const effectRegex = /process\s+(\w+):\s*when\s+user\s+(touches|clicks)\s+(.+):\s*animate\s+with\s+"([^"]+)"/g;
    while ((processMatch = effectRegex.exec(logicContent)) !== null) {
      flows.push({
        name: logicName,
        processName: processMatch[1],
        trigger: processMatch[3],
        buttonName: processMatch[3],
        fromInterface: null,
        redirectTo: null,
        actionName: processMatch[1],
        type: 'animation',
        interaction: processMatch[2],
        effect: processMatch[4]
      });
    }
    
    // Fallback: extract process names without specific patterns
    if (flows.filter(f => f.name === logicName).length === 0) {
      const simpleProcessRegex = /process\s+(\w+):/g;
      let simpleMatch;
      while ((simpleMatch = simpleProcessRegex.exec(logicContent)) !== null) {
        const processName = simpleMatch[1];
        flows.push({
          name: logicName,
          processName: processName,
          trigger: processName,
          buttonName: `${processName}_button`,
          fromInterface: null,
          redirectTo: null,
          actionName: processName,
          type: 'generic'
        });
      }
    }
  }
  
  console.log(`✅ Extracted ${flows.length} logic flows:`, flows);
  return flows;
}

function inferFromInterface(logicName, triggerElement) {
  // Try to infer which interface this logic belongs to based on naming patterns
  if (logicName.includes('dashboard')) return 'dashboard';
  if (logicName.includes('project')) return 'project_detail';
  if (logicName.includes('navigation')) {
    if (triggerElement.includes('project')) return 'dashboard';
    if (triggerElement.includes('back')) return 'project_detail';
  }
  return null;
}

function getInterfaceForButton(content, buttonName) {
  // Find which interface contains this button
  const interfaceRegex = /interface\s+(\w+):(.*?)(?=interface\s+\w+:|logic\s+\w+:|data\s+\w+:|theme\s+\w+:|$)/gs;
  let match;
  
  while ((match = interfaceRegex.exec(content)) !== null) {
    const interfaceName = match[1];
    const interfaceContent = match[2];
    
    if (interfaceContent.includes(buttonName)) {
      return interfaceName;
    }
  }
  
  return null;
}

function generateStateNodes(interfaces) {
  return interfaces.map((iface, index) => {
    const actions = extractActionsFromInterface(iface.definition, iface.name);
    
    return {
      id: crypto.randomUUID(),
      interfaceName: iface.name,
      displayContent: `${iface.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Interface`,
      availableActions: actions,
      nodeType: 'app_to_user',
      sceneGroup: iface.name,
      positionX: (index % 3) * 200,
      positionY: Math.floor(index / 3) * 150,
      // Enhanced for simulator
      layout: determineLayoutType(iface.definition, iface.name),
      interfaceDefinition: iface.definition,
      extractedElements: extractUIElements(iface.definition)
    };
  });
}

function determineLayoutType(definition, interfaceName) {
  const name = interfaceName.toLowerCase();
  const def = definition.toLowerCase();
  
  if (name.includes('sort') || def.includes('sort')) return 'list';
  if (name.includes('chat') || def.includes('message')) return 'chat';
  if (name.includes('task') || def.includes('todo')) return 'task';
  if (name.includes('file') || def.includes('upload')) return 'file';
  if (name.includes('form') || def.includes('input')) return 'form';
  if (name.includes('search') || def.includes('filter')) return 'search';
  
  return 'default';
}

function extractUIElements(definition) {
  const elements = [];
  
  // Pattern 1: show elements with complex nested structures
  const showRegex = /show\s+(\w+):(.*?)(?=show\s+\w+:|$)/gs;
  let match;
  
  while ((match = showRegex.exec(definition)) !== null) {
    const elementName = match[1];
    const elementDef = match[2];
    
    // Determine element type based on name and content
    let type = 'component';
    if (elementName.includes('button')) type = 'button';
    else if (elementName.includes('header')) type = 'header';
    else if (elementName.includes('nav')) type = 'navigation';
    else if (elementName.includes('content')) type = 'content';
    else if (elementName.includes('bar')) type = 'bar';
    else if (elementName.includes('grid') || elementName.includes('list')) type = 'list';
    
    // Extract nested actions
    const actions = extractActionsFromDefinition(elementDef);
    
    // Extract text content
    const textMatch = elementDef.match(/text:\s*"([^"]+)"/);
    const titleMatch = elementDef.match(/title:\s*"([^"]+)"/);
    const iconMatch = elementDef.match(/icon:\s*"([^"]+)"/);
    
    elements.push({
      type: type,
      id: elementName,
      text: textMatch ? textMatch[1] : (titleMatch ? titleMatch[1] : ''),
      icon: iconMatch ? iconMatch[1] : null,
      interactive: actions.length > 0 || type === 'button',
      actions: actions,
      hasNestedElements: elementDef.includes('for each') || elementDef.includes('layout:'),
      complexity: calculateElementComplexity(elementDef)
    });
  }
  
  return elements;
}

function extractActionsFromDefinition(definition) {
  const actions = [];
  
  // Extract action definitions
  const actionRegex = /(\w+):\s*(?:icon:\s*"([^"]+)"|action:\s*"([^"]+)"|text:\s*"([^"]+)")/g;
  let match;
  
  while ((match = actionRegex.exec(definition)) !== null) {
    if (match[1].includes('button') || match[3]) { // Has action or is a button
      actions.push({
        name: match[1],
        action: match[3] || match[1],
        icon: match[2],
        text: match[4]
      });
    }
  }
  
  return actions;
}

function calculateElementComplexity(definition) {
  const nested = (definition.match(/\w+:/g) || []).length;
  const loops = (definition.match(/for each/g) || []).length;
  const conditionals = (definition.match(/if\s+/g) || []).length;
  
  return nested + (loops * 2) + (conditionals * 2);
}

function generateMessageFlows(logicFlows) {
  // Simplified flow generation
  return logicFlows.map(flow => ({
    id: crypto.randomUUID(),
    fromNode: null, // Would be populated with actual node references
    toNode: null,
    triggerMessage: flow.name,
    flowType: 'process',
    colorCode: '#2563eb',
    isActive: false
  }));
}

function groupIntoScenes(stateNodes, messageFlows, logicFlows) {
  // Create a comprehensive scene with all Trinity components
  const mainScene = {
    id: crypto.randomUUID(),
    sceneName: 'main_flow',
    description: 'Complete application flow with Trinity validation',
    stateNodes: stateNodes,
    logicFlows: logicFlows || [],
    messageFlows: messageFlows || [],
    primaryFlowPath: generatePrimaryPath(stateNodes, logicFlows),
    sceneOrder: 1,
    // Trinity-specific metadata
    trinityPattern: analyzeTrinityPatterns(stateNodes, logicFlows),
    simulatorConfig: generateSimulatorConfig(stateNodes)
  };
  
  console.log('📱 Scene created with Trinity patterns:', mainScene.trinityPattern);
  return [mainScene];
}

function generatePrimaryPath(stateNodes, logicFlows) {
  // Create the main user journey through the interface
  if (!stateNodes || stateNodes.length === 0) return [];
  
  const path = [stateNodes[0].interfaceName];
  
  // Follow logical flow connections
  logicFlows.forEach(flow => {
    if (flow.redirectTo && !path.includes(flow.redirectTo)) {
      path.push(flow.redirectTo);
    }
  });
  
  return path;
}

function analyzeTrinityPatterns(stateNodes, logicFlows) {
  // Analyze for SHOW → DO → PROCESS patterns
  const patterns = {
    showNodes: stateNodes.filter(node => node.extractedElements?.some(el => el.type === 'text')),
    doNodes: stateNodes.filter(node => node.extractedElements?.some(el => el.interactive)),
    processNodes: logicFlows.map(flow => flow.processName),
    flowCompleteness: calculateFlowCompleteness(stateNodes, logicFlows)
  };
  
  return patterns;
}

function calculateFlowCompleteness(stateNodes, logicFlows) {
  if (stateNodes.length === 0) return 0;
  
  const connectedNodes = new Set();
  logicFlows.forEach(flow => {
    if (flow.fromInterface) connectedNodes.add(flow.fromInterface);
    if (flow.redirectTo) connectedNodes.add(flow.redirectTo);
  });
  
  return (connectedNodes.size / stateNodes.length) * 100;
}

function generateSimulatorConfig(stateNodes) {
  return {
    totalScreens: stateNodes.length,
    startScreen: stateNodes[0]?.interfaceName || null,
    screenTypes: stateNodes.map(node => node.layout),
    interactionCount: stateNodes.reduce((count, node) => 
      count + (node.extractedElements?.filter(el => el.interactive).length || 0), 0
    )
  };
}

function extractActionsFromInterface(definition, interfaceName) {
  const actions = [];
  
  // Pattern 1: Button definitions (_button suffix)
  const buttonRegex = /(\w+)_button/g;
  let match;
  while ((match = buttonRegex.exec(definition)) !== null) {
    actions.push({
      name: match[1],
      type: 'button',
      source: 'button_definition'
    });
  }
  
  // Pattern 2: Action properties (action: "action_name")
  const actionRegex = /action:\s*"([^"]+)"/g;
  while ((match = actionRegex.exec(definition)) !== null) {
    actions.push({
      name: match[1],
      type: 'action',
      source: 'action_property'
    });
  }
  
  // Pattern 3: Text properties that suggest actions
  const textRegex = /text:\s*"([^"]+)"/g;
  while ((match = textRegex.exec(definition)) !== null) {
    const text = match[1].toLowerCase();
    if (text.includes('click') || text.includes('press') || text.includes('tap') || 
        text.includes('button') || text.includes('submit') || text.includes('send')) {
      const actionName = text.replace(/[^\w\s]/g, '').replace(/\s+/g, '_');
      actions.push({
        name: actionName,
        type: 'interactive_text',
        source: 'text_analysis'
      });
    }
  }
  
  // Pattern 4: Show sections that might be interactive
  const showRegex = /show\s+(\w+):/g;
  while ((match = showRegex.exec(definition)) !== null) {
    actions.push({
      name: `view_${match[1]}`,
      type: 'show_section',
      source: 'show_section'
    });
  }
  
  // Pattern 5: Interface-specific defaults based on layout
  const layoutMatch = definition.match(/layout:\s*"([^"]+)"/);
  const layout = layoutMatch ? layoutMatch[1] : 'default';
  
  const layoutDefaults = {
    'chat': ['send_message', 'view_history', 'add_attachment'],
    'task': ['create_task', 'complete_task', 'edit_task'],
    'file': ['upload_file', 'download_file', 'delete_file'],
    'form': ['submit_form', 'reset_form', 'validate_input'],
    'search': ['search', 'filter', 'sort_results'],
    'default': ['navigate', 'interact', 'process']
  };
  
  if (actions.length === 0 && layoutDefaults[layout]) {
    layoutDefaults[layout].forEach(actionName => {
      actions.push({
        name: actionName,
        type: 'layout_default',
        source: 'layout_inference'
      });
    });
  }
  
  // Ensure we always have at least some actions
  if (actions.length === 0) {
    actions.push({
      name: 'navigate',
      type: 'default',
      source: 'fallback'
    });
  }
  
  // Remove duplicates and return just the names
  const uniqueActions = [...new Set(actions.map(a => a.name))];
  return uniqueActions;
}
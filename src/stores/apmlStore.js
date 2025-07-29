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
  const interfaceRegex = /interface\s+(\w+):(.*?)(?=interface\s+\w+:|logic\s+\w+:|data\s+\w+:|$)/gs;
  let match;
  
  while ((match = interfaceRegex.exec(content)) !== null) {
    const interfaceName = match[1];
    const definition = match[2].trim();
    
    // Extract layout information
    const layoutMatch = definition.match(/layout:\s*"([^"]+)"/);
    const layout = layoutMatch ? layoutMatch[1] : 'default';
    
    // Enhanced action extraction from various APML patterns
    const actions = extractActionsFromInterface(definition, interfaceName);
    
    interfaces.push({
      name: interfaceName,
      definition: definition,
      layout: layout,
      extractedActions: actions
    });
  }
  
  return interfaces;
}

function extractDataModels(content) {
  const models = [];
  const dataRegex = /data\s+(\w+):(.*?)(?=data\s+\w+:|interface\s+\w+:|logic\s+\w+:|$)/gs;
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
  const logicRegex = /logic\s+(\w+):(.*?)(?=logic\s+\w+:|interface\s+\w+:|data\s+\w+:|$)/gs;
  let match;
  
  console.log('🔍 Extracting logic flows from APML...');
  
  while ((match = logicRegex.exec(content)) !== null) {
    const logicName = match[1];
    const logicContent = match[2].trim();
    
    console.log(`📋 Found logic block: ${logicName}`, logicContent);
    
    // Parse individual processes within this logic block - handle both button names and action names  
    const processRegex = /process\s+(\w+):\s*when\s+user\s+clicks\s+(\w+(?:_button)?):\s*redirect\s+to\s+(\w+)/g;
    // Also try simpler pattern for this APML format
    const simpleProcessRegex = /process\s+(\w+):/g;
    let processMatch;
    
    while ((processMatch = processRegex.exec(logicContent)) !== null) {
      const buttonName = processMatch[2];
      // Convert button name to action (remove _button suffix)
      const actionName = buttonName.replace('_button', '');
      
      console.log(`🔗 Found process: ${processMatch[1]}, button: ${buttonName}, action: ${actionName}, redirect: ${processMatch[3]}`);
      
      flows.push({
        name: logicName,
        processName: processMatch[1],
        trigger: actionName,  // Use action name without _button
        buttonName: buttonName,  // Keep original button name for interface lookup
        fromInterface: getInterfaceForButton(content, buttonName),
        redirectTo: processMatch[3],
        actionName: processMatch[1]
      });
    }
    
    // If no specific flows found, create basic flows from process names
    if (flows.filter(f => f.name === logicName).length === 0) {
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
          actionName: processName
        });
      }
    }
  }
  
  console.log(`✅ Extracted ${flows.length} logic flows:`, flows);
  return flows;
}

function getInterfaceForButton(content, buttonName) {
  // Find which interface contains this button
  const interfaceRegex = /interface\s+(\w+):(.*?)(?=interface\s+\w+:|logic\s+\w+:|data\s+\w+:|$)/gs;
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
  
  // Extract show elements that become UI components
  const showRegex = /show\s+(\w+):\s*text:\s*"([^"]+)"/g;
  let match;
  while ((match = showRegex.exec(definition)) !== null) {
    elements.push({
      type: match[1].includes('button') ? 'button' : 'text',
      id: match[1],
      text: match[2],
      interactive: match[1].includes('button')
    });
  }
  
  return elements;
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
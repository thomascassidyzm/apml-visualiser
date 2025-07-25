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
      // Simple APML parser for demonstration
      const interfaces = extractInterfaces(content);
      const dataModels = extractDataModels(content);
      const logicFlows = extractLogicFlows(content);
      
      const stateNodes = generateStateNodes(interfaces);
      const messageFlows = generateMessageFlows(logicFlows);
      const scenes = groupIntoScenes(stateNodes, messageFlows);
      
      apmlSpec.update(spec => ({
        ...spec,
        rawContent: content,
        parsedFlows: logicFlows,
        stateNodes,
        messageFlows,
        validationStatus: 'valid',
        parseErrors: []
      }));
      
      flowScenes.set(scenes);
      
      return true;
    } catch (error) {
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
    interfaces.push({
      name: match[1],
      definition: match[2].trim()
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
  return interfaces.map((iface, index) => ({
    id: crypto.randomUUID(),
    interfaceName: iface.name,
    displayContent: `${iface.name} Interface`,
    availableActions: extractActionsFromInterface(iface.definition),
    nodeType: 'app_to_user',
    sceneGroup: iface.name,
    positionX: (index % 3) * 200,
    positionY: Math.floor(index / 3) * 150
  }));
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

function groupIntoScenes(stateNodes, messageFlows) {
  // Get the current APML spec to access parsed flows
  let currentSpec;
  apmlSpec.subscribe(spec => currentSpec = spec)();
  
  // Create a single scene containing all interfaces and their connections
  const mainScene = {
    id: crypto.randomUUID(),
    sceneName: 'main_flow',
    description: 'Complete application flow',
    stateNodes: stateNodes,
    logicFlows: currentSpec.parsedFlows || [],
    primaryFlowPath: [],
    sceneOrder: 1
  };
  
  return [mainScene];
}

function extractActionsFromInterface(definition) {
  // Simple action extraction
  const actions = [];
  const buttonRegex = /(\w+)_button/g;
  let match;
  
  while ((match = buttonRegex.exec(definition)) !== null) {
    actions.push(match[1]);
  }
  
  return actions.length > 0 ? actions : ['click', 'navigate'];
}
/**
 * Trinity Flow Store - Single Source of Truth
 * Synchronizes Trinity Flow Diagram with Live App
 * Creates the "Billie Jean effect" - lighting up paths as user navigates
 */

import { writable, derived, get } from 'svelte/store';

// Current application state - the single source of truth
export const trinityFlowState = writable({
  currentScreen: 'dashboard',
  previousScreen: null,
  activeConnection: null,
  screenHistory: [],
  businessLogicQueue: [],
  isNavigating: false,
  lastAction: null
});

// Available screens and their connections
export const screenNetwork = writable({
  screens: new Map(),
  connections: new Map(),
  initialized: false
});

// Visual effects for the "Billie Jean" path lighting
export const pathEffects = writable({
  activeNodes: new Set(),
  glowingConnections: new Set(),
  pathHistory: [],
  currentEffect: null
});

/**
 * Navigation Controller - handles all screen transitions
 */
export const navigationController = {
  
  /**
   * Navigate to a screen (from Trinity diagram or app)
   */
  navigateToScreen(targetScreen, source = 'unknown', userAction = null) {
    console.log(`🎯 Navigation: ${get(trinityFlowState).currentScreen} → ${targetScreen} (from ${source})`);
    
    const currentState = get(trinityFlowState);
    const previousScreen = currentState.currentScreen;
    
    // Don't navigate if already on target screen, unless it's a refresh action
    if (previousScreen === targetScreen && !userAction?.includes('refresh')) {
      console.log('📍 Already on target screen, skipping navigation');
      return;
    }
    
    // Start navigation
    trinityFlowState.update(state => ({
      ...state,
      isNavigating: true,
      previousScreen: previousScreen,
      lastAction: {
        type: 'NAVIGATION_START',
        from: previousScreen,
        to: targetScreen,
        source: source,
        userAction: userAction,
        timestamp: new Date().toISOString()
      }
    }));
    
    // Light up the connection path (Billie Jean effect!)
    this.lightUpPath(previousScreen, targetScreen);
    
    // Generate business logic for this transition
    this.generateBusinessLogic(previousScreen, targetScreen, userAction);
    
    // Complete navigation after a brief delay for visual effect
    setTimeout(() => {
      trinityFlowState.update(state => ({
        ...state,
        currentScreen: targetScreen,
        previousScreen: previousScreen,
        screenHistory: [...state.screenHistory, {
          screen: targetScreen,
          timestamp: new Date().toISOString(),
          userAction: userAction
        }].slice(-10), // Keep last 10 transitions
        isNavigating: false,
        lastAction: {
          type: 'NAVIGATION_COMPLETE',
          from: previousScreen,
          to: targetScreen,
          source: source,
          userAction: userAction,
          timestamp: new Date().toISOString()
        }
      }));
      
      // Clear path effects after showing them
      setTimeout(() => {
        this.clearPathEffects();
      }, 2000);
      
    }, 300);
  },
  
  /**
   * Light up the path between screens (Billie Jean effect)
   */
  lightUpPath(fromScreen, toScreen) {
    console.log(`✨ Lighting up path: ${fromScreen} → ${toScreen}`);
    
    pathEffects.update(effects => ({
      ...effects,
      activeNodes: new Set([fromScreen, toScreen]),
      glowingConnections: new Set([`${fromScreen}->${toScreen}`]),
      pathHistory: [...effects.pathHistory, {
        from: fromScreen,
        to: toScreen,
        timestamp: new Date().toISOString(),
        effect: 'billie_jean_glow'
      }].slice(-5), // Keep last 5 path transitions
      currentEffect: {
        type: 'path_glow',
        from: fromScreen,
        to: toScreen,
        startTime: Date.now()
      }
    }));
  },
  
  /**
   * Generate business logic messages for screen transitions
   */
  generateBusinessLogic(fromScreen, toScreen, userAction) {
    const businessSteps = this.getBusinessLogicSteps(fromScreen, toScreen, userAction);
    
    // Add each business logic step with delays for realistic flow
    businessSteps.forEach((step, index) => {
      setTimeout(() => {
        trinityFlowState.update(state => ({
          ...state,
          businessLogicQueue: [...state.businessLogicQueue, {
            id: `bl_${Date.now()}_${index}`,
            step: step.step,
            description: step.description,
            type: 'app_process',
            fromScreen: fromScreen,
            toScreen: toScreen,
            userAction: userAction,
            timestamp: new Date().toISOString()
          }].slice(-20) // Keep last 20 business logic steps
        }));
      }, index * 200); // Stagger the business logic steps
    });
  },
  
  /**
   * Get business logic steps for a specific transition
   */
  getBusinessLogicSteps(fromScreen, toScreen, userAction) {
    // Define business logic patterns for different transitions
    const transitions = {
      'dashboard->project_detail': [
        { step: 'validate_project_access', description: 'Checking user permissions for project' },
        { step: 'load_project_data', description: 'Fetching project details from database' },
        { step: 'prepare_ui_state', description: 'Preparing project detail interface' }
      ],
      'dashboard->create_project': [
        { step: 'initialize_form', description: 'Setting up new project form' },
        { step: 'load_user_defaults', description: 'Loading user preferences and defaults' }
      ],
      'create_project->dashboard': [
        { step: 'validate_project_data', description: 'Validating project information' },
        { step: 'save_to_database', description: 'Persisting new project to database' },
        { step: 'update_project_list', description: 'Refreshing project list cache' },
        { step: 'send_notifications', description: 'Notifying team members of new project' }
      ],
      'project_detail->dashboard': [
        { step: 'cache_project_state', description: 'Saving current project view state' },
        { step: 'update_recent_views', description: 'Adding to recently viewed projects' }
      ]
    };
    
    const transitionKey = `${fromScreen}->${toScreen}`;
    const defaultSteps = [
      { step: 'process_navigation', description: `Processing navigation from ${fromScreen} to ${toScreen}` }
    ];
    
    return transitions[transitionKey] || defaultSteps;
  },
  
  /**
   * Clear visual path effects
   */
  clearPathEffects() {
    pathEffects.update(effects => ({
      ...effects,
      activeNodes: new Set(),
      glowingConnections: new Set(),
      currentEffect: null
    }));
  },
  
  /**
   * Initialize the screen network from APML spec
   */
  initializeScreenNetwork(apmlSpec) {
    console.log('🌐 Initializing screen network from APML...');
    
    const screens = new Map();
    const connections = new Map();
    
    // Add screens
    if (apmlSpec.stateNodes) {
      apmlSpec.stateNodes.forEach(node => {
        screens.set(node.interfaceName, {
          id: node.id,
          name: node.interfaceName,
          type: this.classifyScreenType(node.interfaceName),
          availableActions: node.availableActions || [],
          originalNode: node
        });
      });
    }
    
    // Add connections from logic flows
    if (apmlSpec.parsedFlows) {
      apmlSpec.parsedFlows.forEach(flow => {
        const connectionId = `${flow.fromInterface}->${flow.redirectTo}`;
        connections.set(connectionId, {
          id: connectionId,
          from: flow.fromInterface,
          to: flow.redirectTo,
          trigger: flow.trigger,
          action: flow.actionName,
          flow: flow
        });
      });
    }
    
    screenNetwork.update(network => ({
      screens,
      connections,
      initialized: true
    }));
    
    console.log(`✅ Screen network initialized: ${screens.size} screens, ${connections.size} connections`);
  },
  
  /**
   * Classify screen type for visual organization
   */
  classifyScreenType(screenName) {
    const name = screenName.toLowerCase();
    if (name.includes('login') || name.includes('auth') || name.includes('signup')) return 'auth';
    if (name.includes('dashboard') || name.includes('home') || name.includes('main')) return 'main';
    if (name.includes('admin') || name.includes('settings')) return 'admin';
    if (name.includes('onboard') || name.includes('welcome') || name.includes('tutorial')) return 'onboarding';
    return 'feature';
  }
};

/**
 * Trinity Flow Actions - for components to dispatch
 */
export const trinityActions = {
  
  // Called when user clicks a node in Trinity diagram
  nodeClicked(screenName) {
    navigationController.navigateToScreen(screenName, 'trinity_diagram', 'node_click');
  },
  
  // Called when user clicks a button in the live app
  appButtonClicked(buttonName, currentScreen, targetScreen) {
    navigationController.navigateToScreen(targetScreen, 'live_app', `button_${buttonName}`);
  },
  
  // Called when app loads to set initial state
  appInitialized(initialScreen) {
    trinityFlowState.update(state => ({
      ...state,
      currentScreen: initialScreen,
      lastAction: {
        type: 'APP_INITIALIZED',
        screen: initialScreen,
        timestamp: new Date().toISOString()
      }
    }));
  }
};

// Derived stores for components to use
export const currentScreen = derived(trinityFlowState, $state => $state.currentScreen);
export const screenHistory = derived(trinityFlowState, $state => $state.screenHistory);
export const businessLogicQueue = derived(trinityFlowState, $state => $state.businessLogicQueue);
export const isNavigating = derived(trinityFlowState, $state => $state.isNavigating);
export const activePathEffects = derived(pathEffects, $effects => $effects);

export default {
  trinityFlowState,
  screenNetwork,
  pathEffects,
  navigationController,
  trinityActions,
  currentScreen,
  screenHistory,
  businessLogicQueue,
  isNavigating,
  activePathEffects
};
/**
 * Trinity Completeness Validator
 * Ensures APML specifications have complete SHOW→DO→PROCESS→SHOW cycles
 */

export class TrinityCompletenessValidator {
  constructor() {
    this.validationResults = [];
    this.interfaces = [];
    this.logicFlows = [];
    this.connections = [];
    this.reachabilityGraph = new Map();
  }

  /**
   * Main validation entry point
   */
  validateTrinityCompleteness(apmlSpec) {
    console.log('🔍 Starting Trinity Completeness Validation...');
    
    this.interfaces = apmlSpec.stateNodes || [];
    this.logicFlows = apmlSpec.parsedFlows || [];
    this.validationResults = [];
    
    // Build reachability graph
    this.buildReachabilityGraph();
    
    // Run validation checks
    this.validateInterfaceReachability();
    this.validateDeadEndInterfaces();
    this.validateOrphanedInterfaces();
    this.validateTrinityFlowCompleteness();
    this.validateUserActionCoverage();
    
    const summary = this.generateValidationSummary();
    
    console.log('✅ Trinity Completeness Validation Complete:', summary);
    return {
      isComplete: summary.failCount === 0,
      summary,
      results: this.validationResults
    };
  }

  /**
   * Build a graph of interface connections based on logic flows
   */
  buildReachabilityGraph() {
    console.log('🔗 Building reachability graph...');
    
    // Initialize graph
    this.interfaces.forEach(iface => {
      this.reachabilityGraph.set(iface.interfaceName, {
        interface: iface,
        canReach: new Set(),
        reachableFrom: new Set(),
        actions: new Set()
      });
    });
    
    // Add connections from logic flows
    this.logicFlows.forEach(flow => {
      const fromInterface = flow.fromInterface;
      const toInterface = flow.redirectTo;
      const action = flow.trigger;
      
      if (fromInterface && toInterface) {
        const fromNode = this.reachabilityGraph.get(fromInterface);
        const toNode = this.reachabilityGraph.get(toInterface);
        
        if (fromNode && toNode) {
          fromNode.canReach.add(toInterface);
          toNode.reachableFrom.add(fromInterface);
          fromNode.actions.add(action);
          
          this.connections.push({
            from: fromInterface,
            to: toInterface,
            action: action,
            flow: flow
          });
        }
      }
    });
    
    console.log(`📊 Graph built: ${this.interfaces.length} interfaces, ${this.connections.length} connections`);
  }

  /**
   * Check if all interfaces are reachable from the entry point
   */
  validateInterfaceReachability() {
    const entryInterface = this.findEntryInterface();
    if (!entryInterface) {
      this.addValidationResult('reachability', 'fail', 
        'No entry interface found (dashboard, login, home, or main)', []);
      return;
    }
    
    const reachableInterfaces = this.findReachableInterfaces(entryInterface.interfaceName);
    const unreachableInterfaces = this.interfaces.filter(iface => 
      !reachableInterfaces.has(iface.interfaceName) && iface.interfaceName !== entryInterface.interfaceName
    );
    
    if (unreachableInterfaces.length > 0) {
      this.addValidationResult('reachability', 'fail',
        `${unreachableInterfaces.length} interfaces are unreachable from entry point`,
        unreachableInterfaces.map(i => i.interfaceName),
        unreachableInterfaces.map(i => `Add navigation path from ${entryInterface.interfaceName} to ${i.interfaceName}`)
      );
    } else {
      this.addValidationResult('reachability', 'pass',
        'All interfaces are reachable from entry point', []);
    }
  }

  /**
   * Find interfaces with no outgoing connections (dead ends)
   */
  validateDeadEndInterfaces() {
    const deadEndInterfaces = [];
    
    this.reachabilityGraph.forEach((node, interfaceName) => {
      if (node.canReach.size === 0) {
        // Allow certain interface types to be dead ends
        const allowedDeadEnds = ['confirmation', 'success', 'error', 'logout'];
        const isAllowedDeadEnd = allowedDeadEnds.some(type => 
          interfaceName.toLowerCase().includes(type)
        );
        
        if (!isAllowedDeadEnd) {
          deadEndInterfaces.push(interfaceName);
        }
      }
    });
    
    if (deadEndInterfaces.length > 0) {
      this.addValidationResult('dead_ends', 'warning',
        `${deadEndInterfaces.length} interfaces have no outgoing connections`,
        deadEndInterfaces,
        deadEndInterfaces.map(i => `Add navigation options from ${i} (back button, home button, etc.)`)
      );
    } else {
      this.addValidationResult('dead_ends', 'pass',
        'No problematic dead-end interfaces found', []);
    }
  }

  /**
   * Find interfaces with no incoming connections (orphaned)
   */
  validateOrphanedInterfaces() {
    const entryInterface = this.findEntryInterface();
    const orphanedInterfaces = [];
    
    this.reachabilityGraph.forEach((node, interfaceName) => {
      if (node.reachableFrom.size === 0 && interfaceName !== entryInterface?.interfaceName) {
        orphanedInterfaces.push(interfaceName);
      }
    });
    
    if (orphanedInterfaces.length > 0) {
      this.addValidationResult('orphaned_interfaces', 'fail',
        `${orphanedInterfaces.length} interfaces have no incoming connections`,
        orphanedInterfaces,
        orphanedInterfaces.map(i => `Add navigation path to ${i} from other interfaces`)
      );
    } else {
      this.addValidationResult('orphaned_interfaces', 'pass',
        'No orphaned interfaces found', []);
    }
  }

  /**
   * Validate that each interface has complete Trinity flows
   */
  validateTrinityFlowCompleteness() {
    const incompleteInterfaces = [];
    
    this.interfaces.forEach(iface => {
      const trinityIssues = [];
      
      // Check SHOW: Interface must have visible elements
      const hasShowElements = iface.availableActions && iface.availableActions.length > 0;
      if (!hasShowElements) {
        trinityIssues.push('Missing SHOW elements (no interactive actions defined)');
      }
      
      // Check DO: Interface must have user actions
      const node = this.reachabilityGraph.get(iface.interfaceName);
      const hasUserActions = node && node.actions.size > 0;
      if (!hasUserActions) {
        trinityIssues.push('Missing DO actions (no user interactions defined)');
      }
      
      // Check PROCESS: Actions must lead to state changes
      const hasProcessLogic = this.logicFlows.some(flow => 
        flow.fromInterface === iface.interfaceName
      );
      if (!hasProcessLogic) {
        trinityIssues.push('Missing PROCESS logic (no flows from this interface)');
      }
      
      if (trinityIssues.length > 0) {
        incompleteInterfaces.push({
          interface: iface.interfaceName,
          issues: trinityIssues
        });
      }
    });
    
    if (incompleteInterfaces.length > 0) {
      this.addValidationResult('trinity_completeness', 'fail',
        `${incompleteInterfaces.length} interfaces have incomplete Trinity flows`,
        incompleteInterfaces.map(i => i.interface),
        incompleteInterfaces.flatMap(i => 
          i.issues.map(issue => `${i.interface}: ${issue}`)
        )
      );
    } else {
      this.addValidationResult('trinity_completeness', 'pass',
        'All interfaces have complete Trinity flows', []);
    }
  }

  /**
   * Validate that all user actions are covered by logic flows
   */
  validateUserActionCoverage() {
    const uncoveredActions = [];
    
    this.interfaces.forEach(iface => {
      const availableActions = iface.availableActions || [];
      
      availableActions.forEach(action => {
        const hasFlow = this.logicFlows.some(flow => 
          flow.fromInterface === iface.interfaceName && 
          (flow.trigger === action || flow.trigger === action.replace('_button', ''))
        );
        
        if (!hasFlow) {
          uncoveredActions.push({
            interface: iface.interfaceName,
            action: action
          });
        }
      });
    });
    
    if (uncoveredActions.length > 0) {
      this.addValidationResult('action_coverage', 'warning',
        `${uncoveredActions.length} user actions have no corresponding logic flows`,
        uncoveredActions.map(a => `${a.interface}.${a.action}`),
        uncoveredActions.map(a => 
          `Add logic flow for ${a.action} in ${a.interface} interface`
        )
      );
    } else {
      this.addValidationResult('action_coverage', 'pass',
        'All user actions have corresponding logic flows', []);
    }
  }

  /**
   * Find the entry interface (dashboard, login, home, main)
   */
  findEntryInterface() {
    const entryTypes = ['dashboard', 'login', 'home', 'main'];
    
    for (const entryType of entryTypes) {
      const entryInterface = this.interfaces.find(iface => 
        iface.interfaceName.toLowerCase().includes(entryType)
      );
      if (entryInterface) {
        return entryInterface;
      }
    }
    
    // Fallback to first interface
    return this.interfaces[0] || null;
  }

  /**
   * Find all interfaces reachable from a starting interface
   */
  findReachableInterfaces(startInterface, visited = new Set()) {
    if (visited.has(startInterface)) {
      return visited;
    }
    
    visited.add(startInterface);
    
    const node = this.reachabilityGraph.get(startInterface);
    if (node) {
      node.canReach.forEach(reachableInterface => {
        this.findReachableInterfaces(reachableInterface, visited);
      });
    }
    
    return visited;
  }

  /**
   * Add a validation result
   */
  addValidationResult(type, status, message, affectedInterfaces = [], suggestedFixes = []) {
    this.validationResults.push({
      id: `${type}_${Date.now()}`,
      validationType: type,
      status: status, // 'pass', 'fail', 'warning'
      message: message,
      affectedInterfaces: affectedInterfaces,
      suggestedFixes: suggestedFixes,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Generate validation summary
   */
  generateValidationSummary() {
    const passCount = this.validationResults.filter(r => r.status === 'pass').length;
    const failCount = this.validationResults.filter(r => r.status === 'fail').length;
    const warningCount = this.validationResults.filter(r => r.status === 'warning').length;
    
    return {
      totalInterfaces: this.interfaces.length,
      totalConnections: this.connections.length,
      passCount,
      failCount,
      warningCount,
      completenessPercentage: Math.round((passCount / this.validationResults.length) * 100)
    };
  }

  /**
   * Get interfaces that can be improved
   */
  getImprovementSuggestions() {
    const suggestions = [];
    
    // Suggest missing connections
    this.interfaces.forEach(iface => {
      const node = this.reachabilityGraph.get(iface.interfaceName);
      if (node && node.canReach.size < 2) {
        suggestions.push({
          type: 'add_connections',
          interface: iface.interfaceName,
          suggestion: `Consider adding more navigation options from ${iface.interfaceName}`
        });
      }
    });
    
    return suggestions;
  }
}

export default TrinityCompletenessValidator;
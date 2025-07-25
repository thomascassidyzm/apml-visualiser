<script>
  export let currentSceneData = null;
  export let currentNode = null;
  
  import { visualizationState } from '../stores/apmlStore.js';
  
  let selectedNode = null;
  let trinityAnalysis = null;
  let actionLog = [];
  
  // Listen to visualization state changes and action log
  $: if ($visualizationState.currentNode) {
    selectedNode = $visualizationState.currentNode;
    analyzeTrinityFlow(selectedNode);
  }
  
  $: if ($visualizationState.actionLog) {
    actionLog = $visualizationState.actionLog;
  }
  
  $: if (currentSceneData && currentSceneData.stateNodes) {
    // Auto-select first node if none selected
    if (!selectedNode && currentSceneData.stateNodes.length > 0) {
      selectedNode = currentSceneData.stateNodes[0];
      analyzeTrinityFlow(selectedNode);
    }
  }
  
  function analyzeTrinityFlow(node) {
    if (!node || !currentSceneData) return;
    
    // Get the complete Trinity cycle for this node
    const show = getUIForNode(node);
    const do_actions = getAllUserActions(node);
    const process_logic = getLogicForActions(node);
    const resulting_shows = getNextStates(node);
    
    trinityAnalysis = {
      currentNode: node,
      show,
      do: do_actions,
      process: process_logic,
      resultingShows: resulting_shows
    };
    
    // Update visualization state
    visualizationState.update(state => ({
      ...state,
      currentNode: node,
      availableTransitions: do_actions
    }));
  }
  
  function getUIForNode(node) {
    return {
      interfaceName: node.interfaceName,
      displayContent: node.displayContent,
      availableActions: node.availableActions || []
    };
  }
  
  function getAllUserActions(node) {
    const actions = [];
    
    // Get actions from interface definition
    if (node.availableActions) {
      node.availableActions.forEach(action => {
        actions.push({
          type: 'click',
          element: action,
          description: `User clicks ${action}`
        });
      });
    }
    
    // Add passive actions (timeouts, background, etc.)
    actions.push({
      type: 'wait',
      element: 'screen',
      description: 'User waits/does nothing'
    });
    
    return actions;
  }
  
  function getLogicForActions(node) {
    const processes = [];
    
    if (currentSceneData.logicFlows) {
      currentSceneData.logicFlows.forEach(flow => {
        if (flow.fromInterface === node.interfaceName) {
          processes.push({
            processName: flow.processName || flow.actionName,
            trigger: flow.trigger,
            action: `redirect to ${flow.redirectTo}`,
            description: `When user ${flow.trigger} → ${flow.redirectTo}`
          });
        }
      });
    }
    
    return processes;
  }
  
  function getNextStates(node) {
    const nextStates = [];
    
    if (currentSceneData.logicFlows) {
      currentSceneData.logicFlows.forEach(flow => {
        if (flow.fromInterface === node.interfaceName) {
          const targetNode = currentSceneData.stateNodes.find(n => 
            n.interfaceName === flow.redirectTo
          );
          if (targetNode) {
            nextStates.push({
              node: targetNode,
              trigger: flow.trigger,
              connection: `${flow.trigger} → ${flow.redirectTo}`
            });
          }
        }
      });
    }
    
    return nextStates;
  }
  
  function handleNodeClick(node) {
    selectedNode = node;
    analyzeTrinityFlow(node);
  }
  
  function getNodePosition(index, total) {
    // Arrange nodes in a clean grid layout with more horizontal spread
    const cols = Math.ceil(Math.sqrt(total));
    const row = Math.floor(index / cols);
    const col = index % cols;
    
    return {
      x: 150 + (col * 350), // Much wider horizontal spacing
      y: 120 + (row * 180)  // Slightly more vertical spacing
    };
  }
  
  function getConnectionPath(fromNode, toNode, fromIndex, toIndex, total) {
    const from = getNodePosition(fromIndex, total);
    const to = getNodePosition(toIndex, total);
    
    // Create smooth curved path
    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;
    
    return `M ${from.x + 100} ${from.y + 30} 
            Q ${midX} ${midY - 20} 
            ${to.x + 100} ${to.y + 30}`;
  }
  
  function isNodeConnected(node) {
    if (!selectedNode) return false;
    
    // Check if this node connects to or from the selected node
    if (currentSceneData.logicFlows) {
      return currentSceneData.logicFlows.some(flow => 
        (flow.fromInterface === selectedNode.interfaceName && flow.redirectTo === node.interfaceName) ||
        (flow.fromInterface === node.interfaceName && flow.redirectTo === selectedNode.interfaceName)
      );
    }
    return false;
  }
</script>

<div class="trinity-flow-container h-full bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl overflow-hidden">
  {#if currentSceneData && currentSceneData.stateNodes}
    <div class="flow-diagram-panel h-2/3 relative overflow-hidden">
      <!-- Custom Flow Diagram SVG -->
      <svg class="w-full h-full" viewBox="0 0 1400 600">
        <!-- Connection Lines -->
        {#if currentSceneData.logicFlows}
          {#each currentSceneData.logicFlows as flow, flowIndex}
            {@const fromIndex = currentSceneData.stateNodes.findIndex(n => n.interfaceName === flow.fromInterface)}
            {@const toIndex = currentSceneData.stateNodes.findIndex(n => n.interfaceName === flow.redirectTo)}
            {#if fromIndex !== -1 && toIndex !== -1}
              {@const fromPos = getNodePosition(fromIndex, currentSceneData.stateNodes.length)}
              {@const toPos = getNodePosition(toIndex, currentSceneData.stateNodes.length)}
              
              <!-- Connection Arrow -->
              <path
                d={getConnectionPath(null, null, fromIndex, toIndex, currentSceneData.stateNodes.length)}
                stroke={selectedNode && (flow.fromInterface === selectedNode.interfaceName || flow.redirectTo === selectedNode.interfaceName) ? '#f59e0b' : '#64748b'}
                stroke-width={selectedNode && (flow.fromInterface === selectedNode.interfaceName || flow.redirectTo === selectedNode.interfaceName) ? '3' : '2'}
                fill="none"
                marker-end="url(#arrowhead)"
                class="transition-all duration-300"
              />
              
              <!-- Flow Label -->
              {@const midX = (fromPos.x + toPos.x) / 2 + 100}
              {@const midY = (fromPos.y + toPos.y) / 2 + 15}
              <text
                x={midX}
                y={midY}
                class="text-xs fill-slate-300 font-medium"
                text-anchor="middle"
              >
                {flow.trigger || flow.actionName}
              </text>
            {/if}
          {/each}
        {/if}
        
        <!-- Arrow Marker Definition -->
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" 
                  refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
          </marker>
        </defs>
        
        <!-- Node Elements -->
        {#each currentSceneData.stateNodes as node, index}
          {@const position = getNodePosition(index, currentSceneData.stateNodes.length)}
          {@const isSelected = selectedNode && selectedNode.interfaceName === node.interfaceName}
          {@const isConnected = isNodeConnected(node)}
          {@const isRecentlyActive = actionLog && actionLog.length > 0 && actionLog[actionLog.length - 1]?.resultingShow === node.interfaceName}
          
          <!-- Node Background -->
          <rect
            x={position.x}
            y={position.y}
            width="200"
            height="60"
            rx="12"
            fill={isSelected ? '#3b82f6' : isRecentlyActive ? '#f59e0b' : isConnected ? '#10b981' : '#475569'}
            stroke={isSelected ? '#1d4ed8' : isRecentlyActive ? '#d97706' : isConnected ? '#059669' : '#334155'}
            stroke-width="2"
            class="cursor-pointer transition-all duration-300 hover:brightness-110"
            on:click={() => handleNodeClick(node)}
          />
          
          <!-- Node Icon -->
          <text
            x={position.x + 20}
            y={position.y + 35}
            class="text-xl fill-white"
            text-anchor="middle"
          >
            {node.interfaceName === 'welcome_screen' ? '🏠' : 
             node.interfaceName === 'task_list' ? '📋' : 
             node.interfaceName === 'add_task' ? '➕' : '🔵'}
          </text>
          
          <!-- Node Label -->
          <text
            x={position.x + 100}
            y={position.y + 30}
            class="text-sm fill-white font-semibold"
            text-anchor="middle"
          >
            {node.interfaceName}
          </text>
          
          <!-- Node Sublabel -->
          <text
            x={position.x + 100}
            y={position.y + 45}
            class="text-xs fill-slate-200"
            text-anchor="middle"
          >
            {node.interfaceName} Interface
          </text>
        {/each}
      </svg>
    </div>
    
    <!-- Trinity Analysis Panel -->
    <div class="trinity-analysis-panel min-h-[300px] bg-slate-800/90 p-4 border-t border-slate-700">
      {#if trinityAnalysis}
        <div class="grid grid-cols-5 gap-2 min-h-[250px]">
          <!-- SHOW -->
          <div class="trinity-section">
            <h3 class="text-sm font-bold text-green-400 mb-2">📱 SHOW (App→User)</h3>
            <div class="text-xs text-slate-300">
              <div class="font-medium">{trinityAnalysis.show.interfaceName}</div>
              <div class="mt-1 space-y-1">
                {#each trinityAnalysis.show.availableActions as action}
                  <div class="bg-slate-700 px-2 py-1 rounded text-xs">{action}</div>
                {/each}
              </div>
            </div>
          </div>
          
          <!-- DO -->
          <div class="trinity-section">
            <h3 class="text-sm font-bold text-blue-400 mb-2">👆 DO (User→App)</h3>
            <div class="text-xs text-slate-300 space-y-1">
              {#each trinityAnalysis.do as action}
                <div class="bg-slate-700 px-2 py-1 rounded">
                  <div class="font-medium">{action.type}: {action.element}</div>
                  <div class="text-slate-400">{action.description}</div>
                </div>
              {/each}
            </div>
          </div>
          
          <!-- PROCESS -->
          <div class="trinity-section">
            <h3 class="text-sm font-bold text-orange-400 mb-2">⚡ PROCESS (App→App)</h3>
            <div class="text-xs text-slate-300 space-y-1">
              {#each trinityAnalysis.process as process}
                <div class="bg-slate-700 px-2 py-1 rounded">
                  <div class="font-medium">{process.processName}</div>
                  <div class="text-slate-400">{process.description}</div>
                </div>
              {/each}
            </div>
          </div>
          
          <!-- RESULTING SHOWS -->
          <div class="trinity-section">
            <h3 class="text-sm font-bold text-purple-400 mb-2">🔄 NEXT SHOWS</h3>
            <div class="text-xs text-slate-300 space-y-1">
              {#each trinityAnalysis.resultingShows as result}
                <div class="bg-slate-700 px-2 py-1 rounded cursor-pointer hover:bg-slate-600"
                     on:click={() => handleNodeClick(result.node)}>
                  <div class="font-medium">{result.node.interfaceName}</div>
                  <div class="text-slate-400">{result.connection}</div>
                </div>
              {/each}
            </div>
          </div>
          
          <!-- LIVE ACTION LOG -->
          <div class="trinity-section">
            <h3 class="text-sm font-bold text-yellow-400 mb-2">📋 LIVE ACTION LOG</h3>
            <div class="text-xs text-slate-300 space-y-1 max-h-32 overflow-y-auto">
              {#if actionLog && actionLog.length > 0}
                {#each actionLog.slice(-10).reverse() as logEntry}
                  <div class="bg-slate-700 px-2 py-1 rounded">
                    <div class="font-medium text-yellow-300">{logEntry.action}</div>
                    <div class="text-slate-400">{logEntry.from} → {logEntry.resultingShow}</div>
                    <div class="text-slate-500 text-xs">{new Date(logEntry.timestamp).toLocaleTimeString()}</div>
                  </div>
                {/each}
              {:else}
                <div class="text-slate-500 italic">Click buttons in the iPhone mockup to see live actions...</div>
              {/if}
            </div>
          </div>
        </div>
      {:else}
        <div class="flex items-center justify-center h-full text-slate-400">
          <div class="text-center">
            <div class="text-2xl mb-2">🔍</div>
            <div class="text-sm">Click any node to analyze Trinity flow</div>
          </div>
        </div>
      {/if}
    </div>
  {:else}
    <!-- Empty State -->
    <div class="h-full flex items-center justify-center text-slate-400">
      <div class="text-center">
        <div class="text-4xl mb-4">🏗️</div>
        <h3 class="text-lg font-medium mb-2">Trinity Flow Diagram</h3>
        <p class="text-sm">
          Parse an APML specification to see the complete Trinity visualization
        </p>
      </div>
    </div>
  {/if}
</div>

<style>
  .trinity-flow-container {
    font-family: ui-sans-serif, system-ui, sans-serif;
  }
  
  .trinity-section {
    background: rgba(51, 65, 85, 0.5);
    border-radius: 0.75rem;
    padding: 1rem;
    height: 100%;
    overflow-y: auto;
  }
  
  .trinity-section::-webkit-scrollbar {
    width: 4px;
  }
  
  .trinity-section::-webkit-scrollbar-track {
    background: rgba(71, 85, 105, 0.3);
    border-radius: 2px;
  }
  
  .trinity-section::-webkit-scrollbar-thumb {
    background: rgba(148, 163, 184, 0.5);
    border-radius: 2px;
  }
  
  svg text {
    user-select: none;
    pointer-events: none;
  }
  
  svg rect {
    filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
  }
  
  svg rect:hover {
    filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.2));
  }
</style>
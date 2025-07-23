<script>
  export let currentSceneData = null;
  
  import { visualizationState } from '../stores/apmlStore.js';
  
  $: currentNode = $visualizationState.currentNode;
  $: availableActions = $visualizationState.availableTransitions;
  
  function handleMockupClick(action) {
    // Simulate user interaction
    console.log('Mockup interaction:', action);
    
    // Update visualization state
    visualizationState.update(state => ({
      ...state,
      pathHistory: [...state.pathHistory, currentNode],
      // This would trigger state transition in real implementation
    }));
  }
</script>

<div class="phone-frame">
  <div class="phone-screen">
    {#if currentSceneData}
      <!-- Dynamic interface rendering based on current state -->
      <div class="p-4 h-full flex flex-col">
        <!-- Header -->
        <div class="text-center mb-6">
          <h2 class="text-xl font-bold text-gray-900">
            {currentSceneData.sceneName}
          </h2>
          <p class="text-sm text-gray-600">
            {currentSceneData.description}
          </p>
        </div>
        
        <!-- Interface Content -->
        <div class="flex-1 space-y-4">
          {#each currentSceneData.stateNodes as node}
            <div class="bg-gray-50 rounded-lg p-4 border-2 {currentNode?.id === node.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}">
              <h3 class="font-medium text-gray-900 mb-2">
                {node.interfaceName}
              </h3>
              <p class="text-sm text-gray-600 mb-3">
                {node.displayContent}
              </p>
              
              <!-- Available Actions -->
              {#if node.availableActions && node.availableActions.length > 0}
                <div class="space-y-2">
                  {#each node.availableActions as action}
                    <button
                      class="w-full text-left px-3 py-2 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors"
                      on:click={() => handleMockupClick(action)}
                    >
                      {action}
                    </button>
                  {/each}
                </div>
              {/if}
            </div>
          {/each}
        </div>
        
        <!-- Touch Interaction Overlay -->
        <div class="mt-4 text-center">
          <p class="text-xs text-gray-500">
            Tap elements to simulate user interactions
          </p>
        </div>
      </div>
    {:else}
      <!-- Empty State -->
      <div class="h-full flex items-center justify-center p-4">
        <div class="text-center">
          <div class="text-4xl mb-4">📱</div>
          <p class="text-gray-600">
            No APML specification loaded
          </p>
          <p class="text-sm text-gray-500 mt-2">
            Parse an APML spec to see the mobile mockup
          </p>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .phone-frame {
    background: linear-gradient(145deg, #2d3748, #1a202c);
    box-shadow: 
      0 20px 25px -5px rgba(0, 0, 0, 0.1),
      0 10px 10px -5px rgba(0, 0, 0, 0.04),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }
  
  .phone-screen {
    box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);
  }
</style>
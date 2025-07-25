<script>
  import { apmlSpec, flowScenes, visualizationState } from '../stores/apmlStore.js';
  import LiveAppFrame from './LiveAppFrame.svelte';
  import NetworkTrinityFlowDiagram from './NetworkTrinityFlowDiagram.svelte';
  import ValidationPanel from './ValidationPanel.svelte';
  import { push } from 'svelte-spa-router';
  
  let currentScene = 0;
  
  $: scenes = $flowScenes;
  $: currentSceneData = scenes[currentScene] || null;
  
  function goToAPMLInput() {
    console.log('🚀 Navigating back to APML input screen...');
    push('/');
  }
</script>

<div class="h-screen flex flex-col">
  <!-- Expanded Header with Controls -->
  <div class="bg-white border-b border-gray-200 px-8 py-3 flex-shrink-0">
    <div class="flex items-center justify-between">
      <!-- Left: Status & Stats -->
      <div class="flex items-center space-x-6">
        <div class="flex items-center space-x-2">
          <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span class="text-xs font-medium text-gray-700">Live</span>
          <span class="text-xs text-gray-600">
            <span class="font-semibold text-blue-600">{$apmlSpec.stateNodes.length}</span> states
          </span>
          <span class="text-xs text-gray-600">
            <span class="font-semibold text-purple-600">{$apmlSpec.messageFlows.length}</span> flows
          </span>
        </div>
        
        <!-- Scene Selector -->
        {#if scenes.length > 0}
          <div class="flex items-center space-x-1">
            <span class="text-xs font-medium text-gray-700">Scene:</span>
            {#each scenes as scene, index}
              <button
                class="px-2 py-1 text-xs rounded {index === currentScene ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}"
                on:click={() => currentScene = index}
              >
                {scene.sceneName}
              </button>
            {/each}
          </div>
        {/if}
      </div>
      
      <!-- Right: Testing & Validation Controls -->
      <div class="flex items-center space-x-4">
        <!-- Testing Controls -->
        <div class="flex items-center space-x-2">
          <button class="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded font-medium">
            Manual Testing
          </button>
          <button class="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded font-medium hover:bg-gray-200">
            Automated
          </button>
          <button class="px-3 py-1 text-xs bg-green-600 text-white rounded font-medium hover:bg-green-700">
            Test All Paths
          </button>
        </div>
        
        <!-- Quick Stats -->
        <div class="flex items-center space-x-3 text-xs">
          <div class="text-gray-600">
            <span class="font-semibold text-green-600">22</span> passed
          </div>
          <div class="text-gray-600">
            <span class="font-semibold text-red-600">3</span> failed
          </div>
        </div>
        
        <!-- Change Request Button -->
        <button class="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded font-medium hover:bg-purple-200">
          + Change Request
        </button>
        
        <!-- New APML Button -->
        <button 
          on:click={goToAPMLInput}
          class="px-3 py-1 text-xs bg-orange-100 text-orange-700 rounded font-medium hover:bg-orange-200"
          title="Return to APML input to load new specification"
        >
          📝 New APML
        </button>
      </div>
    </div>
  </div>
  
  <!-- Trinity Completeness Summary Bar -->
  <div class="bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-3 border-b border-gray-200">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-6">
        <div class="flex items-center gap-2">
          <div class="text-2xl">✅</div>
          <div>
            <div class="text-white font-semibold">Trinity: 85% Complete</div>
            <div class="text-green-100 text-sm">3 interfaces, 2 flows validated</div>
          </div>
        </div>
        <div class="text-green-100 text-sm">
          • All interfaces reachable • No dead ends • 1 warning
        </div>
      </div>
      <button class="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-md text-sm font-medium transition-colors">
        View Details
      </button>
    </div>
  </div>

  <!-- Main Content Area -->
  <div class="flex-1 flex gap-6 px-6 py-4">
    <!-- Left: Real APML Compiled App (Much Bigger) -->
    <div class="w-[450px] flex-shrink-0">
      <LiveAppFrame {currentSceneData} selectedNode={$visualizationState.currentNode} />
    </div>
    
    <!-- Right: Trinity Flow Diagram -->
    <div class="flex-1 bg-white rounded-lg shadow-sm border border-gray-200">
      <div class="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-3 flex items-center justify-between">
        <div>
          <h3 class="text-lg font-semibold text-white">🚁 Live Behavior Monitor</h3>
          <p class="text-slate-300 text-sm">Real-time app navigation tracking</p>
        </div>
        <div class="flex space-x-2">
          <button class="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 rounded font-medium">
            Export SVG
          </button>
          <button class="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 rounded font-medium">
            Full Screen
          </button>
        </div>
      </div>
      
      <div class="h-full">
        <NetworkTrinityFlowDiagram {currentSceneData} />
      </div>
    </div>
  </div>
  
</div>
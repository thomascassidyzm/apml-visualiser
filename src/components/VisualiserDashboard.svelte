<script>
  import { apmlSpec, flowScenes, visualizationState } from '../stores/apmlStore.js';
  import MobileMockup from './MobileMockup.svelte';
  import MermaidPanel from './MermaidPanel.svelte';
  import ValidationPanel from './ValidationPanel.svelte';
  
  let currentScene = 0;
  
  $: scenes = $flowScenes;
  $: currentSceneData = scenes[currentScene] || null;
</script>

<div class="py-6">
  <!-- Dashboard Stats & Controls -->
  <div class="mb-8">
    <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-6">
          <!-- Stats -->
          <div class="flex items-center space-x-4">
            <div class="flex items-center space-x-2">
              <div class="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span class="text-sm font-medium text-gray-700">Live Visualization</span>
            </div>
            <div class="text-sm text-gray-500">|</div>
            <div class="text-sm text-gray-600">
              <span class="font-semibold text-blue-600">{$apmlSpec.stateNodes.length}</span> states
            </div>
            <div class="text-sm text-gray-600">
              <span class="font-semibold text-purple-600">{$apmlSpec.messageFlows.length}</span> flows
            </div>
            <div class="text-sm text-gray-600">
              <span class="font-semibold text-green-600">{scenes.length}</span> scenes
            </div>
          </div>
        </div>
        
        <!-- Scene Selector -->
        {#if scenes.length > 0}
          <div class="flex items-center space-x-2">
            <span class="text-sm font-medium text-gray-700 mr-3">Scene:</span>
            <div class="flex space-x-1">
              {#each scenes as scene, index}
                <button
                  class="scene-tab {index === currentScene ? 'scene-tab-active' : 'scene-tab-inactive'}"
                  on:click={() => currentScene = index}
                >
                  {scene.sceneName}
                </button>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
  
  <!-- Main Dashboard Layout -->
  <div class="grid grid-cols-12 gap-6 h-[800px]">
    <!-- Left Panel: Mobile Mockup -->
    <div class="col-span-4">
      <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 h-full">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h3 class="text-lg font-semibold text-gray-900">Live Mobile Mockup</h3>
            <p class="text-sm text-gray-500 mt-1">Interactive prototype with touch simulation</p>
          </div>
          <div class="flex space-x-2">
            <button class="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium">
              <svg class="w-3 h-3 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              Reset
            </button>
            <button class="px-3 py-1.5 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors font-medium">
              <svg class="w-3 h-3 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H15M9 10V9a3 3 0 013-3m0 0a3 3 0 013 3v1m0 0h1.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H21"/>
              </svg>
              Auto-Run
            </button>
          </div>
        </div>
        
        <div class="flex justify-center h-full">
          <MobileMockup {currentSceneData} />
        </div>
      </div>
    </div>
    
    <!-- Center Panel: Flow Diagram -->
    <div class="col-span-5">
      <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden h-full">
        <div class="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-semibold text-white">Interactive Flow Diagram</h3>
              <p class="text-slate-300 text-sm mt-1">Real-time state visualization with clickable nodes</p>
            </div>
            <div class="flex space-x-2">
              <button class="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors font-medium">
                <svg class="w-3 h-3 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                Export SVG
              </button>
              <button class="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors font-medium">
                <svg class="w-3 h-3 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"/>
                </svg>
                Zoom
              </button>
            </div>
          </div>
        </div>
        
        <div class="h-full">
          <MermaidPanel {currentSceneData} />
        </div>
      </div>
    </div>
    
    <!-- Right Panel: Validation & Testing -->
    <div class="col-span-3">
      <div class="bg-white rounded-2xl shadow-sm border border-gray-200 h-full">
        <ValidationPanel />
      </div>
    </div>
  </div>
  
  <!-- Bottom Action Bar -->
  <div class="mt-6">
    <div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
      <div class="flex items-center justify-between">
        <div>
          <h4 class="text-lg font-semibold mb-2">Ready to iterate?</h4>
          <p class="text-blue-100 text-sm">
            Add change requests to any screen, then export enhanced APML for your next development cycle.
          </p>
        </div>
        <div class="flex space-x-3">
          <button class="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-colors font-medium text-sm">
            Export APML with CRs
          </button>
          <button class="px-4 py-2 bg-white text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium text-sm">
            Load New APML
          </button>
        </div>
      </div>
    </div>
  </div>
</div>
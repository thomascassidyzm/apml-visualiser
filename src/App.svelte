<script>
  import Router from 'svelte-spa-router';
  import APMLInputScreen from './components/APMLInputScreen.svelte';
  import VisualiserDashboard from './components/VisualiserDashboard.svelte';
  import TrinitySimulatorDashboard from './components/TrinitySimulatorDashboard.svelte';
  import TrinitySimulatorTest from './components/TrinitySimulatorTest.svelte';
  import { onMount } from 'svelte';
  import { push } from 'svelte-spa-router';
  import { apmlStore } from './stores/apmlStore.js';
  import './app.css';
  
  let showInputPopup = false;

  const routes = {
    '/': TrinitySimulatorDashboard,
    '/input': APMLInputScreen,
    '/dashboard': VisualiserDashboard,
    '/trinity': TrinitySimulatorDashboard
  };

  // Note: Auto-loading is disabled to show APML input screen first
  // Users can now paste sophisticated APML via the input screen
</script>

<main class="min-h-screen bg-gray-900 text-white">
  <!-- Beautiful Header with Simulator Aesthetics -->
  <header class="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
    <div class="w-full px-6 py-4">
      <div class="flex items-center justify-between">
        <a href="#/" class="flex items-center space-x-4">
          <div class="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div>
            <h1 class="text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
              Trinity APML Visualiser
            </h1>
            <p class="text-sm text-gray-300">Beautiful Simulator Aesthetics • Real-time Validation</p>
          </div>
        </a>
        
        <div class="flex items-center space-x-3">
          <button 
            on:click={() => showInputPopup = true}
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            📝 Input APML
          </button>
        </div>
      </div>
    </div>
  </header>

  <!-- Main Content -->
  <div class="w-full">
    <Router {routes} />
  </div>
  
  <!-- Input APML Popup -->
  {#if showInputPopup}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[70vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-semibold text-white">📝 Paste APML</h2>
          <button 
            on:click={() => showInputPopup = false}
            class="text-gray-400 hover:text-white transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        
        <div class="space-y-4">
          <textarea 
            placeholder="Paste your APML code here..."
            class="w-full h-64 bg-gray-800 border border-gray-600 rounded text-white p-3 text-sm font-mono resize-none focus:outline-none focus:border-blue-500"
          ></textarea>
          
          <div class="flex justify-end space-x-3">
            <button 
              on:click={() => showInputPopup = false}
              class="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
            >
              Cancel
            </button>
            <button class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors">
              Parse & Visualize
            </button>
          </div>
        </div>
      </div>
    </div>
  {/if}
</main>
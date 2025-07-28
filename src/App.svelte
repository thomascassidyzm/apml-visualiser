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

  const routes = {
    '/': APMLInputScreen,
    '/dashboard': VisualiserDashboard,
    '/trinity': TrinitySimulatorDashboard
  };

  // Note: Auto-loading is disabled to show APML input screen first
  // Users can now paste sophisticated APML via the input screen
</script>

<main class="min-h-screen bg-gray-900 text-white">
  <!-- Beautiful Header with Simulator Aesthetics -->
  <header class="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
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
        </div>
        
        <div class="flex items-center space-x-3">
          <!-- Navigation -->
          <div class="flex items-center space-x-2">
            <a href="#/" class="px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors text-sm">
              📝 Input
            </a>
            <a href="#/dashboard" class="px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors text-sm">
              📊 Dashboard
            </a>
            <a href="#/trinity" class="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium">
              ✨ Trinity Simulator
            </a>
          </div>
          
          <div class="px-3 py-1 bg-green-900 text-green-300 rounded-full text-xs font-medium border border-green-600">
            ✨ Simulator Mode
          </div>
          <div class="px-3 py-1 bg-blue-900 text-blue-300 rounded-full text-xs font-medium border border-blue-600">
            v1.0.0 Trinity
          </div>
          <button class="p-2 text-gray-400 hover:text-green-400 transition-colors rounded-lg hover:bg-gray-700">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </header>

  <!-- Main Content -->
  <div class="w-full">
    <Router {routes} />
  </div>
</main>
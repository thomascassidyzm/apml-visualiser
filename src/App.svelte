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
  let apmlInput = '';
  let isProcessing = false;

  const routes = {
    '/': TrinitySimulatorDashboard,
    '/input': APMLInputScreen,
    '/dashboard': VisualiserDashboard,
    '/trinity': TrinitySimulatorDashboard
  };

  // Note: Auto-loading is disabled to show APML input screen first
  // Users can now paste sophisticated APML via the input screen
  
  async function handleAPMLSubmit() {
    if (!apmlInput.trim() || isProcessing) return;
    
    isProcessing = true;
    
    try {
      console.log('🔄 Compiling APML via MCP server:', apmlInput.substring(0, 100) + '...');
      
      // Build real app directly with MCP server
      console.log('🚀 Building real app with MCP compiler...');
      await buildRealAppWithMCP(apmlInput);
    } catch (error) {
      console.error('❌ Error compiling APML:', error);
      console.error('Error compiling APML:', error.message);
    } finally {
      isProcessing = false;
    }
  }
  
  async function buildRealAppWithMCP(apmlContent) {
    console.log('🚀 Calling MCP server for APML compilation...');
    
    try {
      const response = await fetch('https://web-production-1136.up.railway.app/compile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tool: 'compile_apml',
          arguments: {
            apml_content: apmlContent,
            target_framework: 'svelte',
            glass_morphism: true
          }
        })
      });

      if (!response.ok) {
        throw new Error(`MCP server error: ${response.status} ${response.statusText}`);
      }

      const compilationResult = await response.json();
      console.log('✅ MCP compilation successful:', compilationResult);
      
      // Extract the compiled app data and integrate with Trinity
      if (compilationResult && compilationResult.content) {
        // Parse the compilation result and update Trinity's state
        const compilerMessage = compilationResult.content[0].text;
        console.log('📱 Compiled app details:', compilerMessage);
        
        // Extract app info from the compilation message
        const appNameMatch = compilerMessage.match(/App Name:\s*(.+)/);
        const appName = appNameMatch ? appNameMatch[1].trim() : 'Compiled App';
        
        // Store the compilation result for Trinity to use
        window.mcpCompilationResult = {
          appName: appName,
          message: compilerMessage,
          compiledAt: new Date().toISOString(),
          apmlContent: apmlContent,
          mcpServerUrl: 'https://web-production-1136.up.railway.app'
        };
        
        // Show real app in simulator and extract flow nodes from compiled code
        showInputPopup = false;
        apmlInput = '';
        
        // Trinity will show the real app running + extract flow from the code
        console.log(`🎉 SUCCESS! Real app built: ${appName} - Running in iPhone simulator!`);
      } else {
        throw new Error('Unexpected compilation result format');
      }
      
    } catch (error) {
      console.error('❌ MCP compilation failed:', error);
      throw new Error('MCP server compilation failed - please check server status');
    }
  }
  
  
  function createSortingInterface(sortingLogic) {
    // Convert sorting logic into proper APML interface format
    return `interface sorting_screen:
  layout: "list"
  show sort_newest_button: text: "Newest First"
  show sort_oldest_button: text: "Oldest First"  
  show sort_highest_button: text: "Highest Rated"
  show sort_lowest_button: text: "Lowest Rated"
  show sort_helpful_button: text: "Most Helpful"

interface results_screen:
  layout: "list"
  show results_list: text: "Sorted Results"
  show back_button: text: "Back to Sort"

logic sorting_flow:
  process sort_newest: when user clicks sort_newest_button:
    redirect to results_screen
  process sort_oldest: when user clicks sort_oldest_button:
    redirect to results_screen
  process sort_highest: when user clicks sort_highest_button:
    redirect to results_screen
  process sort_lowest: when user clicks sort_lowest_button:
    redirect to results_screen
  process sort_helpful: when user clicks sort_helpful_button:
    redirect to results_screen
  process go_back: when user clicks back_button:
    redirect to sorting_screen`;
  }
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
🚀 Build App
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
          <h2 class="text-lg font-semibold text-white">🚀 Build Real App from APML</h2>
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
            bind:value={apmlInput}
            placeholder="Paste your APML code here..."
            class="w-full h-64 bg-gray-800 border border-gray-600 rounded text-white p-3 text-sm font-mono resize-none focus:outline-none focus:border-blue-500"
          ></textarea>
          
          <div class="flex justify-end space-x-3">
            <button 
              on:click={() => showInputPopup = false}
              class="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
              disabled={isProcessing}
            >
              Cancel
            </button>
            <button 
              on:click={handleAPMLSubmit}
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors disabled:opacity-50"
              disabled={isProcessing || !apmlInput.trim()}
            >
              {isProcessing ? 'Building App...' : 'Build Real App'}
            </button>
          </div>
        </div>
      </div>
    </div>
  {/if}
</main>
<script>
  export let currentSceneData = null;
  export let selectedNode = null;
  
  import { onMount } from 'svelte';
  import { visualizationState, apmlSpec } from '../stores/apmlStore.js';
  import { SvelteAPMLCompiler } from '../compiler/SvelteAPMLCompiler.js';
  import { AdvancedAPMLCompiler } from '../compiler/AdvancedAPMLCompiler.js';
  import { SvelteAdvancedAPMLCompiler } from '../compiler/SvelteAdvancedAPMLCompiler.js';
  import { trinityActions, currentScreen } from '../stores/trinityFlowStore.js';
  
  let iframeElement;
  let compiler = new SvelteAdvancedAPMLCompiler();
  let useAdvancedCompiler = true;
  let compiledApp = null;
  let isLoading = false;
  
  // Recompile when APML spec changes
  $: if ($apmlSpec && $apmlSpec.stateNodes && $apmlSpec.stateNodes.length > 0) {
    console.log('🔄 APML spec changed, triggering recompilation...', $apmlSpec.stateNodes.length, 'interfaces');
    compileAndLoad();
  }
  
  // Load compiled app into iframe once both compiledApp and iframeElement exist
  $: if (compiledApp && iframeElement) {
    loadAppIntoIframe();
  }
  
  async function compileAndLoad() {
    // Clear existing app first
    compiledApp = null;
    isLoading = true;
    if (iframeElement) {
      iframeElement.src = 'about:blank';
    }
    
    console.log('🚀 ROCK SOLID: Compiling APML to real Svelte app...');
    
    try {
      // Validate APML spec before compilation
      if (!$apmlSpec) {
        throw new Error('No APML specification available');
      }
      
      console.log('📋 APML Spec contains:', {
        interfaces: $apmlSpec.stateNodes?.length || 0,
        flows: $apmlSpec.parsedFlows?.length || 0,
        rawContent: $apmlSpec.rawContent?.length || 0
      });
      
      // Always use the ROCK SOLID Svelte Advanced APML Compiler
      compiler = new SvelteAdvancedAPMLCompiler();
      console.log('💎 Using ROCK SOLID Svelte Advanced APML Compiler - Universal APML Support!');
      
      // Compile APML to beautiful app
      compiledApp = compiler.compile($apmlSpec);
      
      console.log('✨ Compilation successful!', {
        components: compiledApp.components?.size || 0,
        stores: compiledApp.stores?.size || 0,
        htmlLength: compiledApp.html?.length || 0
      });
      
      console.log('✨ Compilation complete, compiledApp set, iframe should render next tick');
      
      console.log('✨ Beautiful advanced app compiled and loaded successfully!');
    } catch (error) {
      console.error('❌ Svelte APML compilation failed:', error);
      
      // Show error in iframe
      if (iframeElement) {
        const errorHTML = `
          <html>
            <head><title>Compilation Error</title></head>
            <body style="font-family: system-ui; padding: 2rem; color: #dc2626;">
              <h2>🚨 Compilation Error</h2>
              <p><strong>Error:</strong> ${error.message}</p>
              <p>Please check the APML specification and try again.</p>
            </body>
          </html>
        `;
        iframeElement.src = `data:text/html;charset=utf-8,${encodeURIComponent(errorHTML)}`;
      }
    } finally {
      isLoading = false;
    }
  }
  
  function loadAppIntoIframe() {
    if (!compiledApp || !iframeElement) {
      console.log('⚠️ loadAppIntoIframe called but missing:', { compiledApp: !!compiledApp, iframeElement: !!iframeElement });
      return;
    }
    
    console.log('🚀 Loading compiled app into iframe...');
    const cacheBuster = `&cb=${Date.now()}`;
    const finalUrl = compiledApp.dataUrl + cacheBuster;
    console.log('🚀 Loading iframe with URL length:', finalUrl.length);
    console.log('🚀 Data URL starts with:', finalUrl.substring(0, 50));
    
    iframeElement.src = finalUrl;
    
    // Listen for iframe load events
    iframeElement.onload = () => {
      console.log('✅ Iframe loaded successfully!');
    };
    iframeElement.onerror = (error) => {
      console.error('❌ Iframe failed to load:', error);
    };
  }
  
  onMount(() => {
    // Listen for messages from the iframe (Trinity actions)
    window.addEventListener('message', handleIframeMessage);
    
    return () => {
      window.removeEventListener('message', handleIframeMessage);
    };
  });
  
  function handleIframeMessage(event) {
    if (event.data && event.data.type === 'TRINITY_FLOW_ACTION') {
      const { action, buttonName, from, to, timestamp } = event.data;
      
      console.log('🌟 Received Trinity Flow Action from app (Billie Jean!):', event.data);
      
      // Trigger Trinity Flow navigation (Billie Jean effect!)
      trinityActions.appButtonClicked(buttonName, from, to);
      
      // Update visualization state for legacy compatibility
      const targetNode = $apmlSpec.stateNodes.find(node => 
        node.interfaceName === to
      );
      
      if (targetNode) {
        visualizationState.update(state => ({
          ...state,
          currentNode: targetNode,
          lastAction: {
            type: 'TRINITY_FLOW_ACTION',
            from: from,
            action: buttonName,
            timestamp: timestamp,
            description: `App button clicked: ${buttonName} (${from} → ${to})`
          }
        }));
      }
    }
    
    // Legacy support for old TRINITY_ACTION messages
    else if (event.data && event.data.type === 'TRINITY_ACTION') {
      const { action, from, to, timestamp } = event.data;
      console.log('🎨 Received legacy Trinity Action:', event.data);
      
      // Convert to Trinity Flow action
      trinityActions.appButtonClicked(action, from, to);
    }
  }
  
  // React to Trinity Flow navigation commands
  $: if ($currentScreen) {
    sendNavigationToIframe($currentScreen);
  }
  
  function sendNavigationToIframe(screenName) {
    if (iframeElement && iframeElement.contentWindow) {
      console.log('📡 Sending navigation command to iframe:', screenName);
      
      iframeElement.contentWindow.postMessage({
        type: 'TRINITY_NAVIGATE_TO_SCREEN',
        screenName: screenName,
        timestamp: new Date().toISOString()
      }, '*');
    }
  }
  
  function recompileApp() {
    // Force fresh compilation by clearing any cached data
    compiledApp = null;
    isLoading = true;
    
    // Clear iframe src to force reload
    if (iframeElement) {
      iframeElement.src = 'about:blank';
    }
    
    // Recompile after brief delay to ensure cleanup
    setTimeout(() => {
      compileAndLoad();
    }, 100);
  }
</script>

<div class="live-app-frame">
  {#if isLoading}
    <!-- Loading State -->
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <div class="loading-text">
        <h3>{useAdvancedCompiler ? '🚀 Compiling Advanced Glass Morphism App' : '🎨 Compiling Beautiful Svelte App'}</h3>
        <p>{useAdvancedCompiler ? 'Generating glass morphism with advanced animations...' : 'Converting APML to modern UX with animations...'}</p>
      </div>
    </div>
  {:else if compiledApp}
    <!-- Real Compiled App -->
    <div class="app-container">
      <!-- App Controls -->
      <div class="app-controls">
        <div class="app-status">
          <div class="status-indicator"></div>
          <span class="status-text">{useAdvancedCompiler ? 'Svelte Advanced Glass Morphism App' : 'Basic Svelte App'}</span>
        </div>
        <div class="compiler-controls">
          <button 
            class="compiler-toggle" 
            class:active={useAdvancedCompiler}
            on:click={() => { useAdvancedCompiler = true; recompileApp(); }}
          >
            Svelte Advanced
          </button>
          <button 
            class="compiler-toggle" 
            class:active={!useAdvancedCompiler}
            on:click={() => { useAdvancedCompiler = false; recompileApp(); }}
          >
            Basic Svelte
          </button>
        </div>
        <button class="recompile-btn" on:click={recompileApp}>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          Recompile
        </button>
      </div>
      
      <!-- iPhone Frame with Full PWA App -->
      <div class="phone-frame">
        <div class="phone-screen">
          <!-- Full PWA Application -->
          <iframe 
            bind:this={iframeElement}
            class="app-iframe"
            title="APML Compiled PWA"
            sandbox="allow-scripts allow-same-origin allow-forms"
          ></iframe>
        </div>
      </div>
      
      <!-- App Info -->
      <div class="app-info">
        <div class="text-center">
          <div class="text-sm font-medium text-gray-700 mb-1">
            {useAdvancedCompiler ? 'Advanced Glass Morphism App' : 'Beautiful Svelte App'}
          </div>
          <div class="text-xs text-gray-500">
            {useAdvancedCompiler ? 'Glass morphism with advanced animations' : 'Modern UX with animations & transitions'}
          </div>
          <div class="text-xs text-blue-600 mt-2">
            🎨 Design validation + Trinity flow testing
          </div>
        </div>
      </div>
    </div>
  {:else}
    <!-- Empty State -->
    <div class="empty-state">
      <div class="text-center">
        <div class="text-4xl mb-4">🏗️</div>
        <div class="text-lg font-medium mb-2">No APML Spec</div>
        <div class="text-sm text-gray-500">Parse an APML specification to see the compiled app</div>
      </div>
    </div>
  {/if}
</div>

<style>
  .live-app-frame {
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100%;
    padding: 1rem;
  }
  
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
  }
  
  .loading-spinner {
    width: 3rem;
    height: 3rem;
    border: 3px solid #e5e7eb;
    border-top: 3px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .loading-text {
    text-align: center;
  }
  
  .loading-text h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #374151;
    margin-bottom: 0.5rem;
  }
  
  .loading-text p {
    color: #6b7280;
    font-size: 0.875rem;
  }
  
  .app-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100%;
  }
  
  .app-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 390px;
    margin-bottom: 1rem;
    padding: 0.5rem;
    background: #f8fafc;
    border-radius: 0.5rem;
    border: 1px solid #e2e8f0;
    gap: 1rem;
  }
  
  .app-status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .status-indicator {
    width: 0.5rem;
    height: 0.5rem;
    background: #10b981;
    border-radius: 50%;
    animation: pulse 2s ease-in-out infinite;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  
  .status-text {
    font-size: 0.75rem;
    font-weight: 500;
    color: #374151;
  }
  
  .recompile-btn {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.5rem;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 0.375rem;
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
    margin-left: auto;
  }
  
  .recompile-btn:hover {
    background: #2563eb;
  }
  
  .compiler-controls {
    display: flex;
    gap: 0.25rem;
    background: #e5e7eb;
    border-radius: 0.375rem;
    padding: 0.125rem;
  }
  
  .compiler-toggle {
    padding: 0.25rem 0.75rem;
    background: transparent;
    border: none;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 500;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .compiler-toggle:hover {
    color: #374151;
  }
  
  .compiler-toggle.active {
    background: white;
    color: #1f2937;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }
  
  .phone-frame {
    width: 390px;
    height: 844px;
    background: linear-gradient(145deg, #2d3748, #1a202c);
    border-radius: 47px;
    padding: 6px;
    box-shadow: 
      0 20px 25px -5px rgba(0, 0, 0, 0.1),
      0 10px 10px -5px rgba(0, 0, 0, 0.04),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }
  
  .phone-screen {
    width: 100%;
    height: 100%;
    border-radius: 41px;
    overflow: hidden;
    display: block;
    position: relative;
  }
  
  .app-iframe {
    width: 100%;
    height: 100%;
    border: none;
    border-radius: 41px;
    display: block;
    position: absolute;
    top: 0;
    left: 0;
  }
  
  .app-info {
    margin-top: 1rem;
    text-align: center;
  }
  
  .empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #6b7280;
  }
</style>
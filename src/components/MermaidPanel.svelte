<script>
  export let currentSceneData = null;
  
  import { onMount, onDestroy } from 'svelte';
  import { visualizationState } from '../stores/apmlStore.js';
  
  let mermaidContainer;
  let mermaidLoaded = false;
  let currentNode = null;
  
  $: if (mermaidLoaded && currentSceneData) {
    renderMermaidDiagram();
  }
  
  onMount(async () => {
    try {
      // Load Mermaid from CDN
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js';
      script.onload = () => {
        window.mermaid.initialize({ 
          startOnLoad: false,
          theme: 'dark',
          themeVariables: {
            darkMode: true,
            background: '#1e293b',
            primaryColor: '#3b82f6',
            primaryTextColor: '#ffffff',
            primaryBorderColor: '#1e40af',
            lineColor: '#64748b',
            secondaryColor: '#10b981',
            tertiaryColor: '#f59e0b',
            quaternaryColor: '#ef4444',
            fontFamily: 'ui-sans-serif, system-ui, sans-serif',
            fontSize: '14px'
          },
          securityLevel: 'loose',
          flowchart: {
            useMaxWidth: true,
            htmlLabels: true,
            curve: 'basis'
          },
          // CR1: Disable node dragging and repositioning 
          pan: false,
          zoom: false,
          dragPan: false
        });
        mermaidLoaded = true;
      };
      document.head.appendChild(script);
    } catch (error) {
      console.error('Failed to load Mermaid:', error);
    }
  });
  
  function renderMermaidDiagram() {
    if (!mermaidContainer || !currentSceneData || !window.mermaid) return;
    
    const mermaidCode = generateAdvancedMermaidFromScene(currentSceneData);
    const uniqueId = `mermaid-${Date.now()}`;
    
    // Clear previous diagram
    mermaidContainer.innerHTML = `<div id="${uniqueId}">${mermaidCode}</div>`;
    
    // Render new diagram
    window.mermaid.render(`rendered-${uniqueId}`, mermaidCode)
      .then(({svg}) => {
        mermaidContainer.innerHTML = svg;
        addInteractivity();
      })
      .catch(error => {
        console.error('Mermaid render error:', error);
        mermaidContainer.innerHTML = `
          <div class="flex items-center justify-center h-full text-slate-400">
            <div class="text-center">
              <svg class="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
              </svg>
              <p class="text-sm">Diagram render error</p>
            </div>
          </div>`;
      });
  }
  
  function generateAdvancedMermaidFromScene(sceneData) {
    if (!sceneData.stateNodes || sceneData.stateNodes.length === 0) {
      return `graph TD
        A["⚠️ No states found"]
        style A fill:#fee2e2,stroke:#dc2626,color:#dc2626`;
    }
    
    let mermaidCode = `graph TD\n`;
    
    // Color mapping for different node types
    const nodeColors = {
      'welcome_screen': '#10b981',  // green
      'task_list': '#3b82f6',       // blue  
      'add_task': '#f59e0b',        // orange
      'default': '#64748b'          // gray
    };
    
    // Add nodes with beautiful styling
    sceneData.stateNodes.forEach((node, index) => {
      const nodeId = `node${index}`;
      const nodeName = node.interfaceName || `State ${index}`;
      const nodeColor = nodeColors[node.interfaceName] || nodeColors.default;
      
      // Create node with icon and label
      const icon = getNodeIcon(node.interfaceName);
      mermaidCode += `    ${nodeId}["${icon} ${nodeName}"]\n`;
      
      // Apply sophisticated styling
      if (currentNode?.id === node.id) {
        // Active node styling with glow effect
        mermaidCode += `    style ${nodeId} fill:#8b5cf6,stroke:#a855f7,stroke-width:3px,color:#ffffff,stroke-dasharray: 5 5\n`;
        mermaidCode += `    class ${nodeId} activeNode\n`;
      } else {
        // Regular node styling
        mermaidCode += `    style ${nodeId} fill:${nodeColor},stroke:${nodeColor},color:#ffffff,stroke-width:2px\n`;
      }
    });
    
    // Add sophisticated connections with different styles
    const connectionPaths = generateConnectionPaths(sceneData.stateNodes);
    connectionPaths.forEach(path => {
      mermaidCode += `    ${path.from} ${path.style} ${path.to}\n`;
    });
    
    // Add click events for interactivity
    sceneData.stateNodes.forEach((node, index) => {
      mermaidCode += `    click node${index} handleNodeClick\n`;
    });
    
    // Add custom classes for animations
    mermaidCode += `
    classDef activeNode fill:#8b5cf6,stroke:#a855f7,stroke-width:3px,color:#ffffff
    classDef hoverNode fill:#6366f1,stroke:#818cf8,stroke-width:2px,color:#ffffff
    `;
    
    return mermaidCode;
  }
  
  function getNodeIcon(interfaceName) {
    const icons = {
      'welcome_screen': '🏠',
      'task_list': '📋', 
      'add_task': '➕',
      'user_profile': '👤',
      'settings': '⚙️',
      'dashboard': '📊'
    };
    return icons[interfaceName] || '🔵';
  }
  
  function generateConnectionPaths(nodes) {
    const paths = [];
    
    // Create a mapping of interface names to node indices
    const interfaceToNodeIndex = {};
    nodes.forEach((node, index) => {
      interfaceToNodeIndex[node.interfaceName] = index;
    });
    
    // Parse logic flows from currentSceneData to create proper connections
    if (currentSceneData.logicFlows) {
      currentSceneData.logicFlows.forEach(flow => {
        if (flow.redirectTo) {
          const fromIndex = interfaceToNodeIndex[flow.fromInterface];
          const toIndex = interfaceToNodeIndex[flow.redirectTo];
          
          if (fromIndex !== undefined && toIndex !== undefined) {
            paths.push({
              from: `node${fromIndex}`,
              to: `node${toIndex}`,
              style: '-->',
              label: flow.trigger || flow.actionName
            });
          }
        }
      });
    }
    
    // If no logic flows found, create basic sequential connections as fallback
    if (paths.length === 0) {
      for (let i = 0; i < nodes.length - 1; i++) {
        paths.push({
          from: `node${i}`,
          to: `node${i + 1}`,
          style: '-->'
        });
      }
    }
    
    return paths;
  }
  
  function addInteractivity() {
    // CR1: Apply fixed positioning and prevent node repositioning
    const svgNodes = mermaidContainer.querySelectorAll('.node');
    svgNodes.forEach((node, index) => {
      // Apply fixed positioning - prevent any movement
      node.style.cursor = 'pointer';
      node.style.position = 'relative';
      
      // Store original position to prevent drift
      const originalTransform = node.style.transform || '';
      
      // Disable drag behaviors completely
      node.addEventListener('dragstart', (e) => e.preventDefault());
      node.addEventListener('drag', (e) => e.preventDefault());
      node.addEventListener('dragend', (e) => e.preventDefault());
      node.addEventListener('mousedown', (e) => {
        // Prevent default dragging but allow click events
        if (e.button === 0) { // Left click only
          e.stopPropagation();
        }
      });
      
      // Add hover effects while maintaining fixed position
      node.addEventListener('mouseenter', () => {
        node.style.filter = 'brightness(1.2) drop-shadow(0 0 10px rgba(139, 92, 246, 0.5))';
        // Use scale transform but preserve original position
        node.style.transform = originalTransform + ' scale(1.05)';
        node.style.transition = 'all 0.2s ease';
        node.style.transformOrigin = 'center center';
      });
      
      node.addEventListener('mouseleave', () => {
        node.style.filter = 'none';
        // Reset to original transform, maintaining position
        node.style.transform = originalTransform;
      });
      
      // Handle click events for state changes
      node.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Ensure position stays fixed after click
        node.style.transform = originalTransform;
        // Call the Mermaid click handler
        const nodeId = `node${index}`;
        handleNodeClick(nodeId);
      });
    });
    
    // Disable any SVG-level dragging
    const svgElement = mermaidContainer.querySelector('svg');
    if (svgElement) {
      svgElement.style.pointerEvents = 'auto';
      svgElement.addEventListener('dragstart', (e) => e.preventDefault());
      
      // Add fixed positioning to the entire SVG
      svgElement.style.position = 'relative';
      svgElement.style.overflow = 'visible';
    }
    
    // Add pulse animation to connections
    const connections = mermaidContainer.querySelectorAll('.path');
    connections.forEach((path, index) => {
      setTimeout(() => {
        path.style.strokeDasharray = '5,5';
        path.style.animation = 'dash 2s linear infinite';
      }, index * 200);
    });
  }
  
  function handleNodeClick(nodeId) {
    console.log('Mermaid node clicked:', nodeId);
    // Update visualization state
    visualizationState.update(state => ({
      ...state,
      currentNode: { id: nodeId, interfaceName: `Node ${nodeId}` }
    }));
  }
  
  // Make click handler globally available for Mermaid
  if (typeof window !== 'undefined') {
    window.handleNodeClick = handleNodeClick;
  }
</script>

<div class="mermaid-container h-full relative">
  {#if currentSceneData}
    <!-- Mermaid Diagram Container -->
    <div 
      bind:this={mermaidContainer}
      class="w-full h-full flex items-center justify-center p-4"
    >
      {#if !mermaidLoaded}
        <div class="flex items-center justify-center h-full">
          <div class="text-center text-slate-400">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-flow-accent mx-auto mb-4"></div>
            <p class="text-sm">Loading interactive diagram...</p>
          </div>
        </div>
      {/if}
    </div>
    
    <!-- Legend & Controls Overlay -->
    <div class="absolute bottom-4 left-4 right-4">
      <div class="bg-slate-800/90 backdrop-blur-sm rounded-xl p-4 border border-slate-700">
        <div class="flex items-center justify-between text-sm">
          <div class="flex items-center space-x-4">
            <div class="flex items-center space-x-2">
              <div class="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
              <span class="text-slate-300">Current State</span>
            </div>
            <div class="flex items-center space-x-2">
              <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span class="text-slate-300">Available States</span>
            </div>
            <div class="flex items-center space-x-2">
              <div class="w-8 h-0.5 bg-flow-accent rounded-full"></div>
              <span class="text-slate-300">Flow Path</span>
            </div>
          </div>
          
          <div class="text-slate-400">
            {currentSceneData.stateNodes.length} states in {currentSceneData.sceneName}
          </div>
        </div>
      </div>
    </div>
  {:else}
    <!-- Empty State -->
    <div class="h-full flex items-center justify-center">
      <div class="text-center text-slate-400">
        <svg class="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3v10"/>
        </svg>
        <h3 class="text-lg font-medium mb-2">No Flow Diagram Available</h3>
        <p class="text-sm text-slate-500">
          Parse an APML specification to see the interactive flow visualization
        </p>
      </div>
    </div>
  {/if}
</div>

<style>
  :global(.mermaid-container svg) {
    width: 100% !important;
    height: auto !important;
    max-height: 100%;
  }
  
  :global(.mermaid-container .node rect) {
    filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
  }
  
  :global(.mermaid-container .node text) {
    font-weight: 600 !important;
    font-size: 14px !important;
  }
  
  :global(.mermaid-container .path) {
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  }
  
  @keyframes dash {
    to {
      stroke-dashoffset: -10;
    }
  }
  
  :global(.mermaid-container .activeNode) {
    animation: node-highlight 2s ease-in-out infinite;
  }
  
  @keyframes node-highlight {
    0%, 100% { 
      filter: drop-shadow(0 0 8px rgba(139, 92, 246, 0.6)); 
    }
    50% { 
      filter: drop-shadow(0 0 16px rgba(139, 92, 246, 0.9)); 
    }
  }
</style>
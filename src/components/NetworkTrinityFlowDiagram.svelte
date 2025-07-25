<script>
  import { onMount, onDestroy } from 'svelte';
  import { visualizationState, apmlSpec } from '../stores/apmlStore.js';
  import { 
    trinityFlowState, 
    navigationController, 
    trinityActions, 
    currentScreen,
    activePathEffects,
    businessLogicQueue 
  } from '../stores/trinityFlowStore.js';
  
  // Network visualization properties
  let canvasElement;
  let ctx;
  let animationFrame;
  let isInitialized = false;
  
  // Network data structures
  let nodes = [];
  let connections = [];
  let activeConnection = null;
  let selectedNode = null;
  
  // Physics simulation parameters
  let simulation = {
    running: false,
    damping: 0.92,
    repulsion: 2000,
    attraction: 0.05,
    centerForce: 0.01,
    minDistance: 120
  };
  
  // Canvas dimensions
  let canvasWidth = 1200;
  let canvasHeight = 600;
  
  // Theme colors for different interface types
  const interfaceColors = {
    'auth': '#ef4444',      // Red
    'main': '#06b6d4',      // Cyan
    'feature': '#10b981',   // Green
    'admin': '#8b5cf6',     // Purple
    'onboarding': '#f59e0b', // Amber
    'default': '#64748b'    // Slate
  };
  
  // Process ticker messages
  let processMessages = [];
  let maxMessages = 20;
  
  $: if ($apmlSpec && $apmlSpec.stateNodes) {
    initializeNetworkData();
    // Initialize the Trinity Flow Store with APML data
    navigationController.initializeScreenNetwork($apmlSpec);
  }
  
  // React to current screen changes to highlight active node
  $: if ($currentScreen) {
    updateActiveNode($currentScreen);
  }
  
  // React to path effects for Billie Jean lighting
  $: if ($activePathEffects) {
    updatePathEffects($activePathEffects);
  }
  
  onMount(() => {
    if (canvasElement) {
      ctx = canvasElement.getContext('2d');
      setupCanvas();
      startSimulation();
    }
  });
  
  onDestroy(() => {
    stopSimulation();
  });
  
  function setupCanvas() {
    const rect = canvasElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    canvasWidth = rect.width;
    canvasHeight = rect.height;
    
    canvasElement.width = canvasWidth * dpr;
    canvasElement.height = canvasHeight * dpr;
    
    ctx.scale(dpr, dpr);
    canvasElement.style.width = canvasWidth + 'px';
    canvasElement.style.height = canvasHeight + 'px';
  }
  
  function initializeNetworkData() {
    console.log('🚁 Trinity Live Behavior Monitor: Initializing from compiled app...');
    
    // LIVE BEHAVIOR MONITOR: Only show interfaces that actually exist in compiled app
    // Filter to only include interfaces that were successfully compiled
    const compiledInterfaces = $apmlSpec.stateNodes.filter(node => {
      // Check if this interface actually compiled to real components
      return node.interfaceName && node.availableActions && node.availableActions.length > 0;
    });
    
    nodes = compiledInterfaces.map((node, index) => {
      const nodeType = classifyInterfaceType(node.interfaceName);
      const position = calculateInitialPosition(nodeType, index, compiledInterfaces.length);
      
      return {
        id: node.id,
        name: node.interfaceName,
        type: nodeType,
        x: position.x,
        y: position.y,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        radius: 50,
        isActive: false,
        originalNode: node,
        fixed: false,
        isRealInterface: true  // Mark as actually compiled
      };
    });
    
    // LIVE BEHAVIOR MONITOR: Only show connections that will actually work
    // We'll build connections dynamically as real navigation happens
    connections = [];
    
    console.log(`🚁 Live Behavior Monitor initialized: ${nodes.length} real interfaces`);
    console.log('📡 Waiting for real app navigation to build connection map...');
    isInitialized = true;
  }
  
  function classifyInterfaceType(interfaceName) {
    const name = interfaceName.toLowerCase();
    if (name.includes('login') || name.includes('auth') || name.includes('signup')) return 'auth';
    if (name.includes('dashboard') || name.includes('home') || name.includes('main')) return 'main';
    if (name.includes('admin') || name.includes('settings')) return 'admin';
    if (name.includes('onboard') || name.includes('welcome') || name.includes('tutorial')) return 'onboarding';
    return 'feature';
  }
  
  function calculateInitialPosition(nodeType, index, totalNodes) {
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    const margin = 80;
    
    // Create different positioning strategies based on node type and count
    if (totalNodes <= 3) {
      // Simple horizontal layout for small networks
      const spacing = (canvasWidth - 2 * margin) / Math.max(1, totalNodes - 1);
      return {
        x: margin + (index * spacing),
        y: centerY
      };
    } else if (totalNodes <= 6) {
      // Circle layout for medium networks
      const radius = Math.min(canvasWidth, canvasHeight) * 0.25;
      const angle = (index / totalNodes) * 2 * Math.PI;
      return {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius
      };
    } else {
      // Clustered layout for larger networks
      return calculateClusteredPosition(nodeType, index, totalNodes, centerX, centerY);
    }
  }
  
  function calculateClusteredPosition(nodeType, index, totalNodes, centerX, centerY) {
    const clusters = {
      'main': { x: centerX, y: centerY - 100, count: 0 },
      'auth': { x: centerX - 200, y: centerY - 50, count: 0 },
      'feature': { x: centerX + 150, y: centerY + 50, count: 0 },
      'admin': { x: centerX - 150, y: centerY + 150, count: 0 },
      'onboarding': { x: centerX + 200, y: centerY - 100, count: 0 }
    };
    
    const cluster = clusters[nodeType];
    const localIndex = cluster.count++;
    
    // Add some variation within the cluster
    const angle = (localIndex / 4) * 2 * Math.PI;
    const radius = 40 + (localIndex * 15);
    
    return {
      x: cluster.x + Math.cos(angle) * radius + (Math.random() - 0.5) * 60,
      y: cluster.y + Math.sin(angle) * radius + (Math.random() - 0.5) * 60
    };
  }
  
  function startSimulation() {
    simulation.running = true;
    animate();
  }
  
  function stopSimulation() {
    simulation.running = false;
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
    }
  }
  
  function animate() {
    if (!simulation.running || !isInitialized) return;
    
    updatePhysics();
    render();
    
    animationFrame = requestAnimationFrame(animate);
  }
  
  function updatePhysics() {
    // Apply forces between nodes
    for (let i = 0; i < nodes.length; i++) {
      const nodeA = nodes[i];
      if (nodeA.fixed) continue;
      
      // Repulsion from other nodes
      for (let j = i + 1; j < nodes.length; j++) {
        const nodeB = nodes[j];
        const dx = nodeB.x - nodeA.x;
        const dy = nodeB.y - nodeA.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0 && distance < simulation.minDistance * 2) {
          // Stronger repulsion when nodes are too close
          const force = simulation.repulsion / Math.max(distance * distance, 100);
          const fx = (dx / distance) * force;
          const fy = (dy / distance) * force;
          
          nodeA.vx -= fx;
          nodeA.vy -= fy;
          if (!nodeB.fixed) {
            nodeB.vx += fx;
            nodeB.vy += fy;
          }
        }
      }
      
      // Weak attraction to center to prevent nodes from flying away
      const centerX = canvasWidth / 2;
      const centerY = canvasHeight / 2;
      const dcx = centerX - nodeA.x;
      const dcy = centerY - nodeA.y;
      const centerDistance = Math.sqrt(dcx * dcx + dcy * dcy);
      
      if (centerDistance > canvasWidth * 0.3) {
        nodeA.vx += dcx * simulation.centerForce;
        nodeA.vy += dcy * simulation.centerForce;
      }
    }
    
    // Attraction along connections (weaker, just to suggest relationships)
    connections.forEach(conn => {
      if (conn.from.fixed || conn.to.fixed) return;
      
      const dx = conn.to.x - conn.from.x;
      const dy = conn.to.y - conn.from.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > simulation.minDistance) {
        const force = simulation.attraction * (distance - simulation.minDistance) / 100;
        const fx = (dx / distance) * force;
        const fy = (dy / distance) * force;
        
        conn.from.vx += fx;
        conn.from.vy += fy;
        conn.to.vx -= fx;
        conn.to.vy -= fy;
      }
    });
    
    // Update positions and apply damping
    nodes.forEach(node => {
      node.vx *= simulation.damping;
      node.vy *= simulation.damping;
      
      node.x += node.vx;
      node.y += node.vy;
      
      // Keep nodes within canvas bounds
      const margin = node.radius;
      if (node.x < margin) { node.x = margin; node.vx = 0; }
      if (node.x > canvasWidth - margin) { node.x = canvasWidth - margin; node.vx = 0; }
      if (node.y < margin) { node.y = margin; node.vy = 0; }
      if (node.y > canvasHeight - margin) { node.y = canvasHeight - margin; node.vy = 0; }
    });
    
    // Update connection animations
    connections.forEach(conn => {
      if (conn.isActive) {
        conn.animationProgress += 0.05;
        if (conn.animationProgress > 1) {
          conn.animationProgress = 0;
        }
      }
    });
  }
  
  function render() {
    // Clear canvas
    ctx.fillStyle = '#0f172a'; // Dark slate background
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Draw grid pattern
    drawGrid();
    
    // Draw connections first (behind nodes)
    connections.forEach(conn => drawConnection(conn));
    
    // Draw nodes
    nodes.forEach(node => drawNode(node));
    
    // Draw labels
    nodes.forEach(node => drawNodeLabel(node));
  }
  
  function drawGrid() {
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.3;
    
    const gridSize = 50;
    
    // Vertical lines
    for (let x = 0; x < canvasWidth; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasHeight);
      ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = 0; y < canvasHeight; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvasWidth, y);
      ctx.stroke();
    }
    
    ctx.globalAlpha = 1;
  }
  
  function drawConnection(conn) {
    const dx = conn.to.x - conn.from.x;
    const dy = conn.to.y - conn.from.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Calculate control points for curved path
    const midX = (conn.from.x + conn.to.x) / 2;
    const midY = (conn.from.y + conn.to.y) / 2;
    const perpX = -dy / distance * 50; // Curve amount
    const perpY = dx / distance * 50;
    const ctrlX = midX + perpX;
    const ctrlY = midY + perpY;
    
    // Draw base connection
    ctx.beginPath();
    ctx.moveTo(conn.from.x, conn.from.y);
    ctx.quadraticCurveTo(ctrlX, ctrlY, conn.to.x, conn.to.y);
    
    if (conn.isBillieJeanGlow) {
      // Billie Jean effect - super bright glow!
      ctx.strokeStyle = '#f59e0b'; // Bright yellow like Billie Jean
      ctx.lineWidth = 6;
      ctx.shadowBlur = 25;
      ctx.shadowColor = '#f59e0b';
      
      // Draw multiple passes for intense glow
      ctx.stroke();
      ctx.shadowBlur = 15;
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#fbbf24';
      ctx.stroke();
      ctx.shadowBlur = 8;
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#fde047';
      ctx.stroke();
      
    } else if (conn.isActive) {
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 3;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#06b6d4';
      ctx.stroke();
    } else {
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 1;
      ctx.shadowBlur = 0;
      ctx.stroke();
    }
    
    // Draw arrow head
    drawArrowHead(conn.to.x, conn.to.y, Math.atan2(dy, dx));
    
    // Draw animated glow if active
    if (conn.isActive) {
      drawConnectionGlow(conn, ctrlX, ctrlY);
    }
    
    // Reset shadow
    ctx.shadowBlur = 0;
  }
  
  function drawArrowHead(x, y, angle) {
    const size = 10;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    
    ctx.beginPath();
    ctx.moveTo(-size, -size/2);
    ctx.lineTo(0, 0);
    ctx.lineTo(-size, size/2);
    ctx.stroke();
    
    ctx.restore();
  }
  
  function drawConnectionGlow(conn, ctrlX, ctrlY) {
    const progress = conn.animationProgress;
    
    // Calculate position along curve
    const t = progress;
    const glowX = (1-t)*(1-t)*conn.from.x + 2*(1-t)*t*ctrlX + t*t*conn.to.x;
    const glowY = (1-t)*(1-t)*conn.from.y + 2*(1-t)*t*ctrlY + t*t*conn.to.y;
    
    // Draw animated glow point
    ctx.beginPath();
    ctx.arc(glowX, glowY, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#06b6d4';
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#06b6d4';
    ctx.fill();
  }
  
  function drawNode(node) {
    let color = interfaceColors[node.type] || interfaceColors.default;
    
    // Active screen gets gold/orange color (Billie Jean style!)
    if (node.isActive) {
      color = '#f59e0b'; // Bright gold/orange for active screen
      ctx.shadowBlur = 25;
      ctx.shadowColor = '#f59e0b';
    } else if (selectedNode === node) {
      ctx.shadowBlur = 15;
      ctx.shadowColor = color;
    } else {
      ctx.shadowBlur = 5;
      ctx.shadowColor = color;
    }
    
    // Main node circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.globalAlpha = node.isActive ? 1.0 : 0.7;
    ctx.fill();
    
    // Extra glow for active screen
    if (node.isActive) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius + 8, 0, Math.PI * 2);
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.4;
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    }
    
    // Inner circle for depth
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.radius - 10, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fill();
    
    // Node border
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }
  
  function drawNodeLabel(node) {
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Add text shadow for readability
    ctx.shadowBlur = 4;
    ctx.shadowColor = '#000000';
    
    ctx.fillText(node.name, node.x, node.y);
    
    // Draw element count
    const elementCount = node.originalNode.availableActions?.length || 0;
    ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`${elementCount} actions`, node.x, node.y + 20);
    
    ctx.shadowBlur = 0;
  }
  
  function handleCanvasClick(event) {
    const rect = canvasElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Check if click is on any node
    const clickedNode = nodes.find(node => {
      const dx = x - node.x;
      const dy = y - node.y;
      return Math.sqrt(dx * dx + dy * dy) <= node.radius;
    });
    
    if (clickedNode) {
      handleNodeClick(clickedNode);
    }
  }
  
  function handleNodeClick(node) {
    console.log('🎯 Trinity Node clicked:', node.name);
    
    // Use Trinity Flow Store for navigation (Single Source of Truth)
    trinityActions.nodeClicked(node.name);
    
    // Update selected node for visual feedback
    selectedNode = node;
  }
  
  /**
   * Update active node based on current screen (Billie Jean effect)
   */
  function updateActiveNode(screenName) {
    if (!nodes || nodes.length === 0) return;
    
    console.log('✨ Updating active node:', screenName);
    
    // Update node active states
    nodes.forEach(node => {
      node.isActive = (node.name === screenName);
    });
    
    // Set selected node to current screen
    selectedNode = nodes.find(node => node.name === screenName) || null;
  }
  
  /**
   * Update path effects for Billie Jean lighting
   */
  function updatePathEffects(effects) {
    if (!connections || connections.length === 0) return;
    
    console.log('🌟 Updating path effects:', effects);
    
    // Clear all connection states first
    connections.forEach(conn => {
      conn.isActive = false;
      conn.isBillieJeanGlow = false;
    });
    
    // Apply glowing connections (Billie Jean effect!)
    if (effects.glowingConnections && effects.glowingConnections.size > 0) {
      connections.forEach(conn => {
        const connectionKey = `${conn.from.name}->${conn.to.name}`;
        if (effects.glowingConnections.has(connectionKey)) {
          conn.isActive = true;
          conn.isBillieJeanGlow = true;
          console.log(`🔥 Billie Jean glow: ${connectionKey}`);
        }
      });
    }
  }
  
  function addProcessMessage(action, description, type) {
    const message = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      action,
      description,
      type,
      icon: type === 'user_action' ? '👆' : type === 'app_process' ? '⚡' : '📱'
    };
    
    processMessages = [message, ...processMessages.slice(0, maxMessages - 1)];
  }
  
  function resetNodeLayout() {
    console.log('🔄 Resetting node layout...');
    nodes.forEach((node, index) => {
      const position = calculateInitialPosition(node.type, index, nodes.length);
      node.x = position.x;
      node.y = position.y;
      node.vx = (Math.random() - 0.5) * 4;
      node.vy = (Math.random() - 0.5) * 4;
      node.fixed = false;
    });
    
    if (!simulation.running) {
      simulation.running = true;
    }
  }
  
  function organizeNodes() {
    console.log('📐 Organizing nodes by type...');
    
    // Group nodes by type
    const nodesByType = {
      'main': [],
      'auth': [],
      'feature': [],
      'admin': [],
      'onboarding': []
    };
    
    nodes.forEach(node => {
      if (nodesByType[node.type]) {
        nodesByType[node.type].push(node);
      } else {
        nodesByType['feature'].push(node);
      }
    });
    
    // Position nodes in organized clusters
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    
    // Main nodes in center
    nodesByType.main.forEach((node, i) => {
      node.x = centerX + (i - nodesByType.main.length/2) * 80;
      node.y = centerY - 80;
      node.vx = 0;
      node.vy = 0;
      node.fixed = true;
    });
    
    // Auth nodes top-left
    nodesByType.auth.forEach((node, i) => {
      node.x = centerX - 200 + (i % 2) * 100;
      node.y = centerY - 100 + Math.floor(i / 2) * 80;
      node.vx = 0;
      node.vy = 0;
      node.fixed = true;
    });
    
    // Feature nodes right
    nodesByType.feature.forEach((node, i) => {
      const angle = (i / nodesByType.feature.length) * 2 * Math.PI;
      node.x = centerX + 180 + Math.cos(angle) * 60;
      node.y = centerY + Math.sin(angle) * 60;
      node.vx = 0;
      node.vy = 0;
      node.fixed = true;
    });
    
    // Admin nodes bottom-left
    nodesByType.admin.forEach((node, i) => {
      node.x = centerX - 150 + (i % 2) * 80;
      node.y = centerY + 120 + Math.floor(i / 2) * 60;
      node.vx = 0;
      node.vy = 0;
      node.fixed = true;
    });
    
    // Onboarding nodes top-right
    nodesByType.onboarding.forEach((node, i) => {
      node.x = centerX + 200 + (i % 2) * 80;
      node.y = centerY - 120 + Math.floor(i / 2) * 60;
      node.vx = 0;
      node.vy = 0;
      node.fixed = true;
    });
    
    // Release fixed positions after a delay
    setTimeout(() => {
      nodes.forEach(node => {
        node.fixed = false;
      });
    }, 3000);
  }
  
  // Listen for REAL app navigation to build live connection map
  $: if ($visualizationState.lastAction) {
    const action = $visualizationState.lastAction;
    if (action.type === 'TRINITY_FLOW_ACTION') {
      console.log('🚁 Live Behavior Monitor: Real navigation detected!', action);
      
      // Find the nodes involved in this REAL navigation
      const fromNode = nodes.find(node => node.name === action.from);
      const toNode = nodes.find(node => node.name === action.to);
      
      if (fromNode && toNode) {
        // Create or update the connection based on REAL app behavior
        let existingConnection = connections.find(conn => 
          conn.from.name === action.from && conn.to.name === action.to
        );
        
        if (!existingConnection) {
          // This is a NEW real connection - add it to the live map!
          console.log(`🔗 Adding REAL connection: ${action.from} → ${action.to}`);
          existingConnection = {
            id: `real_${action.from}_to_${action.to}`,
            from: fromNode,
            to: toNode,
            type: 'real_navigation',
            isActive: true,
            animationProgress: 0,
            realButtonName: action.buttonName,
            isConfirmedWorking: true  // Mark as actually working
          };
          connections.push(existingConnection);
        } else {
          // Connection exists - light it up for real navigation!
          existingConnection.isActive = true;
          existingConnection.isConfirmedWorking = true;
        }
        
        // Billie Jean lighting effect for 3 seconds
        setTimeout(() => {
          if (existingConnection) {
            existingConnection.isActive = false;
          }
        }, 3000);
        
        addProcessMessage(
          action.buttonName || 'navigation', 
          `Real app navigation: ${action.from} → ${action.to}`, 
          'real_navigation'
        );
      }
    }
  }
</script>

<div class="network-trinity-container">
  <!-- Network Canvas -->
  <div class="network-canvas-container">
    <canvas 
      bind:this={canvasElement}
      on:click={handleCanvasClick}
      class="network-canvas"
    ></canvas>
    
    <!-- Network Controls -->
    <div class="network-controls">
      <button class="control-btn" on:click={() => simulation.running = !simulation.running}>
        {simulation.running ? '⏸️' : '▶️'} Physics
      </button>
      <button class="control-btn" on:click={resetNodeLayout}>
        🔄 Reset Layout
      </button>
      <button class="control-btn" on:click={organizeNodes}>
        📐 Organize
      </button>
      <button class="control-btn" on:click={() => selectedNode = null}>
        🎯 Clear Selection
      </button>
    </div>
  </div>
  
  <!-- App-App Business Logic Ticker -->
  <div class="business-logic-ticker">
    <div class="ticker-header">
      <h4>🚁 Live App Behavior</h4>
      <span class="logic-count">{$businessLogicQueue.length} real actions</span>
    </div>
    
    <div class="logic-stream">
      {#each $businessLogicQueue as message (message.id)}
        <div class="logic-message billie-jean-step">
          <span class="logic-action">{message.step}</span>
          <span class="logic-arrow">→</span>
          <span class="logic-description">{message.description}</span>
        </div>
      {/each}
      
      {#if $businessLogicQueue.length === 0}
        <div class="no-logic">
          <span class="text-slate-500">Business logic will appear here when users navigate through the app...</span>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .network-trinity-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  }
  
  .network-canvas-container {
    flex: 1;
    position: relative;
    min-height: 0;
  }
  
  .network-canvas {
    width: 100%;
    height: 100%;
    cursor: pointer;
    border-radius: 8px;
  }
  
  .network-controls {
    position: absolute;
    top: 16px;
    right: 16px;
    display: flex;
    gap: 8px;
  }
  
  .control-btn {
    padding: 8px 16px;
    background: rgba(0, 0, 0, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 6px;
    color: white;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    backdrop-filter: blur(10px);
    transition: all 0.2s ease;
  }
  
  .control-btn:hover {
    background: rgba(0, 0, 0, 0.9);
    border-color: rgba(255, 255, 255, 0.4);
  }
  
  .business-logic-ticker {
    height: 12vh;
    background: #000000;
    border-top: 1px solid #374151;
    display: flex;
    flex-direction: column;
  }
  
  .ticker-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 16px;
    border-bottom: 1px solid #374151;
  }
  
  .ticker-header h4 {
    color: #06b6d4;
    font-size: 13px;
    font-weight: 600;
    margin: 0;
  }
  
  .logic-count {
    color: #64748b;
    font-size: 11px;
  }
  
  .logic-stream {
    flex: 1;
    overflow-y: auto;
    padding: 8px 16px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  
  .logic-message {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 0;
    font-family: 'SF Mono', Monaco, monospace;
    font-size: 11px;
    animation: slideIn 0.3s ease-out;
  }
  
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(-10px); }
    to { opacity: 1; transform: translateX(0); }
  }
  
  .logic-action {
    color: #06b6d4;
    font-weight: 600;
    min-width: 70px;
  }
  
  .logic-arrow {
    color: #64748b;
    font-size: 10px;
  }
  
  .logic-description {
    color: #94a3b8;
    flex: 1;
  }
  
  .no-logic {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    font-size: 11px;
    font-style: italic;
  }
  
  /* Billie Jean Effects */
  .billie-jean-step {
    background: linear-gradient(90deg, rgba(6, 182, 212, 0.1), rgba(6, 182, 212, 0.05));
    border-left: 2px solid #06b6d4;
    border-radius: 4px;
    padding: 6px 8px;
    margin: 2px 0;
    animation: billieJeanGlow 0.6s ease-out;
  }
  
  @keyframes billieJeanGlow {
    0% { 
      background: rgba(6, 182, 212, 0.3);
      transform: translateX(-5px);
      box-shadow: 0 0 15px rgba(6, 182, 212, 0.4);
    }
    100% { 
      background: rgba(6, 182, 212, 0.1);
      transform: translateX(0);
      box-shadow: none;
    }
  }
</style>
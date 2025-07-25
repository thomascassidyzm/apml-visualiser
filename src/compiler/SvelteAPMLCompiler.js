/**
 * Svelte-based APML Compiler
 * Converts APML specifications into beautiful Svelte applications with modern UX
 * Enables both Trinity flow validation AND design validation
 */

export class SvelteAPMLCompiler {
  constructor() {
    this.compiledApp = '';
    this.components = {};
    this.styles = {};
    this.apmlSpec = null;
  }

  /**
   * Main compilation method - converts APML to beautiful Svelte app
   */
  compile(apmlSpec) {
    console.log('🎨 Svelte APML Compiler: Starting compilation...');
    
    // Validate APML spec
    if (!apmlSpec) {
      throw new Error('APML specification is required');
    }
    
    // Store APML spec for dynamic flow generation
    this.apmlSpec = apmlSpec;
    
    const { stateNodes = [], parsedFlows = [], logicFlows = [], dataModels = [] } = apmlSpec;
    // Use parsedFlows from the store, fallback to logicFlows for compatibility
    const flows = parsedFlows.length > 0 ? parsedFlows : logicFlows;
    
    // Validate required fields
    if (!stateNodes || stateNodes.length === 0) {
      throw new Error('APML specification must contain at least one state node');
    }
    
    console.log(`📊 Compiling ${stateNodes.length} states with ${flows.length} flows`);
    
    // Generate Svelte components
    this.generateComponents(stateNodes);
    
    // Generate main app component
    this.generateMainApp(stateNodes, flows);
    
    // Generate styles with animations
    this.generateModernStyles();
    
    // Create complete Svelte app bundle
    const completeApp = this.generateCompleteSvelteApp();
    
    console.log('✨ Svelte APML Compiler: Beautiful app compiled!');
    console.log('📝 Generated HTML length:', completeApp.length, 'characters');
    console.log('🔗 Data URL preview:', `data:text/html;charset=utf-8,${encodeURIComponent(completeApp)}`.substring(0, 100) + '...');
    
    return {
      html: completeApp,
      components: this.components,
      dataUrl: `data:text/html;charset=utf-8,${encodeURIComponent(completeApp)}`
    };
  }

  /**
   * Generate individual Svelte components for each screen
   */
  generateComponents(stateNodes) {
    if (!stateNodes || !Array.isArray(stateNodes)) {
      console.warn('⚠️ No state nodes provided for component generation');
      return;
    }
    
    stateNodes.forEach(node => {
      if (node && node.interfaceName) {
        this.components[node.interfaceName] = this.generateScreenComponent(node);
      } else {
        console.warn('⚠️ Invalid state node:', node);
      }
    });
  }

  /**
   * Generate a beautiful Svelte component for a screen
   */
  generateScreenComponent(node) {
    const componentName = this.formatComponentName(node.interfaceName);
    
    return `
<!-- ${componentName}.svelte - Generated from APML -->
<script>
  import { fade, fly, scale } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  
  export let onAction;
  export let data = {};
  
  let isVisible = true;
  
  function handleAction(action) {
    if (onAction) {
      onAction(action);
    }
  }
</script>

{#if isVisible}
  <div 
    class="screen-container ${node.interfaceName}"
    in:fly="{{ y: 50, duration: 600, easing: quintOut }}"
    out:fade="{{ duration: 300 }}"
  >
    <div class="screen-content">
      ${this.generateScreenContent(node)}
    </div>
    
    <div class="screen-actions">
      ${this.generateSvelteActions(node)}
    </div>
  </div>
{/if}

<style>
  .screen-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    padding: 2rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    position: relative;
    overflow: hidden;
  }
  
  .screen-container::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    z-index: -1;
  }
  
  .screen-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    animation: fadeInUp 0.8s ease-out;
  }
  
  .screen-actions {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-top: 2rem;
    animation: slideInUp 1s ease-out 0.3s both;
  }
  
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes slideInUp {
    from {
      opacity: 0;
      transform: translateY(50px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  ${this.generateScreenSpecificStyles(node)}
</style>
    `;
  }

  /**
   * Generate beautiful content for each screen type
   */
  generateScreenContent(node) {
    switch (node.interfaceName) {
      case 'welcome_screen':
        return `
          <div class="welcome-hero">
            <div class="hero-icon" in:scale="{{ duration: 800, start: 0.5 }}">
              <svg viewBox="0 0 24 24" class="icon-large">
                <path fill="currentColor" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h1 class="hero-title">Welcome to Simple To-Do</h1>
            <p class="hero-subtitle">Organize your tasks with beautiful simplicity</p>
            <div class="hero-features">
              <div class="feature">✨ Beautiful Design</div>
              <div class="feature">⚡ Lightning Fast</div>
              <div class="feature">📱 Mobile Perfect</div>
            </div>
          </div>
        `;
      
      case 'task_list':
        return `
          <div class="task-list-container">
            <div class="list-header">
              <h1 class="list-title">My Tasks</h1>
              <div class="task-stats">
                <span class="stat">
                  <span class="stat-number">{data.tasks ? data.tasks.length : 0}</span>
                  <span class="stat-label">tasks</span>
                </span>
              </div>
            </div>
            
            <div class="tasks-wrapper">
              {#if data.tasks && data.tasks.length > 0}
                <div class="tasks-grid">
                  {#each data.tasks as task, i (task.id)}
                    <div 
                      class="task-card"
                      in:fly="{{ y: 20, duration: 400, delay: i * 100 }}"
                      class:completed={task.completed}
                    >
                      <div class="task-content">
                        <input 
                          type="checkbox" 
                          bind:checked={task.completed}
                          class="task-checkbox"
                        />
                        <span class="task-text">{task.text}</span>
                      </div>
                      <div class="task-actions">
                        <button class="task-action-btn edit">✏️</button>
                        <button class="task-action-btn delete">🗑️</button>
                      </div>
                    </div>
                  {/each}
                </div>
              {:else}
                <div class="empty-state" in:fade="{{ duration: 600 }}">
                  <div class="empty-icon">📝</div>
                  <h3>No tasks yet</h3>
                  <p>Create your first task to get started</p>
                </div>
              {/if}
            </div>
          </div>
        `;
      
      case 'add_task':
        return `
          <div class="add-task-container">
            <div class="form-header">
              <h1 class="form-title">Add New Task</h1>
              <p class="form-subtitle">Create something amazing</p>
            </div>
            
            <div class="form-wrapper">
              <div class="form-group" in:fly="{{ x: -20, duration: 500 }}">
                <label for="taskTitle" class="form-label">Task Title</label>
                <input 
                  type="text" 
                  id="taskTitle"
                  class="form-input"
                  placeholder="What needs to be done?"
                  bind:value={data.newTaskTitle}
                />
              </div>
              
              <div class="form-group" in:fly="{{ x: -20, duration: 500, delay: 200 }}">
                <label for="taskDescription" class="form-label">Description</label>
                <textarea 
                  id="taskDescription"
                  class="form-textarea"
                  placeholder="Add some details..."
                  bind:value={data.newTaskDescription}
                  rows="3"
                ></textarea>
              </div>
              
              <div class="form-group" in:fly="{{ x: -20, duration: 500, delay: 400 }}">
                <label class="form-label">Priority</label>
                <div class="priority-selector">
                  <button class="priority-btn low" class:active={data.priority === 'low'}>
                    <span class="priority-dot"></span>
                    Low
                  </button>
                  <button class="priority-btn medium" class:active={data.priority === 'medium'}>
                    <span class="priority-dot"></span>
                    Medium
                  </button>
                  <button class="priority-btn high" class:active={data.priority === 'high'}>
                    <span class="priority-dot"></span>
                    High
                  </button>
                </div>
              </div>
            </div>
          </div>
        `;
      
      default:
        return `
          <div class="default-screen">
            <h1>{interfaceName} Screen</h1>
            <p>Generated from APML specification</p>
          </div>
        `;
    }
  }

  /**
   * Generate beautiful action buttons with Svelte animations
   */
  generateSvelteActions(node) {
    if (!node || !node.availableActions || !Array.isArray(node.availableActions)) {
      return '';
    }
    
    return node.availableActions.map((action, index) => {
      const buttonClass = this.getButtonClass(action);
      const buttonText = this.formatActionText(action);
      const icon = this.getActionIcon(action);
      
      return `
        <button 
          class="${buttonClass}"
          on:click={() => handleAction('${action}')}
          in:scale="{{ duration: 400, delay: ${index * 100} }}"
        >
          <span class="btn-icon">${icon}</span>
          <span class="btn-text">${buttonText}</span>
          <div class="btn-ripple"></div>
        </button>
      `;
    }).join('');
  }

  /**
   * Generate screen-specific styles
   */
  generateScreenSpecificStyles(node) {
    switch (node.interfaceName) {
      case 'welcome_screen':
        return `
          .welcome-hero {
            max-width: 400px;
          }
          
          .hero-icon {
            width: 80px;
            height: 80px;
            margin: 0 auto 2rem;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(10px);
          }
          
          .icon-large {
            width: 40px;
            height: 40px;
          }
          
          .hero-title {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 1rem;
            background: linear-gradient(45deg, #fff, #e0e7ff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          
          .hero-subtitle {
            font-size: 1.2rem;
            opacity: 0.9;
            margin-bottom: 2rem;
          }
          
          .hero-features {
            display: flex;
            gap: 1rem;
            flex-wrap: wrap;
            justify-content: center;
          }
          
          .feature {
            padding: 0.5rem 1rem;
            background: rgba(255, 255, 255, 0.15);
            border-radius: 20px;
            font-size: 0.9rem;
            backdrop-filter: blur(5px);
          }
        `;
      
      case 'task_list':
        return `
          .task-list-container {
            width: 100%;
            max-width: 500px;
          }
          
          .list-header {
            margin-bottom: 2rem;
          }
          
          .list-title {
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
          }
          
          .task-stats {
            display: flex;
            gap: 1rem;
          }
          
          .stat {
            display: flex;
            align-items: baseline;
            gap: 0.25rem;
          }
          
          .stat-number {
            font-size: 1.5rem;
            font-weight: 700;
          }
          
          .stat-label {
            font-size: 0.9rem;
            opacity: 0.8;
          }
          
          .tasks-grid {
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }
          
          .task-card {
            background: rgba(255, 255, 255, 0.15);
            border-radius: 16px;
            padding: 1.5rem;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            transition: all 0.3s ease;
          }
          
          .task-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          }
          
          .task-card.completed {
            opacity: 0.7;
          }
          
          .task-content {
            display: flex;
            align-items: center;
            gap: 1rem;
          }
          
          .task-checkbox {
            width: 20px;
            height: 20px;
            accent-color: white;
          }
          
          .task-text {
            flex: 1;
            font-size: 1.1rem;
          }
          
          .task-actions {
            display: flex;
            gap: 0.5rem;
            margin-top: 1rem;
          }
          
          .task-action-btn {
            background: rgba(255, 255, 255, 0.2);
            border: none;
            border-radius: 8px;
            padding: 0.5rem;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          
          .task-action-btn:hover {
            background: rgba(255, 255, 255, 0.3);
          }
          
          .empty-state {
            text-align: center;
            padding: 3rem;
          }
          
          .empty-icon {
            font-size: 4rem;
            margin-bottom: 1rem;
          }
        `;
      
      case 'add_task':
        return `
          .add-task-container {
            width: 100%;
            max-width: 400px;
          }
          
          .form-header {
            margin-bottom: 2rem;
          }
          
          .form-title {
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
          }
          
          .form-subtitle {
            opacity: 0.9;
          }
          
          .form-wrapper {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
          }
          
          .form-group {
            display: flex;
            flex-direction: column;
          }
          
          .form-label {
            font-weight: 600;
            margin-bottom: 0.5rem;
            font-size: 0.9rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .form-input, .form-textarea {
            background: rgba(255, 255, 255, 0.15);
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 12px;
            padding: 1rem;
            color: white;
            font-size: 1rem;
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
          }
          
          .form-input:focus, .form-textarea:focus {
            outline: none;
            border-color: rgba(255, 255, 255, 0.6);
            box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.1);
          }
          
          .form-input::placeholder, .form-textarea::placeholder {
            color: rgba(255, 255, 255, 0.6);
          }
          
          .priority-selector {
            display: flex;
            gap: 0.5rem;
          }
          
          .priority-btn {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            padding: 1rem;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 12px;
            color: white;
            cursor: pointer;
            transition: all 0.3s ease;
          }
          
          .priority-btn:hover {
            background: rgba(255, 255, 255, 0.2);
          }
          
          .priority-btn.active {
            background: rgba(255, 255, 255, 0.3);
            border-color: rgba(255, 255, 255, 0.5);
          }
          
          .priority-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: currentColor;
          }
          
          .priority-btn.low .priority-dot { background: #10b981; }
          .priority-btn.medium .priority-dot { background: #f59e0b; }
          .priority-btn.high .priority-dot { background: #ef4444; }
        `;
      
      default:
        return '';
    }
  }

  /**
   * Generate the main Svelte app component
   */
  generateMainApp(stateNodes, logicFlows) {
    const flowMap = this.createFlowMap(logicFlows);
    
    this.mainApp = `
<!-- App.svelte - Main APML Compiled Application -->
<script>
  import { fade } from 'svelte/transition';
  import { writable } from 'svelte/store';
  
  // Import all screen components
  ${stateNodes.map(node => 
    `import ${this.formatComponentName(node.interfaceName)} from './${this.formatComponentName(node.interfaceName)}.svelte';`
  ).join('\n  ')}
  
  // App state
  let currentScreen = '${stateNodes[0]?.interfaceName || 'welcome_screen'}';
  let appData = writable({
    tasks: [],
    newTaskTitle: '',
    newTaskDescription: '',
    priority: 'medium'
  });
  
  // Flow mapping from APML
  const flows = ${JSON.stringify(flowMap, null, 2)};
  
  // Component mapping
  const components = {
    ${stateNodes.map(node => 
      `'${node.interfaceName}': ${this.formatComponentName(node.interfaceName)}`
    ).join(',\n    ')}
  };
  
  // Trinity action handler with beautiful transitions
  function handleAction(action) {
    console.log(\`🎯 Trinity Action: \${action} from \${currentScreen}\`);
    
    const flow = flows[currentScreen] && flows[currentScreen][action];
    if (flow) {
      // Handle special actions
      handleSpecialActions(action);
      
      // Navigate with smooth transition
      navigateToScreen(flow.redirectTo);
      
      // Send Trinity message to parent
      sendTrinityMessage(action, currentScreen, flow.redirectTo);
    }
  }
  
  function handleSpecialActions(action) {
    if (action === 'save' && currentScreen === 'add_task') {
      appData.update(data => {
        if (data.newTaskTitle.trim()) {
          data.tasks.push({
            id: Date.now(),
            text: data.newTaskTitle.trim(),
            description: data.newTaskDescription.trim(),
            priority: data.priority,
            completed: false,
            createdAt: new Date().toISOString()
          });
          data.newTaskTitle = '';
          data.newTaskDescription = '';
          data.priority = 'medium';
        }
        return data;
      });
    }
  }
  
  function navigateToScreen(newScreen) {
    // Add transition delay for smooth UX
    setTimeout(() => {
      currentScreen = newScreen;
    }, 150);
  }
  
  function sendTrinityMessage(action, from, to) {
    const trinityMessage = {
      type: 'TRINITY_ACTION',
      action: action,
      from: from,
      to: to,
      timestamp: new Date().toISOString(),
      framework: 'svelte'
    };
    
    console.log('🎨 Svelte Trinity Message:', trinityMessage);
    
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(trinityMessage, '*');
    }
  }
  
  // Get current component
  $: CurrentComponent = components[currentScreen];
</script>

<main class="app-main">
  {#if CurrentComponent}
    {#key currentScreen}
      <div class="screen-wrapper" in:fade="{{ duration: 300 }}">
        <svelte:component 
          this={CurrentComponent} 
          onAction={handleAction}
          data={$appData}
        />
      </div>
    {/key}
  {/if}
</main>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    overflow: hidden;
  }
  
  .app-main {
    width: 100vw;
    height: 100vh;
    position: relative;
  }
  
  .screen-wrapper {
    width: 100%;
    height: 100%;
  }
  
  :global(.btn-primary) {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.1));
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: white;
    padding: 1rem 2rem;
    border-radius: 16px;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }
  
  :global(.btn-primary:hover) {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.2));
  }
  
  :global(.btn-secondary) {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
    padding: 1rem 2rem;
    border-radius: 16px;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }
  
  :global(.btn-secondary:hover) {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.3);
  }
  
  :global(.btn-icon) {
    font-size: 1.2em;
  }
</style>
    `;
  }

  /**
   * Generate modern styles with animations
   */
  generateModernStyles() {
    // Styles are now embedded in components for better organization
  }

  /**
   * Create complete Svelte app optimized for iPhone 12 dimensions
   */
  generateCompleteSvelteApp() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=390, height=844, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <title>APML Compiled Svelte App</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            -webkit-tap-highlight-color: transparent;
        }
        
        html, body {
            width: 390px;
            height: 844px;
            max-width: 390px;
            max-height: 844px;
            overflow: hidden;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            position: fixed;
            top: 0;
            left: 0;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            font-size: 14px;
            line-height: 1.4;
        }
        
        #app {
            width: 390px;
            height: 844px;
            max-width: 390px;
            max-height: 844px;
            position: absolute;
            top: 0;
            left: 0;
            overflow: hidden;
        }
        
        .loading {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 390px;
            height: 844px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-align: center;
        }
        
        .spinner {
            width: 32px;
            height: 32px;
            border: 2px solid rgba(255,255,255,0.3);
            border-top: 2px solid white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 1rem;
        }
        
        @keyframes spin { 
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .loading h3 {
            font-size: 1rem;
            margin-bottom: 0.5rem;
        }
        
        .loading p {
            font-size: 0.875rem;
            opacity: 0.8;
        }
    </style>
</head>
<body>
    <div id="app">
        <div class="loading">
            <div>
                <div class="spinner"></div>
                <h3>🎨 Compiling Svelte App</h3>
                <p>Optimized for iPhone 12</p>
            </div>
        </div>
    </div>
    
    <script type="module">
        // iPhone 12 optimized Svelte runtime
        ${this.generateiPhoneOptimizedRuntime()}
    </script>
</body>
</html>`;
  }

  /**
   * Generate iPhone 12 optimized runtime (390x844px)
   */
  generateiPhoneOptimizedRuntime() {
    return this.generateSvelteRuntime();
  }

  /**
   * Generate simplified Svelte-like runtime for iframe
   */
  generateSvelteRuntime() {
    // Generate dynamic flows from the parsed APML instead of hardcoded ones
    const dynamicFlows = this.generateDynamicFlows();
    
    return `
        // Simplified Svelte-like runtime
        let currentScreen = 'welcome_screen';
        let appData = {
            tasks: [],
            newTaskTitle: '',
            newTaskDescription: '',
            priority: 'medium'
        };
        
        // Dynamic flows from parsed APML specification
        const flows = ${JSON.stringify(dynamicFlows, null, 8)};
        
        function handleAction(action) {
            console.log('🎯 BUTTON CLICKED:', action, 'from screen:', currentScreen);
            console.log('🔍 Available flows for', currentScreen, ':', flows[currentScreen]);
            console.log('🏗️ All available screens:', Object.keys(flows));
            
            const flow = flows[currentScreen] && flows[currentScreen][action];
            console.log('🎯 Found flow:', flow);
            
            if (flow) {
                // Handle special actions
                if (action === 'save' && currentScreen === 'add_task') {
                    const input = document.querySelector('#taskInput');
                    if (input && input.value.trim()) {
                        appData.tasks.push({
                            id: Date.now(),
                            text: input.value.trim(),
                            completed: false
                        });
                        input.value = '';
                    }
                }
                
                // Navigate with animation
                const currentEl = document.querySelector(\`.\${currentScreen}\`);
                const targetEl = document.querySelector(\`.\${flow.redirectTo}\`);
                
                if (currentEl && targetEl) {
                    console.log('🔄 Switching from', currentScreen, 'to', flow.redirectTo);
                    console.log('📱 Current element:', currentEl);
                    console.log('📱 Target element:', targetEl);
                    
                    currentEl.style.transform = 'translateX(-100%)';
                    currentEl.style.opacity = '0';
                    
                    setTimeout(() => {
                        currentEl.style.display = 'none';
                        targetEl.style.display = 'flex';
                        targetEl.style.transform = 'translateX(100%)';
                        targetEl.style.opacity = '0';
                        
                        requestAnimationFrame(() => {
                            targetEl.style.transition = 'all 0.4s ease';
                            targetEl.style.transform = 'translateX(0)';
                            targetEl.style.opacity = '1';
                        });
                        
                        currentScreen = flow.redirectTo;
                        console.log('✅ Screen switched to:', currentScreen);
                        updateContent();
                    }, 200);
                } else {
                    console.error('❌ Screen elements not found!', {
                        currentEl: !!currentEl,
                        targetEl: !!targetEl,
                        currentScreen,
                        targetScreen: flow.redirectTo
                    });
                }
                
                // Send to parent (fix: send correct from screen)
                const fromScreen = currentScreen;
                if (window.parent) {
                    window.parent.postMessage({
                        type: 'TRINITY_ACTION',
                        action: action,
                        from: fromScreen,
                        to: flow.redirectTo,
                        timestamp: new Date().toISOString(),
                        framework: 'svelte'
                    }, '*');
                }
            }
        }
        
        function updateContent() {
            if (currentScreen === 'task_list') {
                const container = document.querySelector('.tasks-container');
                if (container) {
                    if (appData.tasks.length === 0) {
                        container.innerHTML = '<div class="empty-state">✨ No tasks yet. Create your first one!</div>';
                    } else {
                        container.innerHTML = appData.tasks.map(task => \`
                            <div class="task-item">
                                <input type="checkbox" \${task.completed ? 'checked' : ''} />
                                <span>\${task.text}</span>
                            </div>
                        \`).join('');
                    }
                }
            }
        }
        
        // Initialize beautiful app
        setTimeout(() => {
            document.getElementById('app').innerHTML = \`
                <div class="app-container">
                    <div class="screen welcome_screen active">
                        <!-- Top Status Bar -->
                        <div class="app-header">
                            <div class="header-title">Simple To-Do</div>
                            <div class="header-actions">
                                <button class="header-btn">⚙️</button>
                            </div>
                        </div>
                        
                        <div class="screen-content">
                            <div class="hero-section">
                                <div class="hero-icon">✨</div>
                                <h1>Welcome to Simple To-Do</h1>
                                <p>Beautiful task management made simple</p>
                                <div class="features">
                                    <span class="feature">🎨 Beautiful</span>
                                    <span class="feature">⚡ Fast</span>
                                    <span class="feature">📱 Mobile</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="screen-actions">
                            <button class="btn-primary" onclick="handleAction('get_started')">
                                <span>🚀</span> Get Started
                            </button>
                        </div>
                        
                        <!-- PWA Bottom Navigation -->
                        <div class="bottom-nav">
                            <button class="nav-item active" onclick="handleAction('nav_home')">
                                <span class="nav-icon">🏠</span>
                                <span class="nav-label">Home</span>
                            </button>
                            <button class="nav-item" onclick="handleAction('nav_tasks')">
                                <span class="nav-icon">📋</span>
                                <span class="nav-label">Tasks</span>
                            </button>
                            <button class="nav-item" onclick="handleAction('nav_add')">
                                <span class="nav-icon">➕</span>
                                <span class="nav-label">Add</span>
                            </button>
                            <button class="nav-item">
                                <span class="nav-icon">📊</span>
                                <span class="nav-label">Stats</span>
                            </button>
                        </div>
                    </div>
                    
                    <div class="screen task_list">
                        <div class="app-header">
                            <div class="header-title">My Tasks</div>
                            <div class="header-actions">
                                <button class="header-btn">🔍</button>
                                <button class="header-btn">⚙️</button>
                            </div>
                        </div>
                        
                        <div class="screen-content">
                            <div class="list-header">
                                <div class="task-count">
                                    <span class="count">\${appData.tasks.length}</span>
                                    <span>tasks</span>
                                </div>
                            </div>
                            <div class="tasks-container"></div>
                        </div>
                        
                        <div class="bottom-nav">
                            <button class="nav-item" onclick="handleAction('nav_home')">
                                <span class="nav-icon">🏠</span>
                                <span class="nav-label">Home</span>
                            </button>
                            <button class="nav-item active">
                                <span class="nav-icon">📋</span>
                                <span class="nav-label">Tasks</span>
                            </button>
                            <button class="nav-item" onclick="handleAction('nav_add')">
                                <span class="nav-icon">➕</span>
                                <span class="nav-label">Add</span>
                            </button>
                            <button class="nav-item">
                                <span class="nav-icon">📊</span>
                                <span class="nav-label">Stats</span>
                            </button>
                        </div>
                    </div>
                    
                    <div class="screen add_task">
                        <div class="app-header">
                            <div class="header-title">Add New Task</div>
                            <div class="header-actions">
                                <button class="header-btn" onclick="handleAction('cancel')">✕</button>
                            </div>
                        </div>
                        
                        <div class="screen-content">
                            <div class="form-container">
                                <div class="form-group">
                                    <label>Task Description</label>
                                    <input type="text" id="taskInput" placeholder="What needs to be done?" />
                                </div>
                            </div>
                        </div>
                        
                        <div class="screen-actions">
                            <button class="btn-primary" onclick="handleAction('save')">
                                <span>💾</span> Save Task
                            </button>
                        </div>
                        
                        <div class="bottom-nav">
                            <button class="nav-item" onclick="handleAction('nav_home')">
                                <span class="nav-icon">🏠</span>
                                <span class="nav-label">Home</span>
                            </button>
                            <button class="nav-item" onclick="handleAction('nav_tasks')">
                                <span class="nav-icon">📋</span>
                                <span class="nav-label">Tasks</span>
                            </button>
                            <button class="nav-item active">
                                <span class="nav-icon">➕</span>
                                <span class="nav-label">Add</span>
                            </button>
                            <button class="nav-item">
                                <span class="nav-icon">📊</span>
                                <span class="nav-label">Stats</span>
                            </button>
                        </div>
                    </div>
                </div>
                
                <style>
                    .app-container {
                        width: 390px;
                        height: 844px;
                        max-width: 390px;
                        max-height: 844px;
                        position: absolute;
                        top: 0;
                        left: 0;
                        overflow: hidden;
                        border-radius: 41px;
                    }
                    
                    .screen {
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 390px;
                        height: 844px;
                        max-width: 390px;
                        max-height: 844px;
                        display: none;
                        flex-direction: column;
                        padding: 0;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        transition: all 0.4s ease;
                        overflow: hidden;
                        box-sizing: border-box;
                        border-radius: 41px;
                    }
                    
                    .screen.active {
                        display: flex;
                    }
                    
                    .app-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 0.75rem 1rem;
                        background: rgba(255, 255, 255, 0.1);
                        backdrop-filter: blur(20px);
                        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                        flex-shrink: 0;
                        height: 50px;
                        box-sizing: border-box;
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        z-index: 10;
                        border-radius: 41px 41px 0 0;
                    }
                    
                    .header-title {
                        font-size: 1rem;
                        font-weight: 700;
                        color: white;
                    }
                    
                    .header-actions {
                        display: flex;
                        gap: 0.5rem;
                    }
                    
                    .header-btn {
                        background: rgba(255, 255, 255, 0.15);
                        border: none;
                        border-radius: 8px;
                        padding: 0.5rem;
                        color: white;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        backdrop-filter: blur(10px);
                    }
                    
                    .header-btn:hover {
                        background: rgba(255, 255, 255, 0.25);
                        transform: scale(1.05);
                    }
                    
                    .screen-content {
                        flex: 1;
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        align-items: center;
                        text-align: center;
                        min-height: 0;
                        padding: 1rem;
                        overflow-y: auto;
                        margin-top: 50px;
                        margin-bottom: 65px;
                        height: calc(844px - 50px - 65px);
                        box-sizing: border-box;
                    }
                    
                    .bottom-nav {
                        display: flex;
                        background: rgba(255, 255, 255, 0.1);
                        backdrop-filter: blur(20px);
                        border-top: 1px solid rgba(255, 255, 255, 0.1);
                        padding: 0.5rem 0;
                        flex-shrink: 0;
                        height: 55px;
                        box-sizing: border-box;
                        position: absolute;
                        bottom: 0;
                        left: 0;
                        right: 0;
                        border-radius: 0 0 41px 41px;
                        z-index: 20;
                    }
                    
                    .nav-item {
                        flex: 1;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 0.25rem;
                        background: none;
                        border: none;
                        color: rgba(255, 255, 255, 0.7);
                        cursor: pointer;
                        transition: all 0.3s ease;
                        padding: 0.5rem;
                        border-radius: 8px;
                        margin: 0 0.25rem;
                    }
                    
                    .nav-item:hover {
                        background: rgba(255, 255, 255, 0.1);
                        color: white;
                        transform: translateY(-2px);
                    }
                    
                    .nav-item.active {
                        color: white;
                        background: rgba(255, 255, 255, 0.15);
                    }
                    
                    .nav-icon {
                        font-size: 1.25rem;
                        margin-bottom: 0.25rem;
                    }
                    
                    .nav-label {
                        font-size: 0.75rem;
                        font-weight: 500;
                    }
                    
                    .hero-section {
                        max-width: 400px;
                    }
                    
                    .hero-icon {
                        font-size: 3rem;
                        margin-bottom: 0.75rem;
                        animation: bounce 2s infinite;
                    }
                    
                    @keyframes bounce {
                        0%, 100% { transform: translateY(0); }
                        50% { transform: translateY(-10px); }
                    }
                    
                    .hero-section h1 {
                        font-size: 1.5rem;
                        font-weight: 700;
                        margin-bottom: 0.5rem;
                        background: linear-gradient(45deg, #fff, #e0e7ff);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        line-height: 1.2;
                    }
                    
                    .hero-section p {
                        font-size: 0.9rem;
                        opacity: 0.9;
                        margin-bottom: 1rem;
                    }
                    
                    .features {
                        display: flex;
                        gap: 0.5rem;
                        flex-wrap: wrap;
                        justify-content: center;
                    }
                    
                    .feature {
                        padding: 0.25rem 0.75rem;
                        background: rgba(255, 255, 255, 0.15);
                        border-radius: 15px;
                        font-size: 0.75rem;
                        backdrop-filter: blur(5px);
                        animation: fadeInUp 0.8s ease-out;
                    }
                    
                    @keyframes fadeInUp {
                        from {
                            opacity: 0;
                            transform: translateY(20px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }
                    
                    .list-header {
                        margin-bottom: 2rem;
                    }
                    
                    .list-header h1 {
                        font-size: 2rem;
                        margin-bottom: 0.5rem;
                    }
                    
                    .task-count {
                        display: flex;
                        align-items: baseline;
                        gap: 0.5rem;
                        justify-content: center;
                    }
                    
                    .count {
                        font-size: 2rem;
                        font-weight: 700;
                    }
                    
                    .tasks-container {
                        width: 100%;
                        max-width: 400px;
                        min-height: 200px;
                        display: flex;
                        flex-direction: column;
                        gap: 1rem;
                    }
                    
                    .task-item {
                        display: flex;
                        align-items: center;
                        gap: 1rem;
                        padding: 1rem;
                        background: rgba(255, 255, 255, 0.15);
                        border-radius: 12px;
                        backdrop-filter: blur(10px);
                        animation: slideIn 0.5s ease-out;
                    }
                    
                    @keyframes slideIn {
                        from {
                            opacity: 0;
                            transform: translateX(-20px);
                        }
                        to {
                            opacity: 1;
                            transform: translateX(0);
                        }
                    }
                    
                    .empty-state {
                        text-align: center;
                        padding: 3rem;
                        font-size: 1.1rem;
                        opacity: 0.8;
                    }
                    
                    .form-header {
                        margin-bottom: 2rem;
                    }
                    
                    .form-header h1 {
                        font-size: 2rem;
                        margin-bottom: 0.5rem;
                    }
                    
                    .form-container {
                        width: 100%;
                        max-width: 400px;
                    }
                    
                    .form-group {
                        margin-bottom: 1.5rem;
                    }
                    
                    .form-group label {
                        display: block;
                        font-weight: 600;
                        margin-bottom: 0.5rem;
                        text-transform: uppercase;
                        font-size: 0.9rem;
                        letter-spacing: 0.5px;
                    }
                    
                    .form-group input {
                        width: 100%;
                        padding: 1rem;
                        background: rgba(255, 255, 255, 0.15);
                        border: 1px solid rgba(255, 255, 255, 0.3);
                        border-radius: 12px;
                        color: white;
                        font-size: 1rem;
                        backdrop-filter: blur(10px);
                        transition: all 0.3s ease;
                    }
                    
                    .form-group input:focus {
                        outline: none;
                        border-color: rgba(255, 255, 255, 0.6);
                        box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.1);
                    }
                    
                    .form-group input::placeholder {
                        color: rgba(255, 255, 255, 0.6);
                    }
                    
                    .screen-actions {
                        display: flex;
                        flex-direction: column;
                        gap: 0.75rem;
                        padding: 1rem;
                        flex-shrink: 0;
                        position: absolute;
                        bottom: 70px;
                        left: 1rem;
                        right: 1rem;
                        z-index: 5;
                    }
                    
                    .btn-primary, .btn-secondary {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 0.5rem;
                        padding: 0.875rem 1.5rem;
                        border: none;
                        border-radius: 12px;
                        font-size: 1rem;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        backdrop-filter: blur(10px);
                    }
                    
                    .btn-primary {
                        background: linear-gradient(135deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.1));
                        border: 1px solid rgba(255, 255, 255, 0.3);
                        color: white;
                    }
                    
                    .btn-primary:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
                        background: linear-gradient(135deg, rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.2));
                    }
                    
                    .btn-secondary {
                        background: rgba(255, 255, 255, 0.1);
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        color: white;
                    }
                    
                    .btn-secondary:hover {
                        background: rgba(255, 255, 255, 0.2);
                    }
                </style>
            \`;
            
            updateContent();
            
            // Initialize first screen
            const firstScreen = document.querySelector('.welcome_screen');
            if (firstScreen) {
                firstScreen.style.animation = 'fadeIn 0.8s ease-out';
            }
        }, 1000);
        
        // Make function global
        window.handleAction = handleAction;
        
        // Debug: Log all flows for debugging
        console.log('🎯 ALL FLOWS LOADED:', flows);
        console.log('🎯 Current screen:', currentScreen);
    `;
  }

  // Helper methods
  createFlowMap(logicFlows) {
    const flowMap = {};
    if (logicFlows && Array.isArray(logicFlows)) {
      logicFlows.forEach(flow => {
        if (!flowMap[flow.fromInterface]) {
          flowMap[flow.fromInterface] = {};
        }
        flowMap[flow.fromInterface][flow.trigger] = flow;
      });
    }
    return flowMap;
  }

  formatComponentName(interfaceName) {
    return interfaceName.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join('');
  }

  getButtonClass(action) {
    return action === 'get_started' || action === 'save' ? 'btn-primary' : 'btn-secondary';
  }

  formatActionText(action) {
    const actionMap = {
      'get_started': 'Get Started',
      'add_task': 'Add New Task',
      'save': 'Save Task',
      'cancel': 'Cancel'
    };
    return actionMap[action] || action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  getActionIcon(action) {
    const iconMap = {
      'get_started': '🚀',
      'add_task': '➕',
      'save': '💾',
      'cancel': '↩️'
    };
    return iconMap[action] || '🔘';
  }

  /**
   * Generate dynamic flows from parsed APML specification
   */
  generateDynamicFlows() {
    if (!this.apmlSpec || !this.apmlSpec.parsedFlows) {
      console.warn('⚠️ No parsed flows available, using fallback flows');
      return this.getFallbackFlows();
    }

    const flows = {};
    const { parsedFlows, stateNodes } = this.apmlSpec;

    console.log('🔄 Generating dynamic flows from APML:', parsedFlows);

    // Initialize flow objects for all interfaces
    stateNodes.forEach(node => {
      if (node.interfaceName) {
        flows[node.interfaceName] = {};
      }
    });

    // Map logic flows to interfaces
    parsedFlows.forEach(flow => {
      const fromInterface = flow.fromInterface;
      const trigger = flow.trigger;
      
      if (fromInterface && trigger && flow.redirectTo) {
        if (!flows[fromInterface]) {
          flows[fromInterface] = {};
        }
        
        flows[fromInterface][trigger] = {
          redirectTo: flow.redirectTo,
          actionName: flow.actionName || flow.processName,
          flowType: 'process'
        };
      }
    });

    // Add PWA navigation flows for all screens
    Object.keys(flows).forEach(screenName => {
      // Add universal navigation flows
      flows[screenName]['nav_home'] = { redirectTo: 'welcome_screen', flowType: 'navigation' };
      flows[screenName]['nav_tasks'] = { redirectTo: 'task_list', flowType: 'navigation' };
      flows[screenName]['nav_add'] = { redirectTo: 'add_task', flowType: 'navigation' };
    });

    console.log('✨ Generated dynamic flows:', flows);
    
    // Validate that get_started flow exists
    if (flows.welcome_screen && flows.welcome_screen.get_started) {
      console.log('✅ get_started flow found:', flows.welcome_screen.get_started);
    } else {
      console.log('❌ get_started flow MISSING!');
      console.log('welcome_screen flows:', flows.welcome_screen);
    }
    
    return flows;
  }

  /**
   * Fallback flows if APML parsing fails
   */
  getFallbackFlows() {
    return {
      'welcome_screen': { 
        'get_started': { redirectTo: 'task_list', flowType: 'process' },
        'nav_tasks': { redirectTo: 'task_list', flowType: 'navigation' },
        'nav_add': { redirectTo: 'add_task', flowType: 'navigation' }
      },
      'task_list': { 
        'add_task': { redirectTo: 'add_task', flowType: 'process' },
        'nav_home': { redirectTo: 'welcome_screen', flowType: 'navigation' },
        'nav_add': { redirectTo: 'add_task', flowType: 'navigation' }
      },
      'add_task': { 
        'save': { redirectTo: 'task_list', flowType: 'process' },
        'cancel': { redirectTo: 'task_list', flowType: 'process' },
        'nav_home': { redirectTo: 'welcome_screen', flowType: 'navigation' },
        'nav_tasks': { redirectTo: 'task_list', flowType: 'navigation' }
      }
    };
  }
}
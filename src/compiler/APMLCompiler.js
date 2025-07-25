/**
 * APML Real-Time Compiler
 * Converts APML specifications into actual running HTML/CSS/JS web applications
 */

export class APMLCompiler {
  constructor() {
    this.compiledHTML = '';
    this.compiledCSS = '';
    this.compiledJS = '';
  }

  /**
   * Main compilation method - converts APML to running web app
   */
  compile(apmlSpec) {
    console.log('🔧 APML Compiler: Starting compilation...');
    
    const { stateNodes, logicFlows, dataModels } = apmlSpec;
    
    // Generate the three core files
    this.compiledHTML = this.generateHTML(stateNodes);
    this.compiledCSS = this.generateCSS();
    this.compiledJS = this.generateJavaScript(stateNodes, logicFlows, dataModels);
    
    // Create complete web app
    const completeApp = this.generateCompleteApp();
    
    console.log('✅ APML Compiler: Compilation complete!');
    return {
      html: completeApp,
      css: this.compiledCSS,
      js: this.compiledJS,
      dataUrl: `data:text/html;charset=utf-8,${encodeURIComponent(completeApp)}`
    };
  }

  /**
   * Generate HTML structure from APML state nodes
   */
  generateHTML(stateNodes) {
    let html = '<div id="app-container">';
    
    stateNodes.forEach((node, index) => {
      const isFirst = index === 0;
      const screenClass = isFirst ? 'screen active' : 'screen';
      
      html += `
        <div class="${screenClass}" id="${node.interfaceName}" data-interface="${node.interfaceName}">
          <div class="screen-header">
            <h1>${this.formatTitle(node.interfaceName)}</h1>
            ${this.generateSubtitle(node)}
          </div>
          <div class="screen-content">
            ${this.generateScreenContent(node)}
          </div>
          <div class="screen-actions">
            ${this.generateActions(node)}
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    return html;
  }

  /**
   * Generate screen-specific content
   */
  generateScreenContent(node) {
    switch (node.interfaceName) {
      case 'welcome_screen':
        return `
          <div class="welcome-content">
            <div class="icon">📋</div>
            <p class="description">Simple, powerful task management</p>
          </div>
        `;
      case 'task_list':
        return `
          <div class="task-list">
            <div class="empty-state">
              <p>Your task list is empty</p>
            </div>
            <div class="tasks" id="tasks-container">
              <!-- Tasks will be added here dynamically -->
            </div>
          </div>
        `;
      case 'add_task':
        return `
          <div class="form-container">
            <div class="form-group">
              <label for="taskInput">Task Description</label>
              <input type="text" id="taskInput" placeholder="Enter task description" />
            </div>
          </div>
        `;
      default:
        return `<div class="default-content">Interface: ${node.interfaceName}</div>`;
    }
  }

  /**
   * Generate action buttons for each screen
   */
  generateActions(node) {
    if (!node.availableActions) return '';
    
    return node.availableActions.map(action => {
      const buttonClass = action === 'get_started' || action === 'save' ? 'btn-primary' : 'btn-secondary';
      const buttonText = this.formatActionText(action);
      
      return `<button class="${buttonClass}" data-action="${action}" onclick="handleAction('${action}')">${buttonText}</button>`;
    }).join('');
  }

  /**
   * Generate comprehensive CSS for the app
   */
  generateCSS() {
    return `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: #f8fafc;
        overflow: hidden;
      }

      #app-container {
        width: 100vw;
        height: 100vh;
        position: relative;
      }

      .screen {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: white;
        display: none;
        flex-direction: column;
        padding: 2rem;
        opacity: 0;
        transform: translateX(100px);
        transition: all 0.3s ease;
      }

      .screen.active {
        display: flex;
        opacity: 1;
        transform: translateX(0);
      }

      .screen-header {
        margin-bottom: 2rem;
        text-align: center;
      }

      .screen-header h1 {
        font-size: 2rem;
        font-weight: 700;
        color: #1a202c;
        margin-bottom: 0.5rem;
      }

      .screen-header p {
        color: #718096;
        font-size: 1rem;
      }

      .screen-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
      }

      .welcome-content .icon {
        font-size: 4rem;
        margin-bottom: 1rem;
      }

      .welcome-content .description {
        color: #4a5568;
        font-size: 1.1rem;
        margin-bottom: 2rem;
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
        color: #374151;
        margin-bottom: 0.5rem;
      }

      .form-group input {
        width: 100%;
        padding: 0.75rem;
        border: 2px solid #e5e7eb;
        border-radius: 0.5rem;
        font-size: 1rem;
        transition: border-color 0.2s;
      }

      .form-group input:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
      }

      .screen-actions {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        margin-top: 2rem;
      }

      .btn-primary {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        padding: 1rem 2rem;
        border-radius: 0.75rem;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      }

      .btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
      }

      .btn-secondary {
        background: #f7fafc;
        color: #4a5568;
        border: 2px solid #e2e8f0;
        padding: 1rem 2rem;
        border-radius: 0.75rem;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .btn-secondary:hover {
        background: #edf2f7;
        border-color: #cbd5e0;
      }

      .task-list {
        width: 100%;
        max-width: 400px;
      }

      .empty-state {
        text-align: center;
        color: #9ca3af;
        font-style: italic;
        padding: 2rem;
      }

      .task-item {
        display: flex;
        align-items: center;
        padding: 1rem;
        background: #f9fafb;
        border-radius: 0.5rem;
        margin-bottom: 0.5rem;
      }

      .task-item input[type="checkbox"] {
        margin-right: 0.75rem;
        width: 1.25rem;
        height: 1.25rem;
      }

      .task-item span {
        flex: 1;
        color: #374151;
      }

      .task-item span.completed {
        text-decoration: line-through;
        color: #9ca3af;
      }
    `;
  }

  /**
   * Generate JavaScript for app functionality
   */
  generateJavaScript(stateNodes, logicFlows, dataModels) {
    const flowMap = this.createFlowMap(logicFlows);
    const stateMap = this.createStateMap(stateNodes);
    
    return `
      // APML Compiled Application Runtime
      let currentState = '${stateNodes[0]?.interfaceName || 'welcome_screen'}';
      let appData = {
        tasks: []
      };

      // Flow mapping from APML logic flows
      const flows = ${JSON.stringify(flowMap, null, 2)};
      
      // State mapping from APML state nodes  
      const states = ${JSON.stringify(stateMap, null, 2)};

      // Trinity action logger for parent window communication
      function logTrinityAction(action, from, to) {
        const trinityLog = {
          type: 'TRINITY_ACTION',
          action: action,
          from: from, 
          to: to,
          timestamp: new Date().toISOString()
        };
        
        console.log('🎯 Trinity Action:', trinityLog);
        
        // Send to parent window (Trinity Visualizer)
        if (window.parent && window.parent !== window) {
          window.parent.postMessage(trinityLog, '*');
        }
      }

      // Main action handler
      function handleAction(action) {
        console.log(\`🎬 Action triggered: \${action} from \${currentState}\`);
        
        const flow = flows[currentState] && flows[currentState][action];
        if (flow) {
          logTrinityAction(action, currentState, flow.redirectTo);
          
          // Handle special actions
          if (action === 'save' && currentState === 'add_task') {
            const taskInput = document.getElementById('taskInput');
            if (taskInput && taskInput.value.trim()) {
              appData.tasks.push({
                id: Date.now(),
                text: taskInput.value.trim(),
                completed: false
              });
              taskInput.value = '';
            }
          }
          
          // Navigate to new state
          navigateToState(flow.redirectTo);
        } else {
          console.warn(\`No flow found for action: \${action} from \${currentState}\`);
        }
      }

      // State navigation
      function navigateToState(newState) {
        const currentScreen = document.getElementById(currentState);
        const newScreen = document.getElementById(newState);
        
        if (currentScreen && newScreen) {
          currentScreen.classList.remove('active');
          newScreen.classList.add('active');
          currentState = newState;
          
          // Update dynamic content
          updateScreenContent(newState);
          
          console.log(\`📱 Navigated to: \${newState}\`);
        }
      }

      // Update screen content dynamically
      function updateScreenContent(state) {
        if (state === 'task_list') {
          updateTaskList();
        }
      }

      // Update task list display
      function updateTaskList() {
        const container = document.getElementById('tasks-container');
        const emptyState = document.querySelector('.empty-state');
        
        if (appData.tasks.length === 0) {
          emptyState.style.display = 'block';
          container.innerHTML = '';
        } else {
          emptyState.style.display = 'none';
          container.innerHTML = appData.tasks.map(task => \`
            <div class="task-item">
              <input type="checkbox" \${task.completed ? 'checked' : ''} 
                     onchange="toggleTask(\${task.id})">
              <span class="\${task.completed ? 'completed' : ''}">\${task.text}</span>
            </div>
          \`).join('');
        }
      }

      // Toggle task completion
      function toggleTask(taskId) {
        const task = appData.tasks.find(t => t.id === taskId);
        if (task) {
          task.completed = !task.completed;
          updateTaskList();
          logTrinityAction('toggle_task', currentState, currentState);
        }
      }

      // Initialize app
      document.addEventListener('DOMContentLoaded', function() {
        console.log('🚀 APML Compiled App Initialized');
        updateScreenContent(currentState);
      });

      // Global function exposure
      window.handleAction = handleAction;
      window.navigateToState = navigateToState;
      window.toggleTask = toggleTask;
    `;
  }

  /**
   * Create a complete HTML document
   */
  generateCompleteApp() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>APML Compiled App</title>
    <style>${this.compiledCSS}</style>
</head>
<body>
    ${this.compiledHTML}
    <script>${this.compiledJS}</script>
</body>
</html>`;
  }

  // Helper methods
  createFlowMap(logicFlows) {
    const flowMap = {};
    logicFlows.forEach(flow => {
      if (!flowMap[flow.fromInterface]) {
        flowMap[flow.fromInterface] = {};
      }
      flowMap[flow.fromInterface][flow.trigger] = flow;
    });
    return flowMap;
  }

  createStateMap(stateNodes) {
    const stateMap = {};
    stateNodes.forEach(node => {
      stateMap[node.interfaceName] = node;
    });
    return stateMap;
  }

  formatTitle(interfaceName) {
    switch (interfaceName) {
      case 'welcome_screen': return 'Welcome to Simple To-Do';
      case 'task_list': return 'My Tasks';
      case 'add_task': return 'Add New Task';
      default: return interfaceName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  }

  generateSubtitle(node) {
    switch (node.interfaceName) {
      case 'welcome_screen': return '<p>Organize your tasks efficiently</p>';
      case 'task_list': return '<p>Manage your daily tasks</p>';
      case 'add_task': return '<p>Create a new task</p>';
      default: return '';
    }
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
}
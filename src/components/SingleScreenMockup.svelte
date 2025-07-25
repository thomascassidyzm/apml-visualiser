<script>
  export let currentSceneData = null;
  export let selectedNode = null;
  
  import { visualizationState } from '../stores/apmlStore.js';
  
  let currentScreen = null;
  
  // React to selected node changes from Trinity diagram
  $: if (selectedNode) {
    currentScreen = selectedNode;
  } else if (currentSceneData && currentSceneData.stateNodes && currentSceneData.stateNodes.length > 0) {
    // Default to first screen if none selected
    currentScreen = currentSceneData.stateNodes[0];
  }
  
  // Listen to visualization state changes
  $: if ($visualizationState.currentNode) {
    currentScreen = $visualizationState.currentNode;
  }
  
  function handleScreenAction(action) {
    console.log(`🎯 USER ACTION: ${action} on ${currentScreen.interfaceName}`);
    
    // Log the Trinity DO action
    const trinityAction = {
      type: 'USER_DO',
      from: currentScreen.interfaceName,
      action: action,
      timestamp: new Date().toISOString(),
      description: `User clicked ${action} on ${currentScreen.interfaceName}`
    };
    
    // Find the logic flow for this action
    if (currentSceneData.logicFlows) {
      const flow = currentSceneData.logicFlows.find(f => 
        f.fromInterface === currentScreen.interfaceName && 
        (f.trigger === action || f.trigger === `${action}_button`)
      );
      
      if (flow) {
        console.log(`⚡ PROCESS: ${flow.processName || flow.actionName} - redirecting to ${flow.redirectTo}`);
        
        // Find the target screen
        const targetScreen = currentSceneData.stateNodes.find(n => 
          n.interfaceName === flow.redirectTo
        );
        
        if (targetScreen) {
          const previousScreen = currentScreen;
          currentScreen = targetScreen;
          
          console.log(`📱 SHOW: Now displaying ${targetScreen.interfaceName}`);
          
          // Update visualization state with full Trinity logging
          visualizationState.update(state => ({
            ...state,
            currentNode: targetScreen,
            pathHistory: [...(state.pathHistory || []), trinityAction],
            lastAction: trinityAction,
            actionLog: [...(state.actionLog || []), {
              ...trinityAction,
              processFlow: flow,
              resultingShow: targetScreen.interfaceName
            }]
          }));
        }
      } else {
        console.log(`❌ No flow found for action: ${action} from ${currentScreen.interfaceName}`);
      }
    }
  }
  
  function getScreenContent(screen) {
    if (!screen) return null;
    
    // Parse screen content based on interface name
    const content = {
      title: screen.interfaceName.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      elements: screen.availableActions || [],
      description: screen.displayContent || `${screen.interfaceName} Interface`
    };
    
    // Add screen-specific content
    switch (screen.interfaceName) {
      case 'welcome_screen':
        content.title = 'Welcome to Simple To-Do';
        content.subtitle = 'Organize your tasks efficiently';
        content.primaryAction = 'get_started';
        content.primaryActionText = 'Get Started';
        break;
        
      case 'task_list':
        content.title = 'My Tasks';
        content.subtitle = 'Your task list is empty';
        content.primaryAction = 'add_task';
        content.primaryActionText = 'Add New Task';
        content.items = [
          { id: 1, title: 'Sample task', completed: false },
          { id: 2, title: 'Another task', completed: true }
        ];
        break;
        
      case 'add_task':
        content.title = 'Add New Task';
        content.subtitle = 'Create a new task';
        content.primaryAction = 'save';
        content.primaryActionText = 'Save Task';
        content.secondaryAction = 'cancel';
        content.secondaryActionText = 'Cancel';
        content.hasInput = true;
        content.inputPlaceholder = 'Enter task description';
        break;
    }
    
    return content;
  }
  
  $: screenContent = getScreenContent(currentScreen);
</script>

<div class="single-screen-mockup">
  {#if currentScreen && screenContent}
    <!-- Phone Frame -->
    <div class="phone-frame">
      <div class="phone-screen">
        <!-- Status Bar -->
        <div class="status-bar">
          <div class="flex justify-between items-center">
            <div class="flex items-center space-x-1">
              <div class="w-1 h-1 bg-gray-900 rounded-full"></div>
              <div class="w-1 h-1 bg-gray-900 rounded-full"></div>
              <div class="w-1 h-1 bg-gray-900 rounded-full"></div>
              <span class="text-xs font-medium ml-2">Verizon</span>
            </div>
            <div class="text-xs font-medium">9:41 AM</div>
            <div class="flex items-center space-x-1">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2 17h20l-10-15L2 17z"/>
              </svg>
              <span class="text-xs">100%</span>
            </div>
          </div>
        </div>
        
        <!-- Screen Content -->
        <div class="screen-content">
          <!-- Header -->
          <div class="screen-header">
            <h1 class="screen-title">{screenContent.title}</h1>
            {#if screenContent.subtitle}
              <p class="screen-subtitle">{screenContent.subtitle}</p>
            {/if}
          </div>
          
          <!-- Main Content Area -->
          <div class="screen-main">
            {#if screenContent.hasInput}
              <!-- Input Form (Add Task Screen) -->
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Task Description</label>
                  <input 
                    type="text" 
                    placeholder={screenContent.inputPlaceholder}
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            {:else if screenContent.items}
              <!-- Task List -->
              <div class="space-y-2">
                {#each screenContent.items as item}
                  <div class="flex items-center p-3 bg-gray-50 rounded-lg">
                    <input 
                      type="checkbox" 
                      checked={item.completed}
                      class="w-5 h-5 text-blue-600 rounded mr-3"
                    />
                    <span class="flex-1 {item.completed ? 'line-through text-gray-500' : 'text-gray-900'}">{item.title}</span>
                  </div>
                {/each}
              </div>
            {:else}
              <!-- Welcome Screen Content -->
              <div class="text-center py-8">
                <div class="text-6xl mb-4">📋</div>
                <p class="text-gray-600 mb-6">Simple, powerful task management</p>
              </div>
            {/if}
          </div>
          
          <!-- Action Buttons -->
          <div class="screen-actions">
            {#if screenContent.primaryAction}
              <button 
                class="primary-action-btn"
                on:click={() => handleScreenAction(screenContent.primaryAction)}
              >
                {screenContent.primaryActionText}
              </button>
            {/if}
            
            {#if screenContent.secondaryAction}
              <button 
                class="secondary-action-btn"
                on:click={() => handleScreenAction(screenContent.secondaryAction)}
              >
                {screenContent.secondaryActionText}
              </button>
            {/if}
          </div>
        </div>
        
        <!-- Home Indicator -->
        <div class="home-indicator"></div>
      </div>
    </div>
    
    <!-- Screen Info -->
    <div class="screen-info">
      <div class="text-center">
        <div class="text-sm font-medium text-gray-700 mb-1">Current Screen</div>
        <div class="text-xs text-gray-500">{currentScreen.interfaceName}</div>
        {#if screenContent.primaryAction}
          <div class="text-xs text-blue-600 mt-2">
            Tap "{screenContent.primaryActionText}" to continue
          </div>
        {/if}
      </div>
    </div>
  {:else}
    <!-- Empty State -->
    <div class="phone-frame">
      <div class="phone-screen">
        <div class="flex items-center justify-center h-full text-gray-400">
          <div class="text-center">
            <div class="text-4xl mb-4">📱</div>
            <div class="text-sm">No screen selected</div>
            <div class="text-xs mt-2">Click a node in the Trinity diagram</div>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .single-screen-mockup {
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100%;
    padding: 1rem;
  }
  
  .phone-frame {
    width: 390px;  /* iPhone 12 width */
    height: 844px; /* iPhone 12 height */
    background: linear-gradient(145deg, #2d3748, #1a202c);
    border-radius: 47px; /* iPhone 12 border radius */
    padding: 6px;
    box-shadow: 
      0 20px 25px -5px rgba(0, 0, 0, 0.1),
      0 10px 10px -5px rgba(0, 0, 0, 0.04),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }
  
  .phone-screen {
    width: 100%;
    height: 100%;
    background: white;
    border-radius: 41px; /* iPhone 12 screen border radius */
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06);
  }
  
  .status-bar {
    padding: 12px 20px 8px;
    background: white;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    font-weight: 600;
    color: #1a202c;
  }
  
  .screen-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 24px 20px 20px;
  }
  
  .screen-header {
    margin-bottom: 24px;
  }
  
  .screen-title {
    font-size: 28px;
    font-weight: 700;
    color: #1a202c;
    margin-bottom: 8px;
    text-align: center;
  }
  
  .screen-subtitle {
    font-size: 16px;
    color: #718096;
    text-align: center;
  }
  
  .screen-main {
    flex: 1;
    overflow-y: auto;
  }
  
  .screen-actions {
    padding-top: 24px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .primary-action-btn {
    width: 100%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 12px;
    padding: 16px 24px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }
  
  .primary-action-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
  }
  
  .secondary-action-btn {
    width: 100%;
    background: #f7fafc;
    color: #4a5568;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    padding: 14px 24px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .secondary-action-btn:hover {
    background: #edf2f7;
    border-color: #cbd5e0;
  }
  
  .home-indicator {
    width: 140px;
    height: 4px;
    background: #e2e8f0;
    border-radius: 2px;
    margin: 12px auto 8px;
  }
  
  .screen-info {
    margin-top: 16px;
    text-align: center;
  }
  
  /* Custom scrollbar for screen content */
  .screen-main::-webkit-scrollbar {
    width: 4px;
  }
  
  .screen-main::-webkit-scrollbar-track {
    background: rgba(237, 242, 247, 0.5);
    border-radius: 2px;
  }
  
  .screen-main::-webkit-scrollbar-thumb {
    background: rgba(160, 174, 192, 0.5);
    border-radius: 2px;
  }
</style>
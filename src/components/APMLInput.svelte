<script>
  import { push } from 'svelte-spa-router';
  import { apmlStore } from '../stores/apmlStore.js';
  
  let apmlContent = '';
  let isProcessing = false;
  
  const exampleAPML = `app SimpleToDoApp:
  title: "Simple To-Do Application"
  description: "A basic task management app"
  version: "1.0.0"
  apml_specification_version: "0.9.0"

data Task:
  id: unique_id
  title: text required
  completed: boolean default false
  created_at: timestamp auto

data User:
  id: unique_id
  name: text required
  email: email required

interface welcome_screen:
  show welcome_panel:
    title: "Welcome to Simple To-Do"
    subtitle: "Manage your tasks efficiently"
    get_started_button:
      text: "Get Started"
    login_button:
      text: "Login"

interface task_list:
  show main_panel:
    title: "My Tasks"
    add_task_button:
      text: "Add New Task"
    task_items:
      for each task in Task:
        task_card:
          title: task.title
          complete_button:
            text: "Complete"
          delete_button:
            text: "Delete"

interface add_task:
  show task_form:
    title: "Add New Task"
    task_input:
      placeholder: "Enter task title..."
      required: true
    save_button:
      text: "Save Task"
    cancel_button:
      text: "Cancel"

logic task_management:
  process create_task:
    when user clicks add_task_button:
      redirect to add_task
      
  process save_new_task:
    when user submits task_form:
      validate task_input
      if input_valid:
        create Task with title: task_input
        redirect to task_list
      else:
        show error_message: "Please enter a task title"
        
  process complete_task:
    when user clicks complete_button:
      update task.completed to true
      refresh task_list
      
  process delete_task:
    when user clicks delete_button:
      delete task
      refresh task_list

logic navigation:
  process start_app:
    when user clicks get_started_button:
      redirect to task_list
      
  process cancel_add_task:
    when user clicks cancel_button:
      redirect to task_list`;

  async function handleSubmit() {
    if (!apmlContent.trim()) return;
    
    isProcessing = true;
    
    try {
      const success = apmlStore.parseAPML(apmlContent);
      
      if (success) {
        // Navigate to dashboard
        push('/dashboard');
      } else {
        alert('APML parsing failed. Please check your specification.');
      }
    } catch (error) {
      alert('Error processing APML: ' + error.message);
    } finally {
      isProcessing = false;
    }
  }
  
  function loadExample() {
    apmlContent = exampleAPML;
  }
</script>

<div class="py-8">
  <!-- Hero Section -->
  <div class="text-center mb-12">
    <div class="inline-flex items-center px-4 py-2 bg-blue-50 rounded-full text-blue-700 text-sm font-medium mb-4">
      <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
      </svg>
      Real-time APML Visualization
    </div>
    <h2 class="text-4xl font-bold text-gray-900 mb-4">
      Transform APML into Interactive Mockups
    </h2>
    <p class="text-xl text-gray-600 max-w-3xl mx-auto">
      Paste your APML specification below and watch it come to life with interactive mobile mockups, 
      beautiful flow diagrams, and automated validation testing.
    </p>
  </div>

  <!-- Main Input Panel -->
  <div class="max-w-6xl mx-auto">
    <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
      <!-- Panel Header -->
      <div class="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6">
        <h3 class="text-2xl font-bold text-white mb-2">APML Specification Input</h3>
        <p class="text-blue-100">
          Paste your complete APML specification to generate interactive visualizations
        </p>
      </div>
      
      <!-- Panel Content -->
      <div class="p-8">
        <div class="space-y-6">
          <!-- APML Textarea -->
          <div class="relative">
            <label for="apml-input" class="block text-sm font-semibold text-gray-700 mb-3">
              APML Specification
              <span class="text-gray-400 font-normal ml-2">Supports APML v0.9.0</span>
            </label>
            <div class="relative">
              <textarea 
                id="apml-input"
                bind:value={apmlContent}
                class="textarea-field font-mono text-sm min-h-[400px] bg-gray-50 focus:bg-white"
                placeholder="Paste your complete APML specification here...

Example:
app MyApp:
  title: 'My Application'
  version: '1.0.0'
  apml_specification_version: '0.9.0'

data User:
  id: unique_id
  name: text required

interface welcome:
  show welcome_panel:
    title: 'Welcome!'
    continue_button:
      text: 'Get Started'

logic navigation:
  process start_app:
    when user clicks continue_button:
      redirect to dashboard"
              ></textarea>
              
              <!-- Character Counter -->
              <div class="absolute bottom-3 right-3 text-xs text-gray-400 bg-white px-2 py-1 rounded">
                {apmlContent.length} characters
              </div>
            </div>
          </div>
          
          <!-- Action Buttons -->
          <div class="flex flex-col sm:flex-row gap-4">
            <button 
              on:click={loadExample}
              class="btn-secondary flex items-center justify-center"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              Load Example To-Do App
            </button>
            
            <button 
              on:click={handleSubmit}
              disabled={!apmlContent.trim() || isProcessing}
              class="btn-primary flex-1 flex items-center justify-center"
            >
              {#if isProcessing}
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing APML...
              {:else}
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
                Parse & Visualize
              {/if}
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Feature Cards -->
    <div class="grid md:grid-cols-3 gap-6 mt-12">
      <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
          <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/>
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Interactive Mobile Mockup</h3>
        <p class="text-gray-600 text-sm">
          Real-time mobile mockups that update as you interact with them. See your APML come to life instantly.
        </p>
      </div>
      
      <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
          <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3v10"/>
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Beautiful Flow Diagrams</h3>
        <p class="text-gray-600 text-sm">
          Automatic Mermaid flow diagrams with dark themes, colored nodes, and animated transitions.
        </p>
      </div>
      
      <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
          <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Automated Validation</h3>
        <p class="text-gray-600 text-sm">
          Test all possible user paths automatically. Mathematical validation of your APML specifications.
        </p>
      </div>
    </div>
  </div>
</div>
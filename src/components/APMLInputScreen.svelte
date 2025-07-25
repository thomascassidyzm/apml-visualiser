<script>
  import { push } from 'svelte-spa-router';
  import { apmlStore } from '../stores/apmlStore.js';
  import { navigationController } from '../stores/trinityFlowStore.js';
  
  let apmlContent = '';
  let isLoading = false;
  let parseStatus = null;
  let errorMessage = '';
  
  // Example APML content for quick testing
  const exampleAPML = `app ZenflowAdvanced:
  title: "Zenflow Advanced - Project Management System"
  description: "Sophisticated project management with advanced workflows"
  version: "3.0.0"
  apml_specification_version: "0.9.0"
  
  theme:
    primary_gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%)"
    glass_morphism: true
    animation_style: "cubic-bezier(0.16, 1, 0.3, 1)"
    device_frame: "iphone_12"
    dimensions: "390x844"

data Project:
  id: unique_id
  title: text required
  subtitle: text
  description: text
  icon: emoji
  status: enum["planning", "active", "completed", "on_hold"]
  progress: percentage
  task_count: integer
  team_size: integer
  days_remaining: integer
  priority: enum["high", "medium", "low"]
  team_avatars: array<text>
  budget: currency
  created_at: timestamp auto
  updated_at: timestamp auto

data Task:
  id: unique_id
  project_id: foreign_key<Project>
  title: text required
  description: text
  status: enum["todo", "in_progress", "review", "completed"]
  priority: enum["high", "medium", "low"]
  assignee: text
  due_date: date
  estimated_hours: integer
  actual_hours: integer
  created_at: timestamp auto

data User:
  id: unique_id
  name: text required
  email: email required unique
  avatar: text
  role: enum["admin", "manager", "developer", "designer"]
  department: text
  joined_at: timestamp auto

data Team:
  id: unique_id
  name: text required
  description: text
  members: array<User>
  projects: array<Project>
  created_at: timestamp auto

interface dashboard:
  layout: "mobile_app"
  animation: "fade_in_up"
  
  show status_bar:
    time: dynamic_time
    icons: ["signal", "wifi", "battery"]
    style: "glass_dark"
    
  show app_header:
    title: "Zenflow Advanced"
    style: "glass_morphism_header"
    gradient_text: true
    
    navigation_menu:
      icon: "☰"
      style: "glass_button"
      
    notifications_button:
      icon: "🔔"
      style: "glass_button"
      badge_count: dynamic_notifications
      
    search_button:
      icon: "🔍"
      style: "glass_button"
        
  show main_content:
    scroll: "vertical"
    padding: "20px 24px"
    
    quick_stats:
      layout: "horizontal_cards"
      gap: "12px"
      
      active_projects:
        number: dynamic_active_projects
        label: "Active Projects"
        icon: "📊"
        style: "stat_card_primary"
        
      pending_tasks:
        number: dynamic_pending_tasks
        label: "Pending Tasks"
        icon: "📋" 
        style: "stat_card_warning"
        
      team_members:
        number: dynamic_team_size
        label: "Team Members"
        icon: "👥"
        style: "stat_card_success"
    
    projects_section:
      title: "Recent Projects"
      layout: "vertical_list"
      
      for each project in Project.recent(5):
        project_card:
          style: "glass_morphism_card"
          hover_effect: "lift_and_glow"
          
          project_header:
            layout: "horizontal_space_between"
            
            project_info:
              project_title: project.title
              project_subtitle: project.subtitle
              project_icon: project.icon
              
            project_status:
              status_badge: project.status
              progress_ring: project.progress
              
          project_meta:
            layout: "horizontal_flex"
            gap: "16px"
            
            task_info:
              completed_tasks: project.completed_tasks
              total_tasks: project.task_count
              
            team_info:
              team_avatars: project.team_avatars
              team_size: project.team_size
              
            timeline_info:
              days_remaining: project.days_remaining
              due_date: project.due_date
  
  show floating_actions:
    create_project_fab:
      icon: "+"
      style: "primary_fab"
      position: "bottom_right"
      
    quick_task_fab:
      icon: "✓"
      style: "secondary_fab"
      position: "bottom_right_offset"

interface project_detail:
  layout: "mobile_app"
  animation: "slide_in_right"
  
  show status_bar:
    time: dynamic_time
    icons: ["signal", "wifi", "battery"]
    style: "glass_dark"
    
  show app_header:
    style: "glass_morphism_header"
    
    back_button:
      icon: "←"
      style: "glass_button"
      
    project_info:
      title: current_project.title
      subtitle: current_project.status
      style: "header_title_large"
      
    actions_menu:
      icon: "⋮"
      style: "glass_button"
      
  show main_content:
    scroll: "vertical"
    padding: "20px 24px"
    
    project_overview:
      style: "glass_section"
      
      progress_section:
        title: "Project Progress"
        progress_chart: current_project.progress
        milestone_indicators: current_project.milestones
        
      team_section:
        title: "Team Members"
        team_grid: current_project.team_members
        add_member_button: "+"
        
    task_management:
      title: "Tasks"
      style: "glass_section"
      
      task_filters:
        layout: "horizontal_chips"
        filters: ["All", "Todo", "In Progress", "Review", "Done"]
        
      task_list:
        for each task in current_project.tasks:
          task_item:
            task_title: task.title
            task_status: task.status
            assignee_avatar: task.assignee
            due_date: task.due_date
            priority_indicator: task.priority

interface create_project:
  layout: "mobile_app"
  animation: "scale_up"
  
  show status_bar:
    time: dynamic_time
    icons: ["signal", "wifi", "battery"]
    style: "glass_dark"
    
  show app_header:
    title: "New Project"
    style: "glass_morphism_header"
    
    cancel_button:
      icon: "✕"
      style: "glass_button"
      
  show main_content:
    scroll: "vertical"
    padding: "20px 24px"
    
    project_form:
      style: "glass_form"
      
      basic_info_section:
        title: "Project Details"
        
        project_name_input:
          label: "Project Name"
          placeholder: "Enter project name..."
          required: true
          
        project_description_input:
          label: "Description"
          type: "textarea"
          placeholder: "Describe your project..."
          
        project_icon_selector:
          label: "Project Icon"
          options: ["📱", "💻", "🎨", "🚀", "⚡", "🔥"]
          
      settings_section:
        title: "Project Settings"
        
        priority_selector:
          label: "Priority"
          options: ["High", "Medium", "Low"]
          default: "Medium"
          
        due_date_picker:
          label: "Due Date"
          type: "date"
          
        budget_input:
          label: "Budget (Optional)"
          type: "currency"
          
      team_section:
        title: "Team Assignment"
        
        team_selector:
          label: "Assign Team"
          type: "multi_select"
          options: User.all()
          
  show screen_actions:
    layout: "bottom_fixed"
    
    create_button:
      text: "Create Project"
      icon: "💾"
      style: "primary_button_full_width"

interface team_management:
  layout: "mobile_app"
  animation: "slide_in_left"
  
  show status_bar:
    time: dynamic_time
    icons: ["signal", "wifi", "battery"]
    style: "glass_dark"
    
  show app_header:
    title: "Team Management"
    style: "glass_morphism_header"
    
    back_button:
      icon: "←"
      style: "glass_button"
      
    add_member_button:
      icon: "+"
      style: "glass_button"
      
  show main_content:
    scroll: "vertical"
    padding: "20px 24px"
    
    team_overview:
      style: "glass_section"
      
      team_stats:
        total_members: Team.current().members.count
        active_projects: Team.current().active_projects.count
        completion_rate: Team.current().completion_rate
        
    members_list:
      for each member in Team.current().members:
        member_card:
          style: "glass_member_card"
          
          member_avatar: member.avatar
          member_name: member.name
          member_role: member.role
          member_department: member.department
          current_tasks: member.active_tasks.count
          
interface settings:
  layout: "mobile_app"
  animation: "fade_in"
  
  show status_bar:
    time: dynamic_time
    icons: ["signal", "wifi", "battery"]
    style: "glass_dark"
    
  show app_header:
    title: "Settings"
    style: "glass_morphism_header"
    
    back_button:
      icon: "←"
      style: "glass_button"
      
  show main_content:
    scroll: "vertical"
    padding: "20px 24px"
    
    user_profile:
      style: "glass_section"
      
      profile_header:
        user_avatar: current_user.avatar
        user_name: current_user.name
        user_role: current_user.role
        
    app_preferences:
      style: "glass_section"
      
      theme_selector:
        label: "App Theme"
        options: ["System", "Light", "Dark", "Glass"]
        
      notification_settings:
        push_notifications: toggle
        email_notifications: toggle
        project_updates: toggle

logic navigation:
  process show_dashboard:
    when user clicks dashboard_nav:
      redirect to dashboard
      animation: "slide_left"
      
  process show_project_detail:
    when user clicks project_card:
      set current_project to clicked_project
      load_project_data(current_project.id)
      redirect to project_detail
      animation: "slide_right"
      
  process go_back_to_dashboard:
    when user clicks back_button:
      redirect to dashboard
      animation: "slide_left"
      
  process show_create_project:
    when user clicks create_project_fab:
      initialize_project_form()
      redirect to create_project
      animation: "scale_up"
      
  process cancel_create_project:
    when user clicks cancel_button:
      clear_form_data()
      redirect to dashboard
      animation: "scale_down"
      
  process create_new_project:
    when user clicks create_button:
      validate_project_data()
      save_project_to_database()
      send_team_notifications()
      redirect to project_detail
      animation: "slide_right"
      
  process show_team_management:
    when user clicks navigation_menu:
      redirect to team_management
      animation: "slide_in_left"
      
  process show_settings:
    when user clicks settings_nav:
      redirect to settings
      animation: "fade_in"

logic project_management:
  process load_project_data:
    when project_selected:
      fetch_project_details(project_id)
      load_team_members(project_id)
      calculate_progress_metrics(project_id)
      load_recent_tasks(project_id)
      
  process update_project_progress:
    when task_status_changed:
      recalculate_project_progress()
      update_timeline_estimates()
      notify_stakeholders()
      
  process assign_task:
    when user assigns task:
      validate_team_member_availability()
      create_task_assignment()
      send_assignment_notification()
      update_workload_metrics()

logic team_collaboration:
  process add_team_member:
    when user clicks add_member_button:
      show_member_selection_modal()
      validate_permissions()
      
  process send_project_invitation:
    when member_selected:
      generate_invitation_link()
      send_email_invitation()
      create_notification_entry()
      
  process update_member_role:
    when role_changed:
      validate_role_permissions()
      update_member_access()
      log_role_change_audit()`;

  function loadExampleAPML() {
    apmlContent = exampleAPML;
  }
  
  function clearAPML() {
    apmlContent = '';
    parseStatus = null;
    errorMessage = '';
  }
  
  async function parseAndNavigate() {
    if (!apmlContent.trim()) {
      errorMessage = 'Please enter APML content';
      return;
    }
    
    isLoading = true;
    parseStatus = null;
    errorMessage = '';
    
    try {
      console.log('🚀 Parsing APML content...');
      
      // Parse the APML using the store
      const success = apmlStore.parseAPML(apmlContent);
      
      if (success) {
        console.log('✅ APML parsed successfully');
        parseStatus = 'success';
        
        // Navigate to the visualizer dashboard after brief delay
        setTimeout(() => {
          push('/dashboard');
        }, 1000);
        
      } else {
        console.error('❌ APML parsing failed');
        parseStatus = 'error';
        errorMessage = 'APML parsing failed. Please check your syntax.';
      }
    } catch (error) {
      console.error('❌ APML parsing error:', error);
      parseStatus = 'error';
      errorMessage = error.message || 'An error occurred while parsing APML';
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="apml-input-screen">
  <!-- Header -->
  <div class="input-header">
    <div class="header-content">
      <div class="app-logo">
        <div class="logo-icon">🚀</div>
        <div class="logo-text">
          <h1>APML Development Engine</h1>
          <p>Paste your APML specification to begin</p>
        </div>
      </div>
      
      <div class="header-actions">
        <button class="action-btn secondary" on:click={loadExampleAPML}>
          📋 Load Example
        </button>
        <button class="action-btn secondary" on:click={clearAPML}>
          🗑️ Clear
        </button>
      </div>
    </div>
  </div>
  
  <!-- Main Input Area -->
  <div class="input-main">
    <div class="input-container">
      <div class="input-label">
        <p>Paste your APML code below and click "Parse & Visualize" to see the Trinity Flow</p>
      </div>
      
      <div class="editor-container" class:has-content={apmlContent.trim()}>
        <textarea
          bind:value={apmlContent}
          placeholder="app MyApp:
  title: &quot;My Application&quot;
  description: &quot;A beautiful APML application&quot;
  
data User:
  id: unique_id
  name: text required
  
interface dashboard:
  layout: &quot;mobile_app&quot;
  
  show welcome_message:
    text: &quot;Welcome to MyApp&quot;

logic navigation:
  process show_dashboard:
    when user clicks home:
      redirect to dashboard"
          class="apml-editor"
          rows="20"
        ></textarea>
        
        {#if apmlContent.trim()}
          <div class="editor-stats">
            <span class="stat">
              📝 {apmlContent.split('\n').length} lines
            </span>
            <span class="stat">
              🔤 {apmlContent.length} characters
            </span>
          </div>
        {/if}
      </div>
      
      <!-- Status Messages -->
      {#if parseStatus || errorMessage}
        <div class="status-message" class:success={parseStatus === 'success'} class:error={parseStatus === 'error'}>
          {#if parseStatus === 'success'}
            <div class="status-icon">✅</div>
            <div class="status-text">
              <strong>Success!</strong> APML parsed successfully. Navigating to visualizer...
            </div>
          {:else if errorMessage}
            <div class="status-icon">❌</div>
            <div class="status-text">
              <strong>Error:</strong> {errorMessage}
            </div>
          {/if}
        </div>
      {/if}
      
      <!-- Parse Button -->
      <div class="parse-section">
        <button 
          class="parse-btn"
          class:loading={isLoading}
          on:click={parseAndNavigate}
          disabled={isLoading || !apmlContent.trim()}
        >
          {#if isLoading}
            <div class="loading-spinner"></div>
            <span>Parsing APML...</span>
          {:else}
            <span>🚀</span>
            <span>Parse & Visualize</span>
          {/if}
        </button>
        
        <p class="parse-help">
          This will parse your APML specification and generate the Trinity Flow visualization
        </p>
      </div>
    </div>
  </div>
</div>

<style>
  .apml-input-screen {
    min-height: 100vh;
    background: linear-gradient(135deg, #1f2937 0%, #374151 20%, #581c87 40%, #4b5563 60%, #6b21a8 80%, #1f2937 100%);
    background-size: 400% 400%;
    animation: gradientShift 20s ease infinite;
    display: flex;
    flex-direction: column;
  }
  
  @keyframes gradientShift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  
  .input-header {
    padding: 2rem;
    background: rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  }
  
  .header-content {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  
  .app-logo {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  .logo-icon {
    font-size: 3rem;
  }
  
  .logo-text h1 {
    font-size: 2rem;
    font-weight: 700;
    color: white;
    margin: 0;
  }
  
  .logo-text p {
    color: rgba(255, 255, 255, 0.8);
    margin: 0;
    font-size: 1rem;
  }
  
  .header-actions {
    display: flex;
    gap: 1rem;
  }
  
  .action-btn {
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    border: none;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .action-btn.secondary {
    background: rgba(255, 255, 255, 0.15);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.3);
  }
  
  .action-btn.secondary:hover {
    background: rgba(255, 255, 255, 0.25);
  }
  
  .input-main {
    flex: 1;
    padding: 3rem 2rem;
    display: flex;
    justify-content: center;
  }
  
  .input-container {
    width: 100%;
    max-width: 900px;
  }
  
  .input-label {
    text-align: center;
    margin-bottom: 2rem;
  }
  
  .input-label h3 {
    font-size: 2rem;
    font-weight: 700;
    color: white;
    margin: 0 0 0.5rem 0;
  }
  
  .input-label p {
    color: rgba(255, 255, 255, 0.8);
    font-size: 1.1rem;
    margin: 0;
  }
  
  .editor-container {
    position: relative;
    margin-bottom: 2rem;
  }
  
  .apml-editor {
    width: 100%;
    min-height: 400px;
    padding: 1.5rem;
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    background: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(10px);
    color: white;
    font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', monospace;
    font-size: 14px;
    line-height: 1.5;
    resize: vertical;
    transition: all 0.3s ease;
  }
  
  .apml-editor:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.4);
    background: rgba(0, 0, 0, 0.4);
  }
  
  .apml-editor::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
  
  .editor-stats {
    position: absolute;
    bottom: 1rem;
    right: 1rem;
    display: flex;
    gap: 1rem;
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.6);
  }
  
  .stat {
    background: rgba(0, 0, 0, 0.3);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
  }
  
  .status-message {
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 2rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    animation: fadeIn 0.3s ease-out;
  }
  
  .status-message.success {
    background: rgba(16, 185, 129, 0.2);
    border: 1px solid rgba(16, 185, 129, 0.4);
  }
  
  .status-message.error {
    background: rgba(239, 68, 68, 0.2);
    border: 1px solid rgba(239, 68, 68, 0.4);
  }
  
  .status-icon {
    font-size: 1.5rem;
  }
  
  .status-text {
    color: white;
    flex: 1;
  }
  
  .parse-section {
    text-align: center;
  }
  
  .parse-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 2rem;
    font-size: 1.1rem;
    font-weight: 600;
    border: none;
    border-radius: 12px;
    background: linear-gradient(135deg, #06b6d4, #3b82f6);
    color: white;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(6, 182, 212, 0.3);
  }
  
  .parse-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(6, 182, 212, 0.4);
  }
  
  .parse-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
  
  .parse-btn.loading {
    background: linear-gradient(135deg, #6b7280, #9ca3af);
  }
  
  .loading-spinner {
    width: 1rem;
    height: 1rem;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .parse-help {
    color: rgba(255, 255, 255, 0.7);
    margin-top: 1rem;
    font-size: 0.9rem;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
</style>
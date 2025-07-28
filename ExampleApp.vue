<template>
  <SimulatorCore
    :app-title="appTitle"
    :flow-title="flowTitle"
    :chat-title="chatTitle"
    :screens="screens"
    :initial-screen-id="initialScreenId"
    :show-bottom-nav="true"
    :show-technical-details="showTechnicalDetails"
    @screen-changed="handleScreenChanged"
    @action-triggered="handleActionTriggered"
    @message-sent="handleMessageSent"
    @flow-updated="handleFlowUpdated"
  >
    <!-- Flow Diagram Slot -->
    <template #flow-diagram>
      <FlowDiagram
        :nodes="flowNodes"
        :connections="flowConnections"
        :current-node-id="currentScreenId"
        theme="dark"
        :animated="true"
        @node-clicked="handleNodeClicked"
      />
    </template>
    
    <!-- Screen Content Slot -->
    <template #screen-content="{ screen, layout }">
      <SimulatorLayouts
        :screen="screen"
        :layout="layout"
        @action-triggered="handleActionTriggered"
      />
    </template>
    
    <!-- Technical Details Slot -->
    <template #technical-details="{ currentScreen, history }">
      <div class="space-y-4">
        <!-- Message Sequence -->
        <div v-if="messageSequence.length > 0" class="p-3 bg-gray-700 rounded">
          <h4 class="text-sm font-medium mb-2 text-orange-400">Message Sequence</h4>
          <div class="space-y-1 max-h-32 overflow-y-auto">
            <div
              v-for="message in messageSequence"
              :key="message.id"
              :class="[
                'p-2 rounded text-xs',
                message.type === 'user-to-app' ? 'bg-green-900 text-green-100' :
                message.type === 'app-to-app' ? 'bg-purple-900 text-purple-100' :
                'bg-blue-900 text-blue-100'
              ]"
            >
              <div class="font-medium">{{ message.type.replace('-', ' → ').toUpperCase() }}</div>
              <div>{{ message.content }}</div>
            </div>
          </div>
        </div>
        
        <!-- Current Screen Info -->
        <div class="p-3 bg-gray-700 rounded">
          <h4 class="text-sm font-medium mb-2 text-blue-400">Screen Info</h4>
          <div class="text-xs text-gray-300 space-y-1">
            <div><strong>ID:</strong> {{ currentScreen?.id }}</div>
            <div><strong>Layout:</strong> {{ currentScreen?.layout }}</div>
            <div><strong>Actions:</strong> {{ currentScreen?.actions?.length || 0 }}</div>
            <div><strong>History:</strong> {{ history.length }} screens</div>
          </div>
        </div>
        
        <!-- Performance Stats -->
        <div class="p-3 bg-gray-700 rounded">
          <h4 class="text-sm font-medium mb-2 text-green-400">Stats</h4>
          <div class="text-xs text-gray-300 space-y-1">
            <div><strong>Total Screens:</strong> {{ screens.length }}</div>
            <div><strong>Interactions:</strong> {{ totalInteractions }}</div>
            <div><strong>Avg. Time:</strong> {{ averageTimePerScreen }}s</div>
          </div>
        </div>
      </div>
    </template>
  </SimulatorCore>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import SimulatorCore from './SimulatorCore.vue'
import SimulatorLayouts from './SimulatorLayouts.vue'
import FlowDiagram from './FlowDiagram.vue'

// App Configuration
const appTitle = ref('ProjectChat Simulator')
const flowTitle = ref('App Flow Diagram')
const chatTitle = ref('ADE Assistant')
const initialScreenId = ref('chat_screen')
const showTechnicalDetails = ref(false)

// State
const currentScreenId = ref('chat_screen')
const messageSequence = ref([])
const totalInteractions = ref(0)
const screenTimes = ref({})
const lastScreenChangeTime = ref(Date.now())

// Sample Screens Data
const screens = ref([
  {
    id: 'chat_screen',
    name: 'Chat',
    description: 'Team communication hub',
    layout: 'chat',
    isHome: true,
    showInBottomNav: true,
    navIcon: '💬',
    navLabel: 'Chat',
    actions: [
      {
        id: 'send_message',
        label: 'Send Message',
        description: 'Send a message to the team',
        color: 'blue',
        nextScreenId: null
      },
      {
        id: 'view_tasks',
        label: 'View Tasks',
        description: 'Check current tasks',
        color: 'green',
        nextScreenId: 'task_screen'
      }
    ],
    data: {
      messages: {
        received: { text: "Hey team! How's the new feature coming along?", sender: "Sarah", time: "2:30 PM" },
        sent: { text: "Almost done! Just finishing up the tests.", sender: "You", time: "2:32 PM" }
      }
    }
  },
  {
    id: 'task_screen',
    name: 'Tasks',
    description: 'Manage your tasks and deadlines',
    layout: 'task',
    showInBottomNav: true,
    navIcon: '✅',
    navLabel: 'Tasks',
    actions: [
      {
        id: 'create_task',
        label: 'Create New Task',
        description: 'Add a new task to the project',
        color: 'green',
        nextScreenId: 'task_creation'
      },
      {
        id: 'view_files',
        label: 'View Project Files',
        description: 'Browse shared files',
        color: 'purple',
        nextScreenId: 'file_screen'
      }
    ],
    data: {
      tasks: [
        { id: 1, title: "Complete wireframes v2", dueDate: "Due tomorrow", completed: true },
        { id: 2, title: "Review backend API", dueDate: "Due Friday", completed: false },
        { id: 3, title: "Update project timeline", dueDate: "Due next week", completed: false }
      ]
    }
  },
  {
    id: 'file_screen',
    name: 'Files',
    description: 'Browse and manage project files',
    layout: 'file',
    showInBottomNav: true,
    navIcon: '📁',
    navLabel: 'Files',
    actions: [
      {
        id: 'upload_file',
        label: 'Upload New File',
        description: 'Share a new file with the team',
        color: 'purple',
        nextScreenId: 'file_upload'
      },
      {
        id: 'view_team',
        label: 'View Team',
        description: 'See who\'s online',
        color: 'indigo',
        nextScreenId: 'team_screen'
      }
    ],
    data: {
      files: [
        { id: 1, name: "wireframes-v2.sketch", size: "2.4 MB", icon: "🎨" },
        { id: 2, name: "api-documentation.pdf", size: "1.2 MB", icon: "📄" },
        { id: 3, name: "project-timeline.xlsx", size: "856 KB", icon: "📊" },
        { id: 4, name: "team-photos.zip", size: "15.3 MB", icon: "📸" }
      ]
    }
  },
  {
    id: 'team_screen',
    name: 'Team',
    description: 'View team members and their status',
    layout: 'team',
    showInBottomNav: true,
    navIcon: '👥',
    navLabel: 'Team',
    actions: [
      {
        id: 'invite_member',
        label: 'Invite Team Member',
        description: 'Add someone new to the project',
        color: 'indigo',
        nextScreenId: 'team_invitation'
      },
      {
        id: 'back_to_chat',
        label: 'Back to Chat',
        description: 'Return to the main conversation',
        color: 'blue',
        nextScreenId: 'chat_screen'
      }
    ],
    data: {
      teamMembers: [
        { id: 1, name: "Sarah Chen", initials: "SC", online: true },
        { id: 2, name: "Mike Johnson", initials: "MJ", online: false },
        { id: 3, name: "Emma Davis", initials: "ED", online: true },
        { id: 4, name: "Alex Rodriguez", initials: "AR", online: false }
      ]
    }
  },
  {
    id: 'task_creation',
    name: 'Create Task',
    description: 'Add a new task to the project',
    layout: 'form',
    actions: [
      {
        id: 'save_task',
        label: 'Save Task',
        color: 'orange',
        nextScreenId: 'task_screen'
      },
      {
        id: 'cancel',
        label: 'Cancel',
        color: 'gray',
        nextScreenId: 'task_screen'
      }
    ],
    data: {
      formFields: [
        { id: 1, type: "text", label: "Task Title", placeholder: "Enter task title..." },
        { id: 2, type: "textarea", label: "Description", placeholder: "Describe the task..." },
        { id: 3, type: "select", label: "Assign to", options: [
          { value: "sarah", label: "Sarah Chen" },
          { value: "mike", label: "Mike Johnson" },
          { value: "emma", label: "Emma Davis" }
        ]},
        { id: 4, type: "select", label: "Priority", options: [
          { value: "low", label: "Low" },
          { value: "medium", label: "Medium" },
          { value: "high", label: "High" }
        ]}
      ]
    }
  },
  {
    id: 'file_upload',
    name: 'Upload File',
    description: 'Share a new file with your team',
    layout: 'upload',
    actions: [
      {
        id: 'upload',
        label: 'Upload Files',
        color: 'teal',
        nextScreenId: 'file_screen'
      }
    ],
    data: {
      uploadText: {
        primary: "Drop files here or click to browse",
        secondary: "Supports images, documents, videos up to 50MB"
      }
    }
  },
  {
    id: 'team_invitation',
    name: 'Invite Member',
    description: 'Invite someone to join the project',
    layout: 'form',
    actions: [
      {
        id: 'send_invitation',
        label: 'Send Invitation',
        color: 'orange',
        nextScreenId: 'invitation_sent'
      }
    ],
    data: {
      formFields: [
        { id: 1, type: "text", label: "Email Address", placeholder: "colleague@company.com" },
        { id: 2, type: "text", label: "Full Name", placeholder: "Enter their name..." },
        { id: 3, type: "select", label: "Role", options: [
          { value: "member", label: "Team Member" },
          { value: "admin", label: "Project Admin" },
          { value: "viewer", label: "View Only" }
        ]}
      ]
    }
  },
  {
    id: 'invitation_sent',
    name: 'Invitation Sent',
    description: 'Your invitation has been sent successfully',
    layout: 'celebration',
    actions: [
      {
        id: 'back_to_team',
        label: 'Back to Team',
        color: 'green',
        nextScreenId: 'team_screen'
      }
    ],
    data: {
      celebrationText: {
        title: "Invitation Sent!",
        message: "Your team member will receive an email invitation shortly."
      }
    }
  }
])

// Flow diagram data
const flowNodes = computed(() => {
  return screens.value.map(screen => ({
    id: screen.id,
    name: screen.name,
    label: screen.name,
    type: screen.showInBottomNav ? 'main' : 'normal'
  }))
})

const flowConnections = computed(() => {
  const connections = []
  screens.value.forEach(screen => {
    if (screen.actions) {
      screen.actions.forEach(action => {
        if (action.nextScreenId) {
          connections.push({
            from: screen.id,
            to: action.nextScreenId,
            label: action.label
          })
        }
      })
    }
  })
  return connections
})

const averageTimePerScreen = computed(() => {
  const times = Object.values(screenTimes.value)
  if (times.length === 0) return 0
  const average = times.reduce((a, b) => a + b, 0) / times.length
  return Math.round(average / 1000 * 10) / 10 // Convert to seconds and round
})

// Event Handlers
const handleScreenChanged = ({ current, previous }) => {
  currentScreenId.value = current.id
  
  // Track time spent on previous screen
  if (previous) {
    const timeSpent = Date.now() - lastScreenChangeTime.value
    screenTimes.value[previous.id] = timeSpent
  }
  lastScreenChangeTime.value = Date.now()
  
  // Add to message sequence
  addToMessageSequence('app-to-user', `Screen loaded: ${current.name}`)
}

const handleActionTriggered = ({ action, currentScreen }) => {
  totalInteractions.value++
  
  // Add user action to sequence
  addToMessageSequence('user-to-app', action.label)
  
  // Simulate app processing
  setTimeout(() => {
    addToMessageSequence('app-to-app', `Processing: ${action.label}`)
  }, 300)
  
  // Show result
  setTimeout(() => {
    if (action.nextScreenId) {
      addToMessageSequence('app-to-user', `Navigating to ${getScreenName(action.nextScreenId)}`)
    } else {
      addToMessageSequence('app-to-user', `Action completed: ${action.label}`)
    }
  }, 800)
}

const handleMessageSent = (message) => {
  // Simulate intelligent responses
  setTimeout(() => {
    let response = generateIntelligentResponse(message.content)
    addToMessageSequence('assistant', response)
  }, 1000)
}

const handleFlowUpdated = ({ currentScreenId, history }) => {
  // Handle flow diagram updates if needed
  console.log('Flow updated:', { currentScreenId, history })
}

const handleNodeClicked = (nodeId) => {
  // Navigate to clicked node
  const screen = screens.value.find(s => s.id === nodeId)
  if (screen) {
    currentScreenId.value = nodeId
  }
}

// Helper functions
const addToMessageSequence = (type, content) => {
  messageSequence.value.push({
    id: Date.now() + Math.random(),
    type,
    content,
    timestamp: Date.now()
  })
  
  // Keep only last 20 messages
  if (messageSequence.value.length > 20) {
    messageSequence.value = messageSequence.value.slice(-20)
  }
}

const getScreenName = (screenId) => {
  const screen = screens.value.find(s => s.id === screenId)
  return screen ? screen.name : screenId
}

const generateIntelligentResponse = (userMessage) => {
  const message = userMessage.toLowerCase()
  
  if (message.includes('perfect') || message.includes('great') || message.includes('good')) {
    return '✨ Excellent! The design and flow are working well. Ready to proceed to the next phase?'
  } else if (message.includes('confusing') || message.includes('unclear') || message.includes('difficult')) {
    return '🤔 I understand. Let me help clarify the user flow. Would you like me to highlight the key interaction patterns?'
  } else if (message.includes('slow') || message.includes('performance')) {
    return '⚡ Performance is key! The current interactions are optimized, but we can explore further improvements.'
  } else if (message.includes('design') || message.includes('colors') || message.includes('style')) {
    return '🎨 The visual design follows modern iOS patterns. We can customize colors and styling while preserving the core interactions.'
  } else {
    return `Thanks for the feedback: "${userMessage}". The simulator helps validate user experience before development. What would you like to explore next?`
  }
}

// Toggle technical details
const toggleTechnicalDetails = () => {
  showTechnicalDetails.value = !showTechnicalDetails.value
}

// Expose methods for parent components
defineExpose({
  toggleTechnicalDetails,
  getCurrentScreen: () => screens.value.find(s => s.id === currentScreenId.value),
  getMessageSequence: () => messageSequence.value,
  resetSimulator: () => {
    currentScreenId.value = initialScreenId.value
    messageSequence.value = []
    totalInteractions.value = 0
    screenTimes.value = {}
  }
})

onMounted(() => {
  // Initialize with welcome message
  addToMessageSequence('app-to-user', 'Welcome to ProjectChat! Explore the app by interacting with the simulator.')
})
</script>

<style scoped>
/* Additional styling can be added here if needed */
</style>
# Beautiful App Simulator - Portable Components

This is a collection of beautiful, reusable Vue.js components extracted and enhanced from the ADE Railway simulator. Perfect for integrating sophisticated app simulation and visualization capabilities into any modern web application.

## 🌟 Key Features

### **SimulatorCore.vue** - The Main Container
- **70/30 Split Layout**: Flow diagram + chat (70%) | Device simulator (30%)
- **Dark Theme**: Professional gray-900 background with accent colors
- **Real iPhone Design**: Authentic iPhone 12 simulator (390x844px) with dynamic island
- **Interactive Chat**: Built-in assistant chat with smart responses
- **Screen History**: Full navigation history with back button support
- **Customizable**: Configurable titles, placeholders, and styling

### **SimulatorLayouts.vue** - Screen Templates
- **8+ Layout Types**: Chat, Task, File, Team, Form, Upload, Search, Celebration
- **Color-coded UIs**: Different color schemes for each layout type
- **Responsive Design**: Optimized for mobile-first experience
- **Interactive Elements**: Hover states, animations, and transitions
- **Data-driven**: Accepts custom data for each layout type

### **FlowDiagram.vue** - Interactive Flow Visualization
- **Mermaid Integration**: Automatic diagram generation from node/connection data
- **Real-time Updates**: Dynamic highlighting of current state
- **Zoom Controls**: Pan, zoom in/out, and reset functionality
- **Animated Transitions**: Smooth transitions between states
- **Click Handlers**: Interactive nodes and connections
- **Customizable Themes**: Dark/light theme support

### **ExampleApp.vue** - Complete Implementation
- **ProjectChat Demo**: Full example showing all capabilities
- **Smart Responses**: Context-aware chat assistant
- **Performance Tracking**: Screen time analytics and interaction counting
- **Technical Details**: Optional debug panel with sequence tracking
- **Modular Design**: Easy to customize and extend

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install vue@3 mermaid
```

### 2. Basic Usage
```vue
<template>
  <SimulatorCore
    app-title="My App Simulator"
    :screens="screens"
    initial-screen-id="home"
    @screen-changed="handleScreenChanged"
    @action-triggered="handleAction"
  >
    <template #flow-diagram>
      <FlowDiagram
        :nodes="flowNodes"
        :connections="flowConnections"
        :current-node-id="currentScreenId"
      />
    </template>
    
    <template #screen-content="{ screen, layout }">
      <SimulatorLayouts
        :screen="screen"
        :layout="layout"
        @action-triggered="handleAction"
      />
    </template>
  </SimulatorCore>
</template>

<script setup>
import SimulatorCore from './SimulatorCore.vue'
import SimulatorLayouts from './SimulatorLayouts.vue'
import FlowDiagram from './FlowDiagram.vue'

const screens = ref([
  {
    id: 'home',
    name: 'Home Screen',
    description: 'Welcome to the app',
    layout: 'default',
    isHome: true,
    actions: [
      {
        id: 'action1',
        label: 'Get Started',
        nextScreenId: 'main'
      }
    ]
  }
  // ... more screens
])

const flowNodes = computed(() => 
  screens.value.map(screen => ({
    id: screen.id,
    name: screen.name,
    type: screen.isHome ? 'main' : 'normal'
  }))
)

const flowConnections = computed(() => {
  // Generate connections from screen actions
})
</script>
```

## 📱 Screen Data Structure

### Basic Screen Object
```javascript
{
  id: 'unique_screen_id',
  name: 'Display Name',
  description: 'Screen description',
  layout: 'chat', // chat, task, file, team, form, upload, search, celebration, default
  isHome: true, // Optional: marks as home screen
  showInBottomNav: true, // Optional: show in bottom navigation
  navIcon: '💬', // Optional: navigation icon
  navLabel: 'Chat', // Optional: navigation label
  actions: [
    {
      id: 'action_id',
      label: 'Button Text',
      description: 'Optional description',
      color: 'blue', // blue, green, purple, orange, etc.
      nextScreenId: 'target_screen_id' // Optional: screen to navigate to
    }
  ],
  data: {
    // Layout-specific data (see below)
  }
}
```

### Layout-Specific Data

#### Chat Layout
```javascript
data: {
  messages: {
    received: { text: "Hello!", sender: "John", time: "2:30 PM" },
    sent: { text: "Hi there!", sender: "You", time: "2:32 PM" }
  },
  inputPlaceholder: "Type a message..."
}
```

#### Task Layout
```javascript
data: {
  tasks: [
    { id: 1, title: "Complete wireframes", dueDate: "Due tomorrow", completed: true },
    { id: 2, title: "Review designs", dueDate: "Due Friday", completed: false }
  ]
}
```

#### File Layout
```javascript
data: {
  files: [
    { id: 1, name: "document.pdf", size: "2.4 MB", icon: "📄" },
    { id: 2, name: "image.png", size: "1.2 MB", icon: "🖼️" }
  ]
}
```

#### Team Layout
```javascript
data: {
  teamMembers: [
    { id: 1, name: "Sarah Chen", initials: "SC", online: true },
    { id: 2, name: "Mike Johnson", initials: "MJ", online: false }
  ]
}
```

#### Form Layout
```javascript
data: {
  formFields: [
    { id: 1, type: "text", label: "Title", placeholder: "Enter title..." },
    { id: 2, type: "textarea", label: "Description", placeholder: "Describe..." },
    { id: 3, type: "select", label: "Category", options: [
      { value: "work", label: "Work" },
      { value: "personal", label: "Personal" }
    ]}
  ]
}
```

## 🎨 Styling & Theming

### Color System
The components use Tailwind CSS with a consistent color palette:

- **Background**: `bg-gray-900` (main), `bg-gray-800` (panels)
- **Text**: `text-white` (primary), `text-gray-300` (secondary)
- **Accents**: Blue, Green, Purple, Orange, Teal, Indigo
- **Interactive States**: `hover:bg-{color}-600`, `active:scale-95`

### Device Styling
- **iPhone Frame**: Realistic rounded corners with dynamic island
- **Screen Dimensions**: 390x844px (iPhone 12 size)
- **Status Bar**: Authentic time and battery indicators
- **Home Indicator**: Bottom home bar

### Animations
- **Screen Transitions**: 0.3s ease transitions
- **Message Appearance**: Slide-up animation with fade
- **Button Interactions**: Scale and color transitions
- **Flow Diagram**: Animated connection lines

## 🔧 Advanced Configuration

### Custom Chat Responses
```javascript
const generateResponse = (userMessage) => {
  // Implement your own logic
  return "Custom response based on: " + userMessage
}
```

### Custom Layouts
Add new layout types by extending `SimulatorLayouts.vue`:

```vue
<!-- Add to SimulatorLayouts.vue -->
<div v-else-if="layout === 'custom'" class="space-y-4">
  <!-- Your custom layout here -->
</div>
```

### Flow Diagram Customization
```javascript
// Custom node shapes and colors
const customTheme = {
  primaryColor: '#your-color',
  primaryTextColor: '#ffffff',
  primaryBorderColor: '#your-border-color'
}
```

## 📊 Event System

### Available Events

- **screen-changed**: `{ current: Screen, previous: Screen }`
- **action-triggered**: `{ action: Action, currentScreen: Screen }`
- **message-sent**: `{ type: 'user', content: string, timestamp: Date }`
- **flow-updated**: `{ currentScreenId: string, history: Screen[] }`
- **node-clicked**: `nodeId: string`

### Example Event Handlers
```javascript
const handleScreenChanged = ({ current, previous }) => {
  console.log(`Navigated from ${previous?.name} to ${current.name}`)
  // Track analytics, update URL, etc.
}

const handleActionTriggered = ({ action, currentScreen }) => {
  console.log(`User performed: ${action.label} on ${currentScreen.name}`)
  // Custom business logic
}
```

## 🧪 Testing Integration

### Unit Testing
```javascript
import { mount } from '@vue/test-utils'
import SimulatorCore from './SimulatorCore.vue'

test('renders screen correctly', () => {
  const wrapper = mount(SimulatorCore, {
    props: {
      screens: mockScreens,
      initialScreenId: 'home'
    }
  })
  expect(wrapper.find('.screen-header').text()).toBe('Home Screen')
})
```

### E2E Testing
The simulator provides excellent support for automated testing:
- Predictable screen states
- Clear action buttons with consistent naming
- Observable flow transitions

## 🚀 Integration with Sophisticated Apps

### State Management
```javascript
// Pinia store integration
const useSimulatorStore = defineStore('simulator', {
  state: () => ({
    currentScreen: null,
    screenHistory: [],
    messageSequence: []
  }),
  actions: {
    navigateToScreen(screenId) {
      // Custom navigation logic
    }
  }
})
```

### API Integration
```javascript
// Connect to real backend
const handleActionTriggered = async ({ action }) => {
  if (action.apiEndpoint) {
    const response = await fetch(action.apiEndpoint, {
      method: 'POST',
      body: JSON.stringify(action.data)
    })
    // Handle response
  }
}
```

### Real-time Updates
```javascript
// WebSocket integration
const socket = new WebSocket('ws://your-api')
socket.onmessage = (event) => {
  const update = JSON.parse(event.data)
  // Update simulator state
}
```

## 🔄 Migration from Original

This package preserves the beautiful design elements from the original Railway simulator while making them:

1. **More Modular**: Separated concerns into focused components
2. **More Configurable**: Props and slots for customization
3. **More Scalable**: Event-driven architecture
4. **More Testable**: Clear component boundaries
5. **More Maintainable**: Better code organization

## 📦 Build & Deploy

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

### Component Library
To use as a component library, export the components:

```javascript
// index.js
export { default as SimulatorCore } from './SimulatorCore.vue'
export { default as SimulatorLayouts } from './SimulatorLayouts.vue'
export { default as FlowDiagram } from './FlowDiagram.vue'
```

---

## 💡 Perfect for:

- **App Prototyping**: Validate UX before development
- **Client Demos**: Show interactive app concepts
- **User Testing**: Gather feedback on flows
- **Documentation**: Visual API and flow documentation
- **Training**: Onboard users with interactive tutorials

The beautiful design from the Railway simulator is now yours to use in any sophisticated application! 🚀
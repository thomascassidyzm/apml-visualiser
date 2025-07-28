<template>
  <div class="simulator-container min-h-screen bg-gray-900 text-white">
    <!-- Header -->
    <header class="bg-gray-800 border-b border-gray-700 p-4">
      <div class="flex items-center justify-between">
        <h1 class="text-xl font-bold">{{ appTitle }}</h1>
        <div class="flex items-center space-x-4">
          <div class="text-sm text-gray-300">
            <span class="font-semibold">{{ currentScreen?.name || 'Loading...' }}</span>
          </div>
          <button 
            v-if="canGoBack"
            @click="goBack"
            class="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm transition-colors"
          >
            ← Back
          </button>
          <button 
            @click="resetToHome"
            class="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
          >
            🏠 Home
          </button>
        </div>
      </div>
    </header>
    
    <div class="flex h-screen">
      <!-- Left Panel: Flow Diagram + Chat (70%) -->
      <div class="w-7/10 bg-gray-800 border-r border-gray-700 p-4 overflow-y-auto flex flex-col" style="width: 70%;">
        <!-- Flow Diagram -->
        <div class="flex-1 mb-6">
          <h2 class="text-xl font-semibold mb-4">🗺️ {{ flowTitle }}</h2>
          <div class="h-full p-6 bg-gray-900 rounded-lg border border-gray-600">
            <div ref="flowDiagram" class="text-center h-full">
              <slot name="flow-diagram">
                <div class="text-gray-400 mt-20">
                  <div class="text-6xl mb-4">🔄</div>
                  <p>Flow diagram will render here</p>
                </div>
              </slot>
            </div>
          </div>
        </div>
        
        <!-- Interactive Chat Section -->
        <div class="border-t border-gray-700 pt-4">
          <h2 class="text-lg font-semibold mb-4">💬 {{ chatTitle }}</h2>
          
          <!-- Chat History -->
          <div class="space-y-2 mb-4 max-h-32 overflow-y-auto">
            <div
              v-for="message in chatHistory"
              :key="message.id"
              :class="[
                'p-3 rounded text-sm message-box',
                message.type === 'user' ? 'bg-green-800 text-green-100' : 'bg-blue-800 text-blue-100'
              ]"
            >
              <div class="font-medium">{{ message.type === 'user' ? 'You' : chatTitle }}</div>
              <div v-html="message.content"></div>
            </div>
          </div>
          
          <!-- Chat Input -->
          <div class="flex">
            <input
              v-model="chatInput"
              @keyup.enter="sendMessage"
              :placeholder="chatPlaceholder"
              class="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-l text-sm text-white focus:outline-none focus:border-blue-500"
            />
            <button
              @click="sendMessage"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-r text-sm text-white transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      </div>
      
      <!-- Right Panel: Device Simulator (30%) -->
      <div class="w-3/10 bg-gray-900 p-4 overflow-y-auto flex flex-col" style="width: 30%;">
        <!-- Device Frame -->
        <div class="flex items-center justify-center mb-6">
          <div v-if="!currentScreen" class="text-center text-gray-400">
            <div class="text-6xl mb-4">📱</div>
            <p>{{ loadingText }}</p>
          </div>
          
          <!-- iPhone-style Device -->
          <div v-else class="device-frame bg-black rounded-3xl shadow-2xl" :style="deviceStyle">
            <div class="absolute inset-0 bg-black rounded-3xl p-1">
              <!-- Screen -->
              <div class="bg-white rounded-3xl h-full flex flex-col relative overflow-hidden screen-transition">
                <!-- Dynamic Island -->
                <div class="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-10"></div>
                
                <!-- Status Bar -->
                <div class="flex justify-between items-center px-6 py-3 text-sm text-black bg-white">
                  <span class="font-semibold">{{ statusBarTime }}</span>
                  <div class="flex items-center space-x-1">
                    <div class="w-4 h-2 bg-black rounded-sm"></div>
                    <div class="w-6 h-3 border border-black rounded-sm">
                      <div class="w-full h-full bg-green-500 rounded-sm"></div>
                    </div>
                  </div>
                </div>
                
                <!-- Screen Header -->
                <div class="px-6 py-4 border-b border-gray-200 bg-white">
                  <div class="flex items-center justify-between">
                    <div>
                      <h3 class="text-xl font-bold text-gray-900">{{ currentScreen.name }}</h3>
                      <p class="text-sm text-gray-600 mt-1">{{ currentScreen.description }}</p>
                    </div>
                    <div v-if="canGoBack">
                      <button 
                        @click="goBack"
                        class="text-blue-500 text-lg px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        ← Back
                      </button>
                    </div>
                  </div>
                </div>
                
                <!-- Dynamic Screen Content -->
                <div class="flex-1 p-6 overflow-y-auto bg-gray-50">
                  <slot name="screen-content" :screen="currentScreen" :layout="currentScreen.layout">
                    <!-- Default content if no slot provided -->
                    <div class="space-y-4">
                      <button
                        v-for="action in currentScreen.actions"
                        :key="action.id"
                        @click="handleAction(action)"
                        :class="getActionButtonClass(action)"
                      >
                        <div class="text-base font-semibold">{{ action.label }}</div>
                        <div v-if="action.description" class="text-sm opacity-90 mt-2">{{ action.description }}</div>
                      </button>
                    </div>
                  </slot>
                </div>
                
                <!-- Bottom Navigation -->
                <div v-if="showBottomNav" class="border-t border-gray-200 bg-white px-6 py-4">
                  <div class="flex justify-around">
                    <button 
                      v-for="navItem in bottomNavItems"
                      :key="navItem.id"
                      @click="navigateToScreen(navItem)"
                      :class="getNavItemClass(navItem)"
                    >
                      <div class="text-2xl mb-2">{{ navItem.icon }}</div>
                      <div class="font-medium">{{ navItem.label }}</div>
                    </button>
                  </div>
                </div>
                
                <!-- Home Indicator -->
                <div class="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-black rounded-full opacity-60"></div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Technical Details (Optional) -->
        <div v-if="showTechnicalDetails" class="border-t border-gray-700 pt-4">
          <h3 class="text-lg font-semibold mb-4">🔧 Technical Details</h3>
          <slot name="technical-details" :current-screen="currentScreen" :history="screenHistory">
            <div class="p-3 bg-gray-700 rounded">
              <div class="text-xs text-gray-300 space-y-1">
                <div><strong>Screen ID:</strong> {{ currentScreen?.id }}</div>
                <div><strong>Actions:</strong> {{ currentScreen?.actions?.length || 0 }}</div>
                <div><strong>History:</strong> {{ screenHistory.length }} screens</div>
              </div>
            </div>
          </slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'

// Props
const props = defineProps({
  appTitle: { type: String, default: 'App Simulator' },
  flowTitle: { type: String, default: 'App Flow' },
  chatTitle: { type: String, default: 'Assistant' },
  chatPlaceholder: { type: String, default: 'How does this feel?' },
  loadingText: { type: String, default: 'Loading app...' },
  screens: { type: Array, required: true },
  initialScreenId: { type: String, default: null },
  deviceWidth: { type: Number, default: 390 },
  deviceHeight: { type: Number, default: 844 },
  showBottomNav: { type: Boolean, default: true },
  showTechnicalDetails: { type: Boolean, default: false },
  statusBarTime: { type: String, default: '9:41' }
})

// Emits
const emit = defineEmits(['screen-changed', 'action-triggered', 'message-sent', 'flow-updated'])

// Reactive data
const currentScreen = ref(null)
const screenHistory = ref([])
const chatHistory = ref([])
const chatInput = ref('')
const flowDiagram = ref(null)

// Computed
const canGoBack = computed(() => screenHistory.value.length > 0)

const deviceStyle = computed(() => ({
  width: `${props.deviceWidth}px`,
  height: `${props.deviceHeight}px`,
  position: 'relative'
}))

const bottomNavItems = computed(() => {
  return props.screens.filter(screen => screen.showInBottomNav).map(screen => ({
    id: screen.id,
    label: screen.navLabel || screen.name,
    icon: screen.navIcon || '📱'
  }))
})

// Methods
const loadScreen = (screenId) => {
  const screen = props.screens.find(s => s.id === screenId)
  if (!screen) return

  const previousScreen = currentScreen.value
  currentScreen.value = screen
  
  emit('screen-changed', { current: screen, previous: previousScreen })
  emit('flow-updated', { currentScreenId: screenId, history: screenHistory.value })
}

const navigateToScreen = (navItem) => {
  if (currentScreen.value) {
    screenHistory.value.push(currentScreen.value)
  }
  loadScreen(navItem.id)
}

const handleAction = (action) => {
  emit('action-triggered', { action, currentScreen: currentScreen.value })
  
  if (action.nextScreenId) {
    if (currentScreen.value) {
      screenHistory.value.push(currentScreen.value)
    }
    loadScreen(action.nextScreenId)
  }
}

const goBack = () => {
  if (screenHistory.value.length > 0) {
    const previousScreen = screenHistory.value.pop()
    currentScreen.value = previousScreen
    emit('screen-changed', { current: previousScreen, previous: null })
    emit('flow-updated', { currentScreenId: previousScreen.id, history: screenHistory.value })
  }
}

const resetToHome = () => {
  screenHistory.value = []
  const homeScreen = props.screens.find(s => s.isHome) || props.screens[0]
  if (homeScreen) {
    loadScreen(homeScreen.id)
  }
}

const sendMessage = () => {
  if (!chatInput.value.trim()) return
  
  const message = {
    id: Date.now(),
    type: 'user',
    content: chatInput.value,
    timestamp: new Date()
  }
  
  chatHistory.value.push(message)
  emit('message-sent', message)
  chatInput.value = ''
}

const addChatMessage = (type, content) => {
  const message = {
    id: Date.now(),
    type,
    content,
    timestamp: new Date()
  }
  chatHistory.value.push(message)
}

const getActionButtonClass = (action) => {
  const baseClass = 'w-full p-4 text-white rounded-xl transition-all duration-200 text-left shadow-lg hover:shadow-xl active:scale-95'
  const colorClass = action.color ? `bg-${action.color}-500 hover:bg-${action.color}-600` : 'bg-blue-500 hover:bg-blue-600'
  return `${baseClass} ${colorClass}`
}

const getNavItemClass = (navItem) => {
  const baseClass = 'flex flex-col items-center py-3 px-4 rounded-xl text-sm transition-colors'
  const activeClass = currentScreen.value?.id === navItem.id 
    ? 'text-blue-600 bg-blue-50' 
    : 'text-gray-500 hover:text-gray-700'
  return `${baseClass} ${activeClass}`
}

// Initialize
const initialize = () => {
  const initialScreen = props.screens.find(s => s.id === props.initialScreenId) || 
                       props.screens.find(s => s.isHome) || 
                       props.screens[0]
  
  if (initialScreen) {
    loadScreen(initialScreen.id)
  }
}

// Expose methods for parent component
defineExpose({
  loadScreen,
  addChatMessage,
  getCurrentScreen: () => currentScreen.value,
  getScreenHistory: () => screenHistory.value
})

// Watch for screens changes
watch(() => props.screens, () => {
  if (!currentScreen.value && props.screens.length > 0) {
    initialize()
  }
}, { immediate: true })
</script>

<style scoped>
.screen-transition {
  transition: all 0.3s ease;
}

.message-box {
  animation: messageAppear 0.4s ease;
}

@keyframes messageAppear {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.device-frame {
  position: relative;
}

/* Focus states */
input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Hover effects */
button:hover {
  transform: translateY(-1px);
}

button:active {
  transform: translateY(0);
}
</style>
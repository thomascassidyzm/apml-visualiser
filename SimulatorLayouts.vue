<template>
  <div>
    <!-- Chat Layout -->
    <div v-if="layout === 'chat'" class="h-full flex flex-col">
      <!-- Messages -->
      <div class="flex-1 space-y-3 mb-4">
        <div class="bg-blue-100 p-3 rounded-xl max-w-xs">
          <div class="text-sm text-gray-800">{{ messages.received.text }}</div>
          <div class="text-xs text-gray-500 mt-1">{{ messages.received.sender }} • {{ messages.received.time }}</div>
        </div>
        <div class="bg-green-500 text-white p-3 rounded-xl max-w-xs ml-auto">
          <div class="text-sm">{{ messages.sent.text }}</div>
          <div class="text-xs opacity-80 mt-1">{{ messages.sent.sender }} • {{ messages.sent.time }}</div>
        </div>
      </div>
      <!-- Message Input -->
      <div class="flex items-center space-x-2 p-3 bg-white rounded-xl border">
        <input type="text" :placeholder="inputPlaceholder" class="flex-1 outline-none text-gray-700" />
        <button class="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors">
          <span class="text-sm">→</span>
        </button>
      </div>
      <!-- Action Buttons -->
      <div class="mt-4 space-y-2">
        <button
          v-for="action in screen.actions"
          :key="action.id"
          @click="$emit('action-triggered', action)"
          class="w-full p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-left text-sm"
        >
          {{ action.label }}
        </button>
      </div>
    </div>
    
    <!-- Task Layout -->
    <div v-else-if="layout === 'task'" class="space-y-4">
      <!-- Task List -->
      <div class="bg-white rounded-xl p-4 space-y-3">
        <div v-for="task in tasks" :key="task.id" class="flex items-center space-x-3">
          <input type="checkbox" class="w-5 h-5 text-green-500" :checked="task.completed" />
          <div class="flex-1">
            <div class="font-medium text-gray-800">{{ task.title }}</div>
            <div class="text-sm text-gray-500">{{ task.dueDate }}</div>
          </div>
        </div>
      </div>
      <!-- Action Buttons -->
      <div class="space-y-2">
        <button
          v-for="action in screen.actions"
          :key="action.id"
          @click="$emit('action-triggered', action)"
          class="w-full p-4 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-colors text-left"
        >
          <div class="font-semibold">{{ action.label }}</div>
          <div v-if="action.description" class="text-sm opacity-90 mt-1">{{ action.description }}</div>
        </button>
      </div>
    </div>
    
    <!-- File Layout -->
    <div v-else-if="layout === 'file'" class="space-y-4">
      <!-- File Grid -->
      <div class="grid grid-cols-2 gap-3">
        <div v-for="file in files" :key="file.id" class="bg-white p-4 rounded-xl border text-center hover:shadow-lg transition-shadow">
          <div class="text-2xl mb-2">{{ file.icon }}</div>
          <div class="text-sm font-medium">{{ file.name }}</div>
          <div class="text-xs text-gray-500">{{ file.size }}</div>
        </div>
      </div>
      <!-- Action Buttons -->
      <div class="space-y-2">
        <button
          v-for="action in screen.actions"
          :key="action.id"
          @click="$emit('action-triggered', action)"
          class="w-full p-4 bg-purple-500 hover:bg-purple-600 text-white rounded-xl transition-colors text-left"
        >
          <div class="font-semibold">{{ action.label }}</div>
          <div v-if="action.description" class="text-sm opacity-90 mt-1">{{ action.description }}</div>
        </button>
      </div>
    </div>
    
    <!-- Team Layout -->
    <div v-else-if="layout === 'team'" class="space-y-4">
      <!-- Team Members -->
      <div class="space-y-3">
        <div v-for="member in teamMembers" :key="member.id" class="bg-white p-4 rounded-xl flex items-center space-x-3 hover:shadow-lg transition-shadow">
          <div :class="[
            'w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold',
            member.online ? 'bg-green-500' : 'bg-gray-400'
          ]">
            {{ member.initials }}
          </div>
          <div class="flex-1">
            <div class="font-medium">{{ member.name }}</div>
            <div :class="[
              'text-sm',
              member.online ? 'text-green-500' : 'text-gray-500'
            ]">
              {{ member.online ? '● Online' : '● Away' }}
            </div>
          </div>
        </div>
      </div>
      <!-- Action Buttons -->
      <div class="space-y-2">
        <button
          v-for="action in screen.actions"
          :key="action.id"
          @click="$emit('action-triggered', action)"
          class="w-full p-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl transition-colors text-left"
        >
          <div class="font-semibold">{{ action.label }}</div>
          <div v-if="action.description" class="text-sm opacity-90 mt-1">{{ action.description }}</div>
        </button>
      </div>
    </div>
    
    <!-- Form Layout -->
    <div v-else-if="layout === 'form'" class="space-y-4">
      <div class="bg-white rounded-xl p-4 space-y-4">
        <div v-for="field in formFields" :key="field.id">
          <label class="block text-sm font-medium text-gray-700 mb-2">{{ field.label }}</label>
          <input 
            v-if="field.type === 'text'" 
            type="text" 
            :placeholder="field.placeholder"
            class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
          />
          <textarea 
            v-else-if="field.type === 'textarea'"
            :placeholder="field.placeholder"
            class="w-full p-3 border border-gray-300 rounded-lg h-20 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          ></textarea>
          <select 
            v-else-if="field.type === 'select'"
            class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          >
            <option v-for="option in field.options" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </div>
      </div>
      <!-- Action Buttons -->
      <div class="space-y-2">
        <button
          v-for="action in screen.actions"
          :key="action.id"
          @click="$emit('action-triggered', action)"
          class="w-full p-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition-colors text-left"
        >
          <div class="font-semibold">{{ action.label }}</div>
        </button>
      </div>
    </div>
    
    <!-- Upload Layout -->
    <div v-else-if="layout === 'upload'" class="space-y-4">
      <div class="bg-white rounded-xl p-6 border-2 border-dashed border-gray-300 text-center hover:border-blue-400 transition-colors cursor-pointer">
        <div class="text-4xl mb-4">📁</div>
        <div class="font-medium text-gray-700">{{ uploadText.primary }}</div>
        <div class="text-sm text-gray-500 mt-2">{{ uploadText.secondary }}</div>
      </div>
      <!-- Action Buttons -->
      <div class="space-y-2">
        <button
          v-for="action in screen.actions"
          :key="action.id"
          @click="$emit('action-triggered', action)"
          class="w-full p-4 bg-teal-500 hover:bg-teal-600 text-white rounded-xl transition-colors text-left"
        >
          <div class="font-semibold">{{ action.label }}</div>
        </button>
      </div>
    </div>
    
    <!-- Search Layout -->
    <div v-else-if="layout === 'search'" class="space-y-4">
      <div class="bg-white rounded-xl p-3">
        <input 
          type="text" 
          :placeholder="searchPlaceholder"
          class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
        />
      </div>
      <div class="space-y-2">
        <div v-for="result in searchResults" :key="result.id" class="bg-white p-4 rounded-xl hover:shadow-lg transition-shadow cursor-pointer">
          <div class="font-medium text-gray-800">{{ result.title }}</div>
          <div class="text-sm text-gray-500">{{ result.description }}</div>
        </div>
      </div>
      <!-- Action Buttons -->
      <div class="space-y-2">
        <button
          v-for="action in screen.actions"
          :key="action.id"
          @click="$emit('action-triggered', action)"
          class="w-full p-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors text-left text-sm"
        >
          {{ action.label }}
        </button>
      </div>
    </div>
    
    <!-- Celebration Layout -->
    <div v-else-if="layout === 'celebration'" class="text-center space-y-4">
      <div class="text-6xl animate-bounce">🎉</div>
      <div class="text-xl font-bold text-gray-800">{{ celebrationText.title }}</div>
      <div class="text-gray-600">{{ celebrationText.message }}</div>
      <!-- Action Buttons -->
      <div class="space-y-2 mt-6">
        <button
          v-for="action in screen.actions"
          :key="action.id"
          @click="$emit('action-triggered', action)"
          class="w-full p-4 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-colors text-left"
        >
          <div class="font-semibold">{{ action.label }}</div>
        </button>
      </div>
    </div>
    
    <!-- Default Layout -->
    <div v-else class="space-y-4">
      <button
        v-for="action in screen.actions"
        :key="action.id"
        @click="$emit('action-triggered', action)"
        class="w-full p-5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all duration-200 text-left shadow-lg hover:shadow-xl active:scale-95"
      >
        <div class="text-base font-semibold">{{ action.label }}</div>
        <div v-if="action.description" class="text-sm opacity-90 mt-2">{{ action.description }}</div>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  screen: { type: Object, required: true },
  layout: { type: String, required: true }
})

const emit = defineEmits(['action-triggered'])

// Default data for different layouts
const messages = computed(() => props.screen.data?.messages || {
  received: { text: "Hey! How's the project going?", sender: "Sarah", time: "2:30 PM" },
  sent: { text: "Making great progress! Just shared the latest files.", sender: "You", time: "2:32 PM" }
})

const tasks = computed(() => props.screen.data?.tasks || [
  { id: 1, title: "Review wireframes v2", dueDate: "Due tomorrow", completed: true },
  { id: 2, title: "Update project timeline", dueDate: "Due Friday", completed: false }
])

const files = computed(() => props.screen.data?.files || [
  { id: 1, name: "wireframes-v2.sketch", size: "2.4 MB", icon: "📄" },
  { id: 2, name: "project-timeline.pdf", size: "856 KB", icon: "📊" }
])

const teamMembers = computed(() => props.screen.data?.teamMembers || [
  { id: 1, name: "Sarah Chen", initials: "S", online: true },
  { id: 2, name: "Mike Johnson", initials: "M", online: false }
])

const formFields = computed(() => props.screen.data?.formFields || [
  { id: 1, type: "text", label: "Title", placeholder: "Enter title..." },
  { id: 2, type: "textarea", label: "Description", placeholder: "Enter description..." },
  { id: 3, type: "select", label: "Assign to", options: [
    { value: "sarah", label: "Sarah Chen" },
    { value: "mike", label: "Mike Johnson" }
  ]}
])

const searchResults = computed(() => props.screen.data?.searchResults || [
  { id: 1, title: '"wireframes v2" in #design', description: "Found in conversation yesterday" },
  { id: 2, title: "wireframes-v2.sketch", description: "File shared by Sarah" }
])

const inputPlaceholder = computed(() => props.screen.data?.inputPlaceholder || "Type a message...")
const searchPlaceholder = computed(() => props.screen.data?.searchPlaceholder || "Search messages, files, tasks...")

const uploadText = computed(() => props.screen.data?.uploadText || {
  primary: "Drop files here or click to browse",
  secondary: "Supports PDF, Images, Documents"
})

const celebrationText = computed(() => props.screen.data?.celebrationText || {
  title: "Task Completed!",
  message: "Great work! The task has been marked as complete."
})
</script>

<style scoped>
@keyframes bounce {
  0%, 20%, 53%, 80%, 100% {
    animation-timing-function: cubic-bezier(0.215, 0.610, 0.355, 1.000);
    transform: translate3d(0,0,0);
  }
  40%, 43% {
    animation-timing-function: cubic-bezier(0.755, 0.050, 0.855, 0.060);
    transform: translate3d(0, -30px, 0);
  }
  70% {
    animation-timing-function: cubic-bezier(0.755, 0.050, 0.855, 0.060);
    transform: translate3d(0, -15px, 0);
  }
  90% {
    transform: translate3d(0,-4px,0);
  }
}

.animate-bounce {
  animation: bounce 1s infinite;
}

/* Focus animations */
input:focus, textarea:focus, select:focus {
  transform: translateY(-1px);
}

/* Hover effects */
.cursor-pointer:hover {
  transform: translateY(-2px);
}
</style>
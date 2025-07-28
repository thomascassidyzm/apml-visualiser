<template>
  <div class="flow-diagram-container">
    <div ref="diagramElement" class="diagram-content"></div>
    
    <!-- Controls -->
    <div class="absolute top-4 right-4 flex space-x-2">
      <button 
        @click="zoomIn"
        class="p-2 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm transition-colors"
        title="Zoom In"
      >
        🔍+
      </button>
      <button 
        @click="zoomOut"
        class="p-2 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm transition-colors"
        title="Zoom Out"
      >
        🔍-
      </button>
      <button 
        @click="resetZoom"
        class="p-2 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm transition-colors"
        title="Reset View"
      >
        ↻
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'

const props = defineProps({
  nodes: { type: Array, required: true },
  connections: { type: Array, required: true },
  currentNodeId: { type: String, default: null },
  theme: { type: String, default: 'dark' },
  diagramType: { type: String, default: 'flowchart' }, // 'flowchart', 'graph', 'mindmap'
  animated: { type: Boolean, default: true }
})

const emit = defineEmits(['node-clicked', 'connection-clicked'])

const diagramElement = ref(null)
const zoomLevel = ref(1)
const mermaidInstance = ref(null)

// Initialize Mermaid
const initializeMermaid = async () => {
  if (typeof window !== 'undefined' && window.mermaid) {
    const { default: mermaid } = await import('mermaid')
    mermaidInstance.value = mermaid
    
    mermaid.initialize({ 
      theme: props.theme,
      themeVariables: {
        primaryColor: '#10b981',
        primaryTextColor: '#ffffff',
        primaryBorderColor: '#059669',
        lineColor: '#6b7280',
        secondaryColor: '#3b82f6',
        tertiaryColor: '#f59e0b'
      },
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis'
      }
    })
  }
}

// Generate Mermaid diagram code
const generateDiagramCode = () => {
  if (!props.nodes.length) return ''
  
  let code = `${props.diagramType} TD\n`
  
  // Add nodes
  props.nodes.forEach(node => {
    const shape = getNodeShape(node.type)
    const label = node.label || node.name || node.id
    
    if (node.type === 'main') {
      code += `    ${node.id}${shape.start}"🏠 ${label}"${shape.end}:::mainNode\n`
    } else if (node.type === 'decision') {
      code += `    ${node.id}${shape.start}"${label}"${shape.end}:::decisionNode\n`
    } else {
      code += `    ${node.id}${shape.start}"${label}"${shape.end}:::normalNode\n`
    }
  })
  
  // Add connections
  props.connections.forEach(connection => {
    const label = connection.label ? `|${connection.label}|` : ''
    code += `    ${connection.from} -->${label} ${connection.to}\n`
  })
  
  // Add styling
  code += `
    classDef mainNode fill:#10b981,stroke:#059669,stroke-width:3px,color:#fff
    classDef normalNode fill:#3b82f6,stroke:#2563eb,stroke-width:2px,color:#fff
    classDef decisionNode fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#000
    classDef currentNode fill:#ef4444,stroke:#dc2626,stroke-width:4px,color:#fff
`
  
  // Highlight current node
  if (props.currentNodeId) {
    code += `    class ${props.currentNodeId} currentNode\n`
  }
  
  return code
}

// Get node shape based on type
const getNodeShape = (type) => {
  switch (type) {
    case 'decision':
      return { start: '{', end: '}' }
    case 'process':
      return { start: '[', end: ']' }
    case 'terminal':
      return { start: '([', end: '])' }
    default:
      return { start: '[', end: ']' }
  }
}

// Render diagram
const renderDiagram = async () => {
  if (!mermaidInstance.value || !diagramElement.value) return
  
  const code = generateDiagramCode()
  if (!code) return
  
  try {
    diagramElement.value.innerHTML = ''
    
    const { svg } = await mermaidInstance.value.render(
      `diagram-${Date.now()}`, 
      code
    )
    
    diagramElement.value.innerHTML = svg
    
    // Add click handlers
    addClickHandlers()
    
    // Apply zoom
    applyZoom()
    
  } catch (error) {
    console.error('Mermaid render error:', error)
    diagramElement.value.innerHTML = `
      <div class="text-center text-red-400 p-8">
        <div class="text-4xl mb-4">⚠️</div>
        <p>Error rendering diagram</p>
        <p class="text-sm mt-2">${error.message}</p>
      </div>
    `
  }
}

// Add click handlers to nodes
const addClickHandlers = () => {
  if (!diagramElement.value) return
  
  const nodes = diagramElement.value.querySelectorAll('.node')
  nodes.forEach(node => {
    node.style.cursor = 'pointer'
    node.addEventListener('click', (e) => {
      const nodeId = extractNodeId(node)
      if (nodeId) {
        emit('node-clicked', nodeId)
      }
    })
  })
  
  const edges = diagramElement.value.querySelectorAll('.edgePath')
  edges.forEach(edge => {
    edge.style.cursor = 'pointer'
    edge.addEventListener('click', (e) => {
      const connection = extractConnectionId(edge)
      if (connection) {
        emit('connection-clicked', connection)
      }
    })
  })
}

// Extract node ID from DOM element
const extractNodeId = (element) => {
  const id = element.id || element.getAttribute('id')
  return id ? id.replace('flowchart-', '').replace('-', '') : null
}

// Extract connection info from DOM element
const extractConnectionId = (element) => {
  // This is a simplified version - you might need to enhance based on your needs
  return { from: null, to: null }
}

// Zoom controls
const zoomIn = () => {
  zoomLevel.value = Math.min(zoomLevel.value * 1.2, 3)
  applyZoom()
}

const zoomOut = () => {
  zoomLevel.value = Math.max(zoomLevel.value / 1.2, 0.3)
  applyZoom()
}

const resetZoom = () => {
  zoomLevel.value = 1
  applyZoom()
}

const applyZoom = () => {
  if (diagramElement.value) {
    const svg = diagramElement.value.querySelector('svg')
    if (svg) {
      svg.style.transform = `scale(${zoomLevel.value})`
      svg.style.transformOrigin = 'center center'
      svg.style.transition = 'transform 0.3s ease'
    }
  }
}

// Animation support
const animateTransition = (fromNodeId, toNodeId) => {
  if (!props.animated || !diagramElement.value) return
  
  // Find the connection line and animate it
  const edges = diagramElement.value.querySelectorAll('.edgePath path')
  edges.forEach(edge => {
    edge.style.strokeDasharray = '10,5'
    edge.style.animation = 'dash 2s linear infinite'
  })
  
  // Remove animation after 3 seconds
  setTimeout(() => {
    edges.forEach(edge => {
      edge.style.animation = ''
      edge.style.strokeDasharray = ''
    })
  }, 3000)
}

// Watch for changes
watch(() => [props.nodes, props.connections, props.currentNodeId], () => {
  nextTick(() => renderDiagram())
}, { deep: true })

watch(() => props.currentNodeId, (newId, oldId) => {
  if (props.animated && newId && oldId) {
    animateTransition(oldId, newId)
  }
})

// Expose methods
defineExpose({
  renderDiagram,
  zoomIn,
  zoomOut,
  resetZoom,
  animateTransition
})

onMounted(async () => {
  await initializeMermaid()
  await nextTick()
  renderDiagram()
})
</script>

<style scoped>
.flow-diagram-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: auto;
}

.diagram-content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Animation for connection lines */
@keyframes dash {
  to {
    stroke-dashoffset: -20;
  }
}

/* Custom scrollbar */
.flow-diagram-container::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.flow-diagram-container::-webkit-scrollbar-track {
  background: #374151;
  border-radius: 4px;
}

.flow-diagram-container::-webkit-scrollbar-thumb {
  background: #6b7280;
  border-radius: 4px;
}

.flow-diagram-container::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

/* Mermaid diagram styling */
:deep(.node) {
  transition: all 0.3s ease;
}

:deep(.node:hover) {
  filter: brightness(1.1);
  transform: scale(1.02);
}

:deep(.edgePath) {
  transition: all 0.3s ease;
}

:deep(.edgePath:hover path) {
  stroke-width: 3px;
  filter: brightness(1.2);
}

/* Dark theme adjustments */
:deep(svg) {
  background: transparent;
}

:deep(.cluster rect) {
  fill: #374151;
  stroke: #6b7280;
}

:deep(.cluster text) {
  fill: #ffffff;
}
</style>
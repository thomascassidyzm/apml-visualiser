import express from 'express'
import { WebSocketServer } from 'ws'
import { readFile, readdir, stat } from 'fs/promises'
import { watch } from 'chokidar'
import yaml from 'js-yaml'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.static('dist'))

// Serve APML files
app.use('/apml', express.static('.', {
  setHeaders: (res, path) => {
    if (path.endsWith('.apml')) {
      res.setHeader('Content-Type', 'text/plain')
    }
  }
}))

// WebSocket server for real-time updates
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Trinity APML Visualiser running at:`)
  console.log(`   Local:   http://localhost:${PORT}`)
  console.log(`   Network: http://0.0.0.0:${PORT}`)
  console.log(`\n✨ Beautiful simulator aesthetics enabled!`)
})

const wss = new WebSocketServer({ server })

// Store connected clients
const clients = new Set()

wss.on('connection', (ws) => {
  console.log('📱 Client connected to Trinity Visualiser')
  clients.add(ws)
  
  // Send welcome message with simulator aesthetics
  ws.send(JSON.stringify({
    type: 'welcome',
    message: '🎨 Trinity APML Visualiser connected - Beautiful simulator aesthetics loaded!',
    timestamp: Date.now()
  }))
  
  ws.on('close', () => {
    clients.delete(ws)
    console.log('📱 Client disconnected')
  })
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error)
    clients.delete(ws)
  })
})

// Broadcast to all connected clients
const broadcast = (data) => {
  const message = JSON.stringify(data)
  clients.forEach(client => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(message)
    }
  })
}

// API Routes

// Get all APML files
app.get('/api/apml-files', async (req, res) => {
  try {
    const files = []
    const entries = await readdir('.', { withFileTypes: true })
    
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.apml')) {
        const stats = await stat(entry.name)
        files.push({
          name: entry.name,
          size: stats.size,
          modified: stats.mtime.toISOString(),
          path: `./${entry.name}`
        })
      }
    }
    
    // Sort by modification time (newest first)
    files.sort((a, b) => new Date(b.modified) - new Date(a.modified))
    
    res.json({
      success: true,
      files,
      count: files.length,
      message: `📁 Found ${files.length} APML files ready for visualization`
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: '❌ Failed to load APML files'
    })
  }
})

// Get specific APML file content
app.get('/api/apml/:filename', async (req, res) => {
  try {
    const filename = req.params.filename
    if (!filename.endsWith('.apml')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file type',
        message: '❌ Only .apml files are supported'
      })
    }
    
    const content = await readFile(filename, 'utf-8')
    let parsed = null
    let validationErrors = []
    
    // Try to parse YAML
    try {
      parsed = yaml.load(content)
      
      // Basic APML validation
      if (!parsed.apml_version) {
        validationErrors.push({ type: 'warning', message: 'Missing apml_version' })
      }
      if (!parsed.metadata) {
        validationErrors.push({ type: 'error', message: 'Missing metadata section' })
      }
      if (!parsed.patterns && !parsed.components && !parsed.screens) {
        validationErrors.push({ type: 'warning', message: 'No patterns, components, or screens defined' })
      }
      
    } catch (parseError) {
      validationErrors.push({ type: 'error', message: `YAML parsing error: ${parseError.message}` })
    }
    
    res.json({
      success: true,
      filename,
      content,
      parsed,
      validationErrors,
      size: content.length,
      message: `📄 APML file loaded: ${filename}`
    })
    
    // Broadcast file load event
    broadcast({
      type: 'file-loaded',
      filename,
      validationErrors,
      timestamp: Date.now()
    })
    
  } catch (error) {
    res.status(404).json({
      success: false,
      error: error.message,
      message: `❌ Could not load APML file: ${req.params.filename}`
    })
  }
})

// Validate APML content
app.post('/api/validate', async (req, res) => {
  try {
    const { content, filename } = req.body
    
    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'No content provided',
        message: '❌ APML content is required for validation'
      })
    }
    
    const validationResults = {
      isValid: true,
      errors: [],
      warnings: [],
      info: [],
      parsed: null
    }
    
    // Parse YAML
    try {
      validationResults.parsed = yaml.load(content)
    } catch (parseError) {
      validationResults.isValid = false
      validationResults.errors.push({
        type: 'syntax',
        message: `YAML syntax error: ${parseError.message}`,
        line: parseError.mark?.line || null
      })
      
      return res.json({
        success: true,
        validation: validationResults,
        message: '🔍 APML validation completed with syntax errors'
      })
    }
    
    const apml = validationResults.parsed
    
    // Structure validation
    if (!apml.apml_version) {
      validationResults.warnings.push({
        type: 'structure',
        message: 'Missing apml_version field',
        suggestion: 'Add apml_version: "1.0" to your APML file'
      })
    }
    
    if (!apml.metadata) {
      validationResults.errors.push({
        type: 'structure',
        message: 'Missing required metadata section',
        suggestion: 'Add metadata section with title and description'
      })
      validationResults.isValid = false
    } else {
      if (!apml.metadata.title) {
        validationResults.warnings.push({
          type: 'metadata',
          message: 'Missing metadata.title',
          suggestion: 'Add a descriptive title to your APML metadata'
        })
      }
      if (!apml.metadata.description) {
        validationResults.warnings.push({
          type: 'metadata',
          message: 'Missing metadata.description',
          suggestion: 'Add a description explaining what this APML file does'
        })
      }
    }
    
    // Content validation
    const hasPatterns = apml.patterns && Object.keys(apml.patterns).length > 0
    const hasComponents = apml.components && Object.keys(apml.components).length > 0
    const hasScreens = apml.screens && Object.keys(apml.screens).length > 0
    const hasLayout = apml.layout && Object.keys(apml.layout).length > 0
    
    if (!hasPatterns && !hasComponents && !hasScreens && !hasLayout) {
      validationResults.warnings.push({
        type: 'content',
        message: 'No patterns, components, screens, or layout defined',
        suggestion: 'Add at least one of: patterns, components, screens, or layout'
      })
    }
    
    // Screens validation (for Trinity flow)
    if (hasScreens) {
      validationResults.info.push({
        type: 'trinity-flow',
        message: `Found ${Object.keys(apml.screens).length} screens for Trinity flow visualization`
      })
      
      // Check for screen connections
      let totalConnections = 0
      Object.entries(apml.screens).forEach(([screenId, screen]) => {
        if (screen.user_actions) {
          screen.user_actions.forEach(action => {
            if (action.next_screen) {
              totalConnections++
            }
          })
        }
      })
      
      if (totalConnections > 0) {
        validationResults.info.push({
          type: 'trinity-flow',
          message: `Found ${totalConnections} screen transitions for flow diagram`
        })
      } else {
        validationResults.warnings.push({
          type: 'trinity-flow',
          message: 'No screen transitions found',
          suggestion: 'Add next_screen properties to user_actions for flow visualization'
        })
      }
    }
    
    res.json({
      success: true,
      validation: validationResults,
      message: validationResults.isValid ? 
        '✅ APML validation passed with beautiful simulator aesthetics!' : 
        '⚠️ APML validation completed with issues'
    })
    
    // Broadcast validation event
    broadcast({
      type: 'validation-completed',
      filename: filename || 'inline',
      isValid: validationResults.isValid,
      errorCount: validationResults.errors.length,
      warningCount: validationResults.warnings.length,
      timestamp: Date.now()
    })
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: '❌ Validation failed due to server error'
    })
  }
})

// Compile APML to different formats
app.post('/api/compile', async (req, res) => {
  try {
    const { content, format, options } = req.body
    
    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'No APML content provided'
      })
    }
    
    const apml = yaml.load(content)
    let compiled = null
    
    switch (format) {
      case 'mermaid':
        compiled = compileToMermaid(apml)
        break
      case 'vue':
        compiled = compileToVue(apml, options)
        break
      case 'svelte':
        compiled = compileToSvelte(apml, options)
        break
      case 'simulator':
        compiled = compileToSimulator(apml)
        break
      default:
        return res.status(400).json({
          success: false,
          error: `Unsupported format: ${format}`
        })
    }
    
    res.json({
      success: true,
      format,
      compiled,
      message: `🎨 APML compiled to ${format} with beautiful aesthetics!`
    })
    
    // Broadcast compilation event
    broadcast({
      type: 'compilation-completed',
      format,
      timestamp: Date.now()
    })
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: '❌ Compilation failed'
    })
  }
})

// Compilation functions
function compileToMermaid(apml) {
  if (!apml.screens) return 'flowchart TD\n    A[No screens found]'
  
  let mermaid = 'flowchart TD\n'
  
  // Add nodes
  Object.entries(apml.screens).forEach(([screenId, screen]) => {
    const cleanName = screen.name?.replace(' Screen', '') || screenId
    mermaid += `    ${screenId}["${cleanName}"]:::screenNode\n`
  })
  
  // Add connections
  Object.entries(apml.screens).forEach(([screenId, screen]) => {
    if (screen.user_actions) {
      screen.user_actions.forEach(action => {
        if (action.next_screen && apml.screens[action.next_screen]) {
          mermaid += `    ${screenId} --> ${action.next_screen}\n`
        }
      })
    }
  })
  
  // Add beautiful styling
  mermaid += `
    classDef screenNode fill:#3b82f6,stroke:#2563eb,stroke-width:2px,color:#fff
    classDef currentNode fill:#10b981,stroke:#059669,stroke-width:3px,color:#fff
`
  
  return mermaid
}

function compileToVue(apml, options = {}) {
  // This would generate Vue components - simplified version
  return {
    template: '<!-- Vue components would be generated here -->',
    script: '// Vue logic would be generated here',
    style: '/* Beautiful simulator aesthetics would be applied here */'
  }
}

function compileToSvelte(apml, options = {}) {
  // This would generate Svelte components - simplified version
  return {
    template: '<!-- Svelte components would be generated here -->',
    script: '// Svelte logic would be generated here',
    style: '/* Beautiful simulator aesthetics would be applied here */'
  }
}

function compileToSimulator(apml) {
  if (!apml.screens) {
    return {
      screens: [],
      message: 'No screens found for simulator'
    }
  }
  
  const simulatorScreens = Object.entries(apml.screens).map(([screenId, screen]) => ({
    id: screenId,
    name: screen.name || screenId,
    description: screen.purpose || screen.description || 'Screen description',
    layout: determineLayout(screen),
    actions: (screen.user_actions || []).map((action, index) => ({
      id: `${screenId}_action_${index}`,
      label: action.action || action.description,
      description: action.description,
      nextScreenId: action.next_screen,
      color: getActionColor(action.action)
    })),
    data: extractScreenData(screen)
  }))
  
  return {
    screens: simulatorScreens,
    message: `🎨 Generated ${simulatorScreens.length} screens with beautiful simulator aesthetics`
  }
}

function determineLayout(screen) {
  const screenType = screen.name?.toLowerCase() || screen.purpose?.toLowerCase() || ''
  
  if (screenType.includes('chat') || screenType.includes('message')) return 'chat'
  if (screenType.includes('task') || screenType.includes('todo')) return 'task'
  if (screenType.includes('file') || screenType.includes('document')) return 'file'
  if (screenType.includes('team') || screenType.includes('member')) return 'team'
  if (screenType.includes('form') || screenType.includes('create') || screenType.includes('edit')) return 'form'
  if (screenType.includes('upload')) return 'upload'
  if (screenType.includes('search')) return 'search'
  if (screenType.includes('complete') || screenType.includes('success')) return 'celebration'
  
  return 'default'
}

function getActionColor(actionName) {
  const action = actionName?.toLowerCase() || ''
  
  if (action.includes('chat') || action.includes('message')) return 'blue'
  if (action.includes('task') || action.includes('complete')) return 'green'
  if (action.includes('file') || action.includes('upload')) return 'purple'
  if (action.includes('team') || action.includes('invite')) return 'indigo'
  if (action.includes('create') || action.includes('add')) return 'orange'
  if (action.includes('delete') || action.includes('remove')) return 'red'
  
  return 'blue'
}

function extractScreenData(screen) {
  // Extract data for different layouts - this could be enhanced
  return {
    // Add default data that would be used by SimulatorLayouts
  }
}

// Watch for APML file changes
const watcher = watch('*.apml', {
  ignored: /node_modules/,
  persistent: true
})

watcher.on('change', (filepath) => {
  console.log(`📝 APML file changed: ${filepath}`)
  broadcast({
    type: 'file-changed',
    filepath,
    timestamp: Date.now(),
    message: `🔄 ${filepath} has been updated - Trinity validation in progress...`
  })
})

watcher.on('add', (filepath) => {
  console.log(`📄 New APML file detected: ${filepath}`)
  broadcast({
    type: 'file-added',
    filepath,
    timestamp: Date.now(),
    message: `✨ New APML file: ${filepath} - Ready for beautiful visualization!`
  })
})

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Trinity APML Visualiser shutting down gracefully...')
  watcher.close()
  server.close(() => {
    console.log('✨ Trinity APML Visualiser stopped')
    process.exit(0)
  })
})
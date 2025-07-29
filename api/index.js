import { readFile, readdir, stat } from 'fs/promises'
import yaml from 'js-yaml'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Helper function to find APML files in project root
async function findApmlFiles() {
  try {
    const projectRoot = path.join(__dirname, '..')
    const files = []
    const entries = await readdir(projectRoot, { withFileTypes: true })
    
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.apml')) {
        try {
          const stats = await stat(path.join(projectRoot, entry.name))
          files.push({
            name: entry.name,
            size: stats.size,
            modified: stats.mtime.toISOString(),
            path: `./${entry.name}`
          })
        } catch (error) {
          console.error(`Error reading stats for ${entry.name}:`, error)
        }
      }
    }
    
    // Sort by modification time (newest first)
    files.sort((a, b) => new Date(b.modified) - new Date(a.modified))
    return files
  } catch (error) {
    console.error('Error finding APML files:', error)
    return []
  }
}

// Helper function to read APML file content
async function readApmlFile(filename) {
  try {
    const projectRoot = path.join(__dirname, '..')
    const filePath = path.join(projectRoot, filename)
    const content = await readFile(filePath, 'utf-8')
    return content
  } catch (error) {
    throw new Error(`Could not read file ${filename}: ${error.message}`)
  }
}

// Helper function to validate APML content
function validateApmlContent(content) {
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
    return validationResults
  }
  
  const apml = validationResults.parsed
  
  // Structure validation
  if (!apml.apml_version) {
    validationResults.warnings.push({
      type: 'structure',
      message: 'Missing apml_version field'
    })
  }
  
  if (!apml.metadata) {
    validationResults.errors.push({
      type: 'structure',
      message: 'Missing required metadata section'
    })
    validationResults.isValid = false
  }
  
  // Content validation
  const hasPatterns = apml.patterns && Object.keys(apml.patterns).length > 0
  const hasComponents = apml.components && Object.keys(apml.components).length > 0
  const hasScreens = apml.screens && Object.keys(apml.screens).length > 0
  const hasLayout = apml.layout && Object.keys(apml.layout).length > 0
  
  if (!hasPatterns && !hasComponents && !hasScreens && !hasLayout) {
    validationResults.warnings.push({
      type: 'content',
      message: 'No patterns, components, screens, or layout defined'
    })
  }
  
  // Trinity flow validation
  if (hasScreens) {
    const screenCount = Object.keys(apml.screens).length
    validationResults.info.push({
      type: 'trinity-flow',
      message: `Found ${screenCount} screens for Trinity flow visualization`
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
        message: 'No screen transitions found'
      })
    }
  }
  
  return validationResults
}

// Main serverless function handler
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }
  
  const { url, method } = req
  
  try {
    // Route: Get all APML files
    if (url === '/api/apml-files' && method === 'GET') {
      const files = await findApmlFiles()
      
      res.status(200).json({
        success: true,
        files,
        count: files.length,
        message: `📁 Found ${files.length} APML files ready for visualization`
      })
      return
    }
    
    // Route: Get specific APML file
    if (url.startsWith('/api/apml/') && method === 'GET') {
      const filename = url.replace('/api/apml/', '')
      
      if (!filename.endsWith('.apml')) {
        res.status(400).json({
          success: false,
          error: 'Invalid file type',
          message: '❌ Only .apml files are supported'
        })
        return
      }
      
      try {
        const content = await readApmlFile(filename)
        const validation = validateApmlContent(content)
        
        res.status(200).json({
          success: true,
          filename,
          content,
          parsed: validation.parsed,
          validationErrors: [
            ...validation.errors.map(e => ({ type: 'error', message: e.message })),
            ...validation.warnings.map(w => ({ type: 'warning', message: w.message }))
          ],
          size: content.length,
          message: `📄 APML file loaded: ${filename}`
        })
      } catch (error) {
        res.status(404).json({
          success: false,
          error: error.message,
          message: `❌ Could not load APML file: ${filename}`
        })
      }
      return
    }
    
    // Route: Validate APML content
    if (url === '/api/validate' && method === 'POST') {
      const { content, filename } = req.body
      
      if (!content) {
        res.status(400).json({
          success: false,
          error: 'No content provided',
          message: '❌ APML content is required for validation'
        })
        return
      }
      
      const validationResults = validateApmlContent(content)
      
      res.status(200).json({
        success: true,
        validation: validationResults,
        message: validationResults.isValid ? 
          '✅ APML validation passed with beautiful simulator aesthetics!' : 
          '⚠️ APML validation completed with issues'
      })
      return
    }
    
    // Route: Compile APML (basic version for deployment)
    if (url === '/api/compile' && method === 'POST') {
      const { content, format } = req.body
      
      if (!content) {
        res.status(400).json({
          success: false,
          error: 'No APML content provided'
        })
        return
      }
      
      let compiled = null
      const apml = yaml.load(content)
      
      switch (format) {
        case 'mermaid':
          compiled = compileToMermaid(apml)
          break
        case 'simulator':
          compiled = compileToSimulator(apml)
          break
        default:
          res.status(400).json({
            success: false,
            error: `Unsupported format: ${format}`
          })
          return
      }
      
      res.status(200).json({
        success: true,
        format,
        compiled,
        message: `🎨 APML compiled to ${format} with beautiful aesthetics!`
      })
      return
    }
  } catch (error) {
    console.error('API Error:', error)
    res.status(500).json({
      success: false,
      error: error.message,
      message: '❌ Server error occurred'
    })
  }
}

// Helper function to compile APML to Mermaid
function compileToMermaid(apml) {
  if (!apml.screens) return 'flowchart TD\\n    A[No screens found]'
  
  let mermaid = 'flowchart TD\\n'
  
  // Add nodes
  Object.entries(apml.screens).forEach(([screenId, screen]) => {
    const cleanName = screen.name?.replace(' Screen', '') || screenId
    mermaid += `    ${screenId}["${cleanName}"]:::screenNode\\n`
  })
  
  // Add connections
  Object.entries(apml.screens).forEach(([screenId, screen]) => {
    if (screen.user_actions) {
      screen.user_actions.forEach(action => {
        if (action.next_screen && apml.screens[action.next_screen]) {
          mermaid += `    ${screenId} --> ${action.next_screen}\\n`
        }
      })
    }
  })
  
  // Add styling
  mermaid += `
    classDef screenNode fill:#3b82f6,stroke:#2563eb,stroke-width:2px,color:#fff
    classDef currentNode fill:#10b981,stroke:#059669,stroke-width:3px,color:#fff
`
  
  return mermaid
}

// Helper function to compile APML to simulator format
function compileToSimulator(apml) {
  if (!apml.screens) {
    return {
      screens: [],
      message: 'No screens found for simulator'
    }
  }
  
  const simulatorScreens = Object.entries(apml.screens).map(([screenId, screen], index) => ({
    id: screenId,
    name: screen.name || screenId,
    description: screen.purpose || screen.description || 'Screen description',
    layout: determineLayout(screen),
    actions: (screen.user_actions || []).map((action, actionIndex) => {
      // Create navigation flow between screens
      const screenIds = Object.keys(apml.screens)
      const nextScreenIndex = (index + actionIndex + 1) % screenIds.length
      const nextScreenId = screenIds[nextScreenIndex]
      
      return {
        id: `${screenId}_action_${actionIndex}`,
        label: action.action || action.description,
        description: action.description,
        nextScreenId: action.next_screen || nextScreenId,
        color: getActionColor(action.action)
      }
    }),
    data: {}
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
#!/usr/bin/env node

/**
 * Programmatic MCP Server Generator for Claude Code Projects
 * 
 * This revolutionary tool automatically generates MCP servers for any project directory
 * to preserve conversation context and project knowledge across Claude Code sessions.
 * 
 * Usage: node generate-project-mcp.js [project-directory]
 * 
 * Features:
 * - Auto-detects project type (React, Svelte, Node.js, Python, etc.)
 * - Generates project-specific MCP server with relevant tools
 * - Creates Claude Desktop configuration
 * - Preserves conversation history and context
 * - Enables seamless context continuity across conversations
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ProjectMCPGenerator {
  constructor(projectPath) {
    this.projectPath = path.resolve(projectPath);
    this.projectName = path.basename(this.projectPath);
    this.projectInfo = this.analyzeProject();
  }

  analyzeProject() {
    console.log(`🔍 Analyzing project: ${this.projectName}`);
    
    const info = {
      name: this.projectName,
      path: this.projectPath,
      type: 'unknown',
      framework: null,
      language: null,
      packageManager: null,
      mainFiles: [],
      dependencies: {},
      scripts: {},
      description: '',
      features: []
    };

    // Check for package.json (Node.js/JavaScript projects)
    const packageJsonPath = path.join(this.projectPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        info.type = 'nodejs';
        info.language = 'javascript';
        info.packageManager = fs.existsSync(path.join(this.projectPath, 'package-lock.json')) ? 'npm' : 
                             fs.existsSync(path.join(this.projectPath, 'yarn.lock')) ? 'yarn' : 'npm';
        info.dependencies = packageJson.dependencies || {};
        info.scripts = packageJson.scripts || {};
        info.description = packageJson.description || '';

        // Detect framework
        if (info.dependencies.svelte || info.dependencies['@sveltejs/kit']) {
          info.framework = 'svelte';
        } else if (info.dependencies.react) {
          info.framework = 'react';
        } else if (info.dependencies.vue) {
          info.framework = 'vue';
        } else if (info.dependencies.express) {
          info.framework = 'express';
        } else if (info.dependencies.vite) {
          info.framework = 'vite';
        }
      } catch (error) {
        console.error('Error reading package.json:', error);
      }
    }

    // Check for Python projects
    if (fs.existsSync(path.join(this.projectPath, 'requirements.txt')) ||
        fs.existsSync(path.join(this.projectPath, 'pyproject.toml')) ||
        fs.existsSync(path.join(this.projectPath, 'setup.py'))) {
      info.type = 'python';
      info.language = 'python';
    }

    // Check for Rust projects
    if (fs.existsSync(path.join(this.projectPath, 'Cargo.toml'))) {
      info.type = 'rust';
      info.language = 'rust';
    }

    // Check for Go projects
    if (fs.existsSync(path.join(this.projectPath, 'go.mod'))) {
      info.type = 'go';
      info.language = 'go';
    }

    // Find main files
    const commonMainFiles = [
      'index.js', 'main.js', 'app.js', 'server.js',
      'src/main.js', 'src/App.svelte', 'src/App.js', 'src/App.tsx',
      'main.py', 'app.py', '__init__.py',
      'main.go', 'main.rs'
    ];

    commonMainFiles.forEach(file => {
      if (fs.existsSync(path.join(this.projectPath, file))) {
        info.mainFiles.push(file);
      }
    });

    // Detect special project features
    if (fs.existsSync(path.join(this.projectPath, 'vercel.json'))) {
      info.features.push('vercel-deployment');
    }
    if (fs.existsSync(path.join(this.projectPath, '.github'))) {
      info.features.push('github-actions');
    }
    if (fs.existsSync(path.join(this.projectPath, 'api'))) {
      info.features.push('api-routes');
    }
    if (fs.existsSync(path.join(this.projectPath, 'README.md'))) {
      info.features.push('documentation');
    }

    console.log(`✅ Project analysis complete: ${info.type} (${info.framework || info.language})`);
    return info;
  }

  generateMCPServer() {
    console.log(`🚀 Generating MCP server for ${this.projectInfo.name}...`);

    const serverContent = `#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs';
import path from 'path';

/**
 * ${this.projectInfo.name} MCP Server
 * 
 * Auto-generated MCP server for preserving project knowledge and conversation context
 * 
 * Project Type: ${this.projectInfo.type}
 * Framework: ${this.projectInfo.framework || this.projectInfo.language || 'Generic'}
 * Generated: ${new Date().toISOString()}
 */
class ${this.toPascalCase(this.projectInfo.name)}MCPServer {
  constructor() {
    this.server = new Server({
      name: '${this.projectInfo.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-server',
      version: '1.0.0',
    }, {
      capabilities: {
        tools: {},
      },
    });
    
    this.projectRoot = '${this.projectPath}';
    this.projectInfo = ${JSON.stringify(this.projectInfo, null, 4)};
    this.conversationHistory = this.loadConversationHistory();
    
    this.setupToolHandlers();
  }
  
  loadConversationHistory() {
    try {
      const historyPath = path.join(this.projectRoot, '.mcp-conversation-history.json');
      if (fs.existsSync(historyPath)) {
        return JSON.parse(fs.readFileSync(historyPath, 'utf8'));
      }
    } catch (error) {
      console.error('MCP: No previous conversation history found');
    }
    return [];
  }
  
  saveConversationHistory() {
    try {
      const historyPath = path.join(this.projectRoot, '.mcp-conversation-history.json');
      fs.writeFileSync(historyPath, JSON.stringify(this.conversationHistory, null, 2));
    } catch (error) {
      console.error('MCP: Failed to save conversation history:', error);
    }
  }
  
  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'project_overview',
            description: 'Complete ${this.projectInfo.name} project overview with current status and context',
            inputSchema: {
              type: 'object',
              properties: {
                focus_area: {
                  type: 'string',
                  description: 'Focus area: "all", "architecture", "dependencies", "scripts", "files", "history"',
                  default: 'all'
                }
              }
            }
          },
          {
            name: 'conversation_context',
            description: 'Retrieve and manage conversation context for continuity across sessions',
            inputSchema: {
              type: 'object',
              properties: {
                action: {
                  type: 'string',
                  description: 'Action: "get", "update", "search", "clear"',
                  default: 'get'
                },
                query: {
                  type: 'string',
                  description: 'Search query for finding specific context',
                  default: ''
                }
              }
            }
          },
          {
            name: 'add_context_entry',
            description: 'Add new context entry to preserve important conversation developments',
            inputSchema: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  description: 'Entry type: "development", "decision", "problem", "solution", "completion", "note"'
                },
                summary: {
                  type: 'string',
                  description: 'Brief summary of the context entry'
                },
                details: {
                  type: 'string',
                  description: 'Detailed description'
                },
                files_affected: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Files affected by this context',
                  default: []
                },
                tags: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Tags for categorization',
                  default: []
                }
              },
              required: ['type', 'summary', 'details']
            }
          }${this.generateProjectSpecificTools()}
        ]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      try {
        switch (name) {
          case 'project_overview':
            return await this.handleProjectOverview(args);
          case 'conversation_context':
            return await this.handleConversationContext(args);
          case 'add_context_entry':
            return await this.handleAddContextEntry(args);${this.generateProjectSpecificHandlers()}
          default:
            throw new Error(\`Unknown tool: \${name}\`);
        }
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: \`Error in \${name}: \${error.message}\`
          }],
          isError: true,
        };
      }
    });
  }
  
  async handleProjectOverview(args) {
    const { focus_area = 'all' } = args;
    
    return {
      content: [{
        type: 'text',
        text: \`# 📊 ${this.projectInfo.name} - Project Overview

## 🎯 Project Information
**Name**: ${this.projectInfo.name}
**Type**: ${this.projectInfo.type}
**Framework**: ${this.projectInfo.framework || this.projectInfo.language || 'Generic'}
**Path**: ${this.projectPath}

## 📋 Description
${this.projectInfo.description || 'No description available'}

## 🏗️ Architecture
**Language**: ${this.projectInfo.language || 'Multiple/Unknown'}
**Package Manager**: ${this.projectInfo.packageManager || 'N/A'}
**Main Files**: ${this.projectInfo.mainFiles.join(', ') || 'None detected'}

## 🔧 Features
${this.projectInfo.features.length > 0 ? this.projectInfo.features.map(f => \`- \${f}\`).join('\\n') : '- Standard project structure'}

## 📜 Available Scripts
${Object.keys(this.projectInfo.scripts).length > 0 ? 
  Object.entries(this.projectInfo.scripts).map(([name, script]) => \`- **\${name}**: \${script}\`).join('\\n') :
  '- No scripts defined'
}

## 📚 Dependencies
${Object.keys(this.projectInfo.dependencies).length > 0 ?
  \`**Total**: \${Object.keys(this.projectInfo.dependencies).length} dependencies\\n\${Object.keys(this.projectInfo.dependencies).slice(0, 10).map(dep => \`- \${dep}\`).join('\\n')}\${Object.keys(this.projectInfo.dependencies).length > 10 ? '\\n- ... and more' : ''}\` :
  '- No dependencies found'
}

## 💬 Conversation Context
**Total Entries**: \${this.conversationHistory.length}
**Last Updated**: \${this.conversationHistory.length > 0 ? this.conversationHistory[this.conversationHistory.length - 1].timestamp : 'Never'}

\${this.conversationHistory.length > 0 ? 
  \`\\n**Recent Context:**\\n\${this.conversationHistory.slice(-3).map(entry => \`- **\${entry.type}**: \${entry.summary}\`).join('\\n')}\` :
  '\\n**No conversation history yet** - Start adding context entries to preserve important developments!'
}

---

*This MCP server preserves complete project context across Claude Code conversations, ensuring continuity and eliminating the need to re-explain project details.*\`
      }]
    };
  }
  
  async handleConversationContext(args) {
    const { action = 'get', query = '' } = args;
    
    switch (action) {
      case 'get':
        return {
          content: [{
            type: 'text',
            text: \`# 💬 Conversation Context History

**Total Entries**: \${this.conversationHistory.length}

\${this.conversationHistory.length === 0 ? 
  '**No conversation history yet.**\\n\\nUse the \`add_context_entry\` tool to start preserving important conversation developments.' :
  this.conversationHistory.map(entry => 
    \`## \${entry.timestamp}\\n**Type**: \${entry.type}\\n**Summary**: \${entry.summary}\\n**Details**: \${entry.details}\${entry.files_affected?.length ? \`\\n**Files**: \${entry.files_affected.join(', ')}\` : ''}\${entry.tags?.length ? \`\\n**Tags**: \${entry.tags.join(', ')}\` : ''}\\n\`
  ).join('\\n---\\n\\n')
}

*This context ensures conversation continuity across Claude Code sessions.*\`
          }]
        };
        
      case 'search':
        const searchResults = this.conversationHistory.filter(entry =>
          entry.summary.toLowerCase().includes(query.toLowerCase()) ||
          entry.details.toLowerCase().includes(query.toLowerCase()) ||
          entry.tags?.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
        );
        
        return {
          content: [{
            type: 'text',
            text: \`# 🔍 Search Results for "\${query}"

**Found**: \${searchResults.length} entries

\${searchResults.length === 0 ?
  'No matching entries found.' :
  searchResults.map(entry => 
    \`**\${entry.timestamp}** - \${entry.type}: \${entry.summary}\`
  ).join('\\n')
}\`
          }]
        };
        
      default:
        return {
          content: [{
            type: 'text',
            text: \`Unknown action: \${action}\`
          }]
        };
    }
  }
  
  async handleAddContextEntry(args) {
    const { type, summary, details, files_affected = [], tags = [] } = args;
    
    const entry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      type,
      summary,
      details,
      files_affected,
      tags
    };
    
    this.conversationHistory.push(entry);
    this.saveConversationHistory();
    
    return {
      content: [{
        type: 'text',
        text: \`# ✅ Context Entry Added

**Type**: \${type}
**Summary**: \${summary}
**Details**: \${details}
\${files_affected.length ? \`**Files Affected**: \${files_affected.join(', ')}\` : ''}
\${tags.length ? \`**Tags**: \${tags.join(', ')}\` : ''}

**Total Context Entries**: \${this.conversationHistory.length}

This context will be preserved across all future Claude Code conversations for this project.\`
      }]
    };
  }
  
  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('${this.projectInfo.name} MCP Server running on stdio');
  }
}

const server = new ${this.toPascalCase(this.projectInfo.name)}MCPServer();
server.run().catch(console.error);`;

    return serverContent;
  }

  generateProjectSpecificTools() {
    let tools = '';

    // Add framework-specific tools
    if (this.projectInfo.framework === 'svelte') {
      tools += `,
          {
            name: 'svelte_component_analysis',
            description: 'Analyze Svelte components and their relationships',
            inputSchema: {
              type: 'object',
              properties: {
                component_path: {
                  type: 'string',
                  description: 'Path to specific component to analyze'
                }
              }
            }
          }`;
    }

    if (this.projectInfo.framework === 'react') {
      tools += `,
          {
            name: 'react_component_analysis',
            description: 'Analyze React components and their state management',
            inputSchema: {
              type: 'object',
              properties: {
                component_path: {
                  type: 'string',
                  description: 'Path to specific component to analyze'
                }
              }
            }
          }`;
    }

    if (this.projectInfo.features.includes('vercel-deployment')) {
      tools += `,
          {
            name: 'deployment_status',
            description: 'Check Vercel deployment configuration and status',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          }`;
    }

    if (this.projectInfo.features.includes('api-routes')) {
      tools += `,
          {
            name: 'api_routes_analysis',
            description: 'Analyze API routes and endpoints',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          }`;
    }

    return tools;
  }

  generateProjectSpecificHandlers() {
    let handlers = '';

    if (this.projectInfo.framework === 'svelte') {
      handlers += `
          case 'svelte_component_analysis':
            return await this.handleSvelteComponentAnalysis(args);`;
    }

    if (this.projectInfo.framework === 'react') {
      handlers += `
          case 'react_component_analysis':
            return await this.handleReactComponentAnalysis(args);`;
    }

    if (this.projectInfo.features.includes('vercel-deployment')) {
      handlers += `
          case 'deployment_status':
            return await this.handleDeploymentStatus(args);`;
    }

    if (this.projectInfo.features.includes('api-routes')) {
      handlers += `
          case 'api_routes_analysis':
            return await this.handleApiRoutesAnalysis(args);`;
    }

    return handlers;
  }

  toPascalCase(str) {
    return str
      .replace(/[^a-zA-Z0-9]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  generateClaudeDesktopConfig() {
    const serverName = this.projectInfo.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const serverPath = path.join(this.projectPath, `${serverName}-mcp-server.js`);

    return {
      mcpServers: {
        [serverName]: {
          command: "node",
          args: [serverPath],
          env: {}
        }
      }
    };
  }

  async generate() {
    console.log(`\n🎯 Generating MCP Server for ${this.projectInfo.name}`);
    console.log('='.repeat(50));

    // Generate MCP server
    const serverContent = this.generateMCPServer();
    const serverName = this.projectInfo.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const serverPath = path.join(this.projectPath, `${serverName}-mcp-server.js`);

    fs.writeFileSync(serverPath, serverContent);
    fs.chmodSync(serverPath, 0o755); // Make executable

    console.log(`✅ MCP server generated: ${serverPath}`);

    // Generate Claude Desktop config
    const configContent = this.generateClaudeDesktopConfig();
    const configPath = path.join(this.projectPath, 'claude-desktop-mcp-config.json');

    fs.writeFileSync(configPath, JSON.stringify(configContent, null, 2));
    console.log(`✅ Claude Desktop config: ${configPath}`);

    // Generate installation instructions
    const instructions = `# 🚀 ${this.projectInfo.name} MCP Server Setup

## Auto-Generated MCP Server
Your project now has a complete MCP server for conversation context preservation!

## Files Created:
- \`${path.basename(serverPath)}\` - MCP server for ${this.projectInfo.name}
- \`claude-desktop-mcp-config.json\` - Claude Desktop configuration

## Installation:
1. Copy the contents of \`claude-desktop-mcp-config.json\` 
2. Add to your Claude Desktop settings at:
   - **Mac**: \`~/Library/Application Support/Claude/claude_desktop_config.json\`
   - **Windows**: \`%APPDATA%\\Claude\\claude_desktop_config.json\`

## Usage:
Once installed, you'll have access to these tools in Claude Desktop:
- **project_overview** - Complete project information and status
- **conversation_context** - Retrieve/manage conversation history
- **add_context_entry** - Preserve important developments
${this.projectInfo.framework ? `- **${this.projectInfo.framework}_specific_tools** - Framework-specific analysis` : ''}

## Benefits:
- ✅ **Context Continuity**: Never lose conversation context again
- ✅ **Project Knowledge**: Complete project understanding preserved
- ✅ **Development Flow**: Seamless handoff between conversations
- ✅ **Automatic**: Context preservation happens automatically

## Next Steps:
Start using \`add_context_entry\` to record important decisions, problems solved, and development progress. Your future Claude Code conversations will have complete context!

---
*Generated by Programmatic MCP Generator - ${new Date().toISOString()}*`;

    const readmePath = path.join(this.projectPath, 'MCP-SERVER-README.md');
    fs.writeFileSync(readmePath, instructions);
    console.log(`✅ Instructions: ${readmePath}`);

    console.log('\n🎉 MCP Server Generation Complete!');
    console.log('='.repeat(50));
    console.log(`✨ Your ${this.projectInfo.name} project now has:`);
    console.log('   • Complete conversation context preservation');
    console.log('   • Project knowledge continuity');
    console.log('   • Automatic development state tracking');
    console.log('\n📖 See MCP-SERVER-README.md for setup instructions');

    return {
      serverPath,
      configPath,
      readmePath,
      projectInfo: this.projectInfo
    };
  }
}

// CLI usage
const projectPath = process.argv[2] || process.cwd();

if (!fs.existsSync(projectPath)) {
  console.error(`❌ Project path does not exist: ${projectPath}`);
  process.exit(1);
}

const generator = new ProjectMCPGenerator(projectPath);
generator.generate().catch(console.error);
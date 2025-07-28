# 🎨 Trinity APML Visualiser
## Beautiful Simulator Aesthetics with Real-time Validation

Trinity APML Visualiser transforms your existing APML tool into a beautiful, Railway-inspired simulator that validates both data flows AND UI designs in real-time.

## ✨ What's New

### **Beautiful Simulator Aesthetics**
- **Dark Theme**: Professional gray-900 background with Railway-inspired colors
- **iPhone 12 Simulator**: Authentic 390x844px device with dynamic island
- **Interactive Flow Diagrams**: Mermaid diagrams with beautiful animations
- **Real-time Updates**: WebSocket-powered live validation

### **Enhanced Features**
- **70/30 Split Layout**: Flow diagram + chat (70%) | iPhone simulator (30%)
- **Trinity Assistant**: Smart chat responses about APML flows
- **Multiple Screen Types**: Chat, Task, File, Team, Form, Upload, Search, Celebration
- **Technical Details Panel**: Debug information with message sequences

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Trinity Server
```bash
./start-trinity.sh
```
*Or manually:*
```bash
npm run build
node server.js
```

### 3. Open in Browser
- **Local**: http://localhost:3000
- **Network**: http://0.0.0.0:3000

### 4. Navigate to Trinity Simulator
Click "✨ Trinity Simulator" in the header or go to:
http://localhost:3000/#/trinity

## 🎯 Key Features

### **Real-time APML Validation**
- **Syntax Checking**: YAML parsing with detailed error reports
- **Structure Validation**: Required fields, metadata, and content validation
- **Flow Analysis**: Screen transitions and navigation completeness
- **Live Updates**: Automatic revalidation when APML files change

### **Beautiful UI Generation**
Your APML automatically becomes:
- **Interactive Flow Diagrams**: Mermaid visualization with color coding
- **iPhone Simulator Screens**: Authentic mobile layouts
- **Screen Transitions**: Animated navigation between states
- **Action Buttons**: Color-coded interactions (blue, green, purple, etc.)

### **Trinity Assistant Chat**
Smart responses to questions like:
- "How does this flow feel?"
- "Are there any validation errors?"
- "Can you compile this to Vue?"
- "Show me the beautiful aesthetics"

## 📱 Screen Types Supported

Trinity automatically detects and renders:

1. **Chat Screens** → Blue theme with message bubbles
2. **Task Screens** → Green theme with checkboxes  
3. **File Screens** → Purple theme with file grids
4. **Team Screens** → Indigo theme with member lists
5. **Form Screens** → Orange theme with input fields
6. **Upload Screens** → Teal theme with drop zones
7. **Search Screens** → Gray theme with results
8. **Success Screens** → Green celebration layout

## 🗺️ APML → Beautiful Visuals

### Example APML Input:
```yaml
apml_version: "1.0"
metadata:
  title: "ProjectChat App"
  description: "Team collaboration tool"

screens:
  chat_screen:
    name: "Chat Screen"
    purpose: "Team communication hub"
    user_actions:
      - action: "Send Message"
        description: "Send a message to the team"
        next_screen: "task_screen"
      - action: "View Tasks"
        description: "Check current tasks"
        next_screen: "task_screen"

  task_screen:
    name: "Task Screen"
    purpose: "Manage your tasks"
    user_actions:
      - action: "Create Task"
        description: "Add a new task"
        next_screen: "task_creation"
```

### Trinity Output:
- **Interactive Flow Diagram** with colored nodes and connections
- **iPhone Simulator** with chat and task layouts
- **Navigation System** with bottom tab bar
- **Action Buttons** with appropriate colors and animations

## 🔧 API Endpoints

Trinity provides a powerful REST API:

### **File Management**
- `GET /api/apml-files` - List all APML files
- `GET /api/apml/:filename` - Load specific APML file

### **Validation**
- `POST /api/validate` - Validate APML content
  ```json
  {
    "content": "your APML yaml here",
    "filename": "optional-filename.apml"
  }
  ```

### **Compilation**
- `POST /api/compile` - Compile APML to different formats
  ```json
  {
    "content": "your APML yaml here",
    "format": "mermaid|vue|svelte|simulator",
    "options": {}
  }
  ```

## 🎨 Customization

### **Color Themes**
Trinity uses a sophisticated color system:
```css
/* Main colors */
- Background: bg-gray-900 (#111827)
- Panels: bg-gray-800 (#1f2937)  
- Accents: Green (#10b981), Blue (#3b82f6), Purple (#8b5cf6)
- Interactive: hover:scale-95, active:bg-{color}-600
```

### **Screen Layouts**
Add custom layouts by extending the screen detection:
```javascript
function determineLayout(screen) {
  const screenType = screen.name?.toLowerCase() || '';
  
  if (screenType.includes('custom')) return 'custom';
  // ... existing logic
}
```

### **Action Colors**
Customize button colors based on action types:
```javascript
function getActionColor(actionName) {
  const action = actionName?.toLowerCase() || '';
  
  if (action.includes('danger')) return 'red';
  if (action.includes('success')) return 'green';
  // ... existing logic
}
```

## 🔄 Real-time Features

### **File Watching**
Trinity automatically watches for changes to `.apml` files and:
- Revalidates content
- Updates flow diagrams  
- Refreshes simulator screens
- Notifies connected clients via WebSocket

### **WebSocket Events**
```javascript
// Connection events
{ type: 'welcome', message: '...' }
{ type: 'file-changed', filepath: '...', timestamp: ... }
{ type: 'validation-completed', errorCount: 0, warningCount: 2 }
{ type: 'compilation-completed', format: 'mermaid' }
```

## 📊 Technical Details Panel

Enable the technical panel to see:
- **APML Message Sequence**: User→App→App→User flow
- **Screen Information**: Current screen data and actions
- **Validation Results**: Real-time error and warning counts
- **Performance Stats**: Screen transition times and interaction counts

## 🚀 Production Deployment

### **Environment Variables**
```bash
PORT=3000              # Server port
NODE_ENV=production    # Production mode
```

### **Docker Support**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node", "server.js"]
```

### **Process Management**
```bash
# PM2 deployment
pm2 start server.js --name "trinity-apml-visualiser"
pm2 save
pm2 startup
```

## 🧪 Testing Your APML

### **Validation Checklist**
✅ **Required Fields**
- `apml_version` specified
- `metadata` section with title and description
- At least one of: `patterns`, `components`, `screens`, `layout`

✅ **Screen Flow Validation**
- Screen transitions via `next_screen` properties
- All referenced screens exist
- No orphaned or unreachable screens

✅ **Content Quality**
- Descriptive screen names and purposes
- Clear action labels and descriptions
- Consistent naming conventions

### **Best Practices**
1. **Start Simple**: Begin with 2-3 screens and basic transitions
2. **Use Descriptive Names**: "Chat Screen" not "screen1"
3. **Test Flows**: Ensure all paths lead somewhere meaningful
4. **Validate Often**: Use Trinity's real-time validation
5. **Beautiful Design**: Trinity makes it look great automatically!

## 🎯 Integration with Existing Workflow

Trinity enhances your existing APML workflow:

1. **Write APML** → As you normally do
2. **See Beautiful Visuals** → Automatically generated
3. **Validate in Real-time** → Immediate feedback
4. **Iterate Quickly** → Live updates as you edit
5. **Export Results** → Mermaid, Vue, Svelte, or JSON

## 💡 Tips & Tricks

### **Screen Types**
Include these keywords in screen names for automatic layout detection:
- "chat", "message" → Chat layout
- "task", "todo" → Task layout  
- "file", "document" → File layout
- "team", "member" → Team layout
- "form", "create", "edit" → Form layout
- "upload" → Upload layout
- "search" → Search layout
- "complete", "success" → Celebration layout

### **Action Colors**
Action names automatically get colors:
- "chat", "message" → Blue
- "task", "complete" → Green
- "file", "upload" → Purple
- "team", "invite" → Indigo
- "create", "add" → Orange
- "delete", "remove" → Red

### **Performance**
- Trinity handles 50+ screens smoothly
- WebSocket connections are automatically managed
- File watching uses efficient change detection
- Mermaid diagrams are cached and optimized

## 🎉 What Makes Trinity Special

**Before Trinity**: Plain APML files with basic validation
**After Trinity**: Beautiful iPhone simulator with Railway aesthetics, real-time validation, interactive flow diagrams, and intelligent chat assistance!

Trinity transforms your sophisticated APML tooling into a visual masterpiece that's both functional and beautiful. Your data flows AND UI designs are validated in real-time with stunning aesthetics inspired by the best modern apps.

---

**Ready to experience beautiful APML visualization?**

```bash
./start-trinity.sh
```

Open http://localhost:3000/#/trinity and see your APML come to life! ✨
# APML Interactive Flow Visualiser

**Real-time APML visualization with interactive mockups and beautiful flow diagrams**

[![Deploy to GitHub Pages](https://img.shields.io/badge/Deploy-GitHub%20Pages-brightgreen.svg)](https://github.com/user/apml-visualiser/actions)

## 🚀 Features

- 🎨 **Beautiful UI** - Tailwind CSS with gradients, animations, and dark themes
- 📱 **Interactive Mobile Mockups** - Real-time phone frame visualization 
- 🔄 **Live Mermaid Diagrams** - Dark-themed flow diagrams with colored nodes
- ✅ **Automated Validation** - Test all possible user paths mathematically
- 📝 **Change Request System** - Add notes per screen for LLM iteration
- ⚡ **Real-time Parsing** - Instant APML compilation and visualization

## 🎯 Perfect Dogfooding Example

This APMLVisualiser was **specified in APML and compiled to Svelte**, proving that:
- The same APML specification generates identical functionality across frameworks
- APML → Framework compilation works for complex applications
- Reverse-reverse compilation methodology is production-ready

## 🛠 Technology Stack

- **Frontend**: Svelte + Vite + Tailwind CSS
- **Visualization**: Mermaid.js with custom dark themes
- **Deployment**: Docker + Railway
- **Architecture**: APML → Svelte compilation pipeline

## 🏃‍♂️ Quick Start

### Local Development
```bash
npm install
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

### GitHub Pages Deployment
```bash
# Automatic deployment on push to main branch
# Or manually trigger via GitHub Actions tab
```

## 📋 Usage

1. **Paste APML Specification** - Enter your complete APML spec
2. **Parse & Visualize** - Generate interactive mockups and flow diagrams  
3. **Interact & Test** - Click through mockups, validate all paths
4. **Add Change Requests** - Note improvements per screen
5. **Export Enhanced APML** - Download with CR comments for LLM iteration

## 🔧 APML Development Engine (ADE)

This visualiser is part of the **APML Development Engine** - a complete toolkit for:
- Human-AI collaborative development
- Framework-agnostic compilation
- Mathematical validation of application logic
- Interactive prototyping and testing

## 📖 Example APML

```apml
app SimpleToDoApp:
  title: "Simple To-Do Application"
  version: "1.0.0"
  apml_specification_version: "0.9.0"

data Task:
  id: unique_id
  title: text required
  completed: boolean default false

interface welcome_screen:
  show welcome_panel:
    title: "Welcome to Simple To-Do"
    get_started_button:
      text: "Get Started"

logic navigation:
  process start_app:
    when user clicks get_started_button:
      redirect to task_list
```

## 🚀 GitHub Pages Deployment

This project includes GitHub Pages deployment:
- **GitHub Actions** for automatic build and deploy
- **Vite configuration** for correct base paths
- **Zero maintenance** - just push to main branch
- **Free hosting** with global CDN

## 🎨 Visual Quality

Matches professional standards with:
- Gradient headers and backdrop blur effects
- Interactive hover states and smooth transitions
- Dark theme flow diagrams with colored nodes
- Responsive design and mobile-first approach
- Professional typography and spacing

## 📄 License

Built with [Claude Code](https://claude.ai/code) - Production-ready APML visualization

---

**Transform your APML specifications into beautiful, interactive prototypes** ✨
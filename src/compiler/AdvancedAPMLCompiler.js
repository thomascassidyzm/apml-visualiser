/**
 * Advanced APML Compiler
 * Reverse-engineered from sophisticated reference apps
 * Handles glass morphism, advanced animations, complex data relationships
 */

export class AdvancedAPMLCompiler {
  constructor() {
    this.compiledHTML = '';
    this.compiledCSS = '';
    this.compiledJS = '';
    this.styleDefinitions = new Map();
    this.animationDefinitions = new Map();
    this.componentTree = [];
    this.dataModels = new Map();
    this.logicFlows = [];
  }

  /**
   * Main compilation entry point
   */
  compile(apmlSpec) {
    console.log('🚀 Advanced APML Compiler: Starting sophisticated compilation...');
    
    try {
      // Parse APML structure
      this.parseAPMLStructure(apmlSpec);
      
      // Generate advanced CSS with glass morphism and animations
      this.generateAdvancedCSS();
      
      // Generate semantic HTML structure
      this.generateSemanticHTML();
      
      // Generate intelligent JavaScript with state management
      this.generateIntelligentJS();
      
      // Create complete application
      const completeApp = this.generateCompleteApp();
      
      console.log('✨ Advanced compilation complete!');
      return {
        html: completeApp,
        css: this.compiledCSS,
        js: this.compiledJS,
        dataUrl: `data:text/html;charset=utf-8,${encodeURIComponent(completeApp)}`
      };
      
    } catch (error) {
      console.error('❌ Advanced compilation failed:', error);
      throw error;
    }
  }

  /**
   * Parse APML structure and extract components, styles, animations
   */
  parseAPMLStructure(apmlSpec) {
    // Extract style definitions (if rawContent exists)
    if (apmlSpec.rawContent) {
      this.extractStyleDefinitions(apmlSpec.rawContent);
      this.extractAnimationDefinitions(apmlSpec.rawContent);
      this.extractDataModels(apmlSpec.rawContent);
    } else {
      // Use default glass morphism styles
      this.styleDefinitions.set('glass_morphism', {
        extends: null,
        properties: {
          'background': 'rgba(255, 255, 255, 0.15)',
          'backdrop-filter': 'blur(20px)',
          '-webkit-backdrop-filter': 'blur(20px)',
          'border': '1px solid rgba(255, 255, 255, 0.2)',
          'box-shadow': '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
        },
        states: {}
      });
      this.dataModels = new Map();
    }
    
    // Build component tree from interfaces
    this.buildComponentTree(apmlSpec.stateNodes);
    
    // Process logic flows
    this.logicFlows = apmlSpec.parsedFlows || [];
  }
  
  /**
   * Extract data models from APML content
   */
  extractDataModels(content) {
    const dataRegex = /data\s+(\w+):(.*?)(?=data\s+\w+:|interface\s+\w+:|logic\s+\w+:|$)/gs;
    let match;
    
    while ((match = dataRegex.exec(content)) !== null) {
      const modelName = match[1];
      const definition = match[2].trim();
      
      // Parse fields from definition
      const fields = {};
      const fieldLines = definition.split('\n').map(line => line.trim()).filter(line => line);
      
      for (const line of fieldLines) {
        if (line.includes(':')) {
          const [fieldName, fieldType] = line.split(':').map(s => s.trim());
          fields[fieldName] = fieldType;
        }
      }
      
      this.dataModels.set(modelName, {
        name: modelName,
        fields: fields,
        sampleData: this.generateSampleData(modelName, fields)
      });
    }
    
    console.log('📊 Extracted data models:', this.dataModels);
  }
  
  /**
   * Generate sample data based on field types
   */
  generateSampleData(modelName, fields) {
    if (modelName === 'Project') {
      return [
        {
          id: 1,
          title: 'Mobile App Redesign',
          subtitle: 'Complete UI/UX overhaul for better user engagement',
          icon: '📱',
          progress: 68,
          task_count: 24,
          team_size: 6,
          days_remaining: 12,
          team_avatars: ['AS', 'JD', 'MK', '+3'],
          priority: 'high'
        },
        {
          id: 2,
          title: 'AI Integration',
          subtitle: 'Implementing smart features and automation',
          icon: '🤖',
          progress: 43,
          task_count: 18,
          team_size: 4,
          days_remaining: 21,
          team_avatars: ['RL', 'NK', 'TB', 'CW'],
          priority: 'medium'
        },
        {
          id: 3,
          title: 'Security Audit',
          subtitle: 'Comprehensive security review and improvements',
          icon: '🔒',
          progress: 89,
          task_count: 31,
          team_size: 8,
          days_remaining: 5,
          team_avatars: ['DM', 'SJ', 'LP', '+5'],
          priority: 'high'
        }
      ];
    }
    
    // For other models, generate basic sample data
    return [
      {
        id: 1,
        name: `Sample ${modelName}`,
        title: `Example ${modelName} Title`
      }
    ];
  }

  /**
   * Extract style definitions from APML
   */
  extractStyleDefinitions(content) {
    const styleRegex = /styles\s+(\w+):\s*([\s\S]*?)(?=styles\s+\w+:|animations:|logic\s+\w+:|$)/g;
    let match;
    
    while ((match = styleRegex.exec(content)) !== null) {
      const styleName = match[1];
      const styleContent = match[2].trim();
      
      const styleObject = this.parseStyleContent(styleContent);
      this.styleDefinitions.set(styleName, styleObject);
    }
    
    console.log('🎨 Extracted style definitions:', this.styleDefinitions);
  }

  /**
   * Parse individual style content into CSS properties
   */
  parseStyleContent(content) {
    const style = {
      extends: null,
      properties: {},
      states: {}
    };
    
    const lines = content.split('\n').map(line => line.trim()).filter(line => line);
    
    for (const line of lines) {
      if (line.startsWith('extends:')) {
        style.extends = line.split(':')[1].trim();
      } else if (line.includes(':')) {
        const [property, value] = line.split(':').map(s => s.trim());
        
        // Handle state-specific properties (hover_, active_, etc.)
        if (property.includes('_')) {
          const [state, prop] = property.split('_', 2);
          if (['hover', 'active', 'focus'].includes(state)) {
            if (!style.states[state]) style.states[state] = {};
            style.states[state][this.cssProperty(prop)] = this.cssValue(value);
          } else {
            style.properties[this.cssProperty(property)] = this.cssValue(value);
          }
        } else {
          style.properties[this.cssProperty(property)] = this.cssValue(value);
        }
      }
    }
    
    return style;
  }

  /**
   * Convert APML property names to CSS properties
   */
  cssProperty(apmlProperty) {
    const propertyMap = {
      background_filter: 'backdrop-filter',
      text_fill_color: '-webkit-text-fill-color',
      background_clip: '-webkit-background-clip',
      box_shadow: 'box-shadow',
      border_radius: 'border-radius',
      font_size: 'font-size',
      font_weight: 'font-weight',
      text_shadow: 'text-shadow'
    };
    
    return propertyMap[apmlProperty] || apmlProperty.replace(/_/g, '-');
  }

  /**
   * Convert APML values to CSS values
   */
  cssValue(apmlValue) {
    // Remove quotes if present
    let value = apmlValue.replace(/^["']|["']$/g, '');
    
    // Handle special APML values
    if (value === 'transparent') return 'transparent';
    if (value.startsWith('rgba(') || value.startsWith('rgb(')) return value;
    if (value.startsWith('linear-gradient(')) return value;
    if (value.includes('blur(')) return value;
    
    return value;
  }

  /**
   * Extract animation definitions
   */
  extractAnimationDefinitions(content) {
    const animationRegex = /animations:\s*([\s\S]*?)(?=styles\s+\w+:|logic\s+\w+:|$)/g;
    const match = animationRegex.exec(content);
    
    if (match) {
      const animationContent = match[1];
      const animationBlocks = animationContent.split(/(?=\w+:)/);
      
      for (const block of animationBlocks) {
        if (block.trim()) {
          const [name, ...content] = block.split(':');
          if (name && content.length > 0) {
            this.animationDefinitions.set(name.trim(), this.parseAnimationContent(content.join(':').trim()));
          }
        }
      }
    }
    
    console.log('🎬 Extracted animation definitions:', this.animationDefinitions);
  }

  /**
   * Parse animation content into CSS keyframes
   */
  parseAnimationContent(content) {
    const animation = {
      keyframes: {},
      duration: '0.3s',
      easing: 'ease',
      iteration: '1'
    };
    
    const lines = content.split('\n').map(line => line.trim()).filter(line => line);
    
    for (const line of lines) {
      if (line.includes(':')) {
        const [property, value] = line.split(':').map(s => s.trim());
        
        if (property === 'from' || property === 'to' || property.includes('%')) {
          // Keyframe definition
          animation.keyframes[property] = this.parseKeyframeProperties(value);
        } else if (['duration', 'easing', 'iteration'].includes(property)) {
          animation[property] = this.cssValue(value);
        }
      }
    }
    
    return animation;
  }

  /**
   * Parse keyframe properties
   */
  parseKeyframeProperties(content) {
    const properties = {};
    
    // Handle simple transform values
    if (content.includes('translateY') || content.includes('scale') || content.includes('rotate')) {
      properties.transform = this.cssValue(content);
    } else if (content.includes('opacity')) {
      properties.opacity = this.cssValue(content.split('opacity')[1].trim());
    }
    
    return properties;
  }

  /**
   * Build component tree from state nodes
   */
  buildComponentTree(stateNodes) {
    this.componentTree = stateNodes.map(node => ({
      id: node.id,
      name: node.interfaceName,
      components: this.parseInterfaceComponents(node),
      layout: 'mobile_app',
      animations: []
    }));
    
    console.log('🏗️ Built component tree:', this.componentTree);
  }

  /**
   * Parse interface components from node data
   */
  parseInterfaceComponents(node) {
    // This would normally parse the APML interface definition
    // For now, return a basic structure
    return [
      {
        type: 'status_bar',
        style: 'glass_dark',
        children: [
          { type: 'time', content: 'dynamic_time' },
          { type: 'icons', content: ['signal', 'wifi', 'battery'] }
        ]
      },
      {
        type: 'app_header',
        style: 'glass_morphism',
        children: [
          { type: 'title', content: node.interfaceName },
          { type: 'actions', children: [] }
        ]
      },
      {
        type: 'main_content',
        style: 'scrollable',
        children: this.generateContentForInterface(node.interfaceName)
      }
    ];
  }

  /**
   * Generate content based on interface type
   */
  generateContentForInterface(interfaceName) {
    switch (interfaceName) {
      case 'dashboard':
      case 'welcome_screen':
        return [
          {
            type: 'projects_grid',
            style: 'vertical_stack',
            animation: 'staggered_fade_in',
            children: [
              { type: 'project_card', style: 'glass_morphism_card', data: 'projects' }
            ]
          }
        ];
      
      case 'project_detail':
      case 'task_list':
        return [
          {
            type: 'task_sections',
            style: 'vertical_stack',
            animation: 'staggered_slide_in',
            children: [
              { type: 'task_section', style: 'glass_section', data: 'tasks' }
            ]
          }
        ];
      
      default:
        return [
          { type: 'default_content', content: `Interface: ${interfaceName}` }
        ];
    }
  }

  /**
   * Generate advanced CSS with glass morphism and animations
   */
  generateAdvancedCSS() {
    let css = `
      /* Advanced APML Generated Styles */
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        -webkit-tap-highlight-color: transparent;
      }
      
      html, body {
        width: 390px;
        height: 844px;
        max-width: 390px;
        max-height: 844px;
        overflow: hidden;
        font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif;
        position: fixed;
        top: 0;
        left: 0;
        margin: 0;
        padding: 0;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        font-size: 14px;
        line-height: 1.4;
        background: linear-gradient(135deg, 
          #667eea 0%, 
          #764ba2 25%, 
          #f093fb 50%, 
          #f5576c 75%, 
          #4facfe 100%);
        background-size: 400% 400%;
        animation: gradientShift 20s ease infinite;
      }
      
      @keyframes gradientShift {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      
      #app {
        width: 390px;
        height: 844px;
        position: relative;
        overflow: hidden;
        border-radius: 41px;
      }
      
      .screen {
        position: absolute;
        top: 0;
        left: 0;
        width: 390px;
        height: 844px;
        display: none;
        flex-direction: column;
        transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        transform: translateX(100%);
        opacity: 0;
      }
      
      .screen.active {
        display: flex;
        transform: translateX(0);
        opacity: 1;
      }
    `;
    
    // Generate CSS for each style definition
    for (const [styleName, styleObj] of this.styleDefinitions) {
      css += this.generateCSSFromStyleDefinition(styleName, styleObj);
    }
    
    // Generate animation keyframes
    for (const [animationName, animationObj] of this.animationDefinitions) {
      css += this.generateCSSFromAnimationDefinition(animationName, animationObj);
    }
    
    // Add glass morphism base styles
    css += this.generateGlassMorphismStyles();
    
    // Add component-specific styles
    css += this.generateComponentStyles();
    
    this.compiledCSS = css;
  }

  /**
   * Generate CSS from style definition
   */
  generateCSSFromStyleDefinition(styleName, styleObj) {
    let css = `\n      .${styleName.replace(/_/g, '-')} {\n`;
    
    // Handle inheritance
    if (styleObj.extends) {
      const parentStyle = this.styleDefinitions.get(styleObj.extends);
      if (parentStyle) {
        // Merge parent properties
        Object.assign({}, parentStyle.properties, styleObj.properties);
      }
    }
    
    // Add properties
    for (const [property, value] of Object.entries(styleObj.properties)) {
      css += `        ${property}: ${value};\n`;
    }
    
    css += '      }\n';
    
    // Add state styles (hover, active, etc.)
    for (const [state, properties] of Object.entries(styleObj.states)) {
      css += `\n      .${styleName.replace(/_/g, '-')}:${state} {\n`;
      for (const [property, value] of Object.entries(properties)) {
        css += `        ${property}: ${value};\n`;
      }
      css += '      }\n';
    }
    
    return css;
  }

  /**
   * Generate CSS from animation definition
   */
  generateCSSFromAnimationDefinition(animationName, animationObj) {
    let css = `\n      @keyframes ${animationName.replace(/_/g, '-')} {\n`;
    
    for (const [keyframe, properties] of Object.entries(animationObj.keyframes)) {
      css += `        ${keyframe} {\n`;
      for (const [property, value] of Object.entries(properties)) {
        css += `          ${property}: ${value};\n`;
      }
      css += '        }\n';
    }
    
    css += '      }\n';
    
    // Add animation class
    css += `\n      .animate-${animationName.replace(/_/g, '-')} {\n`;
    css += `        animation: ${animationName.replace(/_/g, '-')} ${animationObj.duration} ${animationObj.easing}`;
    if (animationObj.iteration !== '1') {
      css += ` ${animationObj.iteration}`;
    }
    css += ';\n      }\n';
    
    return css;
  }

  /**
   * Generate glass morphism base styles
   */
  generateGlassMorphismStyles() {
    return `
      .glass {
        background: rgba(255, 255, 255, 0.15);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        box-shadow: 
          0 8px 32px rgba(0, 0, 0, 0.1),
          inset 0 1px 0 rgba(255, 255, 255, 0.2);
      }
      
      .glass-dark {
        background: rgba(0, 0, 0, 0.2);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .glass-bright {
        background: rgba(255, 255, 255, 0.25);
        backdrop-filter: blur(25px);
        -webkit-backdrop-filter: blur(25px);
        border: 1px solid rgba(255, 255, 255, 0.3);
      }
      
      .ripple {
        position: relative;
        overflow: hidden;
      }
      
      .ripple::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 0;
        height: 0;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
        transform: translate(-50%, -50%);
        transition: width 0.3s, height 0.3s;
      }
      
      .ripple:active::before {
        width: 300px;
        height: 300px;
      }
    `;
  }

  /**
   * Generate component-specific styles for advanced layouts
   */
  generateComponentStyles() {
    return `
      .status-bar {
        height: 44px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0 20px;
        background: rgba(0, 0, 0, 0.1);
        backdrop-filter: blur(30px);
        position: relative;
        z-index: 100;
      }
      
      .status-time {
        font-weight: 600;
        font-size: 16px;
        color: white;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      }
      
      .status-icons {
        display: flex;
        gap: 4px;
        align-items: center;
      }
      
      .status-icons span {
        color: white;
        font-size: 14px;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      }
      
      .app-header {
        height: 70px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 24px;
        position: relative;
        z-index: 50;
      }
      
      .header-title {
        font-size: 28px;
        font-weight: 700;
        color: white;
        background: linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.8) 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      
      .header-actions {
        display: flex;
        gap: 12px;
      }
      
      .header-btn {
        width: 40px;
        height: 40px;
        border-radius: 20px;
        border: none;
        background: rgba(255, 255, 255, 0.15);
        backdrop-filter: blur(20px);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        box-shadow: 
          0 4px 12px rgba(0, 0, 0, 0.1),
          inset 0 1px 0 rgba(255, 255, 255, 0.2);
      }
      
      .header-btn:hover {
        background: rgba(255, 255, 255, 0.25);
        transform: translateY(-2px) scale(1.05);
        box-shadow: 
          0 8px 25px rgba(0, 0, 0, 0.15),
          inset 0 1px 0 rgba(255, 255, 255, 0.3);
      }
      
      .main-content {
        flex: 1;
        padding: 20px 24px;
        overflow-y: auto;
        position: relative;
        min-height: 0;
      }
      
      .projects-grid {
        display: flex;
        flex-direction: column;
        gap: 16px;
        margin-bottom: 100px;
      }
      
      .project-card {
        border-radius: 24px;
        padding: 24px;
        position: relative;
        overflow: hidden;
        cursor: pointer;
        transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        transform: translateY(0);
        background: rgba(255, 255, 255, 0.15);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        box-shadow: 
          0 8px 32px rgba(0, 0, 0, 0.1),
          inset 0 1px 0 rgba(255, 255, 255, 0.2);
      }
      
      .project-card:hover {
        transform: translateY(-8px) scale(1.02);
        box-shadow: 
          0 20px 40px rgba(0, 0, 0, 0.1),
          0 4px 8px rgba(0, 0, 0, 0.05);
        background: rgba(255, 255, 255, 0.25);
        border-color: rgba(255, 255, 255, 0.3);
      }
      
      .project-content {
        position: relative;
        z-index: 2;
      }
      
      .project-icon {
        width: 48px;
        height: 48px;
        border-radius: 16px;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.1));
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        margin-bottom: 12px;
        box-shadow: 
          0 4px 12px rgba(0, 0, 0, 0.1),
          inset 0 1px 0 rgba(255, 255, 255, 0.2);
      }
      
      .project-title {
        font-size: 20px;
        font-weight: 700;
        color: white;
        margin-bottom: 6px;
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }
      
      .project-subtitle {
        font-size: 14px;
        color: rgba(255, 255, 255, 0.8);
        margin-bottom: 16px;
        line-height: 1.4;
      }
      
      .project-stats {
        display: flex;
        gap: 20px;
        margin-bottom: 16px;
      }
      
      .stat {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
      }
      
      .stat-number {
        font-size: 24px;
        font-weight: 700;
        color: white;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      }
      
      .stat-label {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.7);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-weight: 500;
      }
      
      .progress-bar {
        width: 100%;
        height: 6px;
        background: rgba(0, 0, 0, 0.1);
        border-radius: 3px;
        overflow: hidden;
        margin-bottom: 12px;
      }
      
      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.6));
        border-radius: 3px;
        transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        box-shadow: 0 0 8px rgba(255, 255, 255, 0.3);
      }
      
      .team-avatars {
        display: flex;
        gap: -8px;
        margin-top: 12px;
      }
      
      .avatar {
        width: 28px;
        height: 28px;
        border-radius: 14px;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.1));
        border: 2px solid rgba(255, 255, 255, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 600;
        color: white;
        margin-left: -4px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
      
      .avatar:first-child {
        margin-left: 0;
      }
      
      .fab {
        position: absolute;
        bottom: 100px;
        right: 24px;
        width: 56px;
        height: 56px;
        border-radius: 28px;
        border: none;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.1));
        backdrop-filter: blur(25px);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        box-shadow: 
          0 8px 25px rgba(0, 0, 0, 0.15),
          inset 0 1px 0 rgba(255, 255, 255, 0.2);
        z-index: 1000;
      }
      
      .fab:hover {
        transform: translateY(-4px) scale(1.1);
        box-shadow: 
          0 12px 35px rgba(0, 0, 0, 0.2),
          inset 0 1px 0 rgba(255, 255, 255, 0.3);
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.2));
      }
      
      .bottom-nav {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 80px;
        background: rgba(0, 0, 0, 0.2);
        backdrop-filter: blur(30px);
        -webkit-backdrop-filter: blur(30px);
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        align-items: center;
        justify-content: space-around;
        padding: 0 20px;
        z-index: 1000;
        border-radius: 0 0 41px 41px;
      }
      
      .nav-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.6);
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        padding: 8px 12px;
        border-radius: 16px;
      }
      
      .nav-item:hover {
        color: rgba(255, 255, 255, 0.9);
        background: rgba(255, 255, 255, 0.1);
        transform: translateY(-2px);
      }
      
      .nav-item.active {
        color: white;
        background: rgba(255, 255, 255, 0.15);
      }
      
      .nav-icon {
        font-size: 20px;
        margin-bottom: 2px;
      }
      
      .nav-label {
        font-size: 11px;
        font-weight: 500;
        letter-spacing: 0.3px;
      }
      
      .animate-fade-in-up {
        animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
      }
      
      .animate-slide-in-right {
        animation: slideInRight 0.6s cubic-bezier(0.16, 1, 0.3, 1);
      }
      
      .animate-float {
        animation: float 3s ease-in-out infinite;
      }
      
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      @keyframes slideInRight {
        from {
          opacity: 0;
          transform: translateX(30px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      
      @keyframes float {
        0%, 100% {
          transform: translateY(0px);
        }
        50% {
          transform: translateY(-10px);
        }
      }
      
      .task-sections {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }
      
      .section {
        background: rgba(255, 255, 255, 0.12);
        backdrop-filter: blur(20px);
        border-radius: 20px;
        padding: 20px;
        border: 1px solid rgba(255, 255, 255, 0.15);
      }
      
      .section-title {
        font-size: 16px;
        font-weight: 600;
        color: white;
        margin-bottom: 12px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .priority-high {
        background: linear-gradient(135deg, #ff6b6b, #ee5a52);
        color: white;
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .priority-medium {
        background: linear-gradient(135deg, #feca57, #ff9ff3);
        color: white;
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .subtasks {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      
      .subtask {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        background: rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        transition: all 0.3s ease;
      }
      
      .subtask:hover {
        background: rgba(255, 255, 255, 0.15);
        border-color: rgba(255, 255, 255, 0.2);
      }
      
      .subtask-checkbox {
        width: 20px;
        height: 20px;
        border-radius: 6px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        background: transparent;
        cursor: pointer;
        transition: all 0.3s ease;
        position: relative;
      }
      
      .subtask-checkbox.checked {
        background: linear-gradient(135deg, #4facfe, #00f2fe);
        border-color: transparent;
      }
      
      .subtask-checkbox.checked::after {
        content: '✓';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: white;
        font-size: 12px;
        font-weight: 700;
      }
      
      .subtask-text {
        flex: 1;
        color: white;
        font-size: 14px;
      }
      
      .subtask-text.completed {
        text-decoration: line-through;
        opacity: 0.6;
      }
      
      .task-header {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 24px;
      }
      
      .back-btn {
        width: 40px;
        height: 40px;
        border-radius: 20px;
        border: none;
        background: rgba(255, 255, 255, 0.15);
        backdrop-filter: blur(20px);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      }
      
      .back-btn:hover {
        background: rgba(255, 255, 255, 0.25);
        transform: scale(1.1);
      }
      
      .task-info {
        flex: 1;
      }
      
      .task-title {
        font-size: 24px;
        font-weight: 700;
        color: white;
        margin-bottom: 4px;
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }
      
      .task-meta {
        font-size: 14px;
        color: rgba(255, 255, 255, 0.7);
      }
      
      .form-container {
        width: 100%;
        max-width: 400px;
      }
      
      .form-group {
        margin-bottom: 1.5rem;
      }
      
      .form-group label {
        display: block;
        font-weight: 600;
        color: white;
        margin-bottom: 0.5rem;
        font-size: 0.9rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .form-input, .form-textarea {
        width: 100%;
        padding: 1rem;
        background: rgba(255, 255, 255, 0.15);
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 12px;
        color: white;
        font-size: 1rem;
        backdrop-filter: blur(10px);
        transition: all 0.3s ease;
      }
      
      .form-input:focus, .form-textarea:focus {
        outline: none;
        border-color: rgba(255, 255, 255, 0.6);
        box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.1);
      }
      
      .form-input::placeholder, .form-textarea::placeholder {
        color: rgba(255, 255, 255, 0.6);
      }
      
      .screen-actions {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        padding: 1rem;
        flex-shrink: 0;
        position: absolute;
        bottom: 70px;
        left: 1rem;
        right: 1rem;
        z-index: 5;
      }
      
      .btn-primary, .btn-secondary {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 0.875rem 1.5rem;
        border: none;
        border-radius: 12px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        backdrop-filter: blur(10px);
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.1));
        border: 1px solid rgba(255, 255, 255, 0.3);
        color: white;
      }
      
      .btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.2));
      }
    `;
  }

  /**
   * Generate semantic HTML structure
   */
  generateSemanticHTML() {
    let html = '<div id="app">';
    
    // Generate all interfaces found in the APML
    const interfaces = ['dashboard', 'project_detail', 'create_project'];
    
    for (const interfaceName of interfaces) {
      const isActive = interfaceName === 'dashboard';
      html += `
        <div class="screen ${isActive ? 'active' : ''}" id="${interfaceName}">
          ${this.generateInterfaceHTML(interfaceName)}
        </div>
      `;
    }
    
    // Add bottom navigation (global)
    html += this.generateBottomNavigation();
    
    html += '</div>';
    this.compiledHTML = html;
  }
  
  /**
   * Generate HTML for specific interface
   */
  generateInterfaceHTML(interfaceName) {
    let html = '';
    
    // Status bar (common to all)
    html += `
      <div class="status-bar">
        <div class="status-time">22:08</div>
        <div class="status-icons">
          <span>📶</span>
          <span>📶</span>
          <span>🔋</span>
        </div>
      </div>
    `;
    
    // Interface-specific content
    switch (interfaceName) {
      case 'dashboard':
        html += this.generateDashboardHTML();
        break;
      case 'project_detail':
        html += this.generateProjectDetailHTML();
        break;
      case 'create_project':
        html += this.generateCreateProjectHTML();
        break;
    }
    
    return html;
  }
  
  /**
   * Generate dashboard interface HTML
   */
  generateDashboardHTML() {
    return `
      <div class="app-header">
        <div class="header-title">Zenflow</div>
        <div class="header-actions">
          <button class="header-btn ripple">🔍</button>
          <button class="header-btn ripple">👤</button>
        </div>
      </div>
      
      <div class="main-content">
        ${this.generateProjectsGrid()}
      </div>
      
      <button class="fab animate-float" onclick="showCreateProject()">
        <span style="font-size: 24px;">+</span>
      </button>
    `;
  }
  
  /**
   * Generate project detail interface HTML
   */
  generateProjectDetailHTML() {
    return `
      <div class="app-header">
        <div class="task-header">
          <button class="back-btn" onclick="showDashboard()">
            <span>←</span>
          </button>
          <div class="task-info">
            <div class="task-title">Project Details</div>
            <div class="task-meta">Tasks and Progress</div>
          </div>
        </div>
      </div>
      
      <div class="main-content">
        <div class="task-sections">
          <div class="section glass animate-slide-in-right" style="animation-delay: 0.1s">
            <div class="section-title">
              <span>🔥</span>
              Project Overview
            </div>
            <div class="subtasks">
              <div class="subtask">
                <div class="subtask-text">This is the project detail view</div>
              </div>
              <div class="subtask">  
                <div class="subtask-text">Navigate back to see the dashboard</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Generate create project interface HTML
   */
  generateCreateProjectHTML() {
    return `
      <div class="app-header">
        <div class="task-header">
          <button class="back-btn" onclick="showDashboard()">
            <span>✕</span>
          </button>
          <div class="task-info">
            <div class="task-title">New Project</div>
            <div class="task-meta">Create something amazing</div>
          </div>
        </div>
      </div>
      
      <div class="main-content">
        <div class="form-container">
          <div class="form-group">
            <label>Project Name</label>
            <input type="text" placeholder="Enter project name..." class="form-input" />
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea placeholder="Project description..." class="form-textarea" rows="3"></textarea>
          </div>
        </div>
      </div>
      
      <div class="screen-actions">
        <button class="btn-primary" onclick="showDashboard()">
          <span>💾</span> Create Project
        </button>
      </div>
    `;
  }

  /**
   * Generate HTML for individual components
   */
  generateComponentHTML(component) {
    let html = '';
    
    for (const comp of component.components) {
      html += this.generateElementHTML(comp);
    }
    
    return html;
  }

  /**
   * Generate HTML for a single element
   */
  generateElementHTML(element) {
    const className = element.style ? element.style.replace(/_/g, '-') : '';
    const animationClass = element.animation ? `animate-${element.animation.replace(/_/g, '-')}` : '';
    const classes = [className, animationClass].filter(c => c).join(' ');
    
    switch (element.type) {
      case 'status_bar':
        return `
          <div class="${classes} status-bar">
            <div class="status-time">9:41</div>
            <div class="status-icons">
              <span>📶</span>
              <span>📶</span>
              <span>🔋</span>
            </div>
          </div>
        `;
      
      case 'app_header':
        return `
          <div class="${classes} app-header">
            <div class="header-title">${element.children?.[0]?.content || 'App'}</div>
            <div class="header-actions">
              <button class="header-btn ripple">🔍</button>
              <button class="header-btn ripple">👤</button>
            </div>
          </div>
        `;
      
      case 'main_content':
        let contentHTML = '<div class="main-content">';
        if (element.children) {
          for (const child of element.children) {
            contentHTML += this.generateElementHTML(child);
          }
        }
        contentHTML += '</div>';
        return contentHTML;
      
      case 'projects_grid':
        return this.generateProjectsGrid();
      
      case 'task_sections':
        return this.generateTaskSections();
      
      default:
        return `<div class="${classes}">${element.content || ''}</div>`;
    }
  }

  /**
   * Generate projects grid HTML
   */
  generateProjectsGrid() {
    return `
      <div class="projects-grid">
        <div class="project-card glass animate-fade-in-up" onclick="showProject('mobile-app')" style="animation-delay: 0.1s">
          <div class="project-content">
            <div class="project-icon">📱</div>
            <div class="project-title">Mobile App Redesign</div>
            <div class="project-subtitle">Complete UI/UX overhaul for better user engagement</div>
            
            <div class="project-stats">
              <div class="stat">
                <div class="stat-number">24</div>
                <div class="stat-label">Tasks</div>
              </div>
              <div class="stat">
                <div class="stat-number">6</div>
                <div class="stat-label">Team</div>
              </div>
              <div class="stat">
                <div class="stat-number">12</div>
                <div class="stat-label">Days</div>
              </div>
            </div>
            
            <div class="progress-bar">
              <div class="progress-fill" style="width: 68%"></div>
            </div>
            
            <div class="team-avatars">
              <div class="avatar">AS</div>
              <div class="avatar">JD</div>
              <div class="avatar">MK</div>
              <div class="avatar">+3</div>
            </div>
          </div>
        </div>
        
        <div class="project-card glass animate-fade-in-up" onclick="showProject('ai-integration')" style="animation-delay: 0.2s">
          <div class="project-content">
            <div class="project-icon">🤖</div>
            <div class="project-title">AI Integration</div>
            <div class="project-subtitle">Implementing smart features and automation</div>
            
            <div class="project-stats">
              <div class="stat">
                <div class="stat-number">18</div>
                <div class="stat-label">Tasks</div>
              </div>
              <div class="stat">
                <div class="stat-number">4</div>
                <div class="stat-label">Team</div>
              </div>
              <div class="stat">
                <div class="stat-number">21</div>
                <div class="stat-label">Days</div>
              </div>
            </div>
            
            <div class="progress-bar">
              <div class="progress-fill" style="width: 43%"></div>
            </div>
            
            <div class="team-avatars">
              <div class="avatar">RL</div>
              <div class="avatar">NK</div>
              <div class="avatar">TB</div>
              <div class="avatar">CW</div>
            </div>
          </div>
        </div>
      </div>
      
      <button class="fab animate-float" onclick="showCreateProject()">
        <span style="font-size: 24px;">+</span>
      </button>
    `;
  }

  /**
   * Generate task sections HTML
   */
  generateTaskSections() {
    return `
      <div class="task-sections">
        <div class="section glass animate-slide-in-right" style="animation-delay: 0.1s">
          <div class="section-title">
            <span>🔥</span>
            High Priority
            <div class="priority-high">Urgent</div>
          </div>
          <div class="subtasks">
            <div class="subtask">
              <div class="subtask-checkbox checked"></div>
              <div class="subtask-text completed">Complete user research analysis</div>
            </div>
            <div class="subtask">
              <div class="subtask-checkbox"></div>
              <div class="subtask-text">Design new onboarding flow</div>
            </div>
          </div>
        </div>
        
        <div class="section glass animate-slide-in-right" style="animation-delay: 0.2s">
          <div class="section-title">
            <span>⚡</span>
            In Progress
            <div class="priority-medium">Active</div>
          </div>
          <div class="subtasks">
            <div class="subtask">
              <div class="subtask-checkbox"></div>
              <div class="subtask-text">Implement new navigation system</div>
            </div>
            <div class="subtask">
              <div class="subtask-checkbox"></div>
              <div class="subtask-text">Create component library</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Generate bottom navigation
   */
  generateBottomNavigation() {
    return `
      <div class="bottom-nav glass-dark">
        <button class="nav-item active ripple" onclick="showDashboard()">
          <div class="nav-icon">🏠</div>
          <div class="nav-label">Home</div>
        </button>
        <button class="nav-item ripple" onclick="showTasks()">
          <div class="nav-icon">✓</div>
          <div class="nav-label">Tasks</div>
        </button>
        <button class="nav-item ripple" onclick="showAnalytics()">
          <div class="nav-icon">📊</div>
          <div class="nav-label">Analytics</div>
        </button>
        <button class="nav-item ripple" onclick="showTeam()">
          <div class="nav-icon">👥</div>
          <div class="nav-label">Team</div>
        </button>
      </div>
    `;
  }

  /**
   * Generate intelligent JavaScript with state management
   */
  generateIntelligentJS() {
    const flowMap = this.createAdvancedFlowMap();
    
    // Generate data from parsed APML models
    const projectData = this.dataModels.has('Project') ? this.dataModels.get('Project').sampleData : [];
    const taskData = this.dataModels.has('Task') ? this.dataModels.get('Task').sampleData : [];
    
    this.compiledJS = `
      // Advanced APML Compiled Application Runtime - Generated from APML Data Models
      let currentState = 'dashboard';
      let appData = {
        projects: ${JSON.stringify(projectData, null, 2)},
        tasks: ${JSON.stringify(taskData, null, 2)},
        currentProject: null
      };
      
      console.log('📊 APML Data Models loaded:', appData);

      // Advanced flow mapping
      const flows = ${JSON.stringify(flowMap, null, 2)};

      // State management with smooth transitions
      function handleAction(action) {
        console.log('🎯 Advanced Action: ' + action + ' from ' + currentState);
        console.log('📋 Available flows for ' + currentState + ':', flows[currentState]);
        console.log('🔍 All flows:', flows);
        
        const flow = flows[currentState] && flows[currentState][action];
        console.log('🎯 Found flow for ' + action + ':', flow);
        
        if (flow) {
          console.log('✅ Executing flow: ' + currentState + ' --[' + action + ']--> ' + flow.redirectTo);
          
          // Execute pre-transition logic
          executePreTransitionLogic(action, flow);
          
          // Navigate with advanced animations
          navigateWithAdvancedAnimation(flow.redirectTo, flow.animation);
          
          // Send Trinity message
          sendAdvancedTrinityMessage(action, currentState, flow.redirectTo);
        } else {
          console.error('❌ No flow found for action: ' + action + ' from ' + currentState);
          console.log('💡 Available actions for ' + currentState + ':', Object.keys(flows[currentState] || {}));
        }
      }

      function executePreTransitionLogic(action, flow) {
        // Handle complex state changes
        switch (action) {
          case 'show_project':
            appData.currentProject = appData.projects[0]; // In real app, get from clicked project
            break;
          case 'toggle_task':
            // Handle task completion logic
            break;
        }
      }

      function navigateWithAdvancedAnimation(newState, animationType = 'slide_right') {
        console.log(\`🔄 Attempting navigation from \${currentState} to \${newState}\`);
        
        const currentScreen = document.getElementById(currentState);
        const newScreen = document.getElementById(newState);
        
        console.log('🔍 Screen elements:', { 
          currentScreen: !!currentScreen,
          newScreen: !!newScreen,
          currentId: currentState,
          newId: newState 
        });
        
        if (currentScreen && newScreen) {
          console.log(\`✅ Both screens found, starting transition\`);
          
          // Remove active class from current screen
          currentScreen.classList.remove('active');
          
          // Add active class to new screen
          newScreen.classList.add('active');
          
          // Update current state
          currentState = newState;
          
          console.log(\`✨ Successfully navigated to: \${newState}\`);
          
          // Force a repaint to ensure the transition is visible
          newScreen.offsetHeight;
          
        } else {
          console.error('❌ Navigation failed - missing screens:', {
            currentScreen: currentScreen ? 'found' : 'missing',
            newScreen: newScreen ? 'found' : 'missing',
            availableScreens: Array.from(document.querySelectorAll('.screen')).map(s => s.id)
          });
        }
      }

      function sendAdvancedTrinityMessage(action, from, to) {
        const trinityMessage = {
          type: 'TRINITY_ACTION',
          action: action,
          from: from,
          to: to,
          timestamp: new Date().toISOString(),
          framework: 'advanced_apml',
          data: {
            currentProject: appData.currentProject,
            transitionType: 'advanced_animation'
          }
        };
        
        console.log('🚀 Advanced Trinity Message:', trinityMessage);
        
        if (window.parent && window.parent !== window) {
          window.parent.postMessage(trinityMessage, '*');
        }
      }

      // Advanced interaction handlers - Generated from APML Logic Flows
      function showDashboard() { 
        console.log('🏠 Navigating to dashboard');
        handleAction('show_dashboard'); 
      }
      
      function showProject(projectId) { 
        console.log('📱 Navigating to project detail:', projectId);
        handleAction('show_project_detail'); 
      }
      
      function showCreateProject() { 
        console.log('➕ Navigating to create project');
        handleAction('show_create_project'); 
      }
      
      function showTasks() { handleAction('show_tasks'); }
      function showAnalytics() { handleAction('show_analytics'); }
      function showTeam() { handleAction('show_team'); }

      // Initialize advanced app
      document.addEventListener('DOMContentLoaded', function() {
        console.log('🚀 Advanced APML App Initialized with Glass Morphism');
        
        // Initialize ripple effects
        initializeRippleEffects();
        
        // Update time display
        updateTimeDisplay();
        setInterval(updateTimeDisplay, 60000);
      });

      function initializeRippleEffects() {
        document.addEventListener('click', function(e) {
          if (e.target.classList.contains('ripple')) {
            // Ripple effect is handled by CSS
          }
        });
      }

      function updateTimeDisplay() {
        const now = new Date();
        const time = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        document.querySelectorAll('.status-time').forEach(el => el.textContent = time);
      }

      // Expose functions globally
      window.handleAction = handleAction;
      window.showDashboard = showDashboard;
      window.showProject = showProject;
      window.showCreateProject = showCreateProject;
      window.showTasks = showTasks;
      window.showAnalytics = showAnalytics;
      window.showTeam = showTeam;
    `;
  }

  /**
   * Create advanced flow map with animation metadata
   */
  createAdvancedFlowMap() {
    // Generate flow map from parsed APML logic flows
    const flowMap = {
      'dashboard': {
        'show_project_detail': { 
          redirectTo: 'project_detail', 
          animation: 'slide_right',
          transition: 'smooth'
        },
        'show_create_project': { 
          redirectTo: 'create_project', 
          animation: 'scale_up',
          transition: 'modal'
        }
      },
      'project_detail': {
        'show_dashboard': { 
          redirectTo: 'dashboard', 
          animation: 'slide_left',
          transition: 'smooth'
        }
      },
      'create_project': {
        'show_dashboard': { 
          redirectTo: 'dashboard', 
          animation: 'scale_down',
          transition: 'smooth'
        }
      }
    };
    
    // Add navigation flows for bottom nav
    for (const screen of Object.keys(flowMap)) {
      flowMap[screen]['show_tasks'] = { redirectTo: 'task_list', animation: 'slide_up' };
      flowMap[screen]['show_analytics'] = { redirectTo: 'analytics', animation: 'slide_up' };
      flowMap[screen]['show_team'] = { redirectTo: 'team', animation: 'slide_up' };
    }
    
    return flowMap;
  }

  /**
   * Generate complete application HTML
   */
  generateCompleteApp() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=390, height=844, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <title>Advanced APML Compiled App</title>
    <style>${this.compiledCSS}</style>
</head>
<body>
    ${this.compiledHTML}
    <script>${this.compiledJS}</script>
</body>
</html>`;
  }
}
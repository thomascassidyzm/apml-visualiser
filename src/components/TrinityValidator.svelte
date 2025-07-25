<script>
  import { onMount } from 'svelte';
  import { apmlSpec, visualizationState } from '../stores/apmlStore.js';
  import { TrinityCompletenessValidator } from '../lib/TrinityCompletenessValidator.js';
  
  let validator = new TrinityCompletenessValidator();
  let validationState = {
    isValidating: false,
    isComplete: false,
    lastValidated: null,
    summary: null,
    results: []
  };
  
  // Auto-validate when APML spec changes
  $: if ($apmlSpec && $apmlSpec.stateNodes && $apmlSpec.stateNodes.length > 0) {
    validateTrinityCompleteness();
  }
  
  async function validateTrinityCompleteness() {
    validationState.isValidating = true;
    
    try {
      console.log('🔍 Running Trinity Completeness Validation...');
      
      const validation = validator.validateTrinityCompleteness($apmlSpec);
      
      validationState = {
        isValidating: false,
        isComplete: validation.isComplete,
        lastValidated: new Date().toISOString(),
        summary: validation.summary,
        results: validation.results
      };
      
      console.log('✅ Validation complete:', validationState.summary);
      
    } catch (error) {
      console.error('❌ Validation failed:', error);
      validationState.isValidating = false;
    }
  }
  
  function getStatusIcon(status) {
    switch (status) {
      case 'pass': return '✅';
      case 'fail': return '❌';
      case 'warning': return '⚠️';
      default: return '❓';
    }
  }
  
  function getStatusColor(status) {
    switch (status) {
      case 'pass': return 'text-green-400';
      case 'fail': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  }
  
  function highlightInterfaceInDiagram(interfaceName) {
    // Send message to highlight interface in Trinity Flow Diagram
    visualizationState.update(state => ({
      ...state,
      highlightedInterface: interfaceName,
      lastAction: {
        type: 'VALIDATION_HIGHLIGHT',
        interface: interfaceName,
        timestamp: new Date().toISOString()
      }
    }));
  }
</script>

<div class="trinity-validator">
  {#if validationState.isValidating}
    <!-- Validating State -->
    <div class="validation-loading">
      <div class="loading-spinner"></div>
      <div class="loading-text">
        <h3>🔍 Validating Trinity Completeness</h3>
        <p>Analyzing APML specification for complete SHOW→DO→PROCESS→SHOW cycles...</p>
      </div>
    </div>
  
  {:else if validationState.summary}
    <!-- Validation Results -->
    <div class="validation-results">
      
      <!-- Summary Header -->
      <div class="validation-header">
        <div class="completeness-indicator" class:complete={validationState.isComplete}>
          <div class="completeness-icon">
            {validationState.isComplete ? '✅' : '⚠️'}
          </div>
          <div class="completeness-text">
            <h3>Trinity Completeness: {validationState.summary.completenessPercentage}%</h3>
            <p>
              {validationState.isComplete ? 'All Trinity flows are complete!' : 'Some issues found in Trinity flows'}
            </p>
          </div>
        </div>
        
        <div class="validation-metrics">
          <div class="metric">
            <div class="metric-number">{validationState.summary.totalInterfaces}</div>
            <div class="metric-label">Interfaces</div>
          </div>
          <div class="metric">
            <div class="metric-number">{validationState.summary.totalConnections}</div>
            <div class="metric-label">Connections</div>
          </div>
          <div class="metric">
            <div class="metric-number text-green-400">{validationState.summary.passCount}</div>
            <div class="metric-label">Passed</div>
          </div>
          <div class="metric">
            <div class="metric-number text-red-400">{validationState.summary.failCount}</div>
            <div class="metric-label">Failed</div>
          </div>
        </div>
      </div>
      
      <!-- Validation Details -->
      <div class="validation-details">
        <h4>Validation Results</h4>
        
        <div class="results-list">
          {#each validationState.results as result (result.id)}
            <div class="result-item" class:failed={result.status === 'fail'} class:warning={result.status === 'warning'}>
              <div class="result-header">
                <span class="result-icon">{getStatusIcon(result.status)}</span>
                <span class="result-type">{result.validationType.replace('_', ' ').toUpperCase()}</span>
                <span class="result-status {getStatusColor(result.status)}">{result.status.toUpperCase()}</span>
              </div>
              
              <div class="result-message">
                {result.message}
              </div>
              
              {#if result.affectedInterfaces && result.affectedInterfaces.length > 0}
                <div class="affected-interfaces">
                  <span class="label">Affected Interfaces:</span>
                  {#each result.affectedInterfaces as interfaceName}
                    <button 
                      class="interface-link"
                      on:click={() => highlightInterfaceInDiagram(interfaceName)}
                    >
                      {interfaceName}
                    </button>
                  {/each}
                </div>
              {/if}
              
              {#if result.suggestedFixes && result.suggestedFixes.length > 0}
                <div class="suggested-fixes">
                  <span class="label">Suggested Fixes:</span>
                  <ul>
                    {#each result.suggestedFixes as fix}
                      <li>{fix}</li>
                    {/each}
                  </ul>
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </div>
      
      <!-- Validation Actions -->
      <div class="validation-actions">
        <button class="action-btn primary" on:click={validateTrinityCompleteness}>
          🔄 Re-validate
        </button>
        <button class="action-btn secondary">
          📋 Export Report
        </button>
        <button class="action-btn secondary">
          🔧 Auto-fix Issues
        </button>
      </div>
    </div>
  
  {:else}
    <!-- No Validation State -->
    <div class="no-validation">
      <div class="no-validation-content">
        <div class="no-validation-icon">🔍</div>
        <h3>Trinity Completeness Validator</h3>
        <p>Parse an APML specification to validate Trinity flow completeness</p>
        <button class="action-btn primary" on:click={validateTrinityCompleteness}>
          🚀 Run Validation
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .trinity-validator {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
    color: white;
  }
  
  .validation-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
    gap: 2rem;
  }
  
  .loading-spinner {
    width: 3rem;
    height: 3rem;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-top: 3px solid #06b6d4;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .loading-text h3 {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: #06b6d4;
  }
  
  .loading-text p {
    color: #94a3b8;
  }
  
  .validation-results {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  
  .validation-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.5rem;
    border-bottom: 1px solid #475569;
  }
  
  .completeness-indicator {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  .completeness-indicator.complete .completeness-icon {
    color: #10b981;
  }
  
  .completeness-icon {
    font-size: 2rem;
    color: #f59e0b;
  }
  
  .completeness-text h3 {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 0.25rem;
  }
  
  .completeness-text p {
    color: #94a3b8;
    font-size: 0.875rem;
  }
  
  .validation-metrics {
    display: flex;
    gap: 2rem;
  }
  
  .metric {
    text-align: center;
  }
  
  .metric-number {
    font-size: 1.5rem;
    font-weight: 600;
    color: #06b6d4;
  }
  
  .metric-label {
    font-size: 0.75rem;
    color: #94a3b8;
    text-transform: uppercase;
    font-weight: 500;
  }
  
  .validation-details {
    flex: 1;
    padding: 1.5rem;
    overflow-y: auto;
  }
  
  .validation-details h4 {
    font-size: 1.125rem;
    font-weight: 600;
    margin-bottom: 1rem;
    color: #e2e8f0;
  }
  
  .results-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .result-item {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    padding: 1rem;
    border-left: 3px solid #10b981;
  }
  
  .result-item.failed {
    border-left-color: #ef4444;
  }
  
  .result-item.warning {
    border-left-color: #f59e0b;
  }
  
  .result-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.5rem;
  }
  
  .result-icon {
    font-size: 1rem;
  }
  
  .result-type {
    font-size: 0.75rem;
    font-weight: 600;
    color: #94a3b8;
    text-transform: uppercase;
  }
  
  .result-status {
    font-size: 0.75rem;
    font-weight: 600;
    margin-left: auto;
  }
  
  .result-message {
    color: #e2e8f0;
    margin-bottom: 0.75rem;
  }
  
  .affected-interfaces, .suggested-fixes {
    margin-top: 0.75rem;
  }
  
  .label {
    font-size: 0.75rem;
    color: #94a3b8;
    font-weight: 600;
    text-transform: uppercase;
    margin-right: 0.5rem;
  }
  
  .interface-link {
    display: inline-block;
    background: #06b6d4;
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 500;
    margin: 0.25rem 0.25rem 0 0;
    border: none;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .interface-link:hover {
    background: #0891b2;
  }
  
  .suggested-fixes ul {
    margin: 0.5rem 0 0 1rem;
    padding: 0;
  }
  
  .suggested-fixes li {
    color: #94a3b8;
    font-size: 0.875rem;
    margin-bottom: 0.25rem;
  }
  
  .validation-actions {
    display: flex;
    gap: 1rem;
    padding: 1.5rem;
    border-top: 1px solid #475569;
  }
  
  .action-btn {
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .action-btn.primary {
    background: #06b6d4;
    color: white;
  }
  
  .action-btn.primary:hover {
    background: #0891b2;
  }
  
  .action-btn.secondary {
    background: rgba(255, 255, 255, 0.1);
    color: #e2e8f0;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
  
  .action-btn.secondary:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  
  .no-validation {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
  }
  
  .no-validation-content {
    text-align: center;
  }
  
  .no-validation-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }
  
  .no-validation-content h3 {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: #e2e8f0;
  }
  
  .no-validation-content p {
    color: #94a3b8;
    margin-bottom: 2rem;
  }
</style>
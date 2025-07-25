<script>
  import { validationResults, changeRequests, visualizationState, apmlSpec } from '../stores/apmlStore.js';
  
  let activeTab = 'manual';
  let showCRDialog = false;
  let newCRNote = '';
  let newCRType = 'ui_change';
  let newCRPriority = 'medium';
  
  $: results = $validationResults;
  $: crs = $changeRequests;
  $: currentNode = $visualizationState.currentNode;
  $: availableActions = $visualizationState.availableTransitions;
  $: pathHistory = $visualizationState.pathHistory;
  
  function runAllPathsTest() {
    // Simulate validation testing
    validationResults.update(results => ({
      ...results,
      totalPathsTested: 25,
      successfulPaths: 22,
      failedPaths: 3,
      issues: [
        'Unreachable state: admin_settings',
        'Infinite loop detected in user_profile flow',
        'Missing validation for email_input'
      ]
    }));
  }
  
  function addChangeRequest() {
    if (!newCRNote.trim()) return;
    
    const cr = {
      id: crypto.randomUUID(),
      screenState: currentNode || { interfaceName: 'Current Screen' },
      userNote: newCRNote,
      crType: newCRType,
      priority: newCRPriority,
      timestamp: new Date().toISOString()
    };
    
    changeRequests.update(crs => [...crs, cr]);
    
    // Reset form
    newCRNote = '';
    newCRType = 'ui_change';
    newCRPriority = 'medium';
    showCRDialog = false;
  }
  
  function exportAPMLWithCRs() {
    // Generate downloadable APML with change requests
    const apmlWithCRs = generateAPMLWithChangeRequests($changeRequests);
    downloadFile('apml-with-change-requests.apml', apmlWithCRs);
  }

  async function copyAPMLWithCRs() {
    const apmlWithCRs = generateAPMLWithChangeRequests($changeRequests);
    try {
      await navigator.clipboard.writeText(apmlWithCRs);
      // Show success feedback
      const btn = document.querySelector('.copy-btn');
      if (btn) {
        const originalText = btn.textContent;
        btn.textContent = '✓ Copied!';
        btn.classList.add('bg-green-600');
        setTimeout(() => {
          btn.textContent = originalText;
          btn.classList.remove('bg-green-600');
        }, 2000);
      }
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      // Fallback to download
      exportAPMLWithCRs();
    }
  }
  
  function generateAPMLWithChangeRequests(crs) {
    // Get the original APML content
    const originalAPML = $apmlSpec.rawContent || '';
    
    if (!originalAPML) {
      return `# No APML content found to export with change requests\n# Please parse an APML specification first.`;
    }
    
    // Create header with change request summary
    let apmlWithCRs = `# APML with Change Requests\n`;
    apmlWithCRs += `# Generated: ${new Date().toISOString()}\n`;
    apmlWithCRs += `# Total Change Requests: ${crs.length}\n\n`;
    
    if (crs.length > 0) {
      apmlWithCRs += `# CHANGE REQUEST SUMMARY:\n`;
      crs.forEach((cr, index) => {
        apmlWithCRs += `# CR${index + 1}: ${cr.screenState.interfaceName} - ${cr.crType} (${cr.priority})\n`;
        apmlWithCRs += `#      "${cr.userNote}"\n`;
      });
      apmlWithCRs += `\n# =====================================\n`;
      apmlWithCRs += `# ORIGINAL APML WITH EMBEDDED COMMENTS\n`;
      apmlWithCRs += `# =====================================\n\n`;
    }
    
    // Embed change requests as comments within the relevant interface sections
    let modifiedAPML = originalAPML;
    
    crs.forEach((cr, index) => {
      const interfaceName = cr.screenState.interfaceName;
      const interfaceRegex = new RegExp(`(interface\\s+${interfaceName}:)`, 'g');
      
      const changeComment = `\n# 🔄 CHANGE REQUEST CR${index + 1} (${cr.priority.toUpperCase()})\n` +
        `# Screen: ${interfaceName}\n` +
        `# Type: ${cr.crType}\n` +
        `# Request: ${cr.userNote}\n` +
        `# Added: ${new Date(cr.timestamp).toLocaleDateString()}\n`;
      
      modifiedAPML = modifiedAPML.replace(interfaceRegex, `$1${changeComment}`);
    });
    
    apmlWithCRs += modifiedAPML;
    
    // Add footer with instructions
    apmlWithCRs += `\n\n# =====================================\n`;
    apmlWithCRs += `# INSTRUCTIONS FOR LLM ITERATION\n`;
    apmlWithCRs += `# =====================================\n`;
    apmlWithCRs += `# Please review the ${crs.length} change request(s) above and update the APML accordingly.\n`;
    apmlWithCRs += `# Focus on the specific screens and requirements mentioned in each CR comment.\n`;
    apmlWithCRs += `# Remove the CR comments after implementing the changes.\n`;
    
    return apmlWithCRs;
  }
  
  function downloadFile(filename, content) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
</script>

<div class="panel h-full flex flex-col">
  <h3 class="text-lg font-semibold mb-4">Validation & Testing</h3>
  
  <!-- Tab Navigation -->
  <div class="flex border-b border-gray-200 mb-4">
    <button
      class="px-4 py-2 text-sm font-medium {activeTab === 'manual' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}"
      on:click={() => activeTab = 'manual'}
    >
      Manual Testing
    </button>
    <button
      class="px-4 py-2 text-sm font-medium {activeTab === 'automated' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}"
      on:click={() => activeTab = 'automated'}
    >
      Automated
    </button>
    <button
      class="px-4 py-2 text-sm font-medium {activeTab === 'changes' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}"
      on:click={() => activeTab = 'changes'}
    >
      Change Requests
    </button>
  </div>
  
  <!-- Tab Content -->
  <div class="flex-1 overflow-auto">
    {#if activeTab === 'manual'}
      <!-- Manual Testing Tab -->
      <div class="space-y-4">
        <!-- Breadcrumb Trail -->
        {#if pathHistory.length > 0}
          <div>
            <h4 class="text-sm font-medium text-gray-700 mb-2">Path History</h4>
            <div class="flex flex-wrap gap-1">
              {#each pathHistory as step, index}
                <span class="text-xs bg-gray-100 px-2 py-1 rounded">
                  {step?.interfaceName || `Step ${index + 1}`}
                </span>
                {#if index < pathHistory.length - 1}
                  <span class="text-xs text-gray-400">→</span>
                {/if}
              {/each}
            </div>
          </div>
        {/if}
        
        <!-- Available Actions -->
        <div>
          <h4 class="text-sm font-medium text-gray-700 mb-2">Available Actions</h4>
          {#if availableActions.length > 0}
            <div class="space-y-2">
              {#each availableActions as action}
                <button class="w-full text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded text-sm transition-colors">
                  {action}
                </button>
              {/each}
            </div>
          {:else}
            <p class="text-sm text-gray-500">No actions available</p>
          {/if}
        </div>
      </div>
      
    {:else if activeTab === 'automated'}
      <!-- Automated Testing Tab -->
      <div class="space-y-4">
        <button 
          on:click={runAllPathsTest}
          class="w-full btn"
        >
          Test All Possible Paths
        </button>
        
        {#if results.totalPathsTested > 0}
          <div class="bg-gray-50 rounded-lg p-4">
            <h4 class="text-sm font-medium text-gray-700 mb-3">Test Results</h4>
            
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span>Total Paths:</span>
                <span class="font-medium">{results.totalPathsTested}</span>
              </div>
              <div class="flex justify-between">
                <span>Successful:</span>
                <span class="font-medium text-green-600">{results.successfulPaths}</span>
              </div>
              <div class="flex justify-between">
                <span>Failed:</span>
                <span class="font-medium text-red-600">{results.failedPaths}</span>
              </div>
            </div>
            
            {#if results.issues.length > 0}
              <div class="mt-4">
                <h5 class="text-sm font-medium text-gray-700 mb-2">Issues Found</h5>
                <ul class="space-y-1">
                  {#each results.issues as issue}
                    <li class="text-sm text-red-600 bg-red-50 px-2 py-1 rounded">
                      {issue}
                    </li>
                  {/each}
                </ul>
              </div>
            {/if}
          </div>
        {/if}
      </div>
      
    {:else if activeTab === 'changes'}
      <!-- Change Requests Tab -->
      <div class="space-y-4">
        <button 
          on:click={() => showCRDialog = true}
          class="w-full btn"
        >
          Add Change Request for Current Screen
        </button>
        
        {#if crs.length > 0}
          <div class="space-y-3">
            {#each crs as cr}
              <div class="bg-gray-50 rounded-lg p-3">
                <div class="flex items-start justify-between mb-2">
                  <span class="text-sm font-medium">{cr.screenState.interfaceName}</span>
                  <span class="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded {cr.priority === 'high' ? 'bg-red-100 text-red-800' : cr.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}">
                    {cr.priority}
                  </span>
                </div>
                <p class="text-sm text-gray-600 mb-2">{cr.userNote}</p>
                <div class="flex items-center justify-between text-xs text-gray-500">
                  <span>{cr.crType}</span>
                  <span>{new Date(cr.timestamp).toLocaleDateString()}</span>
                </div>
              </div>
            {/each}
          </div>
          
          <div class="space-y-2">
            <button 
              on:click={copyAPMLWithCRs}
              class="copy-btn w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
              </svg>
              <span>Copy APML + CRs for LLM</span>
            </button>
            <button 
              on:click={exportAPMLWithCRs}
              class="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              </svg>
              <span>Download APML File</span>
            </button>
          </div>
        {:else}
          <p class="text-sm text-gray-500 text-center py-8">
            No change requests yet
          </p>
        {/if}
      </div>
    {/if}
  </div>
</div>

<!-- Change Request Dialog -->
{#if showCRDialog}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
      <h3 class="text-lg font-semibold mb-4">Add Change Request</h3>
      
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Current Screen: {currentNode?.interfaceName || 'No screen selected'}
          </label>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Change Description
          </label>
          <textarea 
            bind:value={newCRNote}
            class="w-full p-3 border border-gray-300 rounded-lg"
            rows="3"
            placeholder="Describe what you'd like changed about this screen..."
          ></textarea>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Type</label>
          <select bind:value={newCRType} class="w-full p-2 border border-gray-300 rounded-lg">
            <option value="ui_change">UI Change</option>
            <option value="flow_change">Flow Change</option>
            <option value="data_change">Data Change</option>
            <option value="new_feature">New Feature</option>
          </select>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Priority</label>
          <select bind:value={newCRPriority} class="w-full p-2 border border-gray-300 rounded-lg">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        
        <div class="flex gap-3 pt-2">
          <button 
            on:click={addChangeRequest}
            disabled={!newCRNote.trim()}
            class="flex-1 btn"
          >
            Save Change Request
          </button>
          <button 
            on:click={() => showCRDialog = false}
            class="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
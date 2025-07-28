<script>
  let availableApmlFiles = [];
  let showFileSelector = false;

  async function loadAvailableApmlFiles() {
    try {
      console.log('Loading APML files...');
      const response = await fetch('/api/apml-files');
      const data = await response.json();
      
      console.log('APML files response:', data);
      
      if (data.success && data.files.length > 0) {
        availableApmlFiles = data.files;
        showFileSelector = true;
        alert(`Found ${data.files.length} APML files!`);
      } else {
        alert('No APML files found');
      }
    } catch (error) {
      console.error('Error loading APML files:', error);
      alert('Error loading APML files: ' + error.message);
    }
  }

  async function loadSpecificApmlFile(filename) {
    try {
      console.log('Loading file:', filename);
      const response = await fetch(`/api/apml/${filename}`);
      const data = await response.json();
      
      console.log('File data:', data);
      alert(`Loaded ${filename}! Check console for details.`);
      showFileSelector = false;
    } catch (error) {
      console.error('Error loading file:', error);
      alert('Error loading file: ' + error.message);
    }
  }
</script>

<div class="min-h-screen bg-gray-900 text-white p-8">
  <div class="max-w-4xl mx-auto">
    <h1 class="text-3xl font-bold mb-8 text-center">🎨 Trinity APML Visualiser - TEST MODE</h1>
    
    <div class="text-center mb-8">
      <button 
        on:click={loadAvailableApmlFiles}
        class="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
      >
        📁 LOAD YOUR APML FILES (TEST)
      </button>
    </div>

    {#if showFileSelector && availableApmlFiles.length > 0}
      <div class="bg-gray-800 rounded-lg p-6 border border-gray-600">
        <h2 class="text-xl font-semibold mb-4">Select APML File:</h2>
        <div class="space-y-3">
          {#each availableApmlFiles as file}
            <button
              on:click={() => loadSpecificApmlFile(file.name)}
              class="w-full text-left p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              <div class="font-semibold text-lg">{file.name}</div>
              <div class="text-sm text-gray-300">
                Size: {(file.size/1024).toFixed(1)}KB • 
                Modified: {new Date(file.modified).toLocaleDateString()}
              </div>
            </button>
          {/each}
        </div>
        
        <button
          on:click={() => showFileSelector = false}
          class="mt-4 px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded text-white"
        >
          Cancel
        </button>
      </div>
    {/if}

    <div class="mt-8 text-center text-gray-400">
      <p>This is a test version to make sure the Trinity route works.</p>
      <p>If you can see this page and the button works, then routing is fine.</p>
    </div>
  </div>
</div>
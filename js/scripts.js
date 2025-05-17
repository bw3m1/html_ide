// Constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const DEFAULT_FONT_SIZE = 16;
const DEBOUNCE_DELAY = 500;
const INIT_CONTENTS = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>New Document</title>
    <link rel="icon" type="image/png" href="example_image.png">
    <style>
      
      /* Style Sheets goes here */
      
    </style>
  </head>
  <body>
      
    <!-- body -->
      
    <script>
      
      // JS goes here
      
    </script>
  </body>
</html>`;
const FILE_TYPES = {
  html: { mime: 'text/html', ext: '.html' },
  css: { mime: 'text/css', ext: '.css' },
  js: { mime: 'text/javascript', ext: '.js' },
  json: { mime: 'application/json', ext: '.json' },
  txt: { mime: 'text/plain', ext: '.txt' }
};

// State management
const state = {
  unsavedChanges: false,
  recentFiles: JSON.parse(localStorage.getItem('recentFiles')) || [],
  tabs: JSON.parse(localStorage.getItem('editorTabs')) || [{
    id: 'tab1',
    name: 'untitled.html',
    type: 'html',
    content: INIT_CONTENTS,
    handle: null,
    active: true
  }],
  currentTabId: 'tab1',
  fileExplorerOpen: localStorage.getItem('fileExplorerOpen') === 'true',
  files: JSON.parse(localStorage.getItem('projectFiles')) || [
    { name: 'index.html', type: 'file' },
    { name: 'styles.css', type: 'file' },
    { name: 'scripts.js', type: 'file' },
    { name: 'assets', type: 'folder', children: [] }
  ]
};

// Configure Monaco Editor loader with language support paths
require.config({
  paths: {
    'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.40.0/min/vs',
    'vs/language/html': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.40.0/min/vs/language/html',
    'vs/language/css': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.40.0/min/vs/language/css',
    'vs/language/typescript': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.40.0/min/vs/language/typescript',
    'vs/language/json': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.40.0/min/vs/language/json'
  }
});

// Initialize Monaco Editor with language support
require(['vs/editor/editor.main'], function () {
  // Register languages with Monaco
  monaco.languages.register({ id: 'html' });
  monaco.languages.register({ id: 'css' });
  monaco.languages.register({ id: 'javascript' });
  monaco.languages.register({ id: 'json' });
  monaco.languages.register({ id: 'plaintext' });

  // Create editor instance

  if (!window.monacoEditorInstance) {
    window.monacoEditorInstance = monaco.editor.create(document.getElementById('editor'), {
      value: getCurrentTab().content,
      language: 'html',
      theme: localStorage.getItem('editorTheme') === 'light' ? 'vs' : 'vs-dark',
      fontSize: parseInt(localStorage.getItem('editorFontSize')) || DEFAULT_FONT_SIZE,
      fontFamily: localStorage.getItem('editorFontFamily') || 'monospace',
      lineNumbers: localStorage.getItem('editorLineNumbers') !== 'off' ? 'on' : 'off',
      minimap: { enabled: true },
      automaticLayout: true,
      tabSize: 2,
      autoClosingBrackets: 'always',
      autoIndent: 'full',
      formatOnPaste: true,
      formatOnType: true
    });
  }
  const editor = window.monacoEditorInstance;

  // Editor functionality
  const preview = document.getElementById('preview');
  const statusMessage = document.getElementById('statusMessage');
  const lineInfo = document.getElementById('lineInfo');
  const fileExplorer = document.getElementById('file-explorer');
  const fileList = document.getElementById('file-list');
  const tabsContainer = document.getElementById('tabsContainer');
  let updateTimeout;

  // Examples
  const examples = {
    'basic': `
<!DOCTYPE html>\n<html>\n

<head>\n <title>Basic Page</title>\n</head>\n

<body>\n <h1>Hello World</h1>\n <p>This is a basic HTML page.</p>\n</body>\n

</html>`,
    'form': `
<!DOCTYPE html>\n<html>\n

<head>\n <title>Form Example</title>\n <style>
    \n form {
      \n max-width: 500px;
      \n margin: 20px auto;
      \n padding: 20px;
      \n border: 1px solid #ddd;
      \n border-radius: 5px;
      \n
    }

    \n label {
      display: block;
      margin-bottom: 5px;
    }

    \n input,
    textarea {
      width: 100%;
      padding: 8px;
      margin-bottom: 10px;
    }

    \n button {
      background: #007acc;
      color: white;
      border: none;
      padding: 10px 15px;
    }

    \n
  </style>\n</head>\n

<body>\n <form>\n <label>Name:</label>\n <input type="text">\n <label>Email:</label>\n <input type="email">\n
    <label>Message:</label>\n <textarea rows="4"></textarea>\n <button type="submit">Submit</button>\n </form>\n</body>
\n

</html>`,
    'grid': `
<!DOCTYPE html>\n<html>\n

<head>\n <title>CSS Grid</title>\n <style>
    \n .grid-container {
      \n display: grid;
      \n grid-template-columns: repeat(3, 1fr);
      \n gap: 10px;
      \n
    }

    \n .grid-item {
      \n background: #007acc;
      \n color: white;
      \n padding: 20px;
      \n text-align: center;
      \n
    }

    \n
  </style>\n</head>\n

<body>\n <div class="grid-container">\n <div class="grid-item">1</div>\n <div class="grid-item">2</div>\n <div
      class="grid-item">3</div>\n <div class="grid-item">4</div>\n <div class="grid-item">5</div>\n <div
      class="grid-item">6</div>\n </div>\n</body>\n

</html>`,
    'table': `
<!DOCTYPE html>\n<html>\n

<head>\n <title>Table Example</title>\n <style>
    \n table {
      border-collapse: collapse;
      width: 100%;
    }

    \n th,
    td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }

    \n th {
      background-color: #007acc;
      color: white;
    }

    \n tr:nth-child(even) {
      background-color: #f2f2f2;
    }

    \n
  </style>\n</head>\n

<body>\n <table>\n <tr>\n <th>Name</th>\n <th>Email</th>\n <th>Role</th>\n </tr>\n <tr>\n <td>Blue</td>\n <td>
        Blue@amongus.sussy</td>\n <td>Crew mate</td>\n </tr>\n <tr>\n <td>Red</td>\n <td>Red@amongus.sussy</td>\n <td>
        Imposter</td>\n </tr>\n </table>\n</body>\n

</html>`,
    'responsive': `
<!DOCTYPE html>\n<html>\n

<head>\n <title>Responsive Example</title>\n
  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n <style>
    \n .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }

    \n .header {
      background: #007acc;
      color: white;
      padding: 20px;
      text-align: center;
    }

    \n .main {
      display: flex;
      flex-wrap: wrap;
    }

    \n .sidebar {
      flex: 1;
      min-width: 200px;
      background: #f0f0f0;
      padding: 20px;
    }

    \n .content {
      flex: 3;
      min-width: 300px;
      padding: 20px;
    }

    \n @media (max-width: 600px) {
      \n .main {
        flex-direction: column;
      }

      \n
    }

    \n
  </style>\n
</head>\n

<body>\n <div class="container">\n <div class="header">\n <h1>Responsive Layout</h1>\n </div>\n <div class="main">\n
      <div class="sidebar">\n <h3>Sidebar</h3>\n <p>Content here</p>\n </div>\n <div class="content">\n <h2>Main Content
        </h2>\n <p>Resize the browser to see the responsive effect.</p>\n </div>\n </div>\n </div>\n</body>\n

</html>`,
    'json-example': `{\n "name": "My Project",\n "version": "1.0.0",\n "description": "A sample JSON file",\n
"dependencies": {\n "monaco-editor": "^0.40.0",\n "jszip": "^3.10.1"\n },\n "scripts": {\n "start": "node server.js",\n
"build": "webpack"\n }\n}`
  };

  // Tab management functions
  function generateTabId() {
    return 'tab' + Date.now() + Math.floor(Math.random() * 1000);
  }

  function getCurrentTab() {
    return state.tabs.find(tab => tab.id === state.currentTabId);
  }

  function getTabById(tabId) {
    return state.tabs.find(tab => tab.id === tabId);
  }

  function renderTabs() {
    tabsContainer.innerHTML = '';

    state.tabs.forEach(tab => {
      const tabElement = document.createElement('div');
      tabElement.className = `tab ${tab.active ? 'active' : ''}`;
      tabElement.dataset.tabId = tab.id;

      tabElement.innerHTML = `
${tab.name}
<div class="tab-close" data-action="close-tab" data-tab-id="${tab.id}">×</div>
`;

      tabElement.addEventListener('click', (e) => {
        if (!e.target.classList.contains('close-tab')) {
          switchToTab(tab.id);
        }
      });

      tabsContainer.appendChild(tabElement);
    });
  }

  function switchToTab(tabId) {
    const currentTab = getCurrentTab();
    if (currentTab) {
      // Save current content before switching
      currentTab.content = editor.getValue();
      currentTab.active = false;
    }

    const newTab = getTabById(tabId);
    if (newTab) {
      state.currentTabId = tabId;
      newTab.active = true;
      editor.setValue(newTab.content);

      // Update language mode
      const fileType = newTab.name.split('.').pop().toLowerCase();
      const languageMap = {
        html: 'html',
        css: 'css',
        js: 'javascript',
        json: 'json',
        txt: 'plaintext'
      };

      monaco.editor.setModelLanguage(editor.getModel(), languageMap[fileType] || 'plaintext');

      renderTabs();
      updatePreview();
      updateStatus(`Switched to ${newTab.name}`);
      saveTabsToStorage();
    }
  }

  function addNewTab() {

    //  !!

    // ether im bat at odeing or im bad at iplamenting code in html or both


    const tabId = generateTabId();
    const newTab = {
      id: tabId,
      name: `untitled-${state.tabs.length + 1}.html`,
      type: 'html',
      content: `
<!DOCTYPE html>\n<html>\n

<head>\n <title>New Document</title>\n</head>\n

<body>\n\n</body>\n

</html>`,
      handle: null,
      active: true
    };

    // Deactivate current tab
    const currentTab = getCurrentTab();
    if (currentTab) {
      currentTab.content = editor.getValue();
      currentTab.active = false;
    }

    state.tabs.push(newTab);
    state.currentTabId = tabId;

    renderTabs();
    editor.setValue(newTab.content);
    updateStatus(`Created new tab: ${newTab.name}`);
    saveTabsToStorage();
  }

  function closeTab(tabId = null) {
    // If no tabId provided, try to close current tab
    if (!tabId) {
      const currentTab = getCurrentTab();
      if (!currentTab) {
        updateStatus("Error: No active tab to close", true);
        return;
      }
      tabId = currentTab.id;
    }

    // Validate tab exists
    const tabIndex = state.tabs.findIndex(tab => tab.id === tabId);
    if (tabIndex === -1) {
      updateStatus(`Error: Tab ${tabId} not found`, true);

      // Auto-recovery: switch to first available tab or create new one
      if (state.tabs.length > 0) {
        switchToTab(state.tabs[0].id);
      } else {
        addNewTab();
      }
      return;
    }

    // Check for unsaved changes
    const tabToClose = state.tabs[tabIndex];
    const isActiveTab = tabToClose.active;
    const hasUnsavedChanges = isActiveTab &&
      editor.getValue() !== tabToClose.content;

    if (hasUnsavedChanges && !confirm('You have unsaved changes. Close tab anyway?')) {
      return;
    }

    // Close the tab
    state.tabs.splice(tabIndex, 1);

    // Handle tab switching after closure
    if (isActiveTab) {
      if (state.tabs.length > 0) {
        // Switch to nearest tab (next or previous)
        const newIndex = Math.min(tabIndex, state.tabs.length - 1);
        switchToTab(state.tabs[newIndex].id);
      } else {
        // Create new default tab if none remain
        addNewTab();
      }
    }

    // Update UI and state
    renderTabs();
    saveTabsToStorage();
    state.unsavedChanges = false;
    updateStatus(`Closed tab: ${tabToClose.name}`);
  }

  function saveTabsToStorage() {
    const sanitizedTabs = state.tabs.map(tab => ({
      ...tab,
      handle: null // Exclude handle
    }));
    localStorage.setItem('editorTabs', JSON.stringify(sanitizedTabs));
  }

  // File Explorer Functions
  function toggleFileExplorer() {
    state.fileExplorerOpen = !state.fileExplorerOpen;
    localStorage.setItem('fileExplorerOpen', state.fileExplorerOpen);

    if (state.fileExplorerOpen) {
      fileExplorer.classList.add('open');
      document.body.classList.add('file-explorer-open');
    } else {
      fileExplorer.classList.remove('open');
      document.body.classList.remove('file-explorer-open');
    }

    updateStatus(`File explorer ${state.fileExplorerOpen ? 'opened' : 'closed'}`);
  }

  function renderFileList() {
    fileList.innerHTML = '';

    function renderItems(items, parentPath = '') {
      items.forEach(item => {
        const path = parentPath ? `${parentPath}/${item.name}` : item.name;
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.dataset.path = path;
        fileItem.dataset.type = item.type;

        fileItem.innerHTML = `
        <div class="file-item-name">
          ${item.type === 'folder' ? '📁 ' : '📄 '}${item.name}
        </div>
        <div class="file-item-actions">
          ${item.type === 'file' ?
            `<span class="file-item-open" data-action="open-file" data-path="${path}">Open</span>` : ''}
          <span class="file-item-delete" data-action="delete-file" data-path="${path}">×</span>
        </div>
      `;

        fileItem.addEventListener('click', (e) => {
          if (e.target.classList.contains('file-item-delete') ||
            e.target.classList.contains('file-item-open')) {
            return;
          }

          if (item.type === 'folder') {
            // Toggle folder expansion
            fileItem.classList.toggle('expanded');
          }
        });

        fileList.appendChild(fileItem);

        if (item.type === 'folder' && item.children) {
          const childContainer = document.createElement('div');
          childContainer.className = 'folder-children';
          fileItem.appendChild(childContainer);
          renderItems(item.children, path, childContainer);
        }
      });
    }

    renderItems(state.files);
  }

  function addFile() {
    const fileName = prompt('Enter file name (include extension):', 'newfile.html');
    if (fileName) {
      state.files.push({
        name: fileName,
        type: 'file'
      });
      saveProjectFiles();
      renderFileList();
      updateStatus(`Added file: ${fileName}`);
    }
  }

  function addFolder() {
    const folderName = prompt('Enter folder name:', 'newfolder');
    if (folderName) {
      state.files.push({
        name: folderName,
        type: 'folder',
        children: []
      });
      saveProjectFiles();
      renderFileList();
      updateStatus(`Added folder: ${folderName}`);
    }
  }

  function deleteFile(path) {
    if (confirm(`Are you sure you want to delete ${path}?`)) {
      const pathParts = path.split('/');
      let currentLevel = state.files;

      for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i]; const folder = currentLevel.find(item =>
          item.name === part && item.type === 'folder');
        if (!folder) break;
        currentLevel = folder.children;
      }

      const itemName = pathParts[pathParts.length - 1];
      const index = currentLevel.findIndex(item => item.name === itemName);

      if (index !== -1) {
        currentLevel.splice(index, 1);
        saveProjectFiles();
        renderFileList();
        updateStatus(`Deleted: ${path}`);
      }
    }
  }

  function saveProjectFiles() {
    localStorage.setItem('projectFiles', JSON.stringify(state.files));
  }

  // Update preview with sandboxed iframe and error handling
  function updatePreview() {
    try {
      preview.innerHTML = '';
      const currentTab = getCurrentTab();
      const isJsFile = currentTab.name.endsWith('.js');

      if (isJsFile) {
        // Create a container for JS output
        const jsOutputContainer = document.createElement('div');
        jsOutputContainer.id = 'js-output';
        jsOutputContainer.style.padding = '1rem';
        jsOutputContainer.style.fontFamily = 'monospace';
        jsOutputContainer.style.whiteSpace = 'pre';
        jsOutputContainer.style.overflow = 'auto';
        jsOutputContainer.style.height = '100%';

        // Create a console div
        const consoleDiv = document.createElement('div');
        consoleDiv.id = 'js-console';
        consoleDiv.style.backgroundColor = 'var(--menu-bg-dark)';
        consoleDiv.style.padding = '0.5rem';
        consoleDiv.style.marginTop = '1rem';
        consoleDiv.style.borderRadius = '4px';
        consoleDiv.style.fontFamily = 'monospace';
        consoleDiv.style.whiteSpace = 'pre-wrap';

        preview.appendChild(jsOutputContainer);


        // Override console.log to capture output
        const originalConsoleLog = console.log;
        const logs = [];

        console.log = function (...args) {
          logs.push(args.join(' '));
          consoleDiv.textContent = logs.join('\n');
          consoleDiv.scrollTop = consoleDiv.scrollHeight;
          originalConsoleLog.apply(console, args);
        };

        try {
          // Execute the JS code
          const result = new Function(editor.getValue())();

          if (result !== undefined) {
            jsOutputContainer.textContent = String(result);
          } else {
            jsOutputContainer.textContent = 'Code executed (no return value)';
          }
        } catch (error) {
          jsOutputContainer.textContent = `Error: ${error.message}`;
          jsOutputContainer.style.color = 'var(--error-red)';
        }

        // Restore original console.log
        console.log = originalConsoleLog;

        updateStatus("JavaScript executed");
      } else {
        // Original HTML preview code
        const iframe = document.createElement('iframe');
        iframe.sandbox = 'allow-same-origin';
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        preview.appendChild(iframe);

        const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <script>
          window.onerror = function(e) {
            parent.postMessage({ 
              type: 'preview-error', 
              error: e.toString() 
            }, '*');
          };
        <\/script>
        <style>
          body { margin: 0; padding: 1rem; }
          .error { color: red; }
        </style>
      </head>
      <body>${editor.getValue()}</body>
      </html>`;

        iframe.contentDocument.open();
        iframe.contentDocument.write(content);
        iframe.contentDocument.close();

        updateStatus("Preview updated");
      }
    } catch (error) {
      showError(`Preview error: ${error.message}`);
    }
  }

  // File operations with enhanced language support
  async function saveFile() {
    try {
      const currentTab = getCurrentTab();
      if (!currentTab.handle) {
        return await saveFileAs(currentTab.type || 'html');
      }

      const writable = await currentTab.handle.createWritable();
      await writable.write(editor.getValue());
      await writable.close();

      currentTab.content = editor.getValue();
      state.unsavedChanges = false;
      updateStatus(`Saved ${currentTab.name}`);
      addToRecentFiles(currentTab);
      saveTabsToStorage();

      return true;
    } catch (error) {
      showError(`Save failed: ${error.message}`);
      return false;
    }
  }

  async function saveFileAs(type = 'html') {
    try {
      const currentTab = getCurrentTab();
      const fileType = FILE_TYPES[type] || FILE_TYPES.html;
      const handle = await window.showSaveFilePicker({
        suggestedName: currentTab.name.replace(/\..*$/, '') + fileType.ext,
        types: [{
          description: `${fileType.ext.toUpperCase()} Files`,
          accept: { [fileType.mime]: [fileType.ext] }
        }]
      });

      const writable = await handle.createWritable();
      await writable.write(editor.getValue());
      await writable.close();

      currentTab.name = handle.name;
      currentTab.handle = handle;
      currentTab.type = type;
      currentTab.content = editor.getValue();

      state.unsavedChanges = false;
      updateStatus(`Saved as ${handle.name}`);
      addToRecentFiles(currentTab);
      await detectLanguage();
      renderTabs();
      saveTabsToStorage();

      return true;
    } catch (error) {
      if (error.name !== 'AbortError') {
        showError(`Save failed: ${error.message}`);
      }
      return false;
    }
  }

  async function saveText() {
    await saveFileAs('txt');
  }

  async function saveCSS() {
    await saveFileAs('css');
  }

  async function saveJS() {
    await saveFileAs('js');
  }

  async function saveJSON() {
    await saveFileAs('json');
  }

  async function saveZip() {
    try {
      const zip = new JSZip();
      const projectName = prompt("Enter project name for ZIP file:", "my_project") || "my_project";
      const tabsToInclude = state.tabs.filter(tab =>
        confirm(`Include "${tab.name}" in the ZIP file?`)
      );
      if (tabsToInclude.length === 0 &&
        !confirm("No tabs selected. Continue with empty project?")) {
        updateStatus("ZIP export canceled", true);
        return;
      }
      tabsToInclude.forEach(tab => {
        zip.file(tab.name, tab.content);
      });
      if (confirm("Include files from file explorer in ZIP?")) {
        function addFilesToZip(items, zipFolder, path = '') {
          items.forEach(item => {
            const itemPath = path ? `${path}/${item.name}` : item.name;
            if (item.type === 'file') {
              zipFolder.file(itemPath, `Content for ${item.name}`);
            } else if (item.type === 'folder' && item.children) {
              const newFolder = zipFolder.folder(item.name);
              addFilesToZip(item.children, newFolder, itemPath);
            }
          });
        }
        addFilesToZip(state.files, zip);
      }
      const content = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 }
      });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${projectName}.zip`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      updateStatus(`Exported ${tabsToInclude.length} files as ${projectName}.zip`);
    } catch (error) {
      showError(`Error creating ZIP: ${error.message}`);
    }
  }

  async function openFile() {
    try {
      const [handle] = await window.showOpenFilePicker({
        types: Object.values(FILE_TYPES).map(type => ({
          description: `${type.ext.toUpperCase()} Files`,
          accept: { [type.mime]: [type.ext] }
        }))
      });

      const file = await handle.getFile();
      if (file.size > MAX_FILE_SIZE) {
        throw new Error(`File too large (max ${MAX_FILE_SIZE / 1024 / 1024}MB)`);
      }

      const content = await file.text();
      const fileType = handle.name.split('.').pop().toLowerCase();

      // Create a new tab for the opened file
      const tabId = generateTabId();
      const newTab = {
        id: tabId,
        name: handle.name,
        type: Object.keys(FILE_TYPES).includes(fileType) ? fileType : 'html',
        content: content,
        handle: handle,
        active: true
      };

      // Deactivate current tab
      const currentTab = getCurrentTab();
      if (currentTab) {
        currentTab.active = false;
      }

      state.tabs.push(newTab);
      state.currentTabId = tabId;

      editor.setValue(content);
      renderTabs();
      updateStatus(`Opened ${handle.name}`);
      addToRecentFiles(newTab);
      await detectLanguage();
      saveTabsToStorage();

    } catch (error) {
      if (error.name !== 'AbortError') {
        showError(`Open failed: ${error.message}`);
      }
    }
  }

  async function openRecentFile(fileName) {
    try {
      const fileHandle = await findFileHandle(fileName);
      if (fileHandle) {
        const file = await fileHandle.getFile();
        const content = await file.text();
        const fileType = file.name.split('.').pop().toLowerCase();

        // Create a new tab for the opened file
        const tabId = generateTabId();
        const newTab = {
          id: tabId,
          name: file.name,
          type: Object.keys(FILE_TYPES).includes(fileType) ? fileType : 'html',
          content: content,
          handle: fileHandle,
          active: true
        };

        // Deactivate current tab
        const currentTab = getCurrentTab();
        if (currentTab) {
          currentTab.active = false;
        }

        state.tabs.push(newTab);
        state.currentTabId = tabId;

        editor.setValue(content);
        renderTabs();
        updateStatus(`Opened ${file.name}`);
        await detectLanguage();
        saveTabsToStorage();
      } else {
        showError("File not found. It may have been moved or deleted.");
        state.recentFiles = state.recentFiles.filter(f => f.name !== fileName);
        updateRecentFilesMenu();
      }
    } catch (error) {
      showError(`Error opening recent file: ${error.message}`);
    }
  }

  async function findFileHandle(fileName) {
    try {
      const directoryHandle = await window.showDirectoryPicker();
      return await getFileHandle(directoryHandle, fileName);
    } catch {
      return null;
    }
  }

  async function getFileHandle(directoryHandle, fileName) {
    try {
      return await directoryHandle.getFileHandle(fileName);
    } catch {
      return null;
    }
  }

  function newFile() {
    if (state.unsavedChanges && !confirm('You have unsaved changes. Create new file anyway?')) {
      return;
    }

    // Create a new tab instead of replacing current one
    const tabId = generateTabId();
    const newTab = {
      id: tabId,
      name: 'untitled.html',
      type: 'html',
      content: INIT_CONTENTS,
      handle: null,
      active: true
    };

    // Deactivate current tab
    const currentTab = getCurrentTab();
    if (currentTab) {
      currentTab.active = false;
    }

    state.tabs.push(newTab);
    state.currentTabId = tabId;

    editor.setValue(newTab.content);
    state.unsavedChanges = false;
    renderTabs();
    updateStatus("Created new file");
    detectLanguage();
    saveTabsToStorage();
  }

  function nameFile() {
    const currentTab = getCurrentTab();
    const name = prompt('Enter new file name (without extension):',
      currentTab.name.replace(/\..*$/, ''));
    if (name) {
      currentTab.name = `${name}${FILE_TYPES[currentTab.type].ext}`;
      renderTabs();
      updateStatus(`Renamed to ${currentTab.name}`);
      saveTabsToStorage();
    }
  }

  function clearFile() {
    if (state.unsavedChanges && !confirm('You have unsaved changes. Clear editor anyway?')) {
      return;
    }
    editor.setValue('');
    state.unsavedChanges = true;
    updateStatus("Editor cleared");
  }

  async function detectLanguage() {
    const currentTab = getCurrentTab();
    const fileType = currentTab.name.split('.').pop().toLowerCase();
    const languageMap = {
      html: 'html',
      css: 'css',
      js: 'javascript',
      json: 'json',
      txt: 'plaintext',
      md: 'markdown',
      c: 'c',
      cpp: 'cpp',
      cs: 'csharp',
      py: 'python',
      java: 'java',
      rs: 'rust',
      go: 'go',
      ts: 'typescript'
    };

    if (languageMap[fileType]) {
      try {
        // Load the specific language features if needed
        switch (fileType) {
          case 'html':
            await new Promise((resolve) => {
              require(['vs/language/html/html'], resolve);
            });
            break;
          case 'css':
            await new Promise((resolve) => {
              require(['vs/language/css/css'], resolve);
            });
            break;
          case 'js':
            await new Promise((resolve) => {
              require(['vs/language/typescript/tsMode'], resolve);
            });
            break;
          case 'json':
            await new Promise((resolve) => {
              require(['vs/language/json/jsonMode'], resolve);
            });
            break;
          case 'plaintext':
            await new Promise((resolve) => {
              require(['vs/language/plaintext/plaintextMode'], resolve);
            });
            break;
          case 'markdown':
            await new Promise((resolve) => {
              require(['vs/language/markdown/markdownMode'], resolve);
            });
            break;
        }

        monaco.editor.setModelLanguage(editor.getModel(), languageMap[fileType]);
        updateStatus(`Language mode set to ${languageMap[fileType]}`);
      } catch (error) {
        console.error('Error loading language features:', error);
        monaco.editor.setModelLanguage(editor.getModel(), languageMap[fileType] || 'plaintext');
      }
    }
  }

  function updateSyntaxHighlighting(language) {
    const model = editor.getModel();
    if (model) {
      monaco.editor.setModelLanguage(model, language);
      updateStatus(`Syntax highlighting set to ${language}`);
    }
  }

  // Recent files management
  function addToRecentFiles(file) {
    state.recentFiles = [
      { name: file.name, lastOpened: Date.now() },
      ...state.recentFiles.filter(f => f.name !== file.name)
    ].slice(0, 10);

    localStorage.setItem('recentFiles', JSON.stringify(state.recentFiles));
    updateRecentFilesMenu();
  }

  function updateRecentFilesMenu() {
    const recentFilesMenu = document.getElementById('recent-files-menu');
    if (!recentFilesMenu) return;

    recentFilesMenu.innerHTML = state.recentFiles.length
      ? state.recentFiles.map(file => `
          <div class="dropdown-item" role="menuitem" 
                data-action="open-recent" data-file="${file.name}">
            ${file.name}
          </div>
        `).join('')
      : '<div class="dropdown-item" role="menuitem" disabled>No recent files</div>';
  }

  // Unsaved changes protection
  function setupBeforeUnload() {
    window.addEventListener('beforeunload', (e) => {
      if (state.unsavedChanges) {
        e.preventDefault();
        return e.returnValue = 'You have unsaved changes';
      }
    });

    editor.onDidChangeModelContent(() => {
      const currentTab = getCurrentTab();
      if (currentTab) {
        currentTab.content = editor.getValue();
        saveTabsToStorage();
      }
      state.unsavedChanges = true;
    });
  }

  // Status management
  function updateStatus(message, isError = false) {
    statusMessage.textContent = message;
    statusMessage.style.color = isError
      ? 'var(--error-red)'
      : 'var(--text-dark)';
  }

  function showError(message) {
    console.error(message);
    updateStatus(message, true);
  }

  // Theme switching
  function setTheme(theme) {
    // Remove all theme classes first
    document.body.classList.remove('light-theme', 'contrast-dark-theme', 'contrast-light-theme');

    // Apply selected theme
    if (theme === 'light') {
      document.body.classList.add('light-theme');
      monaco.editor.setTheme('vs');
    }
    else if (theme === 'contrast-dark') {
      document.body.classList.add('contrast-dark-theme');
      monaco.editor.setTheme('hc-black');
    }
    else if (theme === 'contrast-light') {
      document.body.classList.add('contrast-light-theme');
      monaco.editor.setTheme('hc-light');
    }
    else {
      // Default dark theme
      monaco.editor.setTheme('vs-dark');
    }

    localStorage.setItem('editorTheme', theme);
    updateStatus(`Theme set to ${theme}`);
  }

  // Run code
  function runCode(newTab) {
    const content = editor.getValue();
    if (newTab) {
      const newWindow = window.open();
      newWindow.document.write(content);
      updateStatus("Opened in new tab");
    } else {
      updatePreview();
    }
  }

  // Font size adjustments
  function adjustFontSize(change) {
    const currentSize = parseInt(editor.getOption(monaco.editor.EditorOption.fontSize));
    const newSize = Math.max(8, Math.min(36, currentSize + change));
    editor.updateOptions({ fontSize: newSize });
    localStorage.setItem('editorFontSize', newSize);
    updateStatus(`Font size: ${newSize}px`);
  }

  function resetFontSize() {
    editor.updateOptions({ fontSize: DEFAULT_FONT_SIZE });
    localStorage.setItem('editorFontSize', DEFAULT_FONT_SIZE);
    updateStatus("Font size reset to 16px");
  }

  // Layout options
  function setLayout(layout) {
    const container = document.getElementById('mainContainer');
    const editorWrapper = document.querySelector('.editor-wrapper');
    const previewPane = document.querySelector('.preview-pane');

    if (layout === 'horizontal' || layout === 'vertical') {
      container.style.flexDirection = layout === 'horizontal' ? 'row' : 'column';
      editorWrapper.style.display = 'flex';
      previewPane.style.display = 'flex';
      updateStatus(`Layout set to ${layout} split`);
    } else if (layout === 'editor-only') {
      editorWrapper.style.display = 'flex';
      previewPane.style.display = 'none';
      updateStatus("Showing editor only");
    } else if (layout === 'output-only') {
      editorWrapper.style.display = 'none';
      previewPane.style.display = 'flex';
      updateStatus("Showing output only");
    }
  }

  function setFileType(fileType) {
    const currentTab = getCurrentTab();
    const fileName = currentTab.name;
    const dotIndex = fileName.lastIndexOf('.');
    const name = dotIndex === -1 ? fileName : fileName.substring(0, dotIndex);
    if (name) {
      currentTab.name = `${name}${'.' + fileType}`;
      renderTabs();
      updateStatus(`Reformated to ${fileType}`);
      saveTabsToStorage();
    }
  }

  // Menu actions
  async function handleMenuAction(action, data) {
    try {
      switch (action) {
        case 'new': newFile(); break;
        case 'new-tab': addNewTab(); break;
        case 'close-tab': closeTab(data.tabId); break;
        case 'open': await openFile(); break;
        case 'open-recent': await openRecentFile(data.file); break;
        case 'save': await saveFile(); break;
        case 'save-as-html': await saveFileAs('html'); break;
        case 'save-as-txt': await saveText(); break;
        case 'save-as-css': await saveCSS(); break;
        case 'save-as-js': await saveJS(); break;
        case 'save-as-json': await saveJSON(); break;
        case 'save-as-zip': await saveZip(); break;
        case 'rename': nameFile(); break;
        case 'clear': clearFile(); break;
        case 'undo': editor.trigger('', 'undo'); break;
        case 'redo': editor.trigger('', 'redo'); break;
        case 'cut':
          const selection = editor.getSelection();
          const text = editor.getModel().getValueInRange(selection);
          navigator.clipboard.writeText(text).then(() => {
            editor.executeEdits("cut", [{ range: selection, text: "" }]);
          }).catch(err => showError("Clipboard access denied"));
          break;
        case 'copy':
          navigator.clipboard.writeText(
            editor.getModel().getValueInRange(editor.getSelection())
          ).catch(err => showError("Clipboard access denied"));
          break;
        case 'paste':
          navigator.clipboard.readText().then(text => {
            editor.executeEdits("paste", [{
              range: editor.getSelection(),
              text: text
            }]);
          }).catch(err => showError("Clipboard access denied"));
          break;
        case 'select-all': editor.setSelection(editor.getModel().getFullModelRange()); break;
        case 'find': editor.getAction('actions.find').run(); break;
        case 'layout-horizontal': setLayout('horizontal'); break;
        case 'layout-vertical': setLayout('vertical'); break;
        case 'layout-editor-only': setLayout('editor-only'); break;
        case 'layout-output-only': setLayout('output-only'); break;
        case 'theme-dark': setTheme('dark'); break;
        case 'theme-light': setTheme('light'); break;
        case 'toggle-explorer': toggleFileExplorer(); break;
        case 'add-file': addFile(); break;
        case 'add-folder': addFolder(); break;
        case 'delete-file': deleteFile(data.path); break;
        case 'number-lines':
        // theres this stupid bug where it will set it to off and then not toggle it back on
        const lineNumbers = editor.getOption(monaco.editor.EditorOption.lineNumbers);
          editor.updateOptions({ lineNumbers: lineNumbers === 'off' ? 'on' : 'off' });
          localStorage.setItem('editorLineNumbers', lineNumbers === 'off' ? 'on' : 'off');
          updateStatus(`Line numbers ${lineNumbers === 'off' ? 'enabled' : 'disabled'}`);
          break;
        case 'font-family-monospace':
          editor.updateOptions({ fontFamily: 'monospace' });
          localStorage.setItem('editorFontFamily', 'monospace');
          updateStatus("Font set to monospace");
          break;
        case 'font-family-arial':
          editor.updateOptions({ fontFamily: 'Arial, sans-serif' });
          localStorage.setItem('editorFontFamily', 'Arial, sans-serif');
          updateStatus("Font set to Arial");
          break;
        case 'font-family-courier':
          editor.updateOptions({ fontFamily: 'Courier New, monospace' });
          localStorage.setItem('editorFontFamily', 'Courier New, monospace');
          updateStatus("Font set to Courier New");
          break;
        case 'font-size-small':
          editor.updateOptions({ fontSize: 12 });
          localStorage.setItem('editorFontSize', 12);
          updateStatus("Font size set to small (12px)");
          break;
        case 'font-size-medium':
          editor.updateOptions({ fontSize: 16 });
          localStorage.setItem('editorFontSize', 16);
          updateStatus("Font size set to medium (16px)");
          break;
        case 'font-size-large':
          editor.updateOptions({ fontSize: 20 });
          localStorage.setItem('editorFontSize', 20);
          updateStatus("Font size set to large (20px)");
          break;
        case 'run-in-tab': runCode(false); break;
        case 'run-new-tab': runCode(true); break;
        case 'refresh-output': updatePreview(); break;
        case 'zoom-in': adjustFontSize(2); break;
        case 'zoom-out': adjustFontSize(-2); break;
        case 'reset-zoom': resetFontSize(); break;
        case 'example-basic': editor.setValue(examples.basic); break;
        case 'example-form': editor.setValue(examples.form); break;
        case 'example-grid': editor.setValue(examples.grid); break;
        case 'example-table': editor.setValue(examples.table); break;
        case 'example-responsive': editor.setValue(examples.responsive); break;
        case 'example-json': editor.setValue(examples['json-example']); break;
        case 'theme-contrast-dark': setTheme('contrast-dark'); break;
        case 'theme-contrast-light': setTheme('contrast-light'); break;
        case 'documentation':
          const docUrl = new URL('IDE_docmtn.html', window.location.href).href;
          window.open(docUrl, '_blank');
          updateStatus("Opening IDE documentation");
          break;
        case 'extensions':
          window.open('extensions.html', '_blank');
          updateStatus("Opened Extensions Loader");
          break;
        case 'shortcuts-win':
          window.open('https://code.visualstudio.com/shortcuts/keyboard-shortcuts-windows.pdf', '_blank');
          updateStatus("Opening Windows shortcuts");
          break;
        case 'shortcuts-mac':
          window.open('https://code.visualstudio.com/shortcuts/keyboard-shortcuts-macos.pdf', '_blank');
          updateStatus("Opening Mac shortcuts");
          break;
        case 'shortcuts-lux':
          window.open('https://code.visualstudio.com/shortcuts/keyboard-shortcuts-linux.pdf', '_blank');
          updateStatus("Opening Linux shortcuts");
          break;
        case 'docmt-css':
          window.open('https://devdocs.io/css/', '_blank');
          updateStatus("Opening CSS documentation");
          break;
        case 'docmt-js':
          window.open('https://devdocs.io/javascript/', '_blank');
          updateStatus("Opening JavaScript documentation");
          break;
        case 'docmt-html':
          window.open('https://devdocs.io/html/', '_blank');
          updateStatus("Opening HTML documentation");
          break;
        case 'docmt-json':
          window.open('https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON', '_blank');
          updateStatus("Opening JSON documentation");
          break;
        case 'file-2-html': setFileType('html'); detectLanguage(); break;
        case 'file-2-css': setFileType('css'); detectLanguage(); break;
        case 'file-2-js': setFileType('js'); detectLanguage(); break;
        case 'file-2-txt': setFileType('txt'); detectLanguage(); break;
        case 'file-2-md': setFileType('md'); detectLanguage(); break;
        case 'file-2-c': setFileType('c'); detectLanguage(); break;
        case 'file-2-cpp': setFileType('cpp'); detectLanguage(); break;
        case 'file-2-cs': setFileType('cs'); detectLanguage(); break;
        case 'file-2-py': setFileType('py'); detectLanguage(); break;
        case 'file-2-java': setFileType('java'); detectLanguage(); break;
        case 'file-2-rust': setFileType('rust'); detectLanguage(); break;
        case 'file-2-go': setFileType('go'); detectLanguage(); break;
        case 'about':
          alert('html IDE\n\nVersion:                  0.4.2.9\nDate of Publish:   2025 / 05 / 17\nBrowsers:              all chromium (the open source browser project) based\n\nA feature-rich IDE for web development\n\nDeveuped by Bryson J G.');
          updateStatus("About dialog shown");
          break;
      }
    } catch (error) {
      showError(`Action failed: ${error.message}`);
    }
  }

  // Set up menu event listeners
  document.querySelectorAll('.menu-item').forEach(menu => {
    menu.addEventListener('mouseenter', () => {
      document.querySelectorAll('.dropdown').forEach(dropdown => {
        if (dropdown !== menu.querySelector('.dropdown')) {
          dropdown.style.display = 'none';
        }
      });
      const dropdown = menu.querySelector('.dropdown');
      if (dropdown) dropdown.style.display = 'block';
    });

    document.addEventListener('click', (e) => {
      if (!menu.contains(e.target)) {
        const dropdown = menu.querySelector('.dropdown');
        if (dropdown) dropdown.style.display = 'none';
      }
    });
  });

  // Special handling for sub-menus
  document.querySelectorAll('.sub-menus').forEach(subMenu => {
    const dropdownItem = subMenu.querySelector('.dropdown-item');
    const dropdown = subMenu.querySelector('.dropdown');

    dropdownItem.addEventListener('click', (e) => {
      e.stopPropagation();
      subMenu.classList.toggle('active');
      dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    });

    dropdownItem.addEventListener('mouseenter', () => {
      subMenu.classList.add('active');
      dropdown.style.display = 'block';
    });
  });

  // Handle all dropdown item clicks
  document.querySelectorAll('.dropdown-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (item.hasAttribute('disabled')) return;

      const action = e.target.dataset.action;
      const file = e.target.dataset.file;
      const path = e.target.dataset.path;
      const tabId = e.target.dataset.tabId;
      if (action) {
        handleMenuAction(action, { file, path, tabId });
        document.querySelectorAll('.dropdown').forEach(dropdown => {
          dropdown.style.display = 'none';
        });
      }
    });
  });

  // Set up resizer
  const resizer = document.getElementById('resizer');
  let isResizing = false;

  resizer.addEventListener('mousedown', (e) => {
    isResizing = true;
    document.body.style.cursor = 'col-resize';
    document.addEventListener('mousemove', resize);
    document.addEventListener('mouseup', stopResize);
  });

  function resize(e) {
    if (!isResizing) return;
    const containerWidth = document.getElementById('mainContainer').offsetWidth;
    const editorWidth = (e.clientX / containerWidth) * 100;
    document.querySelector('.editor-wrapper').style.flex = `0 0 ${editorWidth}%`;
    document.querySelector('.preview-pane').style.flex = `0 0 ${100 - editorWidth}%`;
  }

  function stopResize() {
    isResizing = false;
    document.body.style.cursor = '';
    document.removeEventListener('mousemove', resize);
    document.removeEventListener('mouseup', stopResize);
  }

  // File input handler
  document.getElementById('fileInput').addEventListener('change', async function (e) {
    const file = e.target.files[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        showError(`File too large (max ${MAX_FILE_SIZE / 1024 / 1024}MB)`);
        return;
      }

      // Create a new tab for the opened file
      const tabId = generateTabId();
      const newTab = {
        id: tabId,
        name: file.name,
        type: file.name.split('.').pop().toLowerCase(),
        content: await file.text(),
        handle: null,
        active: true
      };

      // Deactivate current tab
      const currentTab = getCurrentTab();
      if (currentTab) {
        currentTab.active = false;
      }

      state.tabs.push(newTab);
      state.currentTabId = tabId;

      editor.setValue(newTab.content);
      renderTabs();
      updateStatus(`Opened ${file.name}`);
      addToRecentFiles(newTab);
      await detectLanguage();
      saveTabsToStorage();
    }
  });

  // Initialize
  function init() {
    setupBeforeUnload();
    updateRecentFilesMenu();
    renderTabs();
    renderFileList();

    if (state.fileExplorerOpen) {
      toggleFileExplorer();
    }

    let debounceTimer;
    editor.onDidChangeModelContent(() => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(updatePreview, DEBOUNCE_DELAY);

      const currentTab = getCurrentTab();
      if (currentTab) {
        currentTab.content = editor.getValue();
        saveTabsToStorage();
      }
      state.unsavedChanges = true;
    });

    editor.onDidChangeCursorPosition((e) => {
      lineInfo.textContent = `Ln ${e.position.lineNumber}, Col ${e.position.column}`;
    });

    updatePreview();
  }

  init();
});

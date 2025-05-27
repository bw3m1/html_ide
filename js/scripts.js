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
  fileExplorerPath: '', // Current path in file explorer
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
  const statusMessage = document.getElementById('statusMessage');
  const lineInfo = document.getElementById('lineInfo');
  const fileExplorer = document.getElementById('file-explorer');
  const fileList = document.getElementById('file-list');
  const tabsContainer = document.getElementById('tabsContainer');

  // Examples
  const examples = {
    'basic': `<!DOCTYPE html>
<html>
  <head>
    <title>Basic Page</title>
  </head>
  <body>
    <h1>Hello World</h1>
    <p>This is a basic HTML page.</p>
  </body>
</html>`,
    'form': `<!DOCTYPE html>
<html>
<head>
  <title>Form Example</title>
  <style>
    form {
      max-width: 500px;
      margin: 20px auto;
      padding: 20px;
      border: 1px solid #ddd;
      border-radius: 5px;
    }

    label {
      display: block;
      margin-bottom: 5px;
    }

    input,
    textarea {
      width: 100%;
      padding: 8px;
      margin-bottom: 10px;
    }

    button {
      background: #007acc;
      color: white;
      border: none;
      padding: 10px 15px;
    }

  </style>
</head>
<body>
  <form>
    <label>Name:</label>
    <input type="text">
    <label>Email:</label>
    <input type="email">
    <label>Message:</label>
    <textarea rows="4"></textarea>
    <button type="submit">Submit</button>
  </form>
</body>
</html>`,
    'grid': `<!DOCTYPE html>
<html>
<head>
  <title>CSS Grid</title>
  <style>
    .grid-container {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
    }

    .grid-item {
      background: #007acc;
      color: white;
      padding: 20px;
      text-align: center;
    }

  </style>
</head>
<body>
  <div class="grid-container">
    <div class="grid-item">1</div>
    <div class="grid-item">2</div>
    <div class="grid-item">3</div>
    <div class="grid-item">4</div>
    <div class="grid-item">5</div>
    <div class="grid-item">6</div>
  </div>
</body>
</html>`,
    'table': `<!DOCTYPE html>
<html>
<head>
  <title>Table Example</title>
  <style>
    table {
      border-collapse: collapse;
      width: 100%;
    }

    th,
    td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }

    th {
      background-color: #007acc;
      color: white;
    }

    tr:nth-child(even) {
      background-color: #f2f2f2;
    }

  </style>
</head>
<body>
  <table>
    <tr>
      <th>Name</th>
      <th>Email</th>
      <th>Role</th>
    </tr>
    <tr>
      <td>Blue</td>
      <td>Blue@amongus.sussy</td>
      <td>Crew mate</td>
    </tr>
    <tr>
      <td>Red</td>
      <td>Red@amongus.sussy</td>
      <td>Imposter</td>
    </tr>
  </table>
</body>
</html>`,
    'responsive': `<!DOCTYPE html>
<html>
<head>
  <title>Responsive Example</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }

    .header {
      background: #007acc;
      color: white;
      padding: 20px;
      text-align: center;
    }

    .main {
      display: flex;
      flex-wrap: wrap;
    }

    .sidebar {
      flex: 1;
      min-width: 200px;
      background: #f0f0f0;
      padding: 20px;
    }

    .content {
      flex: 3;
      min-width: 300px;
      padding: 20px;
    }

    @media (max-width: 600px) {
      .main {
        flex-direction: column;
      }

    }

  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Responsive Layout</h1>
    </div>
    <div class="main">
      <div class="sidebar">
        <h3>Sidebar</h3>
        <p>Content here</p>
      </div>
      <div class="content">
        <h2>Main Content</h2>
        <p>Resize the browser to see the responsive effect.</p>
      </div>
    </div>
  </div>
</body>
</html>`,
    'json-example': `{
  "name": "My Project",
  "version": "1.0.0",
  "description": "A sample JSON file",
  "dependencies": {
    "monaco-editor": "^0.40.0",
    "jszip": "^3.10.1"
  },
  "scripts": {
    "start": "node server.js",
    "build": "webpack"
  }
}`
  };

  // Tab management functions
  function generateTabId() {
    return `tab_${Date.now()}_${Math.floor(Math.random() * 1e9)}`;
  }

  function getCurrentTab() {
    // Always return a valid tab if possible
    if (state.tabs.length === 0) {
      // Add a default tab if none exist
      const tabId = generateTabId();
      const newTab = {
        id: tabId,
        name: 'untitled.html',
        type: 'html',
        content: INIT_CONTENTS,
        handle: null,
        active: true
      };
      state.tabs.push(newTab);
      state.currentTabId = tabId;
      // Defensive: update Monaco editor if available
      if (window.monacoEditorInstance) {
        window.monacoEditorInstance.setValue(newTab.content);
      }
      renderTabs();
      saveTabsToStorage();
      return newTab;
    }
    return state.tabs.find(tab => tab.id === state.currentTabId) || state.tabs[0];
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

    // Add/remove empty state class on editor-wrapper
    const editorWrapper = document.querySelector('.editor-wrapper');
    if (state.tabs.length === 0) {
      editorWrapper.classList.add('empty');
      // Always ensure at least one tab exists
      getCurrentTab();
    } else {
      editorWrapper.classList.remove('empty');
    }
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

    // Remove empty state
    const editorWrapper = document.querySelector('.editor-wrapper');
    editorWrapper.classList.remove('empty');
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
        // Always add a new default tab if none remain
        const newTab = getCurrentTab();
        editor.setValue(newTab.content);
        renderTabs();
      }
    }

    // Update UI and state
    renderTabs();
    saveTabsToStorage();
    state.unsavedChanges = false;
    updateStatus(`Closed tab: ${tabToClose.name}`);

    // Ensure empty state if no tabs
    const editorWrapper = document.querySelector('.editor-wrapper');
    if (state.tabs.length === 0) {
      editorWrapper.classList.add('empty');
      // Always ensure at least one tab exists
      getCurrentTab();
    } else {
      editorWrapper.classList.remove('empty');
    }
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
  fileList.innerHTML = ''; // Clear existing content

  // Create container for the tree view
  const treeContainer = document.createElement('div');
  treeContainer.className = 'tree-view';
  fileList.appendChild(treeContainer);

  // Recursive function to render items
  function renderItems(items, parentElement, depth = 0) {
    items.forEach(item => {
      const itemElement = createTreeItem(item, depth);
      parentElement.appendChild(itemElement);

      if (item.type === 'folder' && item.expanded && item.children) {
        const childrenContainer = document.createElement('div');
        childrenContainer.className = 'folder-children';
        renderItems(item.children, childrenContainer, depth + 1);
        parentElement.appendChild(childrenContainer);
      }
    });
  }

  // Function to create individual tree items
  function createTreeItem(item, depth) {
    const itemElement = document.createElement('div');
    itemElement.className = `tree-item ${item.selected ? 'selected' : ''}`;
    itemElement.style.paddingLeft = `${depth * 16}px`;
    itemElement.dataset.path = item.path || item.name;
    itemElement.dataset.type = item.type;

    // Folder/File icon logic
    const icon = document.createElement('img');
    icon.className = 'file-icon';
    icon.src = item.type === 'folder' ? 
      (item.expanded ? 'icons/folder-open.svg' : 'icons/folder-closed.svg') :
      `icons/${getFileIcon(item.name)}`;

    // Collapse/expand chevron for folders
    let chevron = '';
    if (item.type === 'folder') {
      chevron = `<span class="material-icons chevron ${
        item.expanded ? '' : 'collapsed'
      }">chevron_right</span>`;
    }

    itemElement.innerHTML = `
      ${chevron}
      <div class="item-content">
        ${icon.outerHTML}
        <span class="item-name">${item.name}</span>
      </div>
      <div class="item-actions">
        ${item.type === 'file' ? `<span class="open-file-btn">◷</span>` : ''}
        <span class="delete-btn">×</span>
      </div>
    `;

    // Event handlers
    if (item.type === 'folder') {
      itemElement.querySelector('.chevron').addEventListener('click', (e) => {
        e.stopPropagation();
        item.expanded = !item.expanded;
        renderFileList();
      });
    }

    itemElement.addEventListener('click', (e) => {
      if (!e.target.classList.contains('delete-btn')) {
        // Select item
        document.querySelectorAll('.tree-item').forEach(i => 
          i.classList.remove('selected'));
        itemElement.classList.add('selected');
        state.selectedPath = item.path || item.name;
      }
    });

    itemElement.addEventListener('dblclick', () => {
      if (item.type === 'folder') {
        item.expanded = !item.expanded;
        renderFileList();
      } else {
        handleMenuAction('open-file', { path: item.path || item.name });
      }
    });

    itemElement.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      showContextMenu(e, item);
    });

    return itemElement;
  }

  // Context menu handling
  function showContextMenu(e, item) {
    const contextMenu = document.createElement('div');
    contextMenu.className = 'context-menu';
    contextMenu.style.left = `${e.pageX}px`;
    contextMenu.style.top = `${e.pageY}px`;

    const menuItems = [
      { label: 'New File', action: 'add-file' },
      { label: 'New Folder', action: 'add-folder' },
      { label: 'Rename', action: 'rename-file' },
      { label: 'Delete', action: 'delete-file' },
      { label: 'Refresh', action: 'refresh-explorer' }
    ];

    menuItems.forEach(menuItem => {
      const menuOption = document.createElement('div');
      menuOption.className = 'context-menu-item';
      menuOption.textContent = menuItem.label;
      menuOption.dataset.action = menuItem.action;
      menuOption.dataset.path = item.path || item.name;
      contextMenu.appendChild(menuOption);
    });

    document.body.appendChild(contextMenu);

    const closeMenu = () => {
      contextMenu.remove();
      document.removeEventListener('click', closeMenu);
    };

    contextMenu.addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      const path = e.target.dataset.path;
      if (action) {
        handleMenuAction(action, { path });
      }
      closeMenu();
    });

    document.addEventListener('click', closeMenu);
  }

  // Start rendering from root items
  renderItems(state.files, treeContainer);
}

  function filterFileList(query) {
    const items = fileList.querySelectorAll('.file-item');
    items.forEach(item => {
      const name = item.querySelector('.file-item-name').textContent;
      item.style.display = name.toLowerCase().includes(query.toLowerCase())
        ? 'flex'
        : 'none';
    });
  }

  // Add these event listeners
  fileList.addEventListener('contextmenu', (e) => {
    const fileItem = e.target.closest('.file-item');
    if (fileItem) {
      e.preventDefault();
      const contextMenu = fileList.querySelector('.context-menu');
      contextMenu.style.display = 'block';
      contextMenu.style.left = `${e.pageX}px`;
      contextMenu.style.top = `${e.pageY}px`;

      // Store selected file path
      contextMenu.dataset.path = fileItem.dataset.path;
    }
  });

  document.addEventListener('click', () => {
    const contextMenu = fileList.querySelector('.context-menu');
    contextMenu.style.display = 'none';
  });

  // Add drag and drop functionality
  let draggedItem = null;

  fileList.addEventListener('dragstart', (e) => {
    draggedItem = e.target.closest('.file-item');
    e.dataTransfer.effectAllowed = 'move';
  });

  fileList.addEventListener('dragover', (e) => {
    e.preventDefault();
    const target = e.target.closest('.file-item');
    if (target && target !== draggedItem) {
      target.classList.add('drag-over');
    }
  });

  fileList.addEventListener('dragleave', (e) => {
    e.target.closest('.file-item')?.classList.remove('drag-over');
  });

  fileList.addEventListener('drop', async (e) => {
    e.preventDefault();
    const target = e.target.closest('.file-item');
    target?.classList.remove('drag-over');

    if (draggedItem && target) {
      // Handle file/folder move logic
      const sourcePath = draggedItem.dataset.path;
      const targetPath = target.dataset.path;
      // Implement your move logic here
      updateStatus(`Moved ${sourcePath} to ${targetPath}`);
      renderFileList();
    }
  });

  // Detect file changes in real-time
  function watchFileChanges() {
    const currentPath = state.fileExplorerPath || '';

    // Polling interval (in milliseconds)
    const interval = 1000;

    setInterval(() => {
      // For each file in the current directory
      state.files.forEach(file => {
        if (file.type === 'file' && file.path) {
          // Check if the file has been modified
          fetch(file.path, { method: 'HEAD' })
            .then(response => {
              const lastModified = new Date(response.headers.get('Last-Modified'));

              // If the file was modified after it was last loaded
              if (lastModified > new Date(file.lastLoaded)) {
                // Update the file content and last loaded time
                file.content = response.text();
                file.lastLoaded = new Date().toISOString();

                // If the file is currently open in a tab, update the editor content
                const openTab = getTabById(file.id);
                if (openTab) {
                  openTab.content = file.content;
                  if (openTab.active) {
                    editor.setValue(file.content);
                  }
                }
              }
            })
            .catch(err => console.error(`Error checking file ${file.name}:`, err));
        }
      });
    }, interval);
  }

  // Shortcuts manager
  // !!
  const shortcuts = {
    'Ctrl+S': async (e) => { e.preventDefault(); await saveFile(); },
    'Ctrl+Shift+S': async (e) => { e.preventDefault(); await saveFileAs(); },
    'Ctrl+O': async (e) => { e.preventDefault(); await openFile(); },
    'Ctrl+N': (e) => { e.preventDefault(); newFile(); },
    'Ctrl+W': (e) => { e.preventDefault(); closeTab(); },
    'Ctrl+B': (e) => { e.preventDefault(); toggleFileExplorer(); },
    'Ctrl+Z': (e) => { e.preventDefault(); editor.trigger('', 'undo'); },
    'Ctrl+Y': (e) => { e.preventDefault(); editor.trigger('', 'redo'); },
    'Ctrl+F': (e) => { e.preventDefault(); editor.getAction('actions.find').run(); },
    'Ctrl+Shift+F': (e) => { e.preventDefault(); /* Implement find in files */ },
    'Ctrl+P': (e) => { e.preventDefault(); /* Implement command palette */ },
    'Ctrl+K': (e) => { e.preventDefault(); /* Implement keyboard shortcuts reference */ },
    'Ctrl+Shift+E': (e) => { e.preventDefault(); toggleFileExplorer(); },
    'F5': (e) => { e.preventDefault(); updatePreview(); },
    'Ctrl+R': (e) => { e.preventDefault(); location.reload(); },
    'Ctrl+D': (e) => { e.preventDefault(); /* Implement duplicate file */ },
    'Ctrl+Shift+D': (e) => { e.preventDefault(); /* Implement duplicate folder */ },
    'Delete': (e) => { e.preventDefault(); closeTab(); },
    'Escape': (e) => { e.preventDefault(); /* Implement escape action */ },
    'ArrowUp': (e) => { e.preventDefault(); /* Implement navigate up */ },
    'ArrowDown': (e) => { e.preventDefault(); /* Implement navigate down */ },
    'ArrowLeft': (e) => { e.preventDefault(); /* Implement navigate left */ },
    'ArrowRight': (e) => { e.preventDefault(); /* Implement navigate right */ }
  };

  document.addEventListener('keydown', (e) => {
    let keyCombo = '';
    if (e.ctrlKey) keyCombo += 'Ctrl+';
    if (e.shiftKey) keyCombo += 'Shift+';
    if (e.altKey) keyCombo += 'Alt+';
    // Use e.code for non-character keys, e.key for character keys
    let key = e.key.length === 1 ? e.key.toUpperCase() : e.key;
    keyCombo += key;
    if (shortcuts[keyCombo]) {
      shortcuts[keyCombo](e);
    }
  });

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
    else if (theme === 'automatic') {
      // Detect system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        monaco.editor.setTheme('vs-dark');
        document.body.classList.remove('light-theme');
        document.body.classList.remove('contrast-light-theme');
        document.body.classList.remove('contrast-dark-theme');
      } else {
        monaco.editor.setTheme('vs');
        document.body.classList.add('light-theme');
        document.body.classList.remove('contrast-light-theme');
        document.body.classList.remove('contrast-dark-theme');
      }
      // Listen for changes in system theme
      if (!setTheme._autoListener) {
        setTheme._autoListener = (e) => setTheme('automatic');
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', setTheme._autoListener);
      }
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
        case 'theme-auto': setTheme('automatic'); break;
        case 'theme-contrast-dark': setTheme('contrast-dark'); break;
        case 'theme-contrast-light': setTheme('contrast-light'); break;
        case 'toggle-explorer': toggleFileExplorer(); break;
        case 'add-file': addFile(); break;
        case 'add-folder': addFolder(); break;
        case 'delete-file':
          if (data.path) {
            deleteFile(data.path);
          } else {
            const contextPath = document.querySelector('.context-menu').dataset.path;
            deleteFile(contextPath);
          }
          break;
        case 'open-file': openFileFromExplorer(data.path); break;
        case 'number-lines':
          const currentLineNumbers = editor.getRawOptions().lineNumbers;
          const newLineNumbers = currentLineNumbers === 'on' ? 'off' : 'on';
          editor.updateOptions({ lineNumbers: newLineNumbers });
          localStorage.setItem('editorLineNumbers', newLineNumbers);
          updateStatus(`Line numbers ${newLineNumbers === 'on' ? 'enabled' : 'disabled'}`);
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
          window.open('shortcuts/windows.html', '_blank');
          updateStatus("Opening Windows shortcuts");
          break;
        case 'shortcuts-mac':
          window.open('shortcuts/macos.html', '_blank');
          updateStatus("Opening Mac shortcuts");
          break;
        case 'shortcuts-lux':
          window.open('shortcuts/linux.html', '_blank');
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
        case 'file-2-json': setFileType('json'); detectLanguage(); break;
        case 'file-2-c': setFileType('c'); detectLanguage(); break;
        case 'file-2-cpp': setFileType('cpp'); detectLanguage(); break;
        case 'file-2-cs': setFileType('cs'); detectLanguage(); break;
        case 'file-2-py': setFileType('py'); detectLanguage(); break;
        case 'file-2-java': setFileType('java'); detectLanguage(); break;
        case 'file-2-rust': setFileType('rs'); detectLanguage(); break;
        case 'file-2-go': setFileType('go'); detectLanguage(); break;
        case 'about':
          alert('html IDE\n\nVersion:                  0.4.2.1\nDate of Publish:   2025 / 05 / 12\nBrowsers:              all chromium (the open source browser project) based\n\nA feature-rich IDE for web development\n\nDeveuped by Bryson J G.');
          updateStatus("About dialog shown");
          break;
      }
    } catch (error) {
      showError(`Action failed: ${error.message}`);
    }
  }

  async function openFileFromExplorer(filePath) {
    try {
      const fileEntry = findFileEntry(filePath, state.files);

      if (!fileEntry || fileEntry.type !== 'file') {
        throw new Error(`File not found: ${filePath}`);
      }

      // Create a new tab for the opened file
      const tabId = generateTabId();
      const newTab = {
        id: tabId,
        name: fileEntry.name,
        type: fileEntry.name.split('.').pop().toLowerCase(),
        content: fileEntry.content || '',
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
      updateStatus(`Opened ${fileEntry.name}`);
      addToRecentFiles(newTab);
      await detectLanguage();
      saveTabsToStorage();

    } catch (error) {
      showError(`Open failed: ${error.message}`);
    }
  }

  // Fixed deleteFile implementation
  async function deleteFile(path) {
    if (!path) {
      const selectedItem = document.querySelector('.context-menu').dataset.path;
      if (!selectedItem) return;
      path = selectedItem;
    }

    if (!confirm(`Are you sure you want to delete "${path}"?`)) return;

    try {
      const pathParts = path.split('/');
      const fileName = pathParts.pop();
      let currentLevel = state.files;

      for (const part of pathParts) {
        const folder = currentLevel.find(item =>
          item.name === part && item.type === 'folder'
        );
        if (!folder) throw new Error(`Folder not found: ${part}`);
        currentLevel = folder.children;
      }

      const index = currentLevel.findIndex(item => item.name === fileName);
      if (index === -1) throw new Error('File not found');

      currentLevel.splice(index, 1);
      saveProjectFiles();
      renderFileList();
      updateStatus(`Deleted ${path}`);
    } catch (error) {
      showError(`Delete failed: ${error.message}`);
    }
  }

  // Fixed addFile implementation
  function addFile() {
    const currentPath = state.fileExplorerPath || '';
    const fileName = prompt('Enter file name with extension:');
    if (!fileName) return;

    try {
      let targetLocation = state.files;
      const pathParts = currentPath.split('/').filter(p => p);

      for (const part of pathParts) {
        const folder = targetLocation.find(item =>
          item.name === part && item.type === 'folder'
        );
        if (!folder) throw new Error(`Folder not found: ${part}`);
        targetLocation = folder.children;
      }

      if (targetLocation.some(item => item.name === fileName)) {
        throw new Error(`"${fileName}" already exists`);
      }

      const newFile = {
        name: fileName,
        type: 'file',
        content: getDefaultContent(fileName)
      };

      targetLocation.push(newFile);
      saveProjectFiles();
      renderFileList();
      updateStatus(`Added ${currentPath}/${fileName}`);
    } catch (error) {
      showError(error.message);
    }
  }

  // Fixed addFolder implementation
  function addFolder() {
    const currentPath = state.fileExplorerPath || '';
    const folderName = prompt('Enter folder name:');
    if (!folderName) return;

    try {
      let targetLocation = state.files;
      const pathParts = currentPath.split('/').filter(p => p);

      for (const part of pathParts) {
        const folder = targetLocation.find(item =>
          item.name === part && item.type === 'folder'
        );
        if (!folder) throw new Error(`Folder not found: ${part}`);
        targetLocation = folder.children;
      }

      if (targetLocation.some(item => item.name === folderName)) {
        throw new Error(`"${folderName}" already exists`);
      }

      targetLocation.push({
        name: folderName,
        type: 'folder',
        children: [],
        expanded: true
      });

      saveProjectFiles();
      renderFileList();
      updateStatus(`Added folder ${currentPath}/${folderName}`);
    } catch (error) {
      showError(error.message);
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
    // Always ensure at least one tab exists
    getCurrentTab();
    renderTabs();
    renderFileList();

    // Set empty state on load if needed
    const editorWrapper = document.querySelector('.editor-wrapper');
    if (state.tabs.length === 0) {
      editorWrapper.classList.add('empty');
      // Always ensure at least one tab exists
      getCurrentTab();
    } else {
      editorWrapper.classList.remove('empty');
    }

    let debounceTimer;
    editor.onDidChangeModelContent(() => {
      const currentTab = getCurrentTab();
      if (currentTab) {
        currentTab.content = editor.getValue();
        saveTabsToStorage();
      }
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(updatePreview, DEBOUNCE_DELAY);
    });

    editor.onDidChangeCursorPosition((e) => {
      lineInfo.textContent = `Ln ${e.position.lineNumber}, Col ${e.position.column}`;
    });

    updatePreview();
    watchFileChanges();
  }

  init();
});

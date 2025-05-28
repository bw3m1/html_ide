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
  const preview = document.getElementById('preview');

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
        active: true,
        unsaved: false
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

      // Add icon to tab
      const fileType = tab.name.split('.').pop().toLowerCase();
      const iconPath = getIcon(tab.name, false, false, localStorage.getItem('editorTheme') === 'light' ? 'light' : 'dark');

      tabElement.innerHTML = `
<img src="${iconPath}" class="tab-icon" style="width:16px;height:16px;vertical-align:middle;margin-right:4px;">
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
    refreshExploreFileList(); // Ensure file list stays in sync
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
      refreshExploreFileList();
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
    refreshExploreFileList();

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
    refreshExploreFileList();

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
    // Sync tab content to state.files if file exists
    state.tabs.forEach(tab => {
      const fileEntry = findFileEntry(tab.name, state.files);
      if (fileEntry && fileEntry.type === 'file') {
        fileEntry.content = tab.content;
      }
    });
    refreshExploreFileList();
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

  function renderFileExplorer() {
    // Helper to recursively render files/folders
    function renderItems(items, parentPath = '') {
      const fragment = document.createDocumentFragment();
      items.forEach(item => {
        const itemPath = parentPath ? `${parentPath}/${item.name}` : item.name;
        const isFolder = item.type === 'folder';
        const div = document.createElement('div');
        div.className = `file-item${isFolder ? ' folder' : ''}`;
        div.dataset.path = itemPath;
        div.setAttribute('tabindex', '0'); // Accessibility
        div.innerHTML = `<img src="${getIcon(item.name, isFolder, item.expanded, localStorage.getItem('editorTheme') === 'light' ? 'light' : 'dark')}" class="file-icon" style="width:16px;height:16px;vertical-align:middle;margin-right:6px;">${item.name}`;
        if (isFolder) {
          div.addEventListener('click', () => {
            item.expanded = !item.expanded;
            renderFileExplorer();
          });
        } else {
          div.addEventListener('click', () => openFileFromExplorer(itemPath));
        }
        fragment.appendChild(div);
        if (isFolder && item.expanded && item.children) {
          const children = renderItems(item.children, itemPath);
          children.style.marginLeft = '16px';
          fragment.appendChild(children);
        }
      });
      const container = document.createElement('div');
      container.appendChild(fragment);
      return container;
    }
    fileList.innerHTML = '';
    fileList.appendChild(renderItems(state.files));

    // --- Open Editors Section ---
    const openEditorsSection = document.createElement('div');
    openEditorsSection.className = 'open-editors-section';
    openEditorsSection.innerHTML = `<div class="open-editors-title" style="font-weight:bold;margin:8px 0 4px 0;">Open Editors</div>`;
    state.tabs.forEach(tab => {
      const tabDiv = document.createElement('div');
      tabDiv.className = `open-editor-item${tab.active ? ' active' : ''}`;
      tabDiv.style.display = 'flex';
      tabDiv.style.alignItems = 'center';
      tabDiv.style.cursor = 'pointer';
      tabDiv.style.padding = '2px 0 2px 20px';
      tabDiv.dataset.tabId = tab.id;
      tabDiv.innerHTML = `
        <span style="flex:1">${tab.name}${tab.unsaved ? ' <span style="color:var(--accent)">*</span>' : ''}${tab.active ? ' <span style="color:var(--accent)">[active]</span>' : ''}</span>
        <span class="open-editor-close" title="Close" style="margin-left:8px;color:#888;cursor:pointer;">&#10005;</span>
      `;
      tabDiv.addEventListener('click', (e) => {
        if (e.target.classList.contains('open-editor-close')) {
          closeTab(tab.id);
          e.stopPropagation();
        } else {
          switchToTab(tab.id);
        }
      });
      openEditorsSection.appendChild(tabDiv);
    });
    fileList.appendChild(openEditorsSection);
    // --- End Open Editors Section ---
  }


  
  // Auto-refresh file list when tabs change
  function refreshExploreFileList() {
    renderFileExplorer();
  }

// Show open tabs in file explorer context menu
document.addEventListener('click', function (e) {
  const contextMenu = fileList.querySelector('.context-menu');
  if (contextMenu && contextMenu.style.display === 'block') {
    if (e.target.dataset.action === 'tabs') {
      // Build a list of open tabs
      let tabsHtml = '<div style="padding:4px 8px;font-weight:bold;">Open Tabs:         \/</div>';
      if (state.tabs.length === 0) {
        tabsHtml += '<div style="padding:4px 8px;">No open tabs</div>';
      } else {
        state.tabs.forEach(tab => {
          tabsHtml += `<div class="dropdown-item" data-action="switch-tab" data-tab-id="${tab.id}">${tab.name}${tab.active ? ' <span style="color:var(--accent)">[active]</span>' : ''}</div>`;
        });
      }
      contextMenu.innerHTML = tabsHtml +
        `<div class="dropdown-item" data-action="close-tab-list">Close</div>`;
    } else if (e.target.dataset.action === 'switch-tab') {
      const tabId = e.target.dataset.tabId;
      if (tabId) {
        switchToTab(tabId);
        contextMenu.style.display = 'none';
      }
    } else if (e.target.dataset.action === 'close-tab-list') {
      contextMenu.style.display = 'none';
    }
  }
});

  let imageOverlay = null;

  function showImageOverlay(src, alt) {
    if (imageOverlay) {
      imageOverlay.remove();
    }
    imageOverlay = document.createElement('div');
    imageOverlay.style.position = 'fixed';
    imageOverlay.style.top = '0';
    imageOverlay.style.left = '0';
    imageOverlay.style.width = '100vw';
    imageOverlay.style.height = '100vh';
    imageOverlay.style.background = 'rgba(0,0,0,0.95)';
    imageOverlay.style.display = 'flex';
    imageOverlay.style.alignItems = 'center';
    imageOverlay.style.justifyContent = 'center';
    imageOverlay.style.zIndex = '9999';
    imageOverlay.style.cursor = 'zoom-out';

    const img = document.createElement('img');
    img.src = src;
    img.alt = alt || '';
    img.style.maxWidth = '90vw';
    img.style.maxHeight = '90vh';
    img.style.boxShadow = '0 0 32px #000';

    // Optional: add a close button
    const closeBtn = document.createElement('div');
    closeBtn.textContent = '×';
    closeBtn.style.position = 'absolute';
    closeBtn.style.top = '24px';
    closeBtn.style.right = '48px';
    closeBtn.style.fontSize = '3rem';
    closeBtn.style.color = '#fff';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.userSelect = 'none';

    closeBtn.onclick = hideImageOverlay;
    imageOverlay.onclick = hideImageOverlay;
    img.onclick = (e) => e.stopPropagation(); // Prevent closing when clicking image

    imageOverlay.appendChild(img);
    imageOverlay.appendChild(closeBtn);
    document.body.appendChild(imageOverlay);

    // Hide editor and preview pane
    document.querySelector('.editor-wrapper').style.display = 'none';
    document.querySelector('.preview-pane').style.display = 'none';
  }

  function hideImageOverlay() {
    if (imageOverlay) {
      imageOverlay.remove();
      imageOverlay = null;
    }
    // Restore editor and preview pane
    document.querySelector('.editor-wrapper').style.display = '';
    document.querySelector('.preview-pane').style.display = '';
  }

  function showImagePreviewInPane(src, alt, isSvg, svgContent) {
    // Hide editor, show preview pane
    document.querySelector('.editor-wrapper').style.display = 'none';
    const previewPane = document.querySelector('.preview-pane');
    previewPane.style.display = 'flex';
    previewPane.style.justifyContent = 'center';
    previewPane.style.alignItems = 'center';
    previewPane.style.background = '#111';

    // Clear preview and add image
    preview.innerHTML = '';
    if (isSvg) {
      // Render SVG markup directly
      const svgWrapper = document.createElement('div');
      svgWrapper.innerHTML = svgContent;
      svgWrapper.style.maxWidth = '100%';
      svgWrapper.style.maxHeight = '100%';
      svgWrapper.style.display = 'flex';
      svgWrapper.style.alignItems = 'center';
      svgWrapper.style.justifyContent = 'center';
      svgWrapper.style.background = '#111';
      svgWrapper.style.cursor = 'zoom-out';
      svgWrapper.onclick = hideImagePreviewInPane;
      preview.appendChild(svgWrapper);
    } else {
      const img = document.createElement('img');
      img.src = src;
      img.alt = alt || '';
      img.style.maxWidth = '100%';
      img.style.maxHeight = '100%';
      img.style.objectFit = 'contain';
      img.style.background = '#111';
      img.style.cursor = 'zoom-out';
      img.onclick = hideImagePreviewInPane;
      preview.appendChild(img);
    }

    // Optional: add a hint
    const hint = document.createElement('div');
    hint.textContent = 'Click image to return to editor';
    hint.style.position = 'absolute';
    hint.style.bottom = '24px';
    hint.style.left = '50%';
    hint.style.transform = 'translateX(-50%)';
    hint.style.color = '#fff';
    hint.style.background = 'rgba(0,0,0,0.5)';
    hint.style.padding = '4px 12px';
    hint.style.borderRadius = '8px';
    hint.style.fontSize = '0.9rem';
    preview.appendChild(hint);
  }

  function hideImagePreviewInPane() {
    document.querySelector('.editor-wrapper').style.display = '';
    const previewPane = document.querySelector('.preview-pane');
    previewPane.style.justifyContent = '';
    previewPane.style.alignItems = '';
    previewPane.style.background = '';
    updatePreview(); // Restore normal preview
  }

  function updatePreview() {
    try {
      preview.innerHTML = '';
      const currentTab = getCurrentTab();
      const value = editor.getValue();
      const fileName = currentTab.name.toLowerCase();

      // --- SVG Preview from markup ---
      if (fileName.endsWith('.svg')) {
        showImagePreviewInPane('', currentTab.name, true, value);
        updateStatus("SVG preview (click to return to editor)");
        return;
      }
      // --- PNG/JPG/JPEG: Show message, not preview ---
      if (
        fileName.endsWith('.png') ||
        fileName.endsWith('.jpg') ||
        fileName.endsWith('.jpeg')
      ) {
        document.querySelector('.editor-wrapper').style.display = 'none';
        const previewPane = document.querySelector('.preview-pane');
        previewPane.style.display = 'flex';
        previewPane.style.justifyContent = 'center';
        previewPane.style.alignItems = 'center';
        previewPane.style.background = '#111';
        preview.innerHTML = '';
        const msg = document.createElement('div');
        msg.textContent = 'Image preview not available for PNG/JPG unless file is opened as binary.';
        msg.style.color = '#fff';
        msg.style.fontSize = '1.2rem';
        msg.style.background = 'rgba(0,0,0,0.7)';
        msg.style.padding = '2rem';
        msg.style.borderRadius = '12px';
        msg.style.textAlign = 'center';
        msg.style.cursor = 'pointer';
        msg.onclick = hideImagePreviewInPane;
        preview.appendChild(msg);
        return;
      }
      // --- End Image Preview ---

      // Restore editor if not viewing image
      document.querySelector('.editor-wrapper').style.display = '';
      const previewPane = document.querySelector('.preview-pane');
      previewPane.style.justifyContent = '';
      previewPane.style.alignItems = '';
      previewPane.style.background = '';

      const isHtml = currentTab.name.endsWith('.html');
      if (isHtml) {
        const iframe = document.createElement('iframe');
        iframe.sandbox = 'allow-same-origin';
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        preview.appendChild(iframe);
        let content = value;
        if (!/^<!DOCTYPE html>/i.test(value)) {
          content = `<!DOCTYPE html><html><head></head><body>${value}</body></html>`;
        }
        iframe.contentDocument.open();
        iframe.contentDocument.write(content);
        iframe.contentDocument.close();
        updateStatus("Preview updated");
        return;
      }

      const isJsFile = currentTab.name.endsWith('.js');
      const isOtherFormat = !isJsFile && !currentTab.name.endsWith('.html');

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
      } else if (isOtherFormat) {
        // Handle other file formats
        const otherOutputContainer = document.createElement('div');
        otherOutputContainer.id = 'other-output';
        otherOutputContainer.style.padding = '1rem';
        otherOutputContainer.style.fontFamily = 'monospace';
        otherOutputContainer.style.whiteSpace = 'pre';
        otherOutputContainer.style.overflow = 'auto';
        otherOutputContainer.style.height = '100%';

        preview.appendChild(otherOutputContainer);
        otherOutputContainer.textContent = 'Preview not available for this file type.\nPlease go to view > layout > editor only to not view this error message';
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
          body { margin: 0; padding: 0; }
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
      renderFileExplorer();
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
      refreshExploreFileList();

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
      refreshExploreFileList();

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
        refreshExploreFileList();
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
    refreshExploreFileList();
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
      refreshExploreFileList();
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

      // Check if tab already open
      if (state.tabs.some(tab => tab.name === fileEntry.name)) {
        switchToTab(state.tabs.find(tab => tab.name === fileEntry.name).id);
        return;
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
      refreshExploreFileList();

    } catch (error) {
      showError(`Open failed: ${error.message}`);
    }
  }

  // Returns the icon path for a given file or folder
  function getIcon(fileName, isFolder, isOpen = false, theme = 'dark') {
    if (theme === 'light') {
      if (isFolder) return isOpen ? 'icons/open_folder_icon_light.svg' : 'icons/closed_folder_icon_light.svg';
    } else {
      if (isFolder) return isOpen ? 'icons/open_folder_icon_dark.svg' : 'icons/closed_folder_icon_dark.svg';
    }
    if (!fileName) return 'icons/text_icon.png';
    if (!isFolder && fileName && fileName.includes('.')) {
      const ext = fileName.split('.').pop().toLowerCase();
      switch (ext) {
        case 'html': return 'icons/html_icon.png';
        case 'css': return 'icons/CSS_icon.png';
        case 'js': return 'icons/JavaScripts_icon.png';
        case 'json': return 'icons/json_icon.png';
        case 'md': return 'icons/README_icon.png';
        case 'txt': return 'icons/text_icon.png';
        case 'png': return 'icons/png_img_icon.png';
        case 'jpg': return 'icons/jpeg_img_icon.png';
        case 'jpeg': return 'icons/jpeg_img_icon.png';
        case 'gif': return 'icons/gif_video_icon.png';
        case 'svg': return 'icons/svg_img_icon.png';
        case 'zip': return 'icons/closed_zip_folder_icon.svg';
        case 'c': return 'icons/Clang_icon.png';
        case 'cpp': return 'icons/Cpp_icon.png';
        case 'cs': return 'icons/Csharp_icon.png';
        case 'py': return 'icons/python_icon.png';
        case 'java': return 'icons/java_icon.png'; 
        case 'rs': return 'icons/rust_icon.png';
        case 'go': return 'icons/golang_icon.png';
        case 'jsx': return 'icons/react_icon.png';
        case 'mp3': return 'icons/mp3_audio_icon.png';
        default: return 'icons/text_icon.png';
      }
    }
  }

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
      renderFileExplorer();
      updateStatus(`Deleted ${path}`);

      // Close any open tab with this file name
      state.tabs = state.tabs.filter(tab => tab.name !== fileName);
      saveTabsToStorage();
      renderTabs();
    } catch (error) {
      showError(`Delete failed: ${error.message}`);
    }
  }

  // Improved addFile implementation with validation
  function addFile() {
    const currentPath = state.fileExplorerPath || '';
    let fileName = prompt('Enter file name with extension:');
    if (!fileName) return;
    fileName = fileName.trim();
    // Prevent empty, whitespace, or invalid file names
    if (!fileName || /[\\/:*?"<>|]/.test(fileName)) {
      showError('Invalid file name.');
      return;
    }

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
      renderFileExplorer();
      updateStatus(`Added ${currentPath}/${fileName}`);
    } catch (error) {
      showError(error.message);
    }
  }

  // Provide default content for new files based on extension
  function getDefaultContent(fileName) {
    const ext = fileName.split('.').pop().toLowerCase();
    switch (ext) {
      case 'html':
        return INIT_CONTENTS;
      case 'css':
        return '/* New CSS file */\n';
      case 'js':
        return '// New JavaScript file\n';
      case 'json':
        return '{\n  \n}';
      case 'txt':
        return '';
      default:
        return '';
    }
  }

  // Fixed addFolder implementation with validation
  function addFolder() {
    const currentPath = state.fileExplorerPath || '';
    let folderName = prompt('Enter folder name:');
    if (!folderName) return;
    folderName = folderName.trim();
    // Prevent empty, whitespace, or invalid folder names
    if (!folderName || /[\\/:*?"<>|]/.test(folderName)) {
      showError('Invalid folder name.');
      return;
    }

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
      renderFileExplorer();
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
    renderFileExplorer();
    refreshExploreFileList();

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
        markTabUnsaved(currentTab.id, true);
        saveTabsToStorage();
      }
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(updatePreview, DEBOUNCE_DELAY);
    });

    editor.onDidChangeCursorPosition((e) => {
      lineInfo.textContent = `Ln ${e.position.lineNumber}, Col ${e.position.column}`;
    });

    updatePreview();
    refreshExploreFileList();
    setTheme(localStorage.getItem('editorTheme') || 'automatic');
    updateStatus("IDE Setup Ready");
    // watchFileChanges();
  }

  init();

  // Add this helper near other file explorer helpers
  function findFileEntry(path, files) {
    if (!path) return null;
    const parts = path.split('/').filter(Boolean);
    let current = files;
    let entry = null;
    for (const part of parts) {
      entry = current.find(item => item.name === part);
      if (!entry) return null;
      if (entry.type === 'folder') {
        current = entry.children;
      }
    }
    return entry;
  }
});
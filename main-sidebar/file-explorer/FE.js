// File system data structure
let fileSystem = JSON.parse(localStorage.getItem('projectFiles')) || [
  { name: "untitled.html", type: "file" }
];

// Tabs state
let tabs = JSON.parse(localStorage.getItem('editorTabs')) || [
  { id: 'tab1', name: 'untitled.html', active: true },
];

// Current context menu state
let currentContext = {
  type: null,
  element: null,
  path: null,
  tabId: null,
  parentFolder: null
};

// Initialize context menu closing
function initContextMenu() {
  const contextMenu = document.querySelector('.context-menu');

  // Close context menu when clicking anywhere else
  document.addEventListener('click', (e) => {
    if (contextMenu && !contextMenu.contains(e.target)) {
      contextMenu.style.display = 'none';
    }
  });

  // Also close when pressing Esc
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      contextMenu.style.display = 'none';
    }
  });
}

// Render file explorer
function renderFileExplorer() {
  const fileList = document.getElementById('fileList');
  fileList.innerHTML = '';

  // Helper to recursively render files/folders
  function renderItems(items, parentPath = '', parentFolder = null) {
    const fragment = document.createDocumentFragment();

    items.forEach(item => {
      const itemPath = parentPath ? `${parentPath}/${item.name}` : item.name;
      const isFolder = item.type === 'folder';
      const div = document.createElement('div');
      div.className = `file-item${isFolder ? ' folder' : ''}${item.expanded ? ' expanded' : ''}`;
      div.dataset.path = itemPath;
      div.draggable = true;  // Make items draggable

      // Add drag and drop event listeners
      div.addEventListener('dragstart', (e) => handleDragStart(e, item, itemPath));
      div.addEventListener('dragover', handleDragOver);
      div.addEventListener('dragleave', handleDragLeave);
      div.addEventListener('drop', (e) => handleDrop(e, item, itemPath));
      div.addEventListener('dragend', handleDragEnd);

      div.innerHTML = `
                  <div class="toggle" style="${isFolder ? '' : 'visibility: hidden;'}">▶</div>
                  <img src="${getIcon(item.name, isFolder, item.expanded, 'dark')}" class="file-icon">
                  <span class="name">${item.name}</span>
              `;

      // Folder toggle functionality
      if (isFolder) {
        const toggle = div.querySelector('.toggle');

        // Toggle expansion when clicking the arrow
        toggle.addEventListener('click', (e) => {
          e.stopPropagation();
          item.expanded = !item.expanded;
          renderFileExplorer();
        });

        // Toggle expansion when clicking the row
        div.addEventListener('click', (e) => {
          if (e.target !== toggle) {
            item.expanded = !item.expanded;
            renderFileExplorer();
          }
        });
      } else {
        // File click opens the file
        div.addEventListener('click', () => {
          openFileFromExplorer(itemPath);
        });
      }

      // Context menu for file/folder
      div.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        currentContext = {
          type: isFolder ? 'folder' : 'file',
          element: item,
          path: itemPath,
          parentFolder: parentFolder || fileSystem
        };
        showContextMenu(e.clientX, e.clientY, isFolder ? 'folder' : 'file');
      });

      fragment.appendChild(div);

      if (isFolder && item.children) {
        const children = document.createElement('div');
        children.className = 'children';
        children.appendChild(renderItems(item.children, itemPath, item));
        fragment.appendChild(children);
      }
    });

    return fragment;
  }

  fileList.appendChild(renderItems(fileSystem));

  // Open Editors Section
  const openEditorsSection = document.createElement('div');
  openEditorsSection.className = 'open-editors-section';
  openEditorsSection.innerHTML = `<div class="open-editors-title">OPEN EDITORS</div>`;

  tabs.forEach(tab => {
    const tabDiv = document.createElement('div');
    tabDiv.className = `open-editor-item${tab.active ? ' active' : ''}`;
    tabDiv.dataset.tabId = tab.id;
    tabDiv.innerHTML = `
              <span style="flex:1">${tab.name}</span>
              <span class="open-editor-close" title="Close">×</span>
          `;

    tabDiv.querySelector('.open-editor-close').addEventListener('click', (e) => {
      e.stopPropagation();
      closeTab(tab.id);
    });

    tabDiv.addEventListener('click', (e) => {
      if (!e.target.classList.contains('open-editor-close')) {
        switchToTab(tab.id);
      }
    });

    // Context menu for open tabs
    tabDiv.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      currentContext = {
        type: 'tab',
        element: tab,
        tabId: tab.id
      };
      showContextMenu(e.clientX, e.clientY, 'tab');
    });

    openEditorsSection.appendChild(tabDiv);
  });

  // Context menu for background
  fileList.addEventListener('contextmenu', (e) => {
    if (!e.target.closest('.file-item') && !e.target.closest('.open-editor-item')) {
      e.preventDefault();
      currentContext = {
        type: 'background',
        element: null,
        parentFolder: fileSystem
      };
      showContextMenu(e.clientX, e.clientY, 'background');
    }
  });

  fileList.appendChild(openEditorsSection);
}

// Tab management
function switchToTab(tabId) {
  tabs.forEach(tab => {
    tab.active = tab.id === tabId;
  });
  localStorage.setItem('editorTabs', JSON.stringify(tabs));
  renderFileExplorer();

  // Notify parent window
  window.parent.postMessage({
    type: 'switchTab',
    tabId: tabId
  }, '*');
}

function closeTab(tabId) {
  const tabIndex = tabs.findIndex(tab => tab.id === tabId);
  if (tabIndex !== -1) {
    tabs.splice(tabIndex, 1);

    if (tabs.length > 0) {
      const newIndex = Math.min(tabIndex, tabs.length - 1);
      switchToTab(tabs[newIndex].id);
    } else {
      localStorage.setItem('editorTabs', JSON.stringify(tabs));
      renderFileExplorer();
    }
  }
  updateTabs(); // Add this after tab changes
}

function openFileFromExplorer(filePath) {
  // Extract filename from path
  const fileName = filePath.split('/').pop();

  // Check if tab already open
  const existingTab = tabs.find(tab => tab.name === fileName);
  if (existingTab) {
    switchToTab(existingTab.id);
    return;
  }

  // Create new tab
  const tabId = 'tab_' + Date.now();
  const newTab = {
    id: tabId,
    name: fileName,
    active: true
  };

  tabs.forEach(tab => tab.active = false);
  tabs.push(newTab);

  localStorage.setItem('editorTabs', JSON.stringify(tabs));
  renderFileExplorer();

  // Notify parent window
  window.parent.postMessage({
    type: 'openFile',
    filePath: filePath
  }, '*');
}

// File icon function
function getIcon(fileName, isFolder, isOpen = false, theme = 'dark') {
  if (theme === 'light') {
    if (isFolder) return isOpen ? '../../icons/open_folder_icon_light.svg' : '../../icons/closed_folder_icon_light.svg';
  } else {
    if (isFolder) return isOpen ? '../../icons/open_folder_icon_dark.svg' : '../../icons/closed_folder_icon_dark.svg';
  }

  if (!fileName) return '../../icons/text_icon.png';

  if (!isFolder && fileName && fileName.includes('.')) {
    const ext = fileName.split('.').pop().toLowerCase();
    switch (ext) {
      case 'html': return '../../icons/html_icon.png';
      case 'css': return '../../icons/CSS_icon.png';
      case 'js': return '../../icons/JavaScripts_icon.png';
      case 'json': return '../../icons/json_icon.png';
      case 'md': return '../../icons/README_icon.png';
      case 'txt': return '../../icons/text_icon.png';
      case 'png': return '../../icons/png_img_icon.png';
      case 'jpg': return '../../icons/jpeg_img_icon.png';
      case 'jpeg': return '../../icons/jpeg_img_icon.png';
      case 'gif': return '../../icons/gif_video_icon.png';
      case 'svg': return '../../icons/svg_img_icon.png';
      case 'zip': return '../../icons/closed_zip_folder_icon.svg';
      case 'c': return '../../icons/Clang_icon.png';
      case 'cpp': return '../../icons/Cpp_icon.png';
      case 'cs': return '../../icons/Csharp_icon.png';
      case 'py': return '../../icons/python_icon.svg';
      case 'java': return '../../icons/java_icon.png';
      case 'rs': return '../../icons/rust_icon.png';
      case 'go': return '../../icons/golang_icon.png';
      case 'jsx': return '../../icons/react_icon.png';
      case 'mp3': return '../../icons/mp3_audio_icon.png';
      case 'bin': return '../../icons/binary_icon.svg';
      case 'sql': return '../../icons/sql_icon.svg';
      case 'php': return '../../icons/php_icon.svg';
      default: return '../../icons/text_icon.png';
    }
  }
  return '../../icons/text_icon.png';
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Apply initial theme
  try {
    const parentTheme = window.parent.localStorage.getItem('editorTheme') || 'dark';
    applyTheme(parentTheme);
  } catch (e) {
    console.warn('Could not get initial theme from parent window');
    applyTheme('dark'); // Fallback to dark theme
  }

  initContextMenu();
  renderFileExplorer();

  // Add collapse all button functionality
  document.querySelector('.explorer-actions button').addEventListener('click', () => {
    collapseAllFolders(fileSystem);
    renderFileExplorer();
  });
});

function collapseAllFolders(items) {
  items.forEach(item => {
    if (item.type === 'folder') {
      item.expanded = false;
      if (item.children) {
        collapseAllFolders(item.children);
      }
    }
  });
}

// Context menu functions
function showContextMenu(x, y, type) {
  const contextMenu = document.querySelector('.context-menu');
  contextMenu.style.display = 'block';
  contextMenu.style.left = `${x}px`;
  contextMenu.style.top = `${y}px`;

  let menuHTML = '';

  switch (type) {
    case 'file':
      menuHTML = `
                  <div class="context-menu-item" data-action="open">Open</div>
                  <div class="context-menu-divider"></div>
                  <div class="context-menu-item" data-action="rename">Rename</div>
                  <div class="context-menu-item" data-action="delete">Delete</div>
                  <div class="context-menu-divider"></div>
                  <div class="context-menu-item" data-action="properties">Properties</div>
              `;
      break;
    case 'folder':
      menuHTML = `
                  <div class="context-menu-item" data-action="open">Open</div>
                  <div class="context-menu-divider"></div>
                  <div class="context-menu-item" data-action="newFile">New File</div>
                  <div class="context-menu-item" data-action="newFolder">New Folder</div>
                  <div class="context-menu-divider"></div>
                  <div class="context-menu-item" data-action="rename">Rename</div>
                  <div class="context-menu-item" data-action="delete">Delete</div>
                  <div class="context-menu-divider"></div>
                  <div class="context-menu-item" data-action="properties">Properties</div>
              `;
      break;
    case 'tab':
      menuHTML = `
                  <div class="context-menu-item" data-action="close">Close</div>
                  <div class="context-menu-item" data-action="closeOthers">Close Others</div>
                  <div class="context-menu-item" data-action="closeAll">Close All</div>
                  <div class="context-menu-divider"></div>
                  <div class="context-menu-item" data-action="properties">Properties</div>
              `;
      break;
    case 'background':
      menuHTML = `
                  <div class="context-menu-item" data-action="newFile">New File</div>
                  <div class="context-menu-item" data-action="newFolder">New Folder</div>
                  <div class="context-menu-divider"></div>
                  <div class="context-menu-item" data-action="collapseAll">Collapse All</div>
                  <div class="context-menu-item" data-action="refresh">Refresh</div>
              `;
      break;
  }

  contextMenu.innerHTML = menuHTML;

  // Add event listeners to menu items
  contextMenu.querySelectorAll('.context-menu-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      handleContextMenuAction(item.dataset.action);
      contextMenu.style.display = 'none';
    });
  });
}

function handleContextMenuAction(action) {
  switch (action) {
    case 'open':
      if (currentContext.type === 'file' || currentContext.type === 'folder') {
        openFileFromExplorer(currentContext.path);
      }
      break;
    case 'close':
      if (currentContext.type === 'tab') {
        closeTab(currentContext.tabId);
      }
      break;
    case 'closeOthers':
      if (currentContext.type === 'tab') {
        // Keep only the current tab
        tabs = tabs.filter(tab => tab.id === currentContext.tabId);
        tabs[0].active = true;
        localStorage.setItem('editorTabs', JSON.stringify(tabs));
        renderFileExplorer();
      }
      break;
    case 'closeAll':
      if (currentContext.type === 'tab') {
        tabs = [];
        localStorage.setItem('editorTabs', JSON.stringify(tabs));
        renderFileExplorer();
      }
      break;
    case 'rename':
      if (currentContext.type === 'file' || currentContext.type === 'folder') {
        const element = document.querySelector(`[data-path="${currentContext.path}"]`);
        const nameSpan = element.querySelector('.name');
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'rename-input';
        input.value = currentContext.element.name;
        nameSpan.replaceWith(input);
        input.select();

        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            const newName = input.value.trim();
            if (newName) {
              currentContext.element.name = newName;
              localStorage.setItem('projectFiles', JSON.stringify(fileSystem));
            }
            renderFileExplorer();
          } else if (e.key === 'Escape') {
            renderFileExplorer();
          }
        });

        input.addEventListener('blur', () => renderFileExplorer());
      }
      break;
    case 'delete':
      if (currentContext.type === 'file' || currentContext.type === 'folder') {
        if (confirm(`Are you sure you want to delete "${currentContext.element.name}"?`)) {
          deleteFileOrFolder(currentContext.element, fileSystem);
          updateFiles(); // Add this
          renderFileExplorer();
        }
      }
      break;
    case 'newFile':
      createNewFile();
      break;
    case 'newFolder':
      createNewFolder();
      break;
    case 'collapseAll':
      collapseAllFolders(fileSystem);
      renderFileExplorer();
      break;
    case 'refresh':
      renderFileExplorer();
      break;
    case 'properties':
      alert(`Properties for ${currentContext.element?.name || 'background'}`);
      break;
  }
}

// Update localStorage and notify parent when files change
function updateFiles() {
  localStorage.setItem('projectFiles', JSON.stringify(fileSystem));
  window.parent.postMessage({
    type: 'updateFiles',
    files: fileSystem
  }, '*');
}

// Update localStorage and notify parent when tabs change  
function updateTabs() {
  localStorage.setItem('editorTabs', JSON.stringify(tabs));
  window.parent.postMessage({
    type: 'updateTabs',
    tabs: tabs
  }, '*');
}

function createNewFile() {
  const parentElement = currentContext.type === 'folder' ?
    document.querySelector(`[data-path="${currentContext.path}"] + .children`) :
    document.getElementById('fileList');

  const div = document.createElement('div');
  div.className = 'file-item';
  div.innerHTML = `
          <div class="toggle" style="visibility: hidden;">▶</div>
          <img src="${getIcon('untitled.txt', false)}" class="file-icon">
          <input type="text" class="rename-input" value="untitled.txt">
      `;
  parentElement.appendChild(div);

  const input = div.querySelector('.rename-input');
  input.select();

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const fullPath = input.value.trim();
      if (fullPath) {
        const pathParts = fullPath.split('/');
        const fileName = pathParts.pop();
        let currentLocation = currentContext.type === 'folder' ? currentContext.element : { children: fileSystem };

        // Create folders if needed
        for (const folderName of pathParts) {
          let folder = currentLocation.children.find(item => item.name === folderName && item.type === 'folder');
          if (!folder) {
            folder = {
              name: folderName,
              type: 'folder',
              expanded: true,
              children: []
            };
            currentLocation.children.push(folder);
          }
          currentLocation = folder;
        }

        // Create the file in the final location
        const newFile = { name: fileName, type: 'file' };
        if (!currentLocation.children) currentLocation.children = [];
        currentLocation.children.push(newFile);
        localStorage.setItem('projectFiles', JSON.stringify(fileSystem));
      }
      renderFileExplorer();
    } else if (e.key === 'Escape') {
      renderFileExplorer();
    }
  });

  input.addEventListener('blur', () => renderFileExplorer());
}

function createNewFolder() {
  const parentElement = currentContext.type === 'folder' ?
    document.querySelector(`[data-path="${currentContext.path}"] + .children`) :
    document.getElementById('fileList');

  const div = document.createElement('div');
  div.className = 'file-item folder';
  div.innerHTML = `
          <div class="toggle">▶</div>
          <img src="${getIcon('', true)}" class="file-icon">
          <input type="text" class="rename-input" value="New Folder">
      `;
  parentElement.appendChild(div);

  const input = div.querySelector('.rename-input');
  input.select();

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const folderName = input.value.trim();
      if (folderName) {
        const newFolder = {
          name: folderName,
          type: 'folder',
          expanded: false,
          children: []
        };
        if (currentContext.type === 'folder') {
          if (!currentContext.element.children) currentContext.element.children = [];
          currentContext.element.children.push(newFolder);
        } else {
          fileSystem.push(newFolder);
        }
        localStorage.setItem('projectFiles', JSON.stringify(fileSystem));
      }
      renderFileExplorer();
    } else if (e.key === 'Escape') {
      renderFileExplorer();
    }
  });

  input.addEventListener('blur', () => renderFileExplorer());
}

function deleteFileOrFolder(item, items) {
  const index = items.indexOf(item);
  if (index !== -1) {
    items.splice(index, 1);
  } else {
    for (const parentItem of items) {
      if (parentItem.children && parentItem.children.includes(item)) {
        const childIndex = parentItem.children.indexOf(item);
        parentItem.children.splice(childIndex, 1);
        break;
      } else if (parentItem.children) {
        deleteFileOrFolder(item, parentItem.children);
      }
    }
  }
}

// Listen for messages from parent window
window.addEventListener('message', (event) => {
  if (event.data.type === 'themeChange') {
    applyTheme(event.data.theme);
  }
});

// Dedicated theme application function
function applyTheme(theme) {
  // Remove existing theme classes
  document.body.classList.remove(
    'light-theme',
    'contrast-dark-theme',
    'contrast-light-theme',
    'fe-dark-theme',
    'fe-light-theme',
    'fe-contrast-dark-theme',
    'fe-contrast-light-theme',
    'fe-github-theme',
    'fe-one-dark-pro-theme',
    'fe-dracula-theme',
    'fe-winter-is-coming-theme'
  );

  // Apply new theme
  switch (theme) {
    case 'light':
      document.body.classList.add('light-theme', 'fe-light-theme');
      break;
    case 'contrast-dark':
      document.body.classList.add('contrast-dark-theme', 'fe-contrast-dark-theme');
      break;
    case 'contrast-light':
      document.body.classList.add('contrast-light-theme', 'fe-contrast-light-theme');
      break;
    case 'github':
      document.body.classList.add('fe-github-theme');
      break;
    case 'one-dark-pro':
      document.body.classList.add('fe-one-dark-pro-theme');
      break;
    case 'dracula':
      document.body.classList.add('fe-dracula-theme');
      break;
    case 'winter-is-coming':
      document.body.classList.add('fe-winter-is-coming-theme');
      break;
    case 'automatic':
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.body.classList.add('fe-dark-theme');
      } else {
        document.body.classList.add('fe-light-theme');
      }
      break;
    default:
      document.body.classList.add('fe-dark-theme');
  }

  // Re-render to update icons with new theme
  renderFileExplorer();
}

let draggedItem = null;
let draggedPath = null;

function handleDragStart(e, item, path) {
  draggedItem = item;
  draggedPath = path;
  e.currentTarget.classList.add('dragging');
  e.stopPropagation();
}

function handleDragOver(e) {
  e.preventDefault();
  e.currentTarget.classList.add('drag-over');
}

function handleDragLeave(e) {
  e.currentTarget.classList.remove('drag-over');
}

function handleDragEnd(e) {
  e.currentTarget.classList.remove('dragging');
  document.querySelectorAll('.drag-over').forEach(el => {
    el.classList.remove('drag-over');
  });
}

function handleDrop(e, targetItem, targetPath) {
  e.preventDefault();
  e.currentTarget.classList.remove('drag-over');

  if (!draggedItem || draggedItem === targetItem) return;

  // Don't allow dropping into non-folders or into own subdirectory
  if (targetItem.type !== 'folder' || targetPath.startsWith(draggedPath + '/')) return;

  // Check if the dragged item is a file and is already in any folder
  const isInFolder = draggedPath.includes('/');
  const isFile = draggedItem.type === 'file';

  // If it's a file in root and trying to move to root, prevent it
  if (isFile && !isInFolder && targetPath === '') {
    return;
  }

  // Remove item from old location
  deleteFileOrFolder(draggedItem, fileSystem);

  // Add to new location
  if (!targetItem.children) targetItem.children = [];
  targetItem.children.push(draggedItem);

  // Expand the target folder
  targetItem.expanded = true;

  // Update storage and UI
  localStorage.setItem('projectFiles', JSON.stringify(fileSystem));
  updateFiles(); // Add this after file system changes
  renderFileExplorer();
}
// themes.js - Monaco Editor Theme Integration
// Converts CSS themes from themes.css to Monaco editor themes

/**
 * Define all themes based on the CSS variables
 */
const monacoThemes = {
  // Main Dark Theme
  'main-dark': {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
      { token: 'keyword', foreground: '569CD6' },
      { token: 'string', foreground: 'CE9178' },
      { token: 'number', foreground: 'B5CEA8' },
      { token: 'type', foreground: '4EC9B0' },
      { token: 'delimiter', foreground: 'D4D4D4' },
    ],
    colors: {
      'editor.background': '#1e1e1e',
      'editor.foreground': '#d4d4d4',
      'editor.lineHighlightBackground': '#282828',
      'editor.selectionBackground': '#264F78',
      'editorCursor.foreground': '#A6A6A6',
      'editorWhitespace.foreground': '#404040',
      'editorIndentGuide.background': '#404040',
      'editorIndentGuide.activeBackground': '#707070',
      'editor.selectionHighlightBorder': '#122F4A',
    }
  },

  // High Contrast Dark Theme
  'high-contrast-dark': {
    base: 'hc-black',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
      { token: 'keyword', foreground: '569CD6' },
      { token: 'string', foreground: 'CE9178' },
      { token: 'number', foreground: 'B5CEA8' },
      { token: 'type', foreground: '4EC9B0' },
    ],
    colors: {
      'editor.background': '#000000',
      'editor.foreground': '#ffffff',
      'editor.lineHighlightBackground': '#0c0c0c',
      'editor.selectionBackground': '#c15900',
      'editorCursor.foreground': '#ffffff',
      'editorWhitespace.foreground': '#333333',
    }
  },

  // Main Light Theme
  'main-light': {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '008000', fontStyle: 'italic' },
      { token: 'keyword', foreground: '0000FF' },
      { token: 'string', foreground: 'A31515' },
      { token: 'number', foreground: '098658' },
      { token: 'type', foreground: '267F99' },
    ],
    colors: {
      'editor.background': '#ffffff',
      'editor.foreground': '#333333',
      'editor.lineHighlightBackground': '#f0f0f0',
      'editor.selectionBackground': '#ADD6FF',
      'editorCursor.foreground': '#333333',
      'editorWhitespace.foreground': '#e0e0e0',
    }
  },

  // High Contrast Light Theme
  'high-contrast-light': {
    base: 'hc-light',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '008000', fontStyle: 'italic' },
      { token: 'keyword', foreground: '0000FF' },
      { token: 'string', foreground: 'A31515' },
      { token: 'number', foreground: '098658' },
      { token: 'type', foreground: '267F99' },
    ],
    colors: {
      'editor.background': '#ffffff',
      'editor.foreground': '#000000',
      'editor.lineHighlightBackground': '#f0f0f0',
      'editor.selectionBackground': '#007acc',
      'editorCursor.foreground': '#000000',
      'editorWhitespace.foreground': '#e0e0e0',
    }
  },

  // GitHub Theme
  'github': {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6a737d', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'd73a49' },
      { token: 'string', foreground: '032f62' },
      { token: 'number', foreground: '005cc5' },
      { token: 'type', foreground: '6f42c1' },
    ],
    colors: {
      'editor.background': '#ffffff',
      'editor.foreground': '#24292e',
      'editor.lineHighlightBackground': '#f6f8fa',
      'editor.selectionBackground': '#0366d6',
      'editorCursor.foreground': '#24292e',
      'editorWhitespace.foreground': '#e1e4e8',
    }
  },

  // One Dark Pro Theme
  'one-dark-pro': {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '5c6370', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'c678dd' },
      { token: 'string', foreground: '98c379' },
      { token: 'number', foreground: 'd19a66' },
      { token: 'type', foreground: 'e5c07b' },
    ],
    colors: {
      'editor.background': '#282c34',
      'editor.foreground': '#abb2bf',
      'editor.lineHighlightBackground': '#2c313a',
      'editor.selectionBackground': '#3e4451',
      'editorCursor.foreground': '#528bff',
      'editorWhitespace.foreground': '#3b4048',
    }
  },

  // Dracula Theme
  'dracula': {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6272a4', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'ff79c6' },
      { token: 'string', foreground: 'f1fa8c' },
      { token: 'number', foreground: 'bd93f9' },
      { token: 'type', foreground: '8be9fd' },
    ],
    colors: {
      'editor.background': '#282a36',
      'editor.foreground': '#f8f8f2',
      'editor.lineHighlightBackground': '#343746',
      'editor.selectionBackground': '#44475a',
      'editorCursor.foreground': '#f8f8f0',
      'editorWhitespace.foreground': '#3b3d4d',
    }
  },

  // Winter is Coming Theme
  'winter-is-coming': {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '5f7e97', fontStyle: 'italic' },
      { token: 'keyword', foreground: '7fdbca' },
      { token: 'string', foreground: 'addb67' },
      { token: 'number', foreground: '82aaff' },
      { token: 'type', foreground: 'ffcb8b' },
    ],
    colors: {
      'editor.background': '#011627',
      'editor.foreground': '#d6deeb',
      'editor.lineHighlightBackground': '#1d3b53',
      'editor.selectionBackground': '#5f7e97',
      'editorCursor.foreground': '#7fdbca',
      'editorWhitespace.foreground': '#0b2942',
    }
  }
};

/**
 * Register all themes with Monaco Editor
*/

function registerMonacoThemes() {
  if (typeof monaco === 'undefined') {
    console.warn('Monaco Editor not loaded yet. Themes will be registered when Monaco is available.');
    return;
  }

  for (const [themeName, themeData] of Object.entries(monacoThemes)) {
    monaco.editor.defineTheme(themeName, themeData);
  }

  // Set default theme
  monaco.editor.setTheme('main-dark');
}
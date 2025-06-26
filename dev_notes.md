# Issue Log from Update 0.4.5

## Critical Fixes Needed

### JavaScript Execution Issues
- **Preview infinite loop freeze**  
JavaScript infinite loops (e.g., `while (true) {}`) completely freeze the preview panel. Current workaround requires deleting browser cookies (which also clears user progress).

### System Functionality
- **Read-only file editing**  
Users can currently edit read-only files - need to implement protection

- **Tab bar button failures**  
Tab management buttons intermittently fail or behave unexpectedly


### Loading Issues (Requires Verification)
- **HTML run in new tab loading**  
Testers report inconsistent loading behavior when executing "run in new tab" on HTML documents...


## Code Maintenance Tasks
- Remove unused functions from `scripts.js`
- Remove unused actions from `scripts.js`

<!-- the next block is for the next update ( 0.4.7 ) -->

<!--

## Proposed Features

### Preview Enhancements
- **Markdown rendering**  
Live preview for .md files

- **Image display**  
Native preview for PNG/JPG formats

### Execution Improvements
- **Tab management**  
Prevent tab clustering with "run in new tab" feature

### UI/UX Upgrades
- **Theme expansion**  
New themes: Ayu Dark, Abyss

- **Editor theming**  
Better Monaco Editor theme support

### Language Support Exploration
- **Python execution**  
Via pyodide (currently considered infeasible)

-->
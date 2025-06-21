"""
HTML IDE Updater - Professional Edition

This script handles updating the HTML IDE application by:
1. Creating a backup of the current version
2. Cloning the latest version from GitHub
3. Synchronizing files while preserving user data
4. Providing visual feedback through a PyGame UI
5. Launching the application after successful update

Key improvements:
- Clearer progress stages with constants
- Better error handling and recovery
- Improved file synchronization
- Enhanced UI with status messages
- Safeguards against common update issues
"""

import os
import sys
import subprocess
import shutil
import time
import tempfile

# === PYGAME IMPORT SAFEGUARD ===
try:
    import pygame
except ImportError:
    # Install pygame automatically if missing
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pygame"])
    import pygame

# === CONFIGURATION CONSTANTS ===
REPOSITORY_URL = "https://github.com/bw3m1/html_ide.git"
CURRENT_SCRIPT = os.path.basename(__file__)  # For self-reference

# UI Constants
WINDOW_WIDTH, WINDOW_HEIGHT = 800, 480
PROGRESS_BAR_WIDTH = 500
PROGRESS_BAR_HEIGHT = 32
PROGRESS_BAR_X = (WINDOW_WIDTH - PROGRESS_BAR_WIDTH) // 2
PROGRESS_BAR_Y = 240

# Progress Stages (0.0-1.0)
PROGRESS_STAGES = {
    "PREPARING": 0.1,
    "BACKING_UP": 0.3,
    "DOWNLOADING": 0.5,
    "SYNCING": 0.7,
    "CLEANING_UP": 0.9,
    "COMPLETE": 1.0
}

# === UI SETUP ===
def init_ui():
    """Initialize PyGame components and return screen object"""
    pygame.init()
    screen = pygame.display.set_mode((WINDOW_WIDTH, WINDOW_HEIGHT))
    pygame.display.set_caption("🛠 HTML IDE Updater")
    return screen

# Create UI components
SCREEN = init_ui()
TITLE_FONT = pygame.font.SysFont("segoeui", 36, bold=True)
STATUS_FONT = pygame.font.SysFont("segoeui", 24)
CLOCK = pygame.time.Clock()

# === COLOR SCHEME ===
BACKGROUND = (18, 18, 28)
TEXT_WHITE = (255, 255, 255)
ACCENT_BLUE = (100, 200, 255)
PROGRESS_BG = (40, 40, 60)
PROGRESS_FILL = (0, 160, 100)
PROGRESS_BORDER = (80, 80, 110)

# === UI RENDERING ===
def render_ui(message, progress=0.0, show_animation=False):
    """Draw the updater interface with progress information"""
    SCREEN.fill(BACKGROUND)
    
    # Render title
    title = TITLE_FONT.render("HTML IDE Updater", True, ACCENT_BLUE)
    SCREEN.blit(title, title.get_rect(center=(WINDOW_WIDTH//2, 80)))
    
    # Render status message with optional animation
    dots = "." * ((pygame.time.get_ticks() // 500) % 4) if show_animation else ""
    status = STATUS_FONT.render(f"{message}{dots}", True, TEXT_WHITE)
    SCREEN.blit(status, status.get_rect(center=(WINDOW_WIDTH//2, 160)))
    
    # Render progress bar
    bar_rect = pygame.Rect(PROGRESS_BAR_X, PROGRESS_BAR_Y, 
                           PROGRESS_BAR_WIDTH, PROGRESS_BAR_HEIGHT)
    fill_width = int(PROGRESS_BAR_WIDTH * progress)
    fill_rect = pygame.Rect(PROGRESS_BAR_X, PROGRESS_BAR_Y, 
                            fill_width, PROGRESS_BAR_HEIGHT)
    
    pygame.draw.rect(SCREEN, PROGRESS_BG, bar_rect, border_radius=12)
    pygame.draw.rect(SCREEN, PROGRESS_FILL, fill_rect, border_radius=12)
    pygame.draw.rect(SCREEN, PROGRESS_BORDER, bar_rect, 2, border_radius=12)
    
    # Render percentage text
    percent_text = STATUS_FONT.render(f"{int(progress*100)}%", True, TEXT_WHITE)
    SCREEN.blit(percent_text, (bar_rect.right + 15, PROGRESS_BAR_Y))
    
    pygame.display.flip()

# === SYSTEM COMMANDS ===
def execute_command(command, description, progress):
    """Execute a shell command with progress feedback"""
    try:
        render_ui(description, progress, show_animation=True)
        
        process = subprocess.Popen(
            command,
            shell=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        # Process output while handling UI events
        while True:
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    pygame.quit()
                    sys.exit()
                    
            # Update progress slightly while command runs
            if process.poll() is None:
                render_ui(description, progress + 0.05, show_animation=True)
                time.sleep(0.1)
            else:
                break
                
        # Check command result
        if process.returncode != 0:
            error = process.stderr.read().strip() or f"Exit code: {process.returncode}"
            render_ui(f"Error: {error}", progress)
            time.sleep(2)
            return False
        return True
        
    except Exception as e:
        render_ui(f"Operation failed: {str(e)}", progress)
        time.sleep(2)
        return False

# === FILE OPERATIONS ===
def robust_remove(path):
    """Safely remove files/directories with retry logic"""
    if not os.path.exists(path):
        return True
        
    # Error handler for permission issues
    def fix_permissions(func, failed_path, _):
        os.chmod(failed_path, 0o777)
        func(failed_path)
    
    for _ in range(3):  # Retry up to 3 times
        try:
            if os.path.isdir(path):
                shutil.rmtree(path, onerror=fix_permissions)
            else:
                os.remove(path)
            return True
        except Exception:
            time.sleep(0.5)
            
    return False

def robust_copy(source, destination):
    """Copy files/directories with error recovery"""
    for _ in range(3):  # Retry up to 3 times
        try:
            if os.path.isdir(source):
                shutil.copytree(source, destination, dirs_exist_ok=True)
            else:
                os.makedirs(os.path.dirname(destination), exist_ok=True)
                shutil.copy2(source, destination)
            return True
        except Exception:
            time.sleep(0.5)
            
    return False

# === UPDATE PROCEDURE ===
def create_backup(base_dir, backup_dir):
    """Create backup of current installation"""
    render_ui("Creating backup", PROGRESS_STAGES["BACKING_UP"])
    
    if not os.path.exists(base_dir):
        render_ui("Error: Installation not found", PROGRESS_STAGES["BACKING_UP"])
        time.sleep(2)
        return False
        
    return robust_copy(base_dir, backup_dir)

def clone_repository(repo_url, clone_dir):
    """Clone repository into temporary directory"""
    return execute_command(
        f'git clone --depth 1 "{repo_url}" "{clone_dir}"',
        "Downloading updates",
        PROGRESS_STAGES["DOWNLOADING"]
    )

def sync_files(source_dir, target_dir):
    """Synchronize files from source to target directory"""
    try:
        # Copy new/changed files
        for item in os.listdir(source_dir):
            if item in ['.git', '__pycache__', CURRENT_SCRIPT]:
                continue
                
            source_path = os.path.join(source_dir, item)
            dest_path = os.path.join(target_dir, item)
            
            # Remove existing item if needed
            if os.path.exists(dest_path):
                if not robust_remove(dest_path):
                    render_ui(f"Warning: Couldn't remove {item}", PROGRESS_STAGES["SYNCING"])
                    time.sleep(1)
                    
            # Copy new version
            if not robust_copy(source_path, dest_path):
                render_ui(f"Warning: Couldn't update {item}", PROGRESS_STAGES["SYNCING"])
                time.sleep(1)
                
        # Remove obsolete files
        for item in os.listdir(target_dir):
            if item == CURRENT_SCRIPT:  # Preserve updater
                continue
                
            source_path = os.path.join(source_dir, item)
            dest_path = os.path.join(target_dir, item)
            
            if not os.path.exists(source_path):
                if not robust_remove(dest_path):
                    render_ui(f"Warning: Couldn't remove obsolete {item}", PROGRESS_STAGES["SYNCING"])
                    time.sleep(1)
                    
        return True
        
    except Exception as e:
        render_ui(f"Sync error: {str(e)}", PROGRESS_STAGES["SYNCING"])
        time.sleep(3)
        return False

# === APPLICATION LAUNCHER ===
def launch_application():
    """Launch the application appropriate for the current OS"""
    base_dir = os.path.dirname(os.path.abspath(__file__))
    index_path = os.path.join(base_dir, "index.html")
    
    if not os.path.exists(index_path):
        return False
        
    try:
        if sys.platform == "win32":
            os.startfile(index_path)
        elif sys.platform == "darwin":
            subprocess.Popen(["open", index_path])
        else:
            subprocess.Popen(["xdg-open", index_path])
        return True
    except Exception as e:
        render_ui(f"Launch failed: {str(e)}", PROGRESS_STAGES["COMPLETE"])
        time.sleep(2)
        return False

# === MAIN UPDATE WORKFLOW ===
def perform_update():
    """Execute the full update process"""
    # Prepare directories
    base_dir = os.path.dirname(os.path.abspath(__file__))
    parent_dir = os.path.dirname(base_dir)
    timestamp = str(int(time.time()))
    
    temp_clone = tempfile.mkdtemp(prefix="ide_clone_", dir=parent_dir)
    backup_dir = os.path.join(parent_dir, f"ide_backup_{timestamp}")
    
    success = False
    try:
        # Update sequence
        render_ui("Preparing update", PROGRESS_STAGES["PREPARING"])
        
        if not create_backup(base_dir, backup_dir):
            return
            
        if not clone_repository(REPOSITORY_URL, temp_clone):
            return
            
        if not sync_files(temp_clone, base_dir):
            return
            
        success = True
        
    finally:
        # Cleanup operations
        render_ui("Finalizing update", PROGRESS_STAGES["CLEANING_UP"])
        
        # Remove temporary clone
        if os.path.exists(temp_clone):
            if not robust_remove(temp_clone):
                render_ui("Notice: Temp files not fully removed", PROGRESS_STAGES["CLEANING_UP"])
                time.sleep(1)
        
        # Remove backup if update succeeded
        if success and os.path.exists(backup_dir):
            if not robust_remove(backup_dir):
                render_ui("Notice: Backup not fully removed", PROGRESS_STAGES["CLEANING_UP"])
                time.sleep(1)
    
    # Finalize and launch
    if success:
        render_ui("Update successful! Launching...", PROGRESS_STAGES["COMPLETE"])
        time.sleep(1.5)
        
        if not launch_application():
            render_ui("Update complete! Launch index.html manually", PROGRESS_STAGES["COMPLETE"])
            time.sleep(3)

# === APPLICATION ENTRY POINT ===
if __name__ == "__main__":
    update_started = False
    active = True
    
    while active:
        if not update_started:
            update_started = True
            perform_update()
            active = False
            
        # Handle quit events
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                active = False
                
        CLOCK.tick(30)
    
    pygame.quit()
    sys.exit()
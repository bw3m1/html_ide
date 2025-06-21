import os
import sys
import subprocess
import shutil
import time
import pygame

# === SETTINGS ===
GITHUB_REPO = "https://github.com/bw3m1/html_ide.git"

# === PATHS ===
UPDATER_DIR = os.path.dirname(os.path.abspath(__file__))      # html_IDE/updater
BASE_DIR = os.path.abspath(os.path.join(UPDATER_DIR, ".."))   # html_IDE

TARGET_DIR = os.path.join(BASE_DIR, "html_ide")   # repo will be cloned here
BACKUP_DIR = os.path.join(BASE_DIR, "!!BKUP")     # backup destination

# === INSTALL PYGAME IF NEEDED ===
try:
    import pygame
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pygame"])
    import pygame

# === INIT PYGAME ===
pygame.init()
screen = pygame.display.set_mode((700, 400))
pygame.display.set_caption("📦 HTML IDE Updater")
font = pygame.font.SysFont("consolas", 24) or pygame.font.SysFont("Arial", 24)
clock = pygame.time.Clock()

# === COLORS ===
BG_COLOR = (20, 20, 30)
TEXT_COLOR = (240, 240, 240)
BAR_BG = (50, 50, 70)
BAR_FILL = (0, 180, 90)
BAR_BORDER = (100, 100, 130)

# === DRAW UI ===
def draw_status(message, progress=0.0, animate_dots=False):
    screen.fill(BG_COLOR)

    # Title
    title_text = font.render("Updating HTML IDE...", True, TEXT_COLOR)
    screen.blit(title_text, title_text.get_rect(center=(350, 80)))

    # Subtitle
    dots = "." * ((pygame.time.get_ticks() // 500) % 4) if animate_dots else ""
    status_text = font.render(f"{message}{dots}", True, TEXT_COLOR)
    screen.blit(status_text, status_text.get_rect(center=(350, 140)))

    # Progress Bar
    bar_rect = pygame.Rect(150, 200, 400, 30)
    pygame.draw.rect(screen, BAR_BG, bar_rect, border_radius=10)
    pygame.draw.rect(screen, BAR_FILL, (150, 200, int(400 * progress), 30), border_radius=10)
    pygame.draw.rect(screen, BAR_BORDER, bar_rect, 2, border_radius=10)

    pygame.display.flip()

# === SHELL COMMANDS ===
def run_command(command, message, stage_progress):
    draw_status(message, stage_progress, animate_dots=True)
    try:
        subprocess.check_call(command, shell=True)
        return True
    except subprocess.CalledProcessError as e:
        draw_status(f"Error: {e}", stage_progress)
        time.sleep(2)
        return False

# === PROGRESS ANIMATION ===
def wait_progress(duration, message, start_p, end_p):
    start_time = time.time()
    while time.time() - start_time < duration:
        t = (time.time() - start_time) / duration
        progress = start_p + (end_p - start_p) * t
        draw_status(message, progress, animate_dots=True)
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                sys.exit()
        clock.tick(60)

# === MAIN UPDATE LOGIC ===
def update_app():
    wait_progress(0.5, "Preparing update", 0.0, 0.1)

    if os.path.exists(BACKUP_DIR):
        shutil.rmtree(BACKUP_DIR)

    if os.path.exists(TARGET_DIR):
        wait_progress(1.0, "Backing up current version", 0.1, 0.3)
        shutil.move(TARGET_DIR, BACKUP_DIR)
    else:
        wait_progress(0.6, "No previous install found", 0.1, 0.3)

    draw_status("Cloning repository", 0.4, animate_dots=True)
    success = run_command(f"git clone {GITHUB_REPO} \"{TARGET_DIR}\"", "Cloning repository", 0.6)

    if success:
        wait_progress(0.8, "Finalizing update", 0.7, 1.0)
        draw_status("✅ Update complete!", 1.0)
    else:
        wait_progress(0.5, "Clone failed, restoring backup", 0.6, 0.8)
        if os.path.exists(BACKUP_DIR):
            shutil.move(BACKUP_DIR, TARGET_DIR)
            draw_status("🔁 Backup restored", 0.9)
        else:
            draw_status("❌ No backup to restore", 0.9)
    time.sleep(2)

# === MAIN LOOP ===
update_started = False
running = True

while running:
    if not update_started:
        update_started = True
        update_app()

    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False

    clock.tick(30)

pygame.quit()

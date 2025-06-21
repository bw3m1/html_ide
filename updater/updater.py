import os
import sys
import subprocess
import shutil
import time
import pygame

# === SETTINGS ===
GITHUB_REPO = "https://github.com/bw3m1/html_ide.git"
TARGET_DIR = "html_ide"
BACKUP_DIR = "!!BKUP"

# === INSTALL PYGAME IF NEEDED ===
try:
    import pygame
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pygame"])
    import pygame

# === INIT PYGAME ===
pygame.init()
screen = pygame.display.set_mode((600, 300))
pygame.display.set_caption("App Updater")
font = pygame.font.SysFont("consolas", 22)
clock = pygame.time.Clock()

# === DRAW STATUS WITH PROGRESS BAR ===
def draw_status(message, progress=0.0):
    screen.fill((25, 25, 25))

    # Text
    text = font.render(message, True, (255, 255, 255))
    text_rect = text.get_rect(center=(300, 120))
    screen.blit(text, text_rect)

    # Progress bar
    bar_x, bar_y, bar_w, bar_h = 100, 170, 400, 25
    pygame.draw.rect(screen, (60, 60, 60), (bar_x, bar_y, bar_w, bar_h), border_radius=5)
    pygame.draw.rect(screen, (100, 200, 100), (bar_x, bar_y, int(bar_w * progress), bar_h), border_radius=5)

    pygame.display.flip()

# === RUN SHELL COMMANDS ===
def run_command(command, message, stage_progress):
    draw_status(message, stage_progress)
    try:
        subprocess.check_call(command, shell=True)
        return True
    except subprocess.CalledProcessError as e:
        draw_status(f"Error: {e}", stage_progress)
        time.sleep(2)
        return False

# === SMOOTH STEP HELPER ===
def wait_with_progress(duration, message, start_p, end_p):
    start_time = time.time()
    while time.time() - start_time < duration:
        t = (time.time() - start_time) / duration
        progress = start_p + (end_p - start_p) * t
        draw_status(message, progress)
        clock.tick(60)

# === MAIN UPDATE LOGIC ===
def update_app():
    wait_with_progress(0.5, "Preparing update...", 0.0, 0.1)

    if os.path.exists(BACKUP_DIR):
        shutil.rmtree(BACKUP_DIR)
    if os.path.exists(TARGET_DIR):
        wait_with_progress(1.0, "Backing up...", 0.1, 0.3)
        shutil.move(TARGET_DIR, BACKUP_DIR)
    else:
        wait_with_progress(1.0, "No existing folder. Skipping backup.", 0.1, 0.3)

    draw_status("Cloning from GitHub...", 0.4)
    success = run_command(f"git clone {GITHUB_REPO} {TARGET_DIR}", "Cloning repository...", 0.6)

    if success:
        wait_with_progress(1.0, "Finalizing update...", 0.8, 1.0)
        draw_status("✅ Update complete!", 1.0)
    else:
        wait_with_progress(0.5, "Failed. Restoring backup...", 0.6, 0.8)
        if os.path.exists(BACKUP_DIR):
            shutil.move(BACKUP_DIR, TARGET_DIR)
            draw_status("🔁 Backup restored.", 0.9)
        else:
            draw_status("❌ No backup found.", 0.9)
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

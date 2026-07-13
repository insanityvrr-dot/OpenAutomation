#!/usr/bin/env python3
"""
OpenAutomation - Alice Agent Linux GUI Control Layer (computer_use.py)
LOONAR V1.0 Core System Driver for Wayland and X11 Screen Control.

This module provides high-fidelity, native OS automation controls for Python.
It handles screenshot capture, mouse motion with human-like bezier curves,
keyboard input injection, coordinate normalization, and environment detection.

License: MIT
"""

import os
import sys
import time
import math
import random
import subprocess
import shutil

# Dynamic Dependency Import with Auto-Installation Advice
try:
    import pyautogui
    from PIL import Image
except ImportError:
    print("[!] Missing required python libraries: pyautogui, Pillow.")
    print("    Please run 'pip install pyautogui Pillow' or use 'install.sh'.")
    pyautogui = None
    Image = None

# Disable PyAutoGUI fail-safe delay to let custom smoothing handle speeds
if pyautogui:
    pyautogui.FAILSAFE = True  # Move mouse to top-left corner to abort
    pyautogui.PAUSE = 0.05


class ComputerUseDriver:
    def __init__(self):
        self.display_server = self._detect_display_server()
        self.screen_width, self.screen_height = self._get_screen_resolution()
        print(f"[*] Alice Driver Initialized.")
        print(f"    - Display Server: {self.display_server.upper()}")
        print(f"    - Resolution: {self.screen_width}x{self.screen_height}")

    def _detect_display_server(self) -> str:
        """Detect whether the current environment is running X11 or Wayland."""
        session_type = os.environ.get("XDG_SESSION_TYPE", "").lower()
        wayland_display = os.environ.get("WAYLAND_DISPLAY", "")
        
        if "wayland" in session_type or wayland_display:
            return "wayland"
        
        # Check if x411 commands are available as a fallback
        if shutil.which("xdotool"):
            return "x11"
            
        return "x11"  # Default fallback

    def _get_screen_resolution(self) -> tuple:
        """Fetch current display resolution, falling back to pyautogui or standard."""
        if pyautogui:
            try:
                return pyautogui.size()
            except Exception:
                pass
        return (1920, 1080)  # Standard fallback

    def scale_coordinates(self, norm_x: float, norm_y: float) -> tuple:
        """
        Convert normalized coordinates (0 to 1000) from LOONAR V1.0
        into actual desktop pixel coordinates.
        """
        # Constrain to 0-1000 bounds
        norm_x = max(0.0, min(1000.0, norm_x))
        norm_y = max(0.0, min(1000.0, norm_y))
        
        pixel_x = int((norm_x / 1000.0) * self.screen_width)
        pixel_y = int((norm_y / 1000.0) * self.screen_height)
        return pixel_x, pixel_y

    def capture_screen(self, output_path: str = "screenshot.png") -> str:
        """
        Takes a full screen screenshot. Automatically handles the safety
        differences between X11 and Wayland display environments.
        """
        print(f"[*] Capturing screen in {self.display_server} mode...")
        
        # Ensure parent directory exists
        dir_name = os.path.dirname(output_path)
        if dir_name and not os.path.exists(dir_name):
            os.makedirs(dir_name, exist_ok=True)

        if self.display_server == "wayland":
            # Under Wayland, standard pyautogui.screenshot() often returns a black screen.
            # We prioritize 'grim' (Wayland native utility)
            if shutil.which("grim"):
                cmd = ["grim", output_path]
                try:
                    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                    return output_path
                except subprocess.SubprocessError:
                    pass
            
            # Alternative: GNOME screenshot via dbus
            if shutil.which("gnome-screenshot"):
                cmd = ["gnome-screenshot", "-f", output_path]
                try:
                    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                    return output_path
                except subprocess.SubprocessError:
                    pass

        # Under X11, prioritize 'scrot' or 'xwd' for lightweight captures
        if shutil.which("scrot"):
            cmd = ["scrot", "-z", "-u", output_path]  # -z: silent, -u: focused window or full
            try:
                subprocess.run(["scrot", "-z", output_path], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                return output_path
            except subprocess.SubprocessError:
                pass

        # Python-level Fallback
        if pyautogui:
            try:
                screenshot = pyautogui.screenshot()
                screenshot.save(output_path)
                return output_path
            except Exception as e:
                print(f"[!] PyAutoGUI screenshot failed: {e}")
        
        raise RuntimeError("Screen capture failed. Please install 'scrot' (for X11) or 'grim' (for Wayland).")

    def _calculate_bezier_point(self, p0: tuple, p1: tuple, p2: tuple, p3: tuple, t: float) -> tuple:
        """Calculate a single point on a cubic Bezier curve."""
        x = (1-t)**3 * p0[0] + 3*(1-t)**2 * t * p1[0] + 3*(1-t) * t**2 * p2[0] + t**3 * p3[0]
        y = (1-t)**3 * p0[1] + 3*(1-t)**2 * t * p1[1] + 3*(1-t) * t**2 * p2[1] + t**3 * p3[1]
        return int(x), int(y)

    def move_mouse_humanlike(self, target_x: int, target_y: int, duration_min: float = 0.4, duration_max: float = 1.0):
        """
        Moves the mouse to target_x, target_y using a cubic Bezier curve
        to simulate human hand-eye motor movements.
        """
        if not pyautogui:
            print(f"[Simulated Mouse Move] -> ({target_x}, {target_y})")
            return

        start_x, start_y = pyautogui.position()
        if start_x == target_x and start_y == target_y:
            return

        # Generate random control points for Bezier curve to create realistic micro-fluctuations
        control_distance = math.hypot(target_x - start_x, target_y - start_y)
        if control_distance < 10:
            pyautogui.moveTo(target_x, target_y)
            return

        p0 = (start_x, start_y)
        p3 = (target_x, target_y)
        
        # Control points are offset from start and target to create a natural curve arc
        deviation_scale = random.uniform(0.1, 0.3)
        p1_x = start_x + (target_x - start_x) * deviation_scale + random.randint(-50, 50)
        p1_y = start_y + (target_y - start_y) * deviation_scale + random.randint(-50, 50)
        
        p2_x = start_x + (target_x - start_x) * (1.0 - deviation_scale) + random.randint(-50, 50)
        p2_y = start_y + (target_y - start_y) * (1.0 - deviation_scale) + random.randint(-50, 50)
        
        p1 = (p1_x, p1_y)
        p2 = (p2_x, p2_y)

        # Dynamic step counting based on distance
        steps = int(max(15, min(60, control_distance / 15)))
        duration = random.uniform(duration_min, duration_max)
        sleep_step = duration / steps

        for i in range(steps + 1):
            t = i / steps
            # Ease-in-out timing function
            t_eased = t * t * (3 - 2 * t)
            curr_x, curr_y = self._calculate_bezier_point(p0, p1, p2, p3, t_eased)
            
            # Clamp to screen size
            curr_x = max(0, min(self.screen_width - 1, curr_x))
            curr_y = max(0, min(self.screen_height - 1, curr_y))
            
            pyautogui.moveTo(curr_x, curr_y)
            time.sleep(sleep_step)

        # Snap to final position to correct rounding errors
        pyautogui.moveTo(target_x, target_y)

    def mouse_click(self, x: int, y: int, button: str = "left", clicks: int = 1):
        """Moves mouse smoothly to X, Y and executes click."""
        self.move_mouse_humanlike(x, y)
        time.sleep(0.1)

        if not pyautogui:
            print(f"[Simulated Click] -> {button.upper()} click at ({x}, {y}) x{clicks}")
            return

        if self.display_server == "wayland":
            # Wayland input bypass: try using ydotool if installed, fallback to pyautogui
            if shutil.which("ydotool"):
                cmd_button = "0x110" if button == "left" else "0x111"  # mouse click codes
                try:
                    subprocess.run(["ydotool", "mousemove", str(x), str(y)], check=True)
                    for _ in range(clicks):
                        subprocess.run(["ydotool", "click", cmd_button], check=True)
                    return
                except subprocess.SubprocessError:
                    pass

        # Standard click execution
        pyautogui.click(button=button, clicks=clicks)

    def type_text(self, text: str, interval_chars: float = 0.05):
        """Simulates text input with a random typing speed variance."""
        if not pyautogui:
            print(f"[Simulated Type] -> '{text}'")
            return

        if self.display_server == "wayland" and shutil.which("ydotool"):
            try:
                subprocess.run(["ydotool", "type", text], check=True)
                return
            except subprocess.SubprocessError:
                pass

        for char in text:
            pyautogui.write(char)
            # Add micro delay mimicking human typing cadences
            time.sleep(interval_chars * random.uniform(0.6, 1.4))

    def key_press(self, shortcut: str):
        """
        Injects specific keys or key combinations (e.g. 'ctrl+t', 'enter').
        """
        print(f"[*] Pressing shortcut: {shortcut.upper()}")
        if not pyautogui:
            print(f"[Simulated Keypress] -> {shortcut.upper()}")
            return

        keys = shortcut.lower().split("+")
        
        if self.display_server == "wayland" and shutil.which("wtype"):
            # Use wtype under Wayland for virtual keypresses
            try:
                cmd = ["wtype"]
                for key in keys:
                    cmd.extend(["-M", key]) if key in ["ctrl", "alt", "shift"] else cmd.extend(["-k", key])
                subprocess.run(cmd, check=True)
                return
            except subprocess.SubprocessError:
                pass

        # PyAutoGUI native multi-key press
        if len(keys) > 1:
            for key in keys[:-1]:
                pyautogui.keyDown(key.strip())
            pyautogui.press(keys[-1].strip())
            for key in reversed(keys[:-1]):
                pyautogui.keyUp(key.strip())
        else:
            pyautogui.press(keys[0].strip())


# Command-Line Diagnostic Interface
if __name__ == "__main__":
    driver = ComputerUseDriver()
    print("\n--- Running Computer Use Driver Diagnostics ---")
    out = driver.capture_screen("test_diagnostics.png")
    print(f"[✓] Screen capture succeeded: {out}")
    print("[*] Scaling coordinates 500, 500 to screen size...")
    px, py = driver.scale_coordinates(500, 500)
    print(f"[✓] Normalized (500, 500) maps to: Pixel ({px}, {py})")
    print("[✓] Diagnostics completed successfully. Ready for LOONAR integration.")

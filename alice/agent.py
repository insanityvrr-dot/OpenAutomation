#!/usr/bin/env python3
"""
OpenAutomation - Alice Agent Orchestrator (agent.py)
Core LOONAR V1.0 Agent Action Loop with Permission-Gated System Commands.

This file implements the agent reasoning cycle:
1. Capture screen & Downsample for VLM
2. Send image and query to local LLM/VLM (Ollama / Llama.cpp)
3. Parse XML actions and coordinates
4. Prompt the user for approval (Permission Gate)
5. Execute coordinates scaling and input injection via computer_use.py
6. Loop until goal accomplished.

License: MIT
"""

import os
import sys
import time
import re
import base64
import json
import shutil
from io import BytesIO

# Import local computer_use driver
try:
    from computer_use import ComputerUseDriver
except ImportError:
    # Handle direct scripts context or relative packages
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from computer_use import ComputerUseDriver

# Import Rich library for vibrant terminal diagnostics
try:
    from rich.console import Console
    from rich.panel import Panel
    from rich.syntax import Syntax
    from rich.text import Text
except ImportError:
    # Create fallback classes so script can run without rich
    class MockConsole:
        def print(self, *args, **kwargs):
            # Strip formatting or simple print
            text = " ".join([str(a) for a in args])
            # Basic ANSI translation for fallback
            text = text.replace("[bold purple]", "\033[1;35m").replace("[/]", "\033[0m")
            text = text.replace("[bold green]", "\033[1;32m")
            text = text.replace("[bold yellow]", "\033[1;33m")
            text = text.replace("[bold cyan]", "\033[1;36m")
            text = text.replace("[bold red]", "\033[1;31m")
            print(text)
    Console = MockConsole
    Panel = lambda content, *args, **kwargs: content
    Syntax = lambda code, *args, **kwargs: code
    Text = lambda t, *args, **kwargs: t


console = Console()

# Simple startup sequence log
def print_startup_banner():
    """Prints a clean startup message representing the LOONAR V1.0 Engine."""
    console.print("\n" + "="*55, style="bold cyan")
    console.print("       🐺  OPENAUTOMATION - ALICE AGENT ACTIVE  🐺       ", style="bold cyan reverse")
    console.print("="*55, style="bold cyan")
    console.print("   LOONAR V1.0 Engine online | Empowering Local Autonomy")
    console.print("="*55 + "\n", style="bold cyan")


class AliceAgent:
    def __init__(self, use_mock_vlm=False):
        self.driver = ComputerUseDriver()
        self.use_mock_vlm = use_mock_vlm
        self.max_steps = 15
        self.screenshot_file = "alice_active_view.png"
        
        # Local model names
        self.vlm_model = os.environ.get("ALICE_VLM_MODEL", "llava:7b")
        self.ollama_url = os.environ.get("OLLAMA_HOST", "http://localhost:11434")

    def encode_image_base64(self, image_path: str) -> str:
        """Encode screenshot image to Base64 for Ollama VLM payload."""
        with open(image_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode("utf-8")

    def query_local_vlm(self, prompt: str, image_path: str) -> str:
        """
        Sends the screenshot and instructions to local Ollama VLM.
        Includes a robust heuristic parser as a fallback if Ollama is unavailable.
        """
        if self.use_mock_vlm:
            return self._heuristic_mock_response(prompt)

        # Import requests dynamically to keep base scripts lightweight
        try:
            import requests
        except ImportError:
            console.print("[bold red][!] Python 'requests' library not found. Run 'pip install requests'. Falling back to local offline heuristic model.[/]")
            return self._heuristic_mock_response(prompt)

        # Check if Ollama is running, else fallback
        try:
            r = requests.get(f"{self.ollama_url}/api/tags", timeout=2)
            if r.status_code != 200:
                raise requests.RequestException()
        except requests.RequestException:
            console.print("[bold yellow][!] Local Ollama server is offline. Simulating LOONAR V1.0 heuristic engine...[/]")
            return self._heuristic_mock_response(prompt)

        # Construct payload with Base64 Vision data
        base64_image = self.encode_image_base64(image_path)
        payload = {
            "model": self.vlm_model,
            "prompt": prompt,
            "stream": False,
            "images": [base64_image],
            "options": {
                "temperature": 0.1,
                "top_p": 0.9
            }
        }

        console.print(f"[bold purple][Alice]: Analyzing visual context with local {self.vlm_model} model...[/]")
        try:
            response = requests.post(f"{self.ollama_url}/api/generate", json=payload, timeout=60)
            if response.status_code == 200:
                return response.json().get("response", "")
            else:
                raise RuntimeError(f"Error from Ollama API: {response.text}")
        except Exception as e:
            console.print(f"[bold red][!] Ollama inference crashed ({e}). Switching to local heuristics.[/]")
            return self._heuristic_mock_response(prompt)

    def _heuristic_mock_response(self, prompt: str) -> str:
        """
        A high-quality offline rule-based heuristic fallback that maps standard Linux
        automation requests directly into valid XML LOONAR V1.0 tags.
        """
        prompt_lower = prompt.lower()
        
        # Scenario A: GitHub Star Repo
        if "github" in prompt_lower and "star" in prompt_lower:
            if "firefox" not in prompt_lower and "browser" not in prompt_lower:
                return """
                <thought>The user wants to star a GitHub repository. First, I need to open the Firefox web browser to access the internet.</thought>
                <action>click</action>
                <coordinates>120, 180</coordinates>
                <target>Firefox Desktop Icon</target>
                """
            elif "github.com" not in prompt_lower:
                return """
                <thought>Firefox is launching. Now I should type the URL of the GitHub repository into the address bar.</thought>
                <action>click</action>
                <coordinates>420, 110</coordinates>
                <text>https://github.com/OpenAutomation/alice</text>
                <target>Browser URL Bar</target>
                """
            else:
                return """
                <thought>The GitHub page has fully loaded. I can visually detect the 'Star' button at the top-right toolbar section. I will click on it to star the repo.</thought>
                <action>click</action>
                <coordinates>780, 220</coordinates>
                <target>GitHub Star Button</target>
                """
                
        # Scenario B: VS Code Editor & React Code
        if "code" in prompt_lower or "editor" in prompt_lower or "react" in prompt_lower:
            if "todolist.tsx" not in prompt_lower:
                return """
                <thought>Creating a React application. First, I need to open the VS Code editor from the application doc panel.</thought>
                <action>click</action>
                <coordinates>200, 720</coordinates>
                <target>VS Code Launcher</target>
                """
            elif "npm run dev" not in prompt_lower:
                return """
                <thought>The code editor is active. I will click the 'New File' button to create 'TodoList.tsx' and write the code.</thought>
                <action>click</action>
                <coordinates>310, 210</coordinates>
                <text>TodoList.tsx</text>
                <target>Editor Create New File</target>
                """
            else:
                return """
                <thought>React code is written. I should now execute 'npm run dev' in the integrated terminal panel to host the app locally.</thought>
                <action>click</action>
                <coordinates>500, 680</coordinates>
                <text>npm run dev</text>
                <target>Integrated Terminal</target>
                """

        # General terminal/audit fallback
        return """
        <thought>The user requested a system check. Let's open the System Terminal application to write diagnostic commands.</thought>
        <action>click</action>
        <coordinates>120, 260</coordinates>
        <target>Terminal Launcher</target>
        """

    def parse_action_xml(self, response_text: str) -> dict:
        """Extract thought, action, coordinates, text, and target from model output."""
        action_data = {
            "thought": "No logical thought provided.",
            "action": "wait",
            "coords": None,
            "text": "",
            "target": "Desktop"
        }

        # Extract tags
        thought_match = re.search(r"<thought>(.*?)</thought>", response_text, re.DOTALL)
        if thought_match:
            action_data["thought"] = thought_match.group(1).strip()

        action_match = re.search(r"<action>(.*?)</action>", response_text, re.DOTALL)
        if action_match:
            action_data["action"] = action_match.group(1).strip().lower()

        coords_match = re.search(r"<coordinates>(.*?)</coordinates>", response_text, re.DOTALL)
        if coords_match:
            raw_coords = coords_match.group(1).strip()
            parts = [p.strip() for p in raw_coords.split(",")]
            if len(parts) == 2:
                try:
                    action_data["coords"] = (float(parts[0]), float(parts[1]))
                except ValueError:
                    pass

        text_match = re.search(r"<text>(.*?)</text>", response_text, re.DOTALL)
        if text_match:
            action_data["text"] = text_match.group(1).strip()

        target_match = re.search(r"<target>(.*?)</target>", response_text, re.DOTALL)
        if target_match:
            action_data["target"] = target_match.group(1).strip()

        return action_data

    def prompt_permission_gate(self, action_data: dict, scaled_x: int, scaled_y: int) -> bool:
        """
        Core Safety Feature. Displays Alice's proposed mouse and keyboard coordinates
        and prompts the user to approve before execution to prevent malicious actions.
        """
        action_desc = action_data["action"].upper()
        target_name = action_data["target"]
        text_payload = action_data["text"]
        
        console.print("\n" + "="*55, style="bold yellow")
        console.print("   [🔒 ALICE PERMISSION GATE - ACTION PENDING]   ", style="bold yellow reverse")
        console.print("="*55, style="bold yellow")
        
        console.print(f" [*] Action Type:  [bold cyan]{action_desc}[/]")
        console.print(f" [*] Target Area:  [bold cyan]{target_name}[/]")
        console.print(f" [*] Normal Coords: {action_data['coords']} (LOONAR space)")
        console.print(f" [*] Native Pixel:  X: {scaled_x}, Y: {scaled_y} (Display space)")
        
        if text_payload:
            console.print(f" [*] Input Payload: [bold green]'{text_payload}'[/]")
            
        console.print("\n [Alice Thought Log]:", style="bold purple")
        console.print(f"   \"{action_data['thought']}\"", style="italic purple")
        console.print("="*55, style="bold yellow")
        
        # User input prompt
        try:
            user_input = input("\n 👉 Press [ENTER] to Approve Action, type 'abort' or Ctrl+C to Exit: ").strip().lower()
            if user_input in ["abort", "a", "no", "n", "exit"]:
                return False
            return True
        except KeyboardInterrupt:
            return False

    def run_agent_loop(self, task_description: str):
        """Orchestrates the active computer use navigation agent loop."""
        print_startup_banner()
        console.print(f"[bold cyan][*] Initializing Alice Agent Core for task: '{task_description}'[/]")
        
        current_step = 1
        system_running = True
        
        while system_running and current_step <= self.max_steps:
            console.print(f"\n[bold purple]=== [Step {current_step} / {self.max_steps}] Reasoning Cycle ===[/]")
            
            # 1. Take screenshot
            try:
                self.driver.capture_screen(self.screenshot_file)
            except Exception as e:
                console.print(f"[bold red][!] Screen capture failed: {e}. Run 'alice' diagnostic tools.[/]")
                break

            # 2. Query LOONAR Engine
            vlm_prompt = f"""
            Task to perform: "{task_description}"
            Currently looking at the desktop view. Analyze what you see and respond with:
            1. An XML thought tag (<thought>Explanation of screen context and next step</thought>)
            2. An XML action tag (<action>click</action> or <action>type</action> or <action>key</action> or <action>done</action>)
            3. Normalized coordinates from 0 to 1000 (<coordinates>X, Y</coordinates>)
            4. Text details to type if applicable (<text>string</text>)
            5. Target descriptor (<target>Button/Icon name</target>)
            
            Coordinates Map: Top-Left is (0, 0), Bottom-Right is (1000, 1000).
            """
            
            model_response = self.query_local_vlm(vlm_prompt, self.screenshot_file)
            
            # 3. Parse XML action
            action_data = self.parse_action_xml(model_response)
            
            # Check if done
            if action_data["action"] == "done":
                console.print(f"\n[bold green][✓] Alice completed the task successfully at step {current_step}.[/]")
                break
                
            # Scale coordinates
            if action_data["coords"]:
                px, py = self.driver.scale_coordinates(action_data["coords"][0], action_data["coords"][1])
            else:
                px, py = (0, 0)

            # 4. Prompt Safety Permission Gate
            approved = self.prompt_permission_gate(action_data, px, py)
            
            if not approved:
                console.print("\n[bold red][!] Action ABORTED by user. Halting agent loop for safety.[/]", style="bold red")
                break

            # 5. Execute Action via driver
            console.print(f"[bold green][*] Executing action {action_data['action']} on pixel coordinates ({px}, {py})...[/]")
            
            if action_data["action"] in ["click", "double-click"]:
                clicks = 2 if action_data["action"] == "double-click" else 1
                self.driver.mouse_click(px, py, clicks=clicks)
                
                # Check if we also have text input to write
                if action_data["text"]:
                    time.sleep(0.5)
                    self.driver.type_text(action_data["text"])
                    time.sleep(0.5)
                    self.driver.key_press("enter")
                    
            elif action_data["action"] == "type" and action_data["text"]:
                self.driver.type_text(action_data["text"])
                
            elif action_data["action"] == "key" and action_data["text"]:
                self.driver.key_press(action_data["text"])
                
            else:
                time.sleep(1.0) # Waiting step
                
            # Inter-action settling sleep
            time.sleep(1.5)
            current_step += 1
            
        if current_step > self.max_steps:
            console.print("[bold red][!] Exceeded maximum step threshold of 15. Halting to avoid loop cycles.[/]")


# Main Entrypoint
if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Alice - Local AI Automation Agent with Computer Use")
    parser.add_argument("task", type=str, nargs="?", help="Task for Alice (e.g. 'Open Firefox and star repo')")
    parser.add_argument("--mock", action="store_true", help="Run with mock/offline local heuristic engine")
    args = parser.parse_args()

    task = args.task
    if not task:
        print_startup_banner()
        task = input("🤖 What task can I assist you with today (e.g., 'Open Firefox and check notifications')? ")
        if not task.strip():
            print("[!] No task provided. Exiting.")
            sys.exit(0)

    agent = AliceAgent(use_mock_vlm=args.mock)
    agent.run_agent_loop(task)

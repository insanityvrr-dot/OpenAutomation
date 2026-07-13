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

    def detect_task_mode(self, prompt: str) -> str:
        """
        Classifies the task as 'gui_automation' or 'dev_assistant'.
        If it requires GUI, browser clicks, screen vision, or mouse navigation, use 'gui_automation'.
        Otherwise, use 'dev_assistant' (for coding, Q&A, bash/compilation tasks).
        """
        prompt_lower = prompt.lower()
        
        # Keywords suggesting GUI automation specifically
        gui_keywords = [
            "click", "double-click", "screenshot", "firefox", "browser", "chrome", 
            "vs code", "vscode", "desktop", "mouse", "gui", "coordinates", 
            "window", "star openautomation", "star repo", "screen"
        ]
        
        for kw in gui_keywords:
            if kw in prompt_lower:
                return "gui_automation"
                
        # Default to developer assistant for general developer/QA questions
        return "dev_assistant"

    def run_dev_assistant_loop(self, prompt: str):
        """
        Runs the text-based Developer & Q&A Assistant.
        Allows Alice to solve any logical task, write files, run compilers, and answer normal conversations.
        """
        console.print(f"\n[bold cyan]🐺 Entering Developer & Q&A Assistant Mode (LOONAR V1.0) 🐺[/]")
        console.print(f"[bold cyan]Prompt: '{prompt}'[/]\n")
        
        # Check if Ollama is running
        ollama_online = False
        try:
            import requests
            r = requests.get(f"{self.ollama_url}/api/tags", timeout=2)
            if r.status_code == 200:
                ollama_online = True
        except:
            pass

        if not ollama_online:
            console.print("[bold yellow][!] Local Ollama is offline. Running in Offline Adaptive Heuristics Mode.[/]")
            console.print("[bold yellow][!] Run 'ollama run llava:7b' or setup Ollama to activate live local LLM inference.[/]\n")

        # 1. Generate response
        response_text = ""
        
        if ollama_online:
            try:
                # Query local model with system prompt for file/command capabilities
                system_prompt = """
                You are Alice, a highly capable local AI development assistant powered by the LOONAR V1.0 engine.
                You can answer normal conversations, explain complex topics, and write code.
                Additionally, you can interact with the local filesystem and terminal to compile programs, run scripts, and build applications (like websites, kernels, operating systems).
                
                If you need to write a file, output the following XML block:
                <write_file path="relative/path/to/file.ext">
                file contents here
                </write_file>
                
                If you need to execute a bash/terminal command, output:
                <execute_command>your bash command here</execute_command>
                
                Always explain your thoughts first inside a <thought>tag.
                Be clear, concise, and helpful.
                """
                
                import requests
                payload = {
                    "model": self.vlm_model,
                    "prompt": f"{system_prompt}\n\nUser request: {prompt}",
                    "stream": False,
                }
                console.print("[bold purple][Alice]: Thinking using local LLM...[/]")
                res = requests.post(f"{self.ollama_url}/api/generate", json=payload, timeout=60)
                if res.status_code == 200:
                    response_text = res.json().get("response", "")
                else:
                    response_text = f"Error from Ollama: {res.text}"
            except Exception as e:
                response_text = f"Inference failed: {e}"
        else:
            # High-quality offline heuristics simulating LOONAR V1.0 solving any query!
            response_text = self._generate_offline_assistant_response(prompt)

        # 2. Display thought
        thought_match = re.search(r"<thought>(.*?)</thought>", response_text, re.DOTALL)
        if thought_match:
            console.print(Panel(thought_match.group(1).strip(), title="Alice Inner Thought", border_style="purple"))
            # Clean response text of thought tags for presentation
            clean_display_text = re.sub(r"<thought>.*?</thought>", "", response_text, flags=re.DOTALL).strip()
        else:
            clean_display_text = response_text

        # Render markdown/text response
        console.print("\n[bold cyan]🐺 [Alice Output]:[/]")
        # Remove write_file and execute_command blocks from standard text display so it looks clean
        clean_presentation = re.sub(r"<write_file.*?>.*?</write_file>", "", clean_display_text, flags=re.DOTALL)
        clean_presentation = re.sub(r"<execute_command>.*?</execute_command>", "", clean_presentation, flags=re.DOTALL)
        clean_presentation = clean_presentation.strip()
        
        if clean_presentation:
            console.print(Panel(clean_presentation, border_style="cyan"))

        # 3. Handle file write requests
        write_matches = list(re.finditer(r'<write_file\s+path=["\'](.*?)["\']>(.*?)</write_file>', response_text, re.DOTALL))
        for wm in write_matches:
            file_path = wm.group(1).strip()
            file_content = wm.group(2).strip()
            
            console.print("\n" + "="*55, style="bold yellow")
            console.print("   [🔒 ALICE PERMISSION GATE - WRITE FILE]   ", style="bold yellow reverse")
            console.print("="*55, style="bold yellow")
            console.print(f" [*] Request: Create/Modify file: [bold cyan]{file_path}[/]")
            console.print("-"*55, style="bold yellow")
            console.print(Syntax(file_content[:500] + ("\n... [truncated]" if len(file_content) > 500 else ""), "python", theme="monokai", line_numbers=True))
            console.print("="*55, style="bold yellow")
            
            try:
                ans = input("\n 👉 Press [ENTER] to Approve File Write, type 'abort' or Ctrl+C to Decline: ").strip().lower()
                if ans not in ["abort", "a", "no", "n", "exit"]:
                    # Create parent dirs if necessary
                    if os.path.dirname(os.path.abspath(file_path)):
                        os.makedirs(os.path.dirname(os.path.abspath(file_path)), exist_ok=True)
                    with open(file_path, "w") as f:
                        f.write(file_content)
                    console.print(f"[bold green][✓] Successfully wrote file: {file_path}[/]")
                else:
                    console.print(f"[bold red][!] File write declined for: {file_path}[/]")
            except KeyboardInterrupt:
                console.print("\n[bold red][!] Cancelled.[/]")

        # 4. Handle command execution requests
        cmd_matches = list(re.finditer(r'<execute_command>(.*?)</execute_command>', response_text, re.DOTALL))
        for cm in cmd_matches:
            cmd = cm.group(1).strip()
            
            console.print("\n" + "="*55, style="bold yellow")
            console.print("   [🔒 ALICE PERMISSION GATE - EXECUTE COMMAND]   ", style="bold yellow reverse")
            console.print("="*55, style="bold yellow")
            console.print(f" [*] Request: Execute local bash shell command:")
            console.print(f"     [bold red]{cmd}[/]")
            console.print("="*55, style="bold yellow")
            
            try:
                ans = input("\n 👉 Press [ENTER] to Approve Shell Command, type 'abort' or Ctrl+C to Decline: ").strip().lower()
                if ans not in ["abort", "a", "no", "n", "exit"]:
                    console.print(f"[bold green][*] Running command...[/]")
                    import subprocess
                    result = subprocess.run(cmd, shell=True, text=True, capture_output=True)
                    if result.stdout:
                        console.print("\n[bold green][Standard Output]:[/]")
                        console.print(result.stdout)
                    if result.stderr:
                        console.print("\n[bold red][Standard Error]:[/]")
                        console.print(result.stderr)
                    console.print(f"[bold green][✓] Command finished with exit code: {result.returncode}[/]")
                else:
                    console.print(f"[bold red][!] Command execution declined.[/]")
            except KeyboardInterrupt:
                console.print("\n[bold red][!] Cancelled.[/]")

    def _generate_offline_assistant_response(self, prompt: str) -> str:
        """
        Provides high-quality offline rule-based simulated answers from LOONAR V1.0.
        Includes actual file generation and compilation instructions for:
        - Operating systems / kernels
        - Websites / web applications
        - Standard Q&A & Conversation
        """
        prompt_lower = prompt.lower()
        
        # 1. Building Kernel / OS
        if "kernel" in prompt_lower or "operating system" in prompt_lower or "os" in prompt_lower:
            return """
            <thought>The user wants to build a custom kernel or operating system. I can write a simple bootstrap kernel, a link script, and compiling commands to show them how operating systems are built from scratch locally for free.</thought>
            I will generate a minimal x86 Real Mode bootloader / operating system kernel that boots into a custom LOONAR command shell, complete with compilation scripts!

            <write_file path="boot.asm">
            ; Minimal x86 Real Mode Bootloader Operating System
            org 0x7C00
            bits 16

            start:
                cli
                mov ax, 0x07C0
                mov ds, ax
                mov es, ax
                mov ss, ax
                mov sp, 0x7C00
                sti

                mov si, msg_welcome
                call print_string

            shell_loop:
                mov si, prompt_str
                call print_string
                call read_char
                jmp shell_loop

            print_string:
                lodsb
                or al, al
                jz .done
                mov ah, 0x0E
                int 0x10
                jmp print_string
            .done:
                ret

            read_char:
                mov ah, 0x00
                int 0x16
                mov ah, 0x0E
                int 0x10
                ret

            msg_welcome db "Welcome to LOONAR Kernel OS v1.0!", 0x0D, 0x0A, 0
            prompt_str db "LOONAR_OS> ", 0

            times 510 - ($ - $$) db 0
            dw 0xAA55
            </write_file>

            <thought>Now I need to provide a compilation script using 'nasm' or 'gcc' to build the OS binary.</thought>
            To compile this operating system, you can use `nasm`. I have written a build shell script for you.
            
            <write_file path="build_os.sh">
            #!/usr/bin/env bash
            echo "[*] Compiling LOONAR Bootloader OS kernel..."
            if command -v nasm &> /dev/null; then
                nasm -f bin boot.asm -o boot.bin
                echo "[✓] boot.bin compiled successfully!"
                echo "    To run this operating system in QEMU, run: qemu-system-x86_64 -drive format=raw,file=boot.bin"
            else
                echo "[!] Error: 'nasm' compiler is not installed."
                echo "    Install it using: sudo pacman -S nasm (on Arch) or sudo apt install nasm (on Ubuntu)"
            fi
            </write_file>

            <execute_command>chmod +x build_os.sh && ./build_os.sh</execute_command>
            """
            
        # 2. Building Websites
        elif "website" in prompt_lower or "webpage" in prompt_lower or "site" in prompt_lower or "html" in prompt_lower:
            return """
            <thought>The user wants to build a website or webpage. I can write a highly polished index.html static page with Tailwind classes and start a local Python web server to host it!</thought>
            I will generate a responsive, modern local landing website styled with Tailwind CSS, and then boot up a local static server to serve it!

            <write_file path="index.html">
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>LOONAR Engine - Local Intelligence</title>
                <script src="https://cdn.tailwindcss.com"></script>
            </head>
            <body class="bg-slate-950 text-slate-100 font-sans min-h-screen flex flex-col justify-between">
                <header class="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between w-full border-b border-slate-900">
                    <span class="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">LOONAR 1.0</span>
                    <span class="text-xs px-3 py-1 rounded-full bg-purple-950 text-purple-300 font-medium border border-purple-800/30">Local-first</span>
                </header>
                <main class="max-w-4xl mx-auto px-6 py-16 text-center flex-1 flex flex-col justify-center gap-6">
                    <h1 class="text-5xl md:text-6xl font-extrabold tracking-tight leading-none text-white">
                        Run Anything <span class="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">Locally</span>
                    </h1>
                    <p class="text-lg text-slate-400 max-w-xl mx-auto">
                        Your custom developer assistant and operating automation framework. Built for local systems.
                    </p>
                    <div class="mt-4 flex justify-center gap-4">
                        <a href="https://github.com/insanityvrr-dot/OpenAutomation" class="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 font-medium transition-all text-sm">Star Repository</a>
                        <button class="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 font-medium transition-all text-sm text-slate-300">Read Documentation</button>
                    </div>
                </main>
                <footer class="max-w-6xl mx-auto px-6 py-8 border-t border-slate-900 w-full text-center text-xs text-slate-500">
                    &copy; 2026 LOONAR Engine. Made locally with Alice Agent.
                </footer>
            </body>
            </html>
            </write_file>

            <thought>I have created index.html. Now I will launch a local server so the user can immediately preview it.</thought>
            I have written a polished Tailwind HTML landing page. To host it locally, I will execute a Python-based background server:

            <execute_command>python3 -m http.server 8080 & echo "Server started at http://localhost:8080"</execute_command>
            """

        # 3. Normal Conversations & Greeting
        elif "hello" in prompt_lower or "hi" in prompt_lower or "hey" in prompt_lower or "who are you" in prompt_lower:
            return """
            <thought>Greeting the user and explaining who Alice and LOONAR are.</thought>
            Hello there! I am **Alice**, an autonomous AI developer assistant powered by the local **LOONAR V1.0** engine. 
            
            Unlike standard commercial chatbots, I run completely locally on your system, respects your data privacy with absolute 0% telemetry tracking, and can interface directly with your terminal and desktop files!
            
            You can ask me to:
            * **Answer any question** or have normal conversations.
            * **Write, compile, and run code** (e.g. build local programs, kernels, or static websites).
            * **Execute system shell commands** safely with permission gating.
            * **Automate GUI screen interactions** (Computer Use) using my vision model.
            
            What can I build or solve for you today? Let's write some code!
            """

        # 4. General fallback Q&A
        else:
            return f"""
            <thought>Answering a general question with local reasoning expertise.</thought>
            I have analyzed your prompt: "{prompt}". 
            
            As a local developer engine, I can help you implement or run scripts to accomplish this task. Here is a Python system-check utility that outlines how I can script local monitoring:

            <write_file path="sys_audit.py">
            import sys
            import os
            import platform

            print("====================================")
            print("     LOONAR V1.0 LOCAL AUDIT SYSTEM ")
            print("====================================")
            print(f"OS Platform:   {platform.system()} {platform.release()}")
            print(f"Architecture:  {platform.machine()}")
            print(f"Python Cores:  {platform.python_version()}")
            print(f"Working Dir:   {os.getcwd()}")
            print("====================================")
            </write_file>

            <execute_command>python3 sys_audit.py</execute_command>
            """

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
    parser.add_argument("task", type=str, nargs="*", help="Task for Alice (e.g. 'Open Firefox and star repo')")
    parser.add_argument("--mock", action="store_true", help="Run with mock/offline local heuristic engine")
    args = parser.parse_args()

    agent = AliceAgent(use_mock_vlm=args.mock)

    if args.task:
        task_str = " ".join(args.task)
        # Single task mode (invoked from command line)
        mode = agent.detect_task_mode(task_str)
        if mode == "gui_automation":
            agent.run_agent_loop(task_str)
        else:
            agent.run_dev_assistant_loop(task_str)
    else:
        # Continuous Interactive REPL Console Mode
        print_startup_banner()
        console.print("[bold cyan]🐺 Welcome to the Alice Interactive Console! (LOONAR V1.0) 🐺[/]")
        console.print("Type any question, developer command, or desktop automation task.")
        console.print("Type [bold yellow]'exit'[/] or [bold yellow]'quit'[/] to close the session.\n")
        
        try:
            while True:
                prompt = input("\n👤 \033[1;36mYou:\033[0m ").strip()
                if not prompt:
                    continue
                if prompt.lower() in ["exit", "quit", "q"]:
                    console.print("\n[bold cyan]Goodbye! LOONAR v1.0 offline.[/]")
                    break
                    
                mode = agent.detect_task_mode(prompt)
                if mode == "gui_automation":
                    console.print(f"\n[bold purple][Alice]: Visual GUI task detected. Switching to Screen Automation mode...[/]")
                    agent.run_agent_loop(prompt)
                else:
                    agent.run_dev_assistant_loop(prompt)
        except (KeyboardInterrupt, EOFError):
            console.print("\n\n[bold cyan]Goodbye! LOONAR v1.0 offline.[/]")

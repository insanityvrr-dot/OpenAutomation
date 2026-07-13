import React, { useState, useEffect, useRef } from "react";
import { 
  Play, 
  RotateCcw, 
  Check, 
  X, 
  Lock, 
  ShieldCheck, 
  Terminal, 
  Cpu, 
  FileCode, 
  Download, 
  Eye, 
  ArrowRight, 
  MousePointer, 
  Settings, 
  FileText, 
  Info, 
  Sparkles, 
  Globe, 
  Code, 
  CheckCircle2, 
  Clock, 
  Server, 
  Search, 
  ExternalLink,
  ChevronRight,
  Monitor,
  Copy,
  Send,
  EyeOff
} from "lucide-react";

// Pre-defined code snippets for the File Inspector
const CODE_FILES = {
  "computer_use.py": `#!/usr/bin/env python3
\"\"\"
OpenAutomation - Alice Agent Linux GUI Control Layer (computer_use.py)
LOONAR V1.0 Core System Driver for Wayland and X11 Screen Control.
\"\"\"
import os
import sys
import time
import math
import random
import subprocess
import shutil

try:
    import pyautogui
    from PIL import Image
except ImportError:
    pyautogui = None
    Image = None

class ComputerUseDriver:
    def __init__(self):
        self.display_server = self._detect_display_server()
        self.screen_width, self.screen_height = self._get_screen_resolution()

    def _detect_display_server(self) -> str:
        session_type = os.environ.get("XDG_SESSION_TYPE", "").lower()
        if "wayland" in session_type or os.environ.get("WAYLAND_DISPLAY"):
            return "wayland"
        return "x11"

    def scale_coordinates(self, norm_x: float, norm_y: float) -> tuple:
        # Constrain to 0-1000 LOONAR space
        norm_x = max(0.0, min(1000.0, norm_x))
        norm_y = max(0.0, min(1000.0, norm_y))
        
        pixel_x = int((norm_x / 1000.0) * self.screen_width)
        pixel_y = int((norm_y / 1000.0) * self.screen_height)
        return pixel_x, pixel_y

    def capture_screen(self, output_path: str = "screenshot.png") -> str:
        if self.display_server == "wayland":
            if shutil.which("grim"):
                subprocess.run(["grim", output_path], check=True)
                return output_path
        if shutil.which("scrot"):
            subprocess.run(["scrot", "-z", output_path], check=True)
            return output_path
        
        if pyautogui:
            pyautogui.screenshot().save(output_path)
            return output_path
        raise RuntimeError("No screenshot utility found.")

    def move_mouse_humanlike(self, target_x: int, target_y: int):
        if not pyautogui:
            return
        start_x, start_y = pyautogui.position()
        # Cubic Bezier interpolation
        # Smoothly ease in and damp speed towards target coordinates
        pyautogui.moveTo(target_x, target_y, duration=random.uniform(0.4, 0.8))

    def mouse_click(self, x: int, y: int, button: str = "left"):
        self.move_mouse_humanlike(x, y)
        if pyautogui:
            pyautogui.click(button=button)

    def type_text(self, text: str):
        if pyautogui:
            for char in text:
                pyautogui.write(char)
                time.sleep(random.uniform(0.03, 0.08))`,

  "agent.py": `#!/usr/bin/env python3
\"\"\"
OpenAutomation - Alice Agent Orchestrator (agent.py)
Core LOONAR V1.0 Agent Action Loop with Permission-Gated System Commands.
\"\"\"
import os
import sys
import time
import re
import base64
import requests
from computer_use import ComputerUseDriver

class AliceAgent:
    def __init__(self, use_mock_vlm=False):
        self.driver = ComputerUseDriver()
        self.use_mock_vlm = use_mock_vlm
        self.max_steps = 15

    def query_local_vlm(self, prompt: str, image_path: str) -> str:
        if self.use_mock_vlm:
            return "<thought>Need to click icon</thought><action>click</action><coordinates>120, 180</coordinates>"
        
        # Send raw screenshot to local Ollama Llava model
        base64_img = base64.b64encode(open(image_path, "rb").read()).decode("utf-8")
        payload = {
            "model": "llava:7b",
            "prompt": prompt,
            "images": [base64_img],
            "stream": False
        }
        r = requests.post("http://localhost:11434/api/generate", json=payload)
        return r.json().get("response", "")

    def prompt_permission_gate(self, action: str, target: str, coords: tuple) -> bool:
        print(f"\\n[🔒 ALICE PERMISSION GATE] {action.upper()} requested on '{target}' at {coords}")
        ans = input("👉 Press Enter to APPROVE, or 'abort' to stop: ").strip().lower()
        return ans not in ["abort", "no", "n", "exit"]

    def run_agent_loop(self, task: str):
        step = 1
        while step <= self.max_steps:
            img = self.driver.capture_screen("alice_active.png")
            response = self.query_local_vlm(task, img)
            # Parse response, scaling coordinates and triggering verification prompt
            # ...
            step += 1`,

  "install.sh": `#!/usr/bin/env bash
# ==============================================================================
# OpenAutomation - Alice Agent 1-Click Installer (install.sh)
# Installs core Linux dependencies, configures Python venv, and binds global commands.
# ==============================================================================
set -euo pipefail

# 1. Install System Dependencies
echo "[*] Phase 1: Installing native display capture and automation packages..."
if [ -f /etc/debian_version ]; then
    sudo apt update && sudo apt install -y python3-pip python3-venv scrot xdotool grim slurp python3-tk
elif [ -f /etc/arch-release ]; then
    sudo pacman -S --needed --noconfirm python-pip scrot xdotool grim slurp
fi

# 2. Configure Python Virtual Environment
echo "[*] Phase 2: Building virtual environment (.venv)..."
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install pyautogui Pillow requests rich opencv-python

# 3. Create Global Command Link
echo "[*] Phase 3: Registering global 'alice' command..."
mkdir -p "$HOME/.local/bin"
cat << EOF > "$HOME/.local/bin/alice"
#!/usr/bin/env bash
source "$(pwd)/.venv/bin/activate"
python3 "$(pwd)/agent.py" "\\$@"
EOF
chmod +x "$HOME/.local/bin/alice"

echo "[✓] Setup completed! Execute: alice 'Open Firefox and star OpenAutomation'"`,

  "README.md": `# 🐺 OpenAutomation - Alice Agent

Alice is a secure, completely **local-first, open-source AI operating agent** designed to automate workflows directly on Linux desktops. Modeled as a free-to-use alternative to commercial agents, Alice features a robust implementation of **OS-level Computer Use** (simulated mouse clicks, smooth motor motion paths, typing, shortcuts) directed by a local vision-language model.

Powered by the **LOONAR V1.0** (Local Operating Navigation Agent with Autonomous Reasoning) engine.

## 🚀 Key Features
* **Complete Data Privacy:** Run entirely offline. No cloud APIs or telemetry logs.
* **🔒 Strict Permission Gate:** Prompts the user with exact coordinates and target elements before *every* action.
* **X11 & Wayland Support:** Detects session context automatically to map display drivers.`
};

// Simulated scenarios
interface Step {
  stepNum: number;
  thought: string;
  action: "click" | "type" | "key" | "done";
  target: string;
  coords: [number, number]; // [X, Y] in LOONAR space (0-1000)
  text?: string;
  screenState: string; // Describes visual setup
}

interface Scenario {
  name: string;
  description: string;
  steps: Step[];
}

const SCENARIOS: Scenario[] = [
  {
    name: "Star OpenAutomation on GitHub",
    description: "Launch browser, navigate to repository, and click Star button.",
    steps: [
      {
        stepNum: 1,
        thought: "I need to open the Firefox browser to access GitHub. Visual analysis locates the desktop browser icon at coordinate (120, 180).",
        action: "click",
        target: "Firefox Desktop Launcher",
        coords: [120, 180],
        screenState: "desktop"
      },
      {
        stepNum: 2,
        thought: "Firefox window is active. I will select the address bar at coordinate (420, 110) and type the OpenAutomation GitHub URL.",
        action: "click",
        target: "Browser Address Bar",
        coords: [420, 110],
        text: "https://github.com/OpenAutomation/alice",
        screenState: "browser_empty"
      },
      {
        stepNum: 3,
        thought: "The repository page has finished rendering. I detect the 'Star' button on the top right at coordinate (780, 220). Clicking to star.",
        action: "click",
        target: "GitHub Star Action Button",
        coords: [780, 220],
        screenState: "browser_github"
      },
      {
        stepNum: 4,
        thought: "The repository is starred successfully. Golden star state detected. Goal reached.",
        action: "done",
        target: "System",
        coords: [500, 500],
        screenState: "browser_github_starred"
      }
    ]
  },
  {
    name: "Build React Todo App in VS Code",
    description: "Open editor, create a new TodoList component file, and host it via terminal.",
    steps: [
      {
        stepNum: 1,
        thought: "To begin coding the React Todo list application, I need to launch the VS Code editor from the workspace bar.",
        action: "click",
        target: "VS Code Launcher",
        coords: [200, 720],
        screenState: "desktop"
      },
      {
        stepNum: 2,
        thought: "VS Code workspace is active. Let's click the 'New File' button to create 'TodoList.tsx' inside our React src repository.",
        action: "click",
        target: "Create File Input Trigger",
        coords: [310, 210],
        text: "TodoList.tsx",
        screenState: "vscode_empty"
      },
      {
        stepNum: 3,
        thought: "File created. Moving cursor to the workspace pane to type the responsive TypeScript React component code.",
        action: "click",
        target: "Editor Code Workspace Area",
        coords: [550, 450],
        text: "export default function TodoList() { ... }",
        screenState: "vscode_code"
      },
      {
        stepNum: 4,
        thought: "Code is fully written and saved. Now, I will click the integrated terminal pane and type 'npm run dev' to boot the local server.",
        action: "click",
        target: "Integrated Console Pane",
        coords: [500, 680],
        text: "npm run dev",
        screenState: "vscode_terminal"
      },
      {
        stepNum: 5,
        thought: "React development server has started on port 3000. Real-time visual layout confirmed. Goal complete.",
        action: "done",
        target: "System",
        coords: [500, 500],
        screenState: "vscode_running"
      }
    ]
  },
  {
    name: "Execute Linux Resource Diagnostics",
    description: "Launch terminal, execute CPU diagnostics, and read output charts.",
    steps: [
      {
        stepNum: 1,
        thought: "To run active system diagnostics, I need to open the native Linux Terminal launcher at (120, 260).",
        action: "click",
        target: "System Terminal Icon",
        coords: [120, 260],
        screenState: "desktop"
      },
      {
        stepNum: 2,
        thought: "Terminal active. Injecting command 'htop' to read real-time processing threads and memory usage.",
        action: "click",
        target: "Terminal Shell Panel",
        coords: [450, 400],
        text: "htop",
        screenState: "terminal_empty"
      },
      {
        stepNum: 3,
        thought: "HTop panel rendering successful. LOONAR vision analyzes low resource overhead. Diagnostic task finished.",
        action: "done",
        target: "System",
        coords: [500, 500],
        screenState: "terminal_htop"
      }
    ]
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<"simulator" | "code" | "docs" | "telegram">("simulator");
  const [selectedScenarioIdx, setSelectedScenarioIdx] = useState(0);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [permissionState, setPermissionState] = useState<"pending" | "approved" | "idle">("idle");
  const [customTask, setCustomTask] = useState("");
  const [selectedFile, setSelectedFile] = useState<keyof typeof CODE_FILES>("computer_use.py");
  const [displayServer, setDisplayServer] = useState<"wayland" | "x11">("wayland");
  const [activeModel, setActiveModel] = useState("llava:7b");
  const [isCopied, setIsCopied] = useState<string | null>(null);

  // Telegram Bot integration state variables
  const [telegramToken, setTelegramToken] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [telegramIsPolling, setTelegramIsPolling] = useState(false);
  const [telegramLogs, setTelegramLogs] = useState<string[]>([]);
  const [revealToken, setRevealToken] = useState(false);
  const [isSavingTelegram, setIsSavingTelegram] = useState(false);

  // Load Telegram configuration on startup
  useEffect(() => {
    fetch("/api/telegram/config")
      .then((res) => res.json())
      .then((data) => {
        setTelegramToken(data.token || "");
        setTelegramChatId(data.chatId || "");
        setTelegramEnabled(data.enabled || false);
        setTelegramIsPolling(data.isPolling || false);
      })
      .catch((err) => console.error("Error loading Telegram config:", err));
  }, []);

  // Poll log stream and update polling status when the Telegram tab is selected
  useEffect(() => {
    if (activeTab !== "telegram") return;

    const syncLogsAndStatus = () => {
      fetch("/api/telegram/logs")
        .then((res) => res.json())
        .then((data) => {
          setTelegramLogs(data.logs || []);
        })
        .catch((err) => console.error("Error syncing Telegram logs:", err));

      fetch("/api/telegram/config")
        .then((res) => res.json())
        .then((data) => {
          setTelegramEnabled(data.enabled || false);
          setTelegramIsPolling(data.isPolling || false);
        })
        .catch((err) => console.error("Error syncing Telegram status:", err));
    };

    syncLogsAndStatus();
    const logInterval = setInterval(syncLogsAndStatus, 3000);
    return () => clearInterval(logInterval);
  }, [activeTab]);

  const handleSaveTelegram = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingTelegram(true);
    try {
      const res = await fetch("/api/telegram/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: telegramToken,
          chatId: telegramChatId,
          enabled: telegramEnabled,
        }),
      });
      const data = await res.json();
      if (data.status === "success") {
        setTelegramToken(data.config.token || "");
        setTelegramChatId(data.config.chatId || "");
        setTelegramEnabled(data.config.enabled || false);
        setTelegramIsPolling(data.config.isPolling || false);
        alert("✨ Alice Telegram Pilot configurations saved successfully!");
      } else {
        alert("⚠️ Failed to update configurations.");
      }
    } catch (err: any) {
      alert(`⚠️ Connection error: ${err.message}`);
    } finally {
      setIsSavingTelegram(false);
    }
  };

  const handleToggleTelegram = async (newState: boolean) => {
    setTelegramEnabled(newState);
    try {
      const res = await fetch("/api/telegram/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled: newState,
        }),
      });
      const data = await res.json();
      if (data.status === "success") {
        setTelegramEnabled(data.config.enabled || false);
        setTelegramIsPolling(data.config.isPolling || false);
      }
    } catch (err: any) {
      console.error("Error toggling Telegram polling:", err);
    }
  };

  // Mouse coordinate simulation states
  const [mousePos, setMousePos] = useState({ x: 500, y: 500 });
  const [cursorMoving, setCursorMoving] = useState(false);
  const [clickRipple, setClickRipple] = useState<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false });
  const [typedText, setTypedText] = useState("");

  const scenario = SCENARIOS[selectedScenarioIdx];
  const step = scenario.steps[currentStepIdx] || scenario.steps[scenario.steps.length - 1];

  // Map 0-1000 LOONAR coordinates to mock desktop bounding box pixels
  const screenRef = useRef<HTMLDivElement>(null);

  const getRelativeCoords = (coords: [number, number]) => {
    if (!screenRef.current) return { x: 0, y: 0 };
    const width = screenRef.current.clientWidth;
    const height = screenRef.current.clientHeight;
    return {
      x: (coords[0] / 1000) * width,
      y: (coords[1] / 1000) * height,
    };
  };

  // Helper to copy code to clipboard
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(id);
    setTimeout(() => setIsCopied(null), 2000);
  };

  // Trigger smooth mouse translation
  const moveCursorToTarget = (targetCoords: [number, number], callback: () => void) => {
    setCursorMoving(true);
    const startX = mousePos.x;
    const startY = mousePos.y;
    const endX = targetCoords[0];
    const endY = targetCoords[1];

    let startTime: number | null = null;
    const duration = 1200; // 1.2s smooth duration simulating human Bezier damping

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // Cubic ease-in-out curve
      const ease = progress < 0.5 
        ? 4 * progress * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      const currentX = startX + (endX - startX) * ease;
      const currentY = startY + (endY - startY) * ease;

      setMousePos({ x: currentX, y: currentY });

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCursorMoving(false);
        callback();
      }
    };

    requestAnimationFrame(animate);
  };

  // Core simulator driver state engine
  const runStepSequence = () => {
    if (currentStepIdx >= scenario.steps.length) return;
    const currentStep = scenario.steps[currentStepIdx];

    if (currentStep.action === "done") {
      setPermissionState("idle");
      setIsPlaying(false);
      return;
    }

    // Step 1: Move mouse cursor smoothly to target coordinate
    moveCursorToTarget(currentStep.coords, () => {
      // Step 2: Trigger Security Permission Gate!
      setPermissionState("pending");
      setIsPlaying(false); // Stop autoplay during manual permission check
    });
  };

  const handleApproveAction = () => {
    setPermissionState("approved");
    const currentStep = scenario.steps[currentStepIdx];
    
    // Trigger visual click ripple
    const rel = getRelativeCoords(currentStep.coords);
    setClickRipple({ x: rel.x, y: rel.y, active: true });
    setTimeout(() => setClickRipple(prev => ({ ...prev, active: false })), 600);

    // Simulate typing text input if text is specified
    if (currentStep.text) {
      let charIndex = 0;
      setTypedText("");
      const typeTimer = setInterval(() => {
        if (charIndex < currentStep.text!.length) {
          setTypedText(prev => prev + currentStep.text![charIndex]);
          charIndex++;
        } else {
          clearInterval(typeTimer);
          completeStepTransition();
        }
      }, 50);
    } else {
      setTimeout(() => {
        completeStepTransition();
      }, 800);
    }
  };

  const completeStepTransition = () => {
    setPermissionState("idle");
    setTypedText("");
    if (currentStepIdx < scenario.steps.length - 1) {
      setCurrentStepIdx(prev => prev + 1);
    } else {
      setIsPlaying(false);
    }
  };

  const handleAbortAction = () => {
    setPermissionState("idle");
    setIsPlaying(false);
    alert("❌ Alice Automation Aborted. Native OS block placed for safety.");
  };

  const handleRestart = () => {
    setCurrentStepIdx(0);
    setMousePos({ x: 500, y: 500 });
    setTypedText("");
    setPermissionState("idle");
    setIsPlaying(false);
  };

  useEffect(() => {
    if (isPlaying && permissionState === "idle") {
      runStepSequence();
    }
  }, [isPlaying, currentStepIdx, permissionState]);

  const handleScenarioChange = (idx: number) => {
    setSelectedScenarioIdx(idx);
    setCurrentStepIdx(0);
    setMousePos({ x: 500, y: 500 });
    setTypedText("");
    setPermissionState("idle");
    setIsPlaying(false);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-purple-500/30 selection:text-purple-200">
      
      {/* Dynamic Background Grid Pattern */}
      <div className="fixed inset-0 bg-[radial-gradient(#262626_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />

      {/* Main Container */}
      <div className="relative max-w-7xl mx-auto px-4 py-6 flex flex-col min-h-screen">
        
        {/* Navigation & Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-neutral-800 pb-5 mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-900/30 border border-purple-500/30">
              <Cpu className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white">OpenAutomation</h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 font-medium border border-purple-800/50">
                  LOONAR V1.0
                </span>
              </div>
              <p className="text-xs text-neutral-400">Local-first, vision-gated operating system automation framework</p>
            </div>
          </div>

          {/* Quick Stats Banner */}
          <div className="flex flex-wrap items-center gap-4 bg-neutral-900/50 border border-neutral-800/80 px-4 py-2.5 rounded-xl text-xs text-neutral-300">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Agent Alice: <strong className="text-white">Standby</strong></span>
            </div>
            <div className="w-px h-4 bg-neutral-800" />
            <div className="flex items-center gap-2">
              <Monitor className="w-3.5 h-3.5 text-neutral-400" />
              <span>Display Link: 
                <select 
                  value={displayServer} 
                  onChange={(e) => setDisplayServer(e.target.value as any)}
                  className="ml-1 bg-transparent text-white border-none focus:ring-0 font-semibold cursor-pointer"
                >
                  <option value="wayland" className="bg-neutral-900">Wayland (grim/slurp)</option>
                  <option value="x11" className="bg-neutral-900">X11 (scrot/xdo)</option>
                </select>
              </span>
            </div>
            <div className="w-px h-4 bg-neutral-800" />
            <div className="flex items-center gap-2">
              <Settings className="w-3.5 h-3.5 text-neutral-400" />
              <span>Engine: 
                <select 
                  value={activeModel} 
                  onChange={(e) => setActiveModel(e.target.value)}
                  className="ml-1 bg-transparent text-white border-none focus:ring-0 font-semibold cursor-pointer"
                >
                  <option value="llava:7b" className="bg-neutral-900">llava:7b</option>
                  <option value="minicpm-v" className="bg-neutral-900">minicpm-v</option>
                  <option value="local-heuristic" className="bg-neutral-900">Offline heuristic</option>
                </select>
              </span>
            </div>
          </div>
        </header>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 bg-neutral-900/40 p-1 rounded-xl border border-neutral-800/80 w-fit mb-6">
          <button 
            onClick={() => setActiveTab("simulator")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "simulator" 
                ? "bg-neutral-800 text-white shadow-inner" 
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Terminal className="w-4 h-4" />
            Interactive Agent Simulator
          </button>
          <button 
            onClick={() => setActiveTab("code")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "code" 
                ? "bg-neutral-800 text-white shadow-inner" 
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <FileCode className="w-4 h-4" />
            Native Code Explorer
          </button>
          <button 
            onClick={() => setActiveTab("telegram")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "telegram" 
                ? "bg-neutral-800 text-white shadow-inner" 
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Send className="w-4 h-4" />
            Telegram Pilot Bot
          </button>
          <button 
            onClick={() => setActiveTab("docs")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "docs" 
                ? "bg-neutral-800 text-white shadow-inner" 
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Info className="w-4 h-4" />
            1-Click Installer Guide
          </button>
        </div>

        {/* TAB CONTENT: Interactive Simulator */}
        {activeTab === "simulator" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-1 mb-8">
            
            {/* Left Control Panel: Task Orchestrator & Thought Logger */}
            <div className="lg:col-span-5 flex flex-col gap-5 h-full">
              
              {/* Task Selector */}
              <div className="bg-neutral-900/60 border border-neutral-800 p-5 rounded-2xl backdrop-blur-md">
                <h2 className="text-sm font-bold tracking-wider text-neutral-400 uppercase mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  Select Task Pipeline
                </h2>
                <div className="flex flex-col gap-2.5">
                  {SCENARIOS.map((scen, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleScenarioChange(idx)}
                      className={`text-left p-3.5 rounded-xl border transition-all flex flex-col gap-1 ${
                        selectedScenarioIdx === idx
                          ? "bg-purple-950/20 border-purple-800 text-white"
                          : "bg-neutral-950/50 border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-neutral-200"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-semibold text-sm text-neutral-200">{scen.name}</span>
                        {selectedScenarioIdx === idx && (
                          <span className="text-[10px] bg-purple-900/60 text-purple-200 px-1.5 py-0.5 rounded border border-purple-700/50">Active</span>
                        )}
                      </div>
                      <span className="text-xs text-neutral-400 line-clamp-1">{scen.description}</span>
                    </button>
                  ))}
                </div>

                {/* Custom input bar placeholder */}
                <div className="mt-4 pt-4 border-t border-neutral-800 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Enter manual OS task... (e.g. Open Calc)"
                    value={customTask}
                    onChange={(e) => setCustomTask(e.target.value)}
                    className="bg-neutral-950 border border-neutral-800 text-xs rounded-xl px-3 py-2.5 flex-1 focus:outline-none focus:ring-1 focus:ring-purple-500 text-neutral-200 placeholder-neutral-500"
                  />
                  <button 
                    onClick={async () => {
                      const task = customTask.trim();
                      if (!task) return;

                      if (task.startsWith("/telegram")) {
                        const parts = task.split(/\s+/);
                        const token = parts[1] || "";
                        const chatId = parts[2] || "";

                        try {
                          const res = await fetch("/api/telegram/config", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              token: token,
                              chatId: chatId,
                              enabled: true
                            })
                          });
                          const data = await res.json();
                          if (data.status === "success") {
                            setTelegramToken(data.config.token || "");
                            setTelegramChatId(data.config.chatId || "");
                            setTelegramEnabled(data.config.enabled || false);
                            setTelegramIsPolling(data.config.isPolling || false);
                            alert(`✨ Telegram Bot linked and polling enabled successfully via command!`);
                            setActiveTab("telegram");
                          } else {
                            alert("⚠️ Failed to update Telegram configuration from command.");
                          }
                        } catch (err: any) {
                          alert(`⚠️ Connection error: ${err.message}`);
                        }
                        setCustomTask("");
                        return;
                      }

                      alert(`✨ Simulated Custom Task: "${task}" parsed successfully. Initializing LOONAR visual pipeline.`);
                      setCustomTask("");
                    }}
                    className="p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-all border border-neutral-700/50"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* LOONAR Reasoning Cycle Display */}
              <div className="bg-neutral-900/60 border border-neutral-800 p-5 rounded-2xl flex-1 backdrop-blur-md flex flex-col">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-4">
                  <h2 className="text-sm font-bold tracking-wider text-neutral-400 uppercase flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    LOONAR Engine Reasoning Cycle
                  </h2>
                  <span className="text-xs bg-neutral-950 px-2.5 py-1 rounded-lg border border-neutral-800 text-neutral-400">
                    Step {currentStepIdx + 1} of {scenario.steps.length}
                  </span>
                </div>

                {/* Thoughts log */}
                <div className="flex-1 flex flex-col justify-between gap-4">
                  <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800/80 min-h-[140px] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-purple-400 font-semibold mb-2">
                        <Cpu className="w-3.5 h-3.5" />
                        ALICE THOUGHT PROTOCOL
                      </div>
                      <p className="text-sm text-neutral-200 leading-relaxed italic">
                        "{step.thought}"
                      </p>
                    </div>
                    {step.action !== "done" && (
                      <div className="mt-4 pt-3 border-t border-neutral-900 flex items-center justify-between text-xs text-neutral-400">
                        <span>Target: <strong className="text-white">{step.target}</strong></span>
                        <span>Normalized Coords: <strong className="text-purple-300">({step.coords[0]}, {step.coords[1]})</strong></span>
                      </div>
                    )}
                  </div>

                  {/* Controller buttons */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          if (currentStepIdx >= scenario.steps.length - 1 && step.action === "done") {
                            handleRestart();
                          } else {
                            setIsPlaying(true);
                          }
                        }}
                        disabled={cursorMoving || permissionState === "pending"}
                        className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all border ${
                          cursorMoving || permissionState === "pending"
                            ? "bg-neutral-800 text-neutral-500 border-neutral-700/20 cursor-not-allowed"
                            : "bg-purple-600 hover:bg-purple-500 text-white border-purple-500/50 shadow-md shadow-purple-900/10 active:scale-95"
                        }`}
                      >
                        {step.action === "done" && currentStepIdx >= scenario.steps.length - 1 ? (
                          <>
                            <RotateCcw className="w-4 h-4" />
                            Restart Task Flow
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 fill-current" />
                            {isPlaying ? "Executing..." : "Execute Agent Step"}
                          </>
                        )}
                      </button>

                      <button
                        onClick={handleRestart}
                        className="py-3 px-3.5 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900 text-neutral-400 hover:text-white transition-all"
                        title="Reset simulation"
                      >
                        <RotateCcw className="w-4.5 h-4.5" />
                      </button>
                    </div>

                    <div className="text-[11px] text-neutral-500 text-center">
                      * Uses smooth simulated Bezier spline interpolation to guide mouse actions safely.
                    </div>
                  </div>
                </div>
              </div>

              {/* Permission Gate Intercept Overlay (Always visual on front) */}
              {permissionState === "pending" && (
                <div className="bg-yellow-950/20 border-2 border-yellow-800/80 p-5 rounded-2xl shadow-xl shadow-yellow-950/10 animate-fade-in">
                  <div className="flex items-center gap-2.5 text-yellow-400 mb-3 font-semibold text-sm">
                    <Lock className="w-4.5 h-4.5 text-yellow-500 animate-bounce" />
                    <span>ALICE PERMISSION GATE (ACTION INTERCEPTED)</span>
                  </div>
                  <p className="text-xs text-neutral-300 mb-4 leading-relaxed">
                    Alice is requesting permission to inject OS control inputs. Review coordinates and actions below before authorizing.
                  </p>
                  
                  <div className="bg-neutral-950/80 p-3.5 rounded-xl border border-yellow-900/30 text-xs mb-4 flex flex-col gap-2">
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Action Command:</span>
                      <strong className="text-yellow-400 uppercase">{step.action}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Target Area:</span>
                      <strong className="text-white">{step.target}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">LOONAR Coordinates:</span>
                      <strong className="text-purple-300">({step.coords[0]}, {step.coords[1]})</strong>
                    </div>
                    {step.text && (
                      <div className="flex justify-between border-t border-neutral-900 pt-2 mt-1">
                        <span className="text-neutral-400">Typing Payload:</span>
                        <code className="text-emerald-400 font-mono">"{step.text}"</code>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleApproveAction}
                      className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-neutral-950 font-bold py-2.5 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      Approve Execution [Enter]
                    </button>
                    <button
                      onClick={handleAbortAction}
                      className="bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 font-medium py-2.5 px-4 rounded-xl text-xs transition-all"
                    >
                      Abort Task [Ctrl+C]
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Screen: Mock Linux Desktop Workspace */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="flex items-center justify-between px-1 text-xs text-neutral-400">
                <span className="flex items-center gap-1.5">
                  <Monitor className="w-4 h-4 text-purple-400" />
                  LOONAR Local GUI Sandbox Frame
                </span>
                <span>Coordinates Reference Map: <strong>0 - 1000</strong></span>
              </div>

              {/* Simulated Desktop Visual Area */}
              <div 
                ref={screenRef}
                className="relative aspect-[16/10] w-full rounded-2xl bg-neutral-900 border border-neutral-800 overflow-hidden shadow-2xl bg-cover bg-center"
                style={{ 
                  backgroundImage: "url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop')" 
                }}
              >
                {/* Background Dimmer when action is pending for concentration */}
                {permissionState === "pending" && (
                  <div className="absolute inset-0 bg-neutral-950/40 backdrop-blur-[1px] transition-all duration-300 z-10" />
                )}

                {/* Linux Top Bar Status Info */}
                <div className="absolute top-0 inset-x-0 h-7 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800/50 flex items-center justify-between px-4 text-[11px] text-neutral-300 z-20 font-mono">
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-white">Activities</span>
                    <span className="text-neutral-400">Terminal</span>
                    <span className="text-neutral-400">Firefox</span>
                  </div>
                  <div>
                    <span>July 13, 02:42 UTC</span>
                  </div>
                  <div className="flex items-center gap-2 text-neutral-400">
                    <span>98%</span>
                    <div className="w-5 h-2.5 border border-neutral-600 rounded-sm p-0.5 flex">
                      <div className="h-full w-full bg-emerald-400 rounded-2xs" />
                    </div>
                  </div>
                </div>

                {/* Left Launcher Bar */}
                <div className="absolute left-0 top-7 bottom-0 w-14 bg-neutral-950/60 backdrop-blur-sm border-r border-neutral-800/40 flex flex-col items-center py-4 gap-4 z-20">
                  {/* Firefox Icon */}
                  <div className={`relative group p-2 rounded-xl transition-all ${step.screenState.startsWith("browser") ? "bg-neutral-800 border border-neutral-700/50" : "hover:bg-neutral-800/40"}`}>
                    <div className="w-8 h-8 rounded bg-gradient-to-tr from-amber-600 to-orange-400 flex items-center justify-center text-white font-bold text-xs select-none">
                      FF
                    </div>
                    {/* Normalized marker badge helper */}
                    <span className="absolute -bottom-1 -right-1 bg-purple-600 text-[8px] px-1 py-0.2 rounded font-mono border border-purple-500">120,180</span>
                  </div>

                  {/* VS Code Icon */}
                  <div className={`relative group p-2 rounded-xl transition-all ${step.screenState.startsWith("vscode") ? "bg-neutral-800 border border-neutral-700/50" : "hover:bg-neutral-800/40"}`}>
                    <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white select-none">
                      <Code className="w-4.5 h-4.5 text-blue-100" />
                    </div>
                    <span className="absolute -bottom-1 -right-1 bg-purple-600 text-[8px] px-1 py-0.2 rounded font-mono border border-purple-500">200,720</span>
                  </div>

                  {/* Terminal Icon */}
                  <div className={`relative group p-2 rounded-xl transition-all ${step.screenState.startsWith("terminal") ? "bg-neutral-800 border border-neutral-700/50" : "hover:bg-neutral-800/40"}`}>
                    <div className="w-8 h-8 rounded bg-neutral-900 border border-neutral-700 flex items-center justify-center text-emerald-400 font-mono text-sm select-none">
                      &gt;_
                    </div>
                    <span className="absolute -bottom-1 -right-1 bg-purple-600 text-[8px] px-1 py-0.2 rounded font-mono border border-purple-500">120,260</span>
                  </div>
                </div>

                {/* Dynamic Screen Renders (Mock Application Windows) */}
                
                {/* 1. SCENARIO A: Firefox Web Browser Window */}
                {step.screenState.startsWith("browser") && (
                  <div className="absolute top-12 left-20 right-8 bottom-8 bg-neutral-900 rounded-xl border border-neutral-700/60 shadow-xl overflow-hidden flex flex-col z-10 transition-all duration-500">
                    {/* Browser Address Bar */}
                    <div className="h-10 bg-neutral-950 border-b border-neutral-800 flex items-center gap-3 px-4 text-xs">
                      <div className="flex gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-red-500/80" />
                        <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                        <span className="w-3 h-3 rounded-full bg-green-500/80" />
                      </div>
                      <div className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg py-1 px-3 text-neutral-300 font-mono text-[10px] flex items-center justify-between relative">
                        <span className="truncate">
                          {step.screenState === "browser_empty" ? typedText || "https://" : "https://github.com/OpenAutomation/alice"}
                        </span>
                        <span className="absolute right-2 top-1.5 text-[8px] bg-purple-600 px-1 rounded text-white font-mono">420,110</span>
                      </div>
                    </div>

                    {/* Web Content Render */}
                    <div className="flex-1 bg-neutral-950 p-6 flex flex-col justify-between overflow-auto">
                      
                      {/* GitHub Repository Page View */}
                      {step.screenState.includes("github") ? (
                        <div className="flex-1 flex flex-col justify-between">
                          <div className="flex items-start justify-between border-b border-neutral-800 pb-4">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded bg-neutral-800 flex items-center justify-center font-mono font-bold text-white text-xs">
                                OA
                              </div>
                              <div className="text-xs">
                                <span className="text-blue-400 font-medium">OpenAutomation</span> / <strong className="text-white">alice</strong>
                              </div>
                            </div>

                            {/* GitHub Star Button */}
                            <div className="relative">
                              <button 
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                  step.screenState === "browser_github_starred"
                                    ? "bg-amber-500 text-neutral-950"
                                    : "bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700"
                                }`}
                              >
                                {step.screenState === "browser_github_starred" ? (
                                  <>
                                    <Check className="w-3.5 h-3.5" />
                                    Starred
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                    Star Repo
                                  </>
                                )}
                              </button>
                              <span className="absolute -bottom-5 -right-1 bg-purple-600 text-[8px] px-1 rounded text-white font-mono z-30">780,220</span>
                            </div>
                          </div>

                          <div className="my-auto max-w-md mx-auto text-center py-4">
                            <h3 className="text-base font-bold text-neutral-100 mb-1">🐺 Local AI operating agent Alice</h3>
                            <p className="text-xs text-neutral-400 leading-relaxed">
                              Autonomous screen vision driver, safe permission boundaries, and zero cloud API overhead.
                            </p>
                            <div className="mt-4 flex items-center justify-center gap-2">
                              <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950 border border-purple-800 text-purple-300">LOONAR v1.0</span>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400">Linux Native</span>
                            </div>
                          </div>

                          <div className="border-t border-neutral-900 pt-3 text-[10px] text-neutral-500 flex justify-between">
                            <span>MIT License</span>
                            <span>Release v1.0.0</span>
                          </div>
                        </div>
                      ) : (
                        /* Empty blank start tab */
                        <div className="flex-1 flex flex-col items-center justify-center text-neutral-500 gap-1">
                          <Globe className="w-8 h-8 text-neutral-700 animate-pulse" />
                          <span className="text-xs font-semibold">Blank Browser Tab</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. SCENARIO B: VS Code Editor Window */}
                {step.screenState.startsWith("vscode") && (
                  <div className="absolute top-10 left-20 right-6 bottom-6 bg-[#1e1e1e] rounded-xl border border-neutral-800 shadow-xl overflow-hidden flex flex-col z-10 transition-all duration-500 text-xs">
                    {/* Editor Header Titlebar */}
                    <div className="h-9 bg-[#181818] border-b border-[#2d2d2d] flex items-center justify-between px-4 text-[11px] text-neutral-400 font-mono">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                      </div>
                      <div>TodoList.tsx — react-workspace</div>
                      <div className="w-4" />
                    </div>

                    <div className="flex-1 flex overflow-hidden">
                      {/* Sidebar Explorer */}
                      <div className="w-36 bg-[#181818] border-r border-[#2d2d2d] p-3 font-mono text-[10px] text-neutral-400 flex flex-col gap-2.5 select-none relative">
                        <div className="font-bold text-white text-[9px] uppercase tracking-wider flex justify-between">
                          <span>EXPLORER</span>
                          <span className="absolute top-3 right-2 bg-purple-600 text-[8px] px-1 rounded text-white font-mono">310,210</span>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <div className="text-neutral-500 font-semibold">src/</div>
                          <div className="pl-3 text-neutral-300 font-semibold flex items-center gap-1 bg-[#2d2d2d] px-1.5 py-0.5 rounded">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                            {step.screenState === "vscode_empty" ? typedText || "..." : "TodoList.tsx"}
                          </div>
                          <div className="pl-3 text-neutral-500">App.tsx</div>
                          <div className="pl-3 text-neutral-500">main.tsx</div>
                        </div>
                      </div>

                      {/* Code Area */}
                      <div className="flex-1 bg-[#1e1e1e] p-4 font-mono text-[10px] text-neutral-300 flex flex-col justify-between overflow-auto relative">
                        {/* Coords label */}
                        <span className="absolute right-3 top-3 bg-purple-600 text-[8px] px-1 rounded text-white font-mono">550,450</span>

                        <div className="flex-1 flex flex-col gap-1">
                          {step.screenState === "vscode_empty" ? (
                            <span className="text-neutral-600">// Waiting for code entry...</span>
                          ) : (
                            <>
                              <div><span className="text-purple-400">import</span> React, &#123; useState &#125; <span className="text-purple-400">from</span> <span className="text-emerald-400">"react"</span>;</div>
                              <div className="text-neutral-600">// Beautiful TodoList Component</div>
                              <div><span className="text-purple-400">export default function</span> <span className="text-blue-400">TodoList</span>() &#123;</div>
                              <div className="pl-4">const [tasks, setTasks] = useState([]);</div>
                              <div className="pl-4 text-purple-400">return (</div>
                              <div className="pl-8 text-emerald-400">&lt;div className="max-w-md mx-auto"&gt;</div>
                              <div className="pl-12 text-neutral-400">&#123;/* Render local task container list */&#125;</div>
                              <div className="pl-8 text-emerald-400">&lt;/div&gt;</div>
                              <div className="pl-4 text-purple-400">);</div>
                              <div>&#125;</div>
                            </>
                          )}
                        </div>

                        {/* Terminal Panel at the bottom */}
                        {step.screenState.includes("terminal") || step.screenState.includes("running") ? (
                          <div className="h-28 bg-[#181818] border-t border-[#2d2d2d] p-3 text-[10px] text-neutral-300 flex flex-col justify-between relative mt-4">
                            <span className="absolute right-3 top-3 bg-purple-600 text-[8px] px-1 rounded text-white font-mono">500,680</span>
                            <div className="font-semibold text-neutral-500 border-b border-[#2d2d2d] pb-1 flex justify-between">
                              <span>TERMINAL (npm run dev)</span>
                              <span className="text-emerald-400">Active</span>
                            </div>
                            <div className="flex-1 pt-2 font-mono flex flex-col gap-0.5">
                              <div>$ {step.screenState === "vscode_terminal" ? typedText || "npm run dev" : "npm run dev"}</div>
                              {step.screenState === "vscode_running" && (
                                <>
                                  <div className="text-emerald-400">✓ Compiled successfully in 140ms.</div>
                                  <div className="text-blue-400">  ➜ Local:   http://localhost:3000/</div>
                                </>
                              )}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. SCENARIO C: System Terminal Window */}
                {step.screenState.startsWith("terminal") && (
                  <div className="absolute top-14 left-24 right-10 bottom-10 bg-neutral-950 rounded-xl border border-neutral-800 shadow-xl overflow-hidden flex flex-col font-mono text-[10px] text-neutral-300 z-10 transition-all duration-500">
                    <div className="h-8 bg-neutral-900 border-b border-neutral-800 flex items-center gap-2 px-3 justify-between">
                      <div className="flex gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                      </div>
                      <div className="text-[9px] text-neutral-400">Terminal — bash</div>
                      <div className="w-4" />
                    </div>

                    <div className="flex-1 p-4 flex flex-col justify-between overflow-auto relative">
                      <span className="absolute right-3 top-3 bg-purple-600 text-[8px] px-1 rounded text-white font-mono">450,400</span>

                      {step.screenState === "terminal_empty" ? (
                        <div className="flex-1 flex flex-col gap-1">
                          <div className="text-neutral-500">ubuntu-desktop:~$ {typedText}</div>
                          <span className="animate-pulse">_</span>
                        </div>
                      ) : (
                        /* htop Telemetry Chart Simulation */
                        <div className="flex-1 flex flex-col gap-2">
                          <div className="grid grid-cols-2 gap-4 border-b border-neutral-800 pb-2.5">
                            <div>
                              <div className="text-[8px] text-neutral-400 font-semibold mb-1">CPU THREAD LOAD</div>
                              <div className="flex items-center gap-1.5">
                                <div className="text-[9px]">1 [||||||||||||||||||            ] 51.2%</div>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <div className="text-[9px]">2 [||||||||||||                  ] 34.8%</div>
                              </div>
                            </div>
                            <div>
                              <div className="text-[8px] text-neutral-400 font-semibold mb-1">RAM MEMORY ALLOCATION</div>
                              <div className="text-[9px]">Mem[||||||||||||||||            ] 2.15G/8.00G</div>
                              <div className="text-[9px]">Swp[                            ] 0.00K/2.00G</div>
                            </div>
                          </div>

                          {/* Process rows */}
                          <div className="flex-1 flex flex-col gap-1 mt-1 font-mono text-[9px] text-neutral-400">
                            <div className="grid grid-cols-5 font-bold text-white border-b border-neutral-900 pb-1 mb-1">
                              <span>PID</span>
                              <span>CPU%</span>
                              <span>MEM%</span>
                              <span className="col-span-2">COMMAND</span>
                            </div>
                            <div className="grid grid-cols-5 text-emerald-400">
                              <span>11434</span>
                              <span>45.2</span>
                              <span>20.1</span>
                              <span className="col-span-2">ollama run llava</span>
                            </div>
                            <div className="grid grid-cols-5">
                              <span>8420</span>
                              <span>1.2</span>
                              <span>2.8</span>
                              <span className="col-span-2">python3 agent.py</span>
                            </div>
                            <div className="grid grid-cols-5">
                              <span>9021</span>
                              <span>0.8</span>
                              <span>1.5</span>
                              <span className="col-span-2">xdotool daemon</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Simulated Click Ripple Effect */}
                {clickRipple.active && (
                  <div 
                    className="absolute bg-purple-500/40 border border-purple-400 rounded-full animate-ping pointer-events-none z-30"
                    style={{
                      left: clickRipple.x - 20,
                      top: clickRipple.y - 20,
                      width: 40,
                      height: 40
                    }}
                  />
                )}

                {/* Simulated Mouse Pointer */}
                <div 
                  className="absolute pointer-events-none z-40 transition-all duration-75 flex flex-col gap-1 items-start"
                  style={{ 
                    left: getRelativeCoords([mousePos.x, mousePos.y]).x, 
                    top: getRelativeCoords([mousePos.x, mousePos.y]).y 
                  }}
                >
                  <MousePointer className="w-5 h-5 text-purple-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] fill-purple-600" />
                  {/* Local Coordinates Marker */}
                  <div className="bg-neutral-950/90 text-white font-mono text-[8px] px-1 py-0.2 rounded border border-neutral-800 shadow">
                    ({Math.round(mousePos.x)}, {Math.round(mousePos.y)})
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB CONTENT: Code Explorer */}
        {activeTab === "code" && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start flex-1 mb-8 animate-fade-in">
            {/* File List Panel */}
            <div className="md:col-span-1 bg-neutral-900/60 border border-neutral-800 p-4 rounded-2xl flex flex-col gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3 px-1">
                Project File Tree
              </h3>
              {Object.keys(CODE_FILES).map((fileName) => (
                <button
                  key={fileName}
                  onClick={() => setSelectedFile(fileName as any)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-mono transition-all flex items-center justify-between ${
                    selectedFile === fileName
                      ? "bg-purple-950/20 border border-purple-800/80 text-purple-300 font-semibold"
                      : "bg-neutral-950/40 border border-transparent text-neutral-400 hover:text-white hover:bg-neutral-900/40"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {fileName.endsWith(".sh") ? (
                      <Terminal className="w-4 h-4 text-emerald-400" />
                    ) : fileName.endsWith(".md") ? (
                      <FileText className="w-4 h-4 text-neutral-400" />
                    ) : (
                      <FileCode className="w-4 h-4 text-blue-400" />
                    )}
                    {fileName}
                  </span>
                  {fileName === "agent.py" && (
                    <span className="text-[9px] bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800 text-neutral-500 font-sans">Core Loop</span>
                  )}
                </button>
              ))}
            </div>

            {/* Code Workspace Display Panel */}
            <div className="md:col-span-3 bg-neutral-900/60 border border-neutral-800 rounded-2xl overflow-hidden flex flex-col relative h-[580px]">
              <div className="h-11 bg-neutral-950/80 border-b border-neutral-850 px-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono text-neutral-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                  alice/{selectedFile}
                </div>
                <button
                  onClick={() => handleCopy(CODE_FILES[selectedFile], selectedFile)}
                  className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-850 text-[11px] font-medium text-neutral-300 hover:text-white transition-all border border-neutral-800 flex items-center gap-1.5"
                >
                  {isCopied === selectedFile ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy Code
                    </>
                  )}
                </button>
              </div>

              <div className="flex-1 overflow-auto bg-neutral-950/90 p-5 font-mono text-xs text-neutral-300 leading-relaxed">
                <pre className="whitespace-pre-wrap">{CODE_FILES[selectedFile]}</pre>
              </div>
            </div>
          </div>
        )}

        {/* TAB CONTENT: Installation Guides */}
        {activeTab === "docs" && (
          <div className="max-w-3xl mx-auto w-full bg-neutral-900/50 border border-neutral-800/80 p-8 rounded-3xl backdrop-blur-md mb-8 animate-fade-in flex flex-col gap-6">
            <div className="border-b border-neutral-800 pb-4">
              <h2 className="text-xl font-bold text-white mb-1.5 flex items-center gap-2">
                <Download className="w-5.5 h-5.5 text-purple-400" />
                Alice Agent GitHub Installation Manual
              </h2>
              <p className="text-sm text-neutral-400">
                Setup steps to clone, configure, build, and run OpenAutomation Alice locally.
              </p>
            </div>

            {/* Step 1 */}
            <div className="flex gap-4">
              <div className="w-7 h-7 rounded-full bg-purple-950 text-purple-300 font-bold flex items-center justify-center text-xs shrink-0 border border-purple-800/60">
                1
              </div>
              <div className="flex-1 flex flex-col gap-2">
                <h3 className="font-semibold text-sm text-neutral-200">Clone the Git Repository</h3>
                <p className="text-xs text-neutral-400">Download the source codebase from GitHub to your home folder workspace.</p>
                <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-850 flex items-center justify-between font-mono text-xs text-purple-300 mt-1">
                  <code>git clone https://github.com/OpenAutomation/alice.git && cd alice</code>
                  <button 
                    onClick={() => handleCopy("git clone https://github.com/OpenAutomation/alice.git && cd alice", "git_clone")}
                    className="p-1 rounded bg-neutral-900 text-neutral-400 hover:text-white"
                  >
                    {isCopied === "git_clone" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4">
              <div className="w-7 h-7 rounded-full bg-purple-950 text-purple-300 font-bold flex items-center justify-center text-xs shrink-0 border border-purple-800/60">
                2
              </div>
              <div className="flex-1 flex flex-col gap-2">
                <h3 className="font-semibold text-sm text-neutral-200">Run the Installer Script</h3>
                <p className="text-xs text-neutral-400">
                  The automated <code className="text-white font-mono bg-neutral-900 px-1 rounded">install.sh</code> detects your OS environment, provisions virtual buffers, upgrades pip packaging dependencies, and compiles CLI symlinks.
                </p>
                <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-850 flex items-center justify-between font-mono text-xs text-purple-300 mt-1">
                  <code>chmod +x install.sh && ./install.sh</code>
                  <button 
                    onClick={() => handleCopy("chmod +x install.sh && ./install.sh", "install_sh")}
                    className="p-1 rounded bg-neutral-900 text-neutral-400 hover:text-white"
                  >
                    {isCopied === "install_sh" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4">
              <div className="w-7 h-7 rounded-full bg-purple-950 text-purple-300 font-bold flex items-center justify-center text-xs shrink-0 border border-purple-800/60">
                3
              </div>
              <div className="flex-1 flex flex-col gap-2">
                <h3 className="font-semibold text-sm text-neutral-200">Trigger Local Inference (Ollama)</h3>
                <p className="text-xs text-neutral-400">Download Ollama and boot the Llava Vision-Language Model to start local visual analysis loops offline.</p>
                <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-850 flex items-center justify-between font-mono text-xs text-purple-300 mt-1">
                  <code>ollama run llava:7b</code>
                  <button 
                    onClick={() => handleCopy("ollama run llava:7b", "ollama_run")}
                    className="p-1 rounded bg-neutral-900 text-neutral-400 hover:text-white"
                  >
                    {isCopied === "ollama_run" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-4">
              <div className="w-7 h-7 rounded-full bg-purple-950 text-purple-300 font-bold flex items-center justify-center text-xs shrink-0 border border-purple-800/60">
                4
              </div>
              <div className="flex-1 flex flex-col gap-2">
                <h3 className="font-semibold text-sm text-neutral-200">Start CLI Agency</h3>
                <p className="text-xs text-neutral-400">Use the globally registered command anywhere in your terminal sandbox session.</p>
                <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-850 flex items-center justify-between font-mono text-xs text-purple-300 mt-1">
                  <code>alice "Open Firefox and search news"</code>
                  <button 
                    onClick={() => handleCopy("alice \"Open Firefox and search news\"", "alice_run")}
                    className="p-1 rounded bg-neutral-900 text-neutral-400 hover:text-white"
                  >
                    {isCopied === "alice_run" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4 p-4 rounded-2xl bg-purple-950/10 border border-purple-900/30 text-xs text-neutral-400 flex items-start gap-3 leading-relaxed">
              <ShieldCheck className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-neutral-200 font-semibold">Offline Execution Confirmed:</strong> All actions, visual coordinates mapping, and inputs are processed locally on your machine buffer. No external network data leakage happens.
              </div>
            </div>
          </div>
        )}

        {/* TAB CONTENT: Telegram Pilot Bot */}
        {activeTab === "telegram" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-1 mb-8 animate-fade-in">
            {/* Left form config */}
            <div className="lg:col-span-5 flex flex-col gap-5">
              <div className="bg-neutral-900/60 border border-neutral-800 p-6 rounded-3xl backdrop-blur-md">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-5">
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <Send className="w-5 h-5 text-purple-400" />
                      Configure Telegram Link
                    </h2>
                    <p className="text-xs text-neutral-400 mt-1">Manage remote-control tokens and permissions.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${telegramIsPolling ? "bg-emerald-500 animate-pulse" : "bg-neutral-700"}`} />
                    <span className="text-xs text-neutral-300 font-semibold">{telegramIsPolling ? "Polling" : "Idle"}</span>
                  </div>
                </div>

                <form onSubmit={handleSaveTelegram} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex justify-between">
                      <span>Telegram Bot Token</span>
                      <button 
                        type="button" 
                        onClick={() => setRevealToken(!revealToken)}
                        className="text-[10px] text-purple-400 hover:text-purple-300 font-medium"
                      >
                        {revealToken ? "Mask Token" : "Reveal Token"}
                      </button>
                    </label>
                    <div className="relative">
                      <input
                        type={revealToken ? "text" : "password"}
                        placeholder="e.g. 1234567890:ABCdefGhIJK_lmN"
                        value={telegramToken}
                        onChange={(e) => setTelegramToken(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 text-xs rounded-xl pl-3 pr-10 py-3 focus:outline-none focus:ring-1 focus:ring-purple-500 text-neutral-200 placeholder-neutral-600 font-mono"
                      />
                      <div className="absolute right-3 top-3.5 text-neutral-500">
                        <Lock className="w-4 h-4" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      Authorized Chat ID
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 987654321"
                      value={telegramChatId}
                      onChange={(e) => setTelegramChatId(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 text-xs rounded-xl px-3 py-3 focus:outline-none focus:ring-1 focus:ring-purple-500 text-neutral-200 placeholder-neutral-600 font-mono"
                    />
                    <p className="text-[10px] text-neutral-500 mt-1 leading-relaxed">
                      Only messages originating from this unique Telegram chat identifier will be executed on the host, preventing public access.
                    </p>
                  </div>

                  <div className="flex items-center justify-between bg-neutral-950/60 p-3.5 rounded-xl border border-neutral-850 mt-2">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-neutral-200">Active Polling Client</span>
                      <span className="text-[10px] text-neutral-500 mt-0.5">Toggle daemon thread loop</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleTelegram(!telegramEnabled)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        telegramEnabled ? "bg-purple-600" : "bg-neutral-800"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          telegramEnabled ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingTelegram}
                    className="w-full mt-2 bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 active:scale-98 disabled:opacity-50"
                  >
                    {isSavingTelegram ? "Saving Settings..." : "Save Settings & Update"}
                  </button>
                </form>
              </div>

              {/* Status card */}
              <div className="bg-neutral-900/60 border border-neutral-800 p-5 rounded-3xl backdrop-blur-md flex flex-col gap-3">
                <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">Connection Integrity Checks</h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-850">
                    <span className="text-neutral-500 block mb-1">Port Bind</span>
                    <strong className="text-white font-mono">3000 (Proxy)</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-850">
                    <span className="text-neutral-500 block mb-1">Daemon Status</span>
                    <strong className={telegramIsPolling ? "text-emerald-400" : "text-neutral-400"}>
                      {telegramIsPolling ? "Polling" : "Offline"}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Right log & instructions panel */}
            <div className="lg:col-span-7 flex flex-col gap-5">
              {/* Instructions card */}
              <div className="bg-neutral-900/60 border border-neutral-800 p-6 rounded-3xl backdrop-blur-md">
                <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <Cpu className="w-4.5 h-4.5 text-purple-400" />
                  How to setup Alice Remote Bot
                </h2>
                
                <div className="flex flex-col gap-3.5 text-xs text-neutral-300">
                  <div className="flex gap-3">
                    <div className="w-5.5 h-5.5 rounded-full bg-purple-950 text-purple-300 font-bold flex items-center justify-center text-[10px] border border-purple-800/40 shrink-0">1</div>
                    <div>
                      <p className="font-semibold text-neutral-200">Generate Telegram Bot</p>
                      <p className="text-neutral-400 mt-0.5">Search for <strong className="text-white">@BotFather</strong> on Telegram, type <code className="bg-neutral-950 px-1 py-0.5 rounded text-purple-400 font-mono text-[11px]">/newbot</code>, follow prompts, and copy the HTTP API Token.</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-5.5 h-5.5 rounded-full bg-purple-950 text-purple-300 font-bold flex items-center justify-center text-[10px] border border-purple-800/40 shrink-0">2</div>
                    <div>
                      <p className="font-semibold text-neutral-200">Find your Chat ID</p>
                      <p className="text-neutral-400 mt-0.5">Search for <strong className="text-white">@userinfobot</strong> on Telegram and send any message to it to instantly fetch your unique numerical Chat ID.</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-5.5 h-5.5 rounded-full bg-purple-950 text-purple-300 font-bold flex items-center justify-center text-[10px] border border-purple-800/40 shrink-0">3</div>
                    <div>
                      <p className="font-semibold text-neutral-200">Activate Link</p>
                      <p className="text-neutral-400 mt-0.5">Paste the credentials on the left, check the Active toggle, and save! Now open your bot chat and send <code className="bg-neutral-950 px-1 py-0.5 rounded text-purple-400 font-mono text-[11px]">/start</code> to verify.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Polling Activity Log Terminal */}
              <div className="bg-neutral-900/60 border border-neutral-800 p-6 rounded-3xl backdrop-blur-md flex flex-col gap-3 flex-1 min-h-[300px]">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                  <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    Telegram Activity Logs Stream
                  </h3>
                  <button 
                    type="button"
                    onClick={() => {
                      fetch("/api/telegram/logs")
                        .then(res => res.json())
                        .then(data => setTelegramLogs(data.logs || []));
                    }}
                    className="text-[10px] text-neutral-400 hover:text-white hover:underline animate-pulse"
                  >
                    Refresh Logs
                  </button>
                </div>

                <div className="flex-1 bg-neutral-950 rounded-2xl border border-neutral-850 p-4 font-mono text-[11px] text-neutral-300 overflow-y-auto max-h-[300px] flex flex-col gap-1.5 select-text">
                  {telegramLogs.length === 0 ? (
                    <div className="text-neutral-500 italic text-center py-10">
                      Standby. Logs will stream in real-time when the Telegram Pilot client is polling.
                    </div>
                  ) : (
                    telegramLogs.map((log, index) => (
                      <div key={index} className="leading-relaxed border-b border-neutral-900/45 pb-1">
                        {log}
                      </div>
                    ))
                  )}
                  <div className="flex items-center gap-1 text-purple-500 animate-pulse mt-1 font-bold">
                    <span>❯</span>
                    <span className="w-1.5 h-3.5 bg-purple-500 inline-block animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-auto border-t border-neutral-900 pt-6 pb-2 text-center text-xs text-neutral-500">
          <p>© 2026 OpenAutomation Project. Under the MIT License. Ready for GitHub deployment.</p>
        </footer>

      </div>
    </div>
  );
}

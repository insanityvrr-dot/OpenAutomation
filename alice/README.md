# 🐺 OpenAutomation - Alice Agent

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Engine: LOONAR V1.0](https://img.shields.io/badge/Local_AI-LOONAR_V1.0-8A2BE2.svg)](#)
[![OS: Linux](https://img.shields.io/badge/OS-Linux_Ubuntu_Arch-orange.svg)](#)

Alice is a secure, completely **local-first, open-source AI operating agent** designed to automate workflows directly on Linux desktops. Modeled as a free-to-use alternative to commercial agents, Alice features a robust implementation of **OS-level Computer Use** (simulated mouse clicks, smooth motor motion paths, typing, shortcuts) directed by a local vision-language model.

Powered by the **LOONAR V1.0** (Local Operating Navigation Agent with Autonomous Reasoning) engine, Alice analyzes regular screenshots to understand the desktop state and plans her steps entirely within your local machine.

---

## 🚀 Key Features

* **Complete Data Privacy:** Run entirely offline. No cloud APIs, telemetry logs, or credit cards.
* **LOONAR V1.0 Vision Architecture:** Feeds downsampled screenshots to local Vision-Language Models (such as `llava` or `minicpm-v` running via [Ollama](https://ollama.com) or `llama.cpp`).
* **Display Server Compatibility:** Native driver supporting both **X11** (via `scrot` and `xdotool`) and **Wayland** (via `grim` and `slurp`).
* **🔒 Strict Permission Gate:** Prompts the user with the exact coordinates, target element, and text input before *every* physical action, ensuring Alice never clicks a button or runs a terminal script without explicit permission.
* **Human-like Motor Curves:** Moves the mouse using custom Bezier math curves to simulate realistic mouse speed dampening and motor fluctuations.

---

## ⚙️ Model Requirements & Engine Specifications

LOONAR V1.0 is engineered for high autonomy and low-latency offline execution:
* **Host Model Support:** Optimized for `llava:7b`, `minicpm-v`, and other Vision-Language Models.
* **Inference Pipeline:** Directly feeds from local system screenshot buffers via Python PIL downsampling routines to standard prompt formats.
* **Accuracy Target:** Features context-aware XML parsing protocols that map high-level actions back to precise display coordinates.

---

## 📂 System Architecture Flow

```
+-------------------------------------------------------------+
|                      User Prompt / Goal                     |
+------------------------------+------------------------------+
                               |
                               v
               +---------------+---------------+
               |       Agent Orchestrator      | <-----------+
               |          (agent.py)           |             |
               +---------------+---------------+             |
                               |                             |
                               v                             |
               +---------------+---------------+             |
               |        Screen Capture         |             |
               |     (X11 scrot / Wayland)     |             |
               +---------------+---------------+             |
                               |                             |
                               v                             |
               +---------------+---------------+             |
               |      Local Ollama VLM         |             | Loop Iteration
               |       (llava Vision)          |             | (Max 15 steps)
               +---------------+---------------+             |
                               |                             |
                               v                             |
               +---------------+---------------+             |
               |      XML Action Parser        |             |
               |  (<thought>, <coordinates>)   |             |
               +---------------+---------------+             |
                               |                             |
                               v                             |
               +---------------+---------------+             |
               |    🔒 Safety Permission Gate  |             |
               | (User Enter/Abort Prompt)     |             |
               +---------------+---------------+             |
                               |                             |
                               v (If Approved)               |
               +---------------+---------------+             |
               |     Native System Driver      |             |
               |   (PyAutoGUI / Bezier Paths)  |             |
               +---------------+---------------+             |
                               |                             |
                               +-----------------------------+
```

---

## 🛠️ Quick Installation (1-Click Installer)

Alice has a robust launcher wrapper that coordinates packages automatically.

### Step 1: Clone and Install
Clone this repository to your Linux desktop and execute the installer:

```bash
git clone https://github.com/insanityvrr-dot/OpenAutomation.git
cd OpenAutomation
chmod +x install.sh
./install.sh
```

The installer will automatically:
1. Detect your Linux distribution (Ubuntu/Debian or Arch Linux).
2. Install required system bindings (`scrot`, `xdotool`, `grim`, `slurp`).
3. Set up a Python Virtual Environment (`.venv`) and install dependencies (`pyautogui`, `Pillow`, `requests`, `rich`).
4. Bind `alice` as a global terminal command in `~/.local/bin/alice`.

---

## 🤖 Launching the Agent

Once installed, you can launch Alice directly from any terminal window. Make sure you are running inside a graphical environment (X11 or Wayland session).

### 1. Conversational Prompting (Computer Use Mode)
Provide Alice with a direct GUI automation instruction:
```bash
alice "Open Firefox, go to GitHub, and star the OpenAutomation repo"
```

### 2. Standalone Chat Mode (Brainstorming)
Start an interactive console prompt directly with Alice:
```bash
alice
```

### 3. Local Offline Heuristic Mode
To preview or test coordinate pathways without loading or running Ollama, launch with the `--mock` flag:
```bash
alice "Create a React Todo app in VS Code" --mock
```

---

## 🎛️ Coordinate Mapping Guide

LOONAR V1.0 operates on a normalized screen coordinate space mapping from **`0` to `1000`**:
* **Top-Left Corner:** `(0, 0)`
* **Bottom-Right Corner:** `(1000, 1000)`
* **Center of Screen:** `(500, 500)`

The `computer_use.py` driver dynamically retrieves the host screen's pixel resolution and handles coordinate translation:
$$\text{Pixel}_x = \left(\frac{\text{Normalized}_x}{1000}\right) \times \text{Display Width}$$
$$\text{Pixel}_y = \left(\frac{\text{Normalized}_y}{1000}\right) \times \text{Display Height}$$

This ensures that Alice can run on ultra-wide screens, laptops, and virtual buffers without recalibrating coordinates.

---

## 🔒 Safety and Sandboxing Recommendation

Since Alice interacts directly with the operating system as a native driver, we recommend these safety precautions:
1. **Always read the Permission Gate:** Inspect the proposed actions. If Alice proposes an incorrect coordinate or a harmful terminal command, simply hit `abort` or type `Ctrl+C`.
2. **Dedicated Workspace:** Run Alice inside a Linux virtual machine (VirtualBox, QEMU/KVM) or a containerized X11 VNC server to complete tasks safely.

---

## 📄 License
OpenAutomation is licensed under the **MIT License**. Check out the `LICENSE` file for full terms and conditions.

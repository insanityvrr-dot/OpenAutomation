#!/usr/bin/env bash
# ==============================================================================
# OpenAutomation - Alice Agent 1-Click Installer (install.sh)
# Installs core Linux dependencies, configures Python venv, and binds global commands.
# Supports: Ubuntu, Debian, Pop!_OS, Mint, and Arch Linux.
# ==============================================================================

set -euo pipefail

# ANSI Color Codes
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Clean Text-based Header
print_banner() {
    echo -e "${CYAN}================================================================${NC}"
    echo -e "${PURPLE}           🐺  OPENAUTOMATION - ALICE AGENT INSTALLER  🐺       ${NC}"
    echo -e "${CYAN}================================================================${NC}"
    echo -e "                 LOONAR V1.0 - Local Operating Automation"
    echo -e "${CYAN}================================================================${NC}\n"
}

print_banner

echo -e "${CYAN}[*] Beginning system diagnostic and environment prep...${NC}"

# Detect Linux Distribution
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS_ID=$ID
else
    echo -e "${RED}[!] Could not detect OS distribution. Assuming Debian/Ubuntu-compatible.${NC}"
    OS_ID="ubuntu"
fi

echo -e "[*] Target Operating System Detected: ${GREEN}${OS_ID^^}${NC}"

# 1. Install System Dependencies (Requires Sudo)
install_packages() {
    echo -e "\n${CYAN}[*] Phase 1: Installing native display capture and automation packages...${NC}"
    
    if [[ "$OS_ID" == "ubuntu" || "$OS_ID" == "debian" || "$OS_ID" == "pop" || "$OS_ID" == "linuxmint" ]]; then
        echo -e "[*] Updating package caches (apt)..."
        sudo apt update -y
        
        echo -e "[*] Installing Python, X11 & Wayland packages via apt..."
        sudo apt install -y python3 python3-pip python3-venv scrot xdotool grim slurp libxdo3 python3-tk python3-dev
        
    elif [[ "$OS_ID" == "arch" || "$OS_ID" == "manjaro" ]]; then
        echo -e "[*] Installing packages via pacman..."
        sudo pacman -Syu --noconfirm
        sudo pacman -S --needed --noconfirm python python-pip scrot xdotool grim slurp libxdo python-pillow python-pyautogui
        
    else
        echo -e "${YELLOW}[!] Unsupported or customized distro detected. Please verify these exist manually:${NC}"
        echo -e "    scrot, xdotool, grim, slurp, python3, python3-pip, python3-venv"
    fi
}

# Prompt for sudo if packages need installation
if ! command -v scrot &> /dev/null || ! command -v xdotool &> /dev/null || ! command -v python3 &> /dev/null; then
    echo -e "${YELLOW}[!] Core packages missing. Requesting administrator permissions to install native libraries:${NC}"
    install_packages
else
    echo -e "${GREEN}[✓] Native display utilities (scrot, xdotool, python3) already present on system.${NC}"
fi

# 2. Configure Python Virtual Environment
echo -e "\n${CYAN}[*] Phase 2: Configuring Python isolated virtual environment (.venv)...${NC}"
VENV_DIR=".venv"

if [ ! -d "$VENV_DIR" ]; then
    python3 -m venv "$VENV_DIR"
    echo -e "${GREEN}[✓] Virtual environment created successfully.${NC}"
else
    echo -e "[*] Virtual environment (.venv) already exists. Re-verifying dependencies."
fi

# Activate Virtual Environment
source "$VENV_DIR"/bin/activate

# Upgrade pip
echo -e "[*] Upgrading pip packages..."
pip install --upgrade pip

# Install Python requirements
echo -e "[*] Installing Python libraries (pyautogui, Pillow, requests, rich, opencv-python)..."
pip install pyautogui Pillow requests rich opencv-python

# 3. Create Global terminal command link (Symlink or Alias)
echo -e "\n${CYAN}[*] Phase 3: Registering global 'alice' CLI terminal command...${NC}"

# Find the absolute path to this folder
ROOT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

LAUNCHER_CONTENT="#!/usr/bin/env bash
# Auto-generated Alice launcher script by install.sh

# Ensure venv is activated for execution context
source \"$ROOT_DIR/.venv/bin/activate\"

# Execute Alice Agent with absolute path
python3 \"$ROOT_DIR/agent.py\" \"\$@\""

# Try writing to /usr/local/bin first (instantly works everywhere)
echo -e "[*] Writing launcher script to /usr/local/bin/alice (requires sudo)..."
if echo "$LAUNCHER_CONTENT" | sudo tee /usr/local/bin/alice > /dev/null; then
    sudo chmod +x /usr/local/bin/alice
    echo -e "${GREEN}[✓] Global launcher script registered successfully in /usr/local/bin/alice!${NC}"
    echo -e "    ${GREEN}No terminal restart or PATH edits required! Just type 'alice' to run.${NC}"
else
    echo -e "${YELLOW}[!] Failed to write to /usr/local/bin. Falling back to local bin...${NC}"
    BIN_TARGET="$HOME/.local/bin"
    mkdir -p "$BIN_TARGET"
    LAUNCHER_PATH="$BIN_TARGET/alice"
    echo "$LAUNCHER_CONTENT" > "$LAUNCHER_PATH"
    chmod +x "$LAUNCHER_PATH"
    echo -e "${GREEN}[✓] Global launcher script mapped to fallback: ${YELLOW}$LAUNCHER_PATH${NC}"

    # Ensure ~/.local/bin is in the PATH
    if [[ ":$PATH:" != *":$HOME/.local/bin:"* ]]; then
        echo -e "\n${YELLOW}[!] PATH Configuration Alert:${NC}"
        echo -e "    The directory ${YELLOW}$HOME/.local/bin${NC} is not in your current shell's PATH."
        echo -e "    Typing 'alice' will fail until this is added."
        echo -e "    Adding 'export PATH=\"\$HOME/.local/bin:\$PATH\"' to your shell configurations..."

    # Add to ~/.bashrc if it exists
    if [ -f "$HOME/.bashrc" ]; then
        if ! grep -q "export PATH=\"\$HOME/.local/bin:\$PATH\"" "$HOME/.bashrc"; then
            echo -e "\n# Added by Alice Agent Installer" >> "$HOME/.bashrc"
            echo "export PATH=\"\$HOME/.local/bin:\$PATH\"" >> "$HOME/.bashrc"
            echo -e "    ${GREEN}[✓] Successfully appended to ~/.bashrc${NC}"
        fi
    fi

    # Add to ~/.zshrc if it exists (very common in modern systems/Arch users)
    if [ -f "$HOME/.zshrc" ]; then
        if ! grep -q "export PATH=\"\$HOME/.local/bin:\$PATH\"" "$HOME/.zshrc"; then
            echo -e "\n# Added by Alice Agent Installer" >> "$HOME/.zshrc"
            echo "export PATH=\"\$HOME/.local/bin:\$PATH\"" >> "$HOME/.zshrc"
            echo -e "    ${GREEN}[✓] Successfully appended to ~/.zshrc${NC}"
        fi
    fi

    # Print reload advice
    echo -e "    ${CYAN}👉 IMPORTANT: Please reload your shell or open a new terminal window to apply!${NC}"
    echo -e "       Or run: ${YELLOW}source ~/.bashrc${NC} (or ${YELLOW}source ~/.zshrc${NC})"
else
    echo -e "    ${GREEN}[✓] $HOME/.local/bin is already in your PATH.${NC}"
fi
fi

# 4. Ollama Vision Model Advice
echo -e "\n${CYAN}[*] Phase 4: Validating local AI inference engine (Ollama)...${NC}"
if command -v ollama &> /dev/null; then
    echo -e "${GREEN}[✓] Local Ollama backend detected!${NC}"
    echo -e "    - To initialize the vision-capable model, run:"
    echo -e "      ${YELLOW}ollama run llava:7b${NC}"
else
    echo -e "${YELLOW}[!] Local Ollama backend was not found in path.${NC}"
    echo -e "    - Install Ollama for complete local visual agency: https://ollama.com"
    echo -e "    - Alice will automatically use offline custom heuristics if Ollama is unavailable."
fi

# Done!
echo -e "\n${GREEN}================================================================${NC}"
echo -e "       ${GREEN}🎉 ALICE AGENT INSTALLATION COMPLETED SUCCESSFULLY! 🎉${NC}"
echo -e " ${CYAN}- You can now start the agent from any terminal tab by running:${NC}"
echo -e "   ${YELLOW}alice \"Open Firefox, go to github and star OpenAutomation\"${NC}"
echo -e "================================================================${NC}\n"

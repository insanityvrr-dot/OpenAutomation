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
BIN_TARGET="$HOME/.local/bin"

mkdir -p "$BIN_TARGET"

# Create launcher script wrapper in ~/.local/bin
LAUNCHER_PATH="$BIN_TARGET/alice"

cat << EOF > "$LAUNCHER_PATH"
#!/usr/bin/env bash
# Auto-generated Alice launcher script by install.sh

# Ensure venv is activated for execution context
source "$ROOT_DIR/.venv/bin/activate"

# Execute Alice Agent with absolute path
python3 "$ROOT_DIR/agent.py" "\$@"
EOF

chmod +x "$LAUNCHER_PATH"

echo -e "${GREEN}[✓] Global launcher script mapped to: ${YELLOW}$LAUNCHER_PATH${NC}"
echo -e "    (Make sure $HOME/.local/bin is inside your system PATH environment variable)"

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

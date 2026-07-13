import express from "express";
import path from "path";
import fs from "fs";
import { exec } from "child_process";
import os from "os";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json());

// Telegram Bot configurations (Local-first persistent caching)
const CONFIG_FILE = path.join(process.cwd(), "telegram_config.json");
let telegramConfig = { token: "", chatId: "", enabled: false };
let telegramLogs: string[] = [];
let lastUpdateId = 0;
let isPolling = false;

function addTelegramLog(message: string) {
  const timestamp = new Date().toLocaleTimeString();
  const logLine = `[${timestamp}] ${message}`;
  telegramLogs.push(logLine);
  if (telegramLogs.length > 100) {
    telegramLogs.shift();
  }
  console.log(logLine);
}

async function sendTelegramMessage(chatId: string, text: string) {
  if (!telegramConfig.token) return;
  try {
    const url = `https://api.telegram.org/bot${telegramConfig.token}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: "Markdown"
      })
    });
    if (!res.ok) {
      // Fallback in case Markdown is invalid
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: text
        })
      });
    }
  } catch (err: any) {
    addTelegramLog(`Failed to send Telegram message: ${err.message}`);
  }
}

async function sendTelegramPhoto(chatId: string, filePath: string, caption: string) {
  if (!telegramConfig.token) return;
  try {
    if (!fs.existsSync(filePath)) {
      addTelegramLog(`Cannot send photo: File ${filePath} does not exist.`);
      return;
    }
    const url = `https://api.telegram.org/bot${telegramConfig.token}/sendPhoto`;
    const fileBuffer = fs.readFileSync(filePath);
    const blob = new Blob([fileBuffer], { type: "image/png" });
    const formData = new FormData();
    formData.append("chat_id", chatId);
    formData.append("photo", blob, "screenshot.png");
    formData.append("caption", caption);
    
    await fetch(url, {
      method: "POST",
      body: formData
    });
    addTelegramLog(`Successfully sent photo ${filePath} to Telegram chat.`);
  } catch (err: any) {
    addTelegramLog(`Failed to send Telegram photo: ${err.message}`);
  }
}

async function handleTelegramMessage(message: any) {
  const chatId = message.chat.id.toString();
  const text = (message.text || "").trim();
  
  if (chatId !== telegramConfig.chatId) {
    addTelegramLog(`⚠️ Unauthorized access attempt from Chat ID: ${chatId}. Message ignored.`);
    await sendTelegramMessage(
      chatId, 
      `🔒 *Access Denied.* Chat ID \`${chatId}\` is not authorized on this Alice Agent instance.\n\nPlease configure this Chat ID inside your local OpenAutomation dashboard.`
    );
    return;
  }
  
  addTelegramLog(`👤 Received message: "${text}"`);
  
  const textLower = text.toLowerCase();
  
  if (text.startsWith("/start")) {
    const welcome = `🐺 *Welcome to Alice Telegram Pilot Bot (LOONAR V1.0)!* 🐺\n\nYou are securely connected to your offline automation host. From here, you can monitor, query, and run tasks on your system remotely.\n\n📚 *Available Commands:*\n• \`/help\` - View manual and guidelines\n• \`/status\` - Audit server CPU temperature and state\n• \`/ls\` - Traverse local workspace folders\n• \`/search <pattern>\` - Search workspace for keywords\n• \`/screenshot\` - Capture active desktop view\n\n🎯 *Raw Task:* Send any instruction directly (e.g. \`Create todo app in python\`) to trigger Alice in Autopilot mode!`;
    await sendTelegramMessage(chatId, welcome);
    return;
  }
  
  if (text.startsWith("/help")) {
    const help = `🛠️ *Alice Telegram Pilot Manual:*\n\n• *Raw Instructions:* Text any system automation or code task (e.g. "write a python hello world script"). Alice will run on autopilot, create files, compile them, and send the console output back to you.\n• \`/screenshot\` - Captures and uploads a photo of the current desktop visual buffer.\n• \`/status\` - Reports system platform info and active CPU load average.\n• \`/ls\` - Lists project files recursively.\n• \`/search <keyword>\` - Scans files for matching text lines.\n\n🔒 *Security:* All commands are isolated to your registered Chat ID. Telemetry is 100% disabled.`;
    await sendTelegramMessage(chatId, help);
    return;
  }
  
  if (text.startsWith("/status")) {
    const loads = os.loadavg();
    const freeMem = Math.round(os.freemem() / 1024 / 1024);
    const totalMem = Math.round(os.totalmem() / 1024 / 1024);
    const statusText = `🖥️ *Alice System Status Audit:*\n\n• *CPU Load Average:* ${loads[0].toFixed(2)}, ${loads[1].toFixed(2)}, ${loads[2].toFixed(2)}\n• *Memory Usage:* ${totalMem - freeMem} MB / ${totalMem} MB used\n• *Platform:* ${os.platform()} (${os.arch()})\n• *Alice Engine:* LOONAR v1.0.0 (Autopilot Remote Active)\n• *Status:* Standby, listening.`;
    await sendTelegramMessage(chatId, statusText);
    return;
  }
  
  if (text.startsWith("/screenshot")) {
    await sendTelegramMessage(chatId, `📸 Capturing active desktop display buffer...`);
    exec(`python3 alice/agent.py --mock --autopilot "Capture screenshot"`, async (err, stdout) => {
      if (fs.existsSync("alice_active_view.png")) {
        await sendTelegramPhoto(chatId, "alice_active_view.png", "🖥️ Active Display Screen Capture");
      } else {
        await sendTelegramMessage(chatId, `⚠️ No screenshot file generated. Run a task first to initialize the display.`);
      }
    });
    return;
  }
  
  if (text.startsWith("/ls") || text.startsWith("/explore")) {
    await sendTelegramMessage(chatId, `📁 Reading project files recursively...`);
    exec(`python3 alice/agent.py --mock --autopilot "list files"`, async (err, stdout) => {
      let output = stdout.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '').trim();
      const match = output.match(/```text([\s\S]*?)```/);
      let tree = match ? match[1].trim() : output;
      if (tree.length > 3800) {
        tree = tree.substring(0, 3800) + "\n\n...Truncated...";
      }
      await sendTelegramMessage(chatId, `📁 *Project Files Tree:*\n\`\`\`text\n${tree}\n\`\`\``);
    });
    return;
  }
  
  if (text.startsWith("/search")) {
    const query = text.replace(/^\/search\s*/i, "").trim();
    if (!query) {
      await sendTelegramMessage(chatId, `⚠️ Please specify a search pattern, e.g. \`/search LOONAR\``);
      return;
    }
    await sendTelegramMessage(chatId, `🔍 Searching workspace for "${query}"...`);
    exec(`python3 alice/agent.py --mock --autopilot "search '${query}'"`, async (err, stdout) => {
      let output = stdout.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '').trim();
      const match = output.match(/```text([\s\S]*?)```/);
      let results = match ? match[1].trim() : output;
      if (results.length > 3800) {
        results = results.substring(0, 3800) + "\n\n...Truncated...";
      }
      await sendTelegramMessage(chatId, `🔍 *Grep Results for "${query}":*\n\`\`\`text\n${results}\n\`\`\``);
    });
    return;
  }
  
  // Custom Raw Task Autopilot Execution
  await sendTelegramMessage(chatId, `⚙️ *Alice Autopilot Activated:* Running task: "${text}"...`);
  
  // Sanitize task input for shell safety
  const safeText = text.replace(/"/g, '\\"');
  
  exec(`python3 alice/agent.py --mock --autopilot "${safeText}"`, async (error, stdout, stderr) => {
    let output = stdout.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, ''); // Strip ANSI bash colors
    
    addTelegramLog(`🤖 Autopilot finished. Output length: ${output.length} characters.`);
    
    // Parse output to find clean answers or write blocks
    if (output.length > 3800) {
      output = output.substring(0, 3800) + "\n\n...(Output truncated due to length limits)...";
    }
    
    const replyText = `🤖 *Alice Execution Finished!* 🐺\n\n\`\`\`\n${output}\n\`\`\``;
    await sendTelegramMessage(chatId, replyText);
    
    // Send updated visual screenshot if it was generated
    if (fs.existsSync("alice_active_view.png")) {
      try {
        await sendTelegramPhoto(chatId, "alice_active_view.png", `🖥️ Active display state after task: "${text}"`);
      } catch (err: any) {
        addTelegramLog(`Failed to send post-execution screenshot: ${err.message}`);
      }
    }
  });
}

async function runPoll() {
  if (!telegramConfig.enabled || !telegramConfig.token) {
    isPolling = false;
    return;
  }
  
  isPolling = true;
  try {
    const url = `https://api.telegram.org/bot${telegramConfig.token}/getUpdates?offset=${lastUpdateId + 1}&timeout=5`;
    const res = await fetch(url);
    if (!res.ok) {
      const errText = await res.text();
      addTelegramLog(`Telegram Error: ${res.status} - ${errText}`);
      setTimeout(runPoll, 10000); // Back off on API error
      return;
    }
    
    const data: any = await res.json();
    if (data.ok && data.result) {
      for (const update of data.result) {
        lastUpdateId = Math.max(lastUpdateId, update.update_id);
        if (update.message) {
          await handleTelegramMessage(update.message);
        }
      }
    }
  } catch (error: any) {
    addTelegramLog(`Telegram network connection error: ${error.message}`);
  }
  
  if (telegramConfig.enabled) {
    setTimeout(runPoll, 1500);
  } else {
    isPolling = false;
  }
}

function startPolling() {
  if (isPolling) return;
  addTelegramLog("🚀 Starting Telegram Bot polling...");
  telegramConfig.enabled = true;
  runPoll();
}

function stopPolling() {
  addTelegramLog("🛑 Stopping Telegram Bot polling.");
  telegramConfig.enabled = false;
}

function loadConfig() {
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
      telegramConfig.token = data.token || "";
      telegramConfig.chatId = data.chatId || "";
      telegramConfig.enabled = !!data.enabled;
      addTelegramLog(`Loaded persistent configuration. Enabled state: ${telegramConfig.enabled}`);
      if (telegramConfig.enabled && telegramConfig.token) {
        startPolling();
      }
    } catch (e: any) {
      addTelegramLog(`Failed to parse persistent config: ${e.message}`);
    }
  } else {
    addTelegramLog("No previous Telegram Bot configurations found. Standby.");
  }
}

function saveConfig() {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(telegramConfig, null, 2), "utf-8");
  } catch (e: any) {
    addTelegramLog(`Failed to write persistent config: ${e.message}`);
  }
}

// Initial config loader
loadConfig();

// =========================================================================
// API ENDPOINTS FOR TELEGRAM CONTROL
// =========================================================================
app.get("/api/telegram/config", (req, res) => {
  res.json({
    token: telegramConfig.token ? `${telegramConfig.token.substring(0, 6)}...` : "",
    chatId: telegramConfig.chatId,
    enabled: telegramConfig.enabled,
    isPolling: isPolling
  });
});

app.post("/api/telegram/config", (req, res) => {
  const { token, chatId, enabled } = req.body;
  
  if (token && !token.endsWith("...")) {
    telegramConfig.token = token.trim();
  }
  
  if (chatId !== undefined) {
    telegramConfig.chatId = chatId.trim();
  }
  
  if (enabled !== undefined) {
    telegramConfig.enabled = enabled;
    if (enabled) {
      startPolling();
    } else {
      stopPolling();
    }
  }
  
  saveConfig();
  
  res.json({
    status: "success",
    config: {
      token: telegramConfig.token ? `${telegramConfig.token.substring(0, 6)}...` : "",
      chatId: telegramConfig.chatId,
      enabled: telegramConfig.enabled,
      isPolling: isPolling
    }
  });
});

app.get("/api/telegram/logs", (req, res) => {
  res.json({
    logs: telegramLogs
  });
});

// =========================================================================
// VITE OR STATIC BUILD SETUP
// =========================================================================
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
  });
}

startServer();

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
let telegramConfig = { token: "", chatId: "", enabled: false, githubRepo: "" };
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
    const welcome = `🐺 *Welcome to Alice Telegram Pilot Bot (LOONAR V1.0)!* 🐺\n\nYou are securely connected to your offline automation host. From here, you can monitor, query, and run tasks on your system remotely.\n\n📚 *Available Commands:*\n• \`/help\` - View manual and guidelines\n• \`/status\` - Audit server CPU temperature and state\n• \`/ls\` - Traverse local workspace folders\n• \`/search <pattern>\` - Search workspace for keywords\n• \`/screenshot\` - Capture active desktop view\n• \`/update [repo_url]\` - Update application from GitHub\n\n🎯 *Raw Task:* Send any instruction directly (e.g. \`Create todo app in python\`) to trigger Alice in Autopilot mode!`;
    await sendTelegramMessage(chatId, welcome);
    return;
  }
  
  if (text.startsWith("/help")) {
    const help = `🛠️ *Alice Telegram Pilot Manual:*\n\n• *Raw Instructions:* Text any system automation or code task (e.g. "write a python hello world script"). Alice will run on autopilot, create files, compile them, and send the console output back to you.\n• \`/screenshot\` - Captures and uploads a photo of the current desktop visual buffer.\n• \`/status\` - Reports system platform info and active CPU load average.\n• \`/ls\` - Lists project files recursively.\n• \`/search <keyword>\` - Scans files for matching text lines.\n• \`/update [repo_url]\` - Pulls the latest software version from GitHub, resolves packages, and rebuilds the application automatically.\n\n🔒 *Security:* All commands are isolated to your registered Chat ID. Telemetry is 100% disabled.`;
    await sendTelegramMessage(chatId, help);
    return;
  }

  if (text.startsWith("/update")) {
    const argsStr = text.replace(/^\/update\s*/i, "").trim();
    const repoUrl = argsStr || undefined;
    
    if (repoUrl) {
      telegramConfig.githubRepo = repoUrl;
      saveConfig();
    }
    
    await sendTelegramMessage(chatId, `🔄 *Alice Software Update Started...*\n\nPulling latest software modules from GitHub, running package updates, and compiling production builds. This might take 15-30 seconds...`);
    
    const result = await performUpdate(repoUrl);
    
    if (result.success) {
      const cleanLog = result.log.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');
      const trimmedLog = cleanLog.length > 3000 ? cleanLog.substring(0, 3000) + "\n\n...[Log Truncated]..." : cleanLog;
      await sendTelegramMessage(chatId, `✅ *Update Succeeded!* 🐺\n\nThe software has been updated to the latest GitHub release.\n\n*Log:*\n\`\`\`text\n${trimmedLog}\n\`\`\``);
      
      addTelegramLog("Scheduling server restart in 1.5 seconds to load updated code...");
      setTimeout(() => {
        process.exit(0);
      }, 1500);
    } else {
      const cleanLog = result.log.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');
      const trimmedLog = cleanLog.length > 3000 ? cleanLog.substring(0, 3000) + "\n\n...[Log Truncated]..." : cleanLog;
      await sendTelegramMessage(chatId, `❌ *Update Failed!* 🐺\n\nThere was an error updating the software. The current server will remain active.\n\n*Error Log:*\n\`\`\`text\n${trimmedLog}\n\`\`\``);
    }
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
  
  // Determine if it is a casual conversational chat vs a developer/automation task
  const isChat = !(/\b(write|create|make|build|script|program|code|run|execute|setup|install|test|todo|calculator|game|server|api|automation)\b/i.test(textLower));
  const safeText = text.replace(/"/g, '\\"');
  
  if (isChat) {
    // Conversational Q&A Chat Mode
    exec(`python3 alice/agent.py --mock --autopilot --clean "${safeText}"`, async (error, stdout, stderr) => {
      let output = stdout.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '').trim();
      addTelegramLog(`🤖 Conversational reply generated. Length: ${output.length} characters.`);
      
      if (!output) {
        output = "🐺 Sorry, I didn't generate a response. Please try asking again!";
      } else if (output.length > 3800) {
        output = output.substring(0, 3800) + "\n\n...(Output truncated due to length limits)...";
      }
      
      await sendTelegramMessage(chatId, output);
    });
    return;
  }
  
  // Custom Raw Developer/Automation Task Autopilot Execution
  await sendTelegramMessage(chatId, `⚙️ *Alice Autopilot Activated:* Running task: "${text}"...`);
  
  exec(`python3 alice/agent.py --mock --autopilot --clean "${safeText}"`, async (error, stdout, stderr) => {
    let output = stdout.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '').trim();
    
    addTelegramLog(`🤖 Autopilot finished. Output length: ${output.length} characters.`);
    
    if (output.length > 3800) {
      output = output.substring(0, 3800) + "\n\n...(Output truncated due to length limits)...";
    }
    
    const replyText = `🤖 *Alice Execution Finished!* 🐺\n\n${output}`;
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
      telegramConfig.githubRepo = data.githubRepo || "";
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

// Helper to run shell commands synchronously/asynchronously and return output
function runCmd(cmd: string, cwd: string = process.cwd()): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve) => {
    exec(cmd, { cwd }, (error, stdout, stderr) => {
      resolve({
        stdout: stdout || "",
        stderr: stderr || "",
        code: error ? (error.code || 1) : 0
      });
    });
  });
}

// Core updater module - clones/pulls git updates, npm install, and rebuilds
async function performUpdate(repoUrl?: string): Promise<{ success: boolean; log: string }> {
  let log = "";
  const appendLog = (msg: string) => {
    log += `[*] ${msg}\n`;
    addTelegramLog(`[Update] ${msg}`);
  };

  const urlToUse = repoUrl || telegramConfig.githubRepo;
  appendLog(`Starting software update. Using repository URL: ${urlToUse || "Not specified (using existing git repo)"}`);

  const hasGit = fs.existsSync(path.join(process.cwd(), ".git"));
  
  if (!hasGit) {
    if (!urlToUse) {
      return {
        success: false,
        log: log + `[!] Error: No Git repository (.git) found in workspace, and no GitHub repository URL is configured.\n\nPlease provide a GitHub URL (e.g. by running "/update https://github.com/... " or entering it in the dashboard).`
      };
    }

    appendLog("Initializing new Git repository...");
    let res = await runCmd("git init");
    log += res.stdout + res.stderr + "\n";
    if (res.code !== 0) return { success: false, log };

    appendLog(`Adding remote origin: ${urlToUse}`);
    res = await runCmd(`git remote add origin "${urlToUse}"`);
    log += res.stdout + res.stderr + "\n";
    
    appendLog("Fetching from remote origin...");
    res = await runCmd("git fetch origin");
    log += res.stdout + res.stderr + "\n";
    if (res.code !== 0) return { success: false, log };

    appendLog("Checking out main branch...");
    res = await runCmd("git checkout -f main || git checkout -f master");
    log += res.stdout + res.stderr + "\n";
    if (res.code !== 0) return { success: false, log };
  } else {
    if (urlToUse) {
      appendLog(`Updating remote origin URL to: ${urlToUse}`);
      await runCmd(`git remote set-url origin "${urlToUse}"`);
    }

    appendLog("Fetching latest changes from origin...");
    let res = await runCmd("git fetch --all");
    log += res.stdout + res.stderr + "\n";
    if (res.code !== 0) return { success: false, log };

    appendLog("Detecting current branch...");
    res = await runCmd("git rev-parse --abbrev-ref HEAD");
    const branchName = res.stdout.trim() || "main";
    appendLog(`Current branch detected: ${branchName}`);

    appendLog(`Resetting hard to origin/${branchName}...`);
    res = await runCmd(`git reset --hard "origin/${branchName}"`);
    log += res.stdout + res.stderr + "\n";
    if (res.code !== 0) return { success: false, log };
  }

  appendLog("Installing updated dependencies (npm install)...");
  let res = await runCmd("npm install");
  log += res.stdout + res.stderr + "\n";
  if (res.code !== 0) return { success: false, log };

  appendLog("Rebuilding application modules (npm run build)...");
  res = await runCmd("npm run build");
  log += res.stdout + res.stderr + "\n";
  if (res.code !== 0) return { success: false, log };

  appendLog("Update process completed successfully!");
  return { success: true, log };
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
// API ENDPOINTS FOR SOFTWARE UPDATE MANAGEMENT
// =========================================================================
app.get("/api/update/config", (req, res) => {
  res.json({
    githubRepo: telegramConfig.githubRepo || ""
  });
});

app.post("/api/update/config", (req, res) => {
  const { githubRepo } = req.body;
  if (githubRepo !== undefined) {
    telegramConfig.githubRepo = githubRepo.trim();
    saveConfig();
  }
  res.json({
    status: "success",
    githubRepo: telegramConfig.githubRepo
  });
});

app.post("/api/update/trigger", async (req, res) => {
  const { githubRepo } = req.body;
  if (githubRepo !== undefined) {
    telegramConfig.githubRepo = githubRepo.trim();
    saveConfig();
  }
  
  const result = await performUpdate();
  
  if (result.success) {
    res.json({
      success: true,
      log: result.log,
      message: "Software successfully updated. Server is restarting..."
    });
    
    // Restart server after sending response
    setTimeout(() => {
      process.exit(0);
    }, 1500);
  } else {
    res.json({
      success: false,
      log: result.log,
      message: "Update process failed. Check log for details."
    });
  }
});

// Full visual browser update dashboard endpoint (GET /update)
app.get("/update", async (req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Alice OpenAutomation Updater</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          background: #09090b;
          color: #f4f4f5;
          max-width: 800px;
          margin: 0 auto;
          padding: 40px 20px;
          line-height: 1.5;
        }
        .card {
          background: #18181b;
          border: 1px solid #27272a;
          border-radius: 16px;
          padding: 30px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
        }
        h1, h2, h3 {
          margin-top: 0;
          color: #ffffff;
        }
        .accent-purple {
          color: #a855f7;
        }
        .accent-green {
          color: #10b981;
        }
        .accent-red {
          color: #ef4444;
        }
        pre {
          background: #09090b;
          padding: 20px;
          border-radius: 12px;
          border: 1px solid #27272a;
          overflow-x: auto;
          max-height: 500px;
          font-family: "JetBrains Mono", "Fira Code", monospace;
          font-size: 12px;
          line-height: 1.6;
          color: #a1a1aa;
        }
        .spinner {
          border: 3px solid rgba(255, 255, 255, 0.1);
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border-left-color: #a855f7;
          animation: spin 1s linear infinite;
          display: inline-block;
          vertical-align: middle;
          margin-right: 15px;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .status-box {
          background: rgba(168, 85, 247, 0.1);
          border: 1px solid rgba(168, 85, 247, 0.2);
          padding: 15px 20px;
          border-radius: 10px;
          margin: 20px 0;
          display: flex;
          align-items: center;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          font-size: 11px;
          color: #52525b;
        }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>🐺 OpenAutomation <span class="accent-purple">Alice Updater</span></h1>
        <p>You have triggered the Git-based direct software updater.</p>
        
        <div id="status-container" class="status-box">
          <div class="spinner"></div>
          <div>
            <strong>🔄 Alice Update In Progress...</strong>
            <div style="font-size:12px; color:#a1a1aa; margin-top:2px;">Pulling latest sources from GitHub, upgrading packages, and rebuilding Vite modules...</div>
          </div>
        </div>
        
        <h3>Update Output Stream:</h3>
  `);

  // Force flush headers to browser
  if (typeof (res as any).flush === "function") {
    (res as any).flush();
  }

  const result = await performUpdate();

  if (result.success) {
    res.write(`
      <script>
        document.getElementById("status-container").className = "status-box";
        document.getElementById("status-container").style.background = "rgba(16, 185, 129, 0.1)";
        document.getElementById("status-container").style.borderColor = "rgba(16, 185, 129, 0.2)";
        document.getElementById("status-container").innerHTML = \`
          <div style="font-size: 24px; margin-right: 15px;">✅</div>
          <div>
            <strong class="accent-green">Update Completed Successfully!</strong>
            <div style="font-size:12px; color:#a1a1aa; margin-top:2px;">Alice has successfully updated to the latest GitHub build. The host is restarting in 1.5s...</div>
          </div>
        \`;
      </script>
      <h4>Detailed Activity Log:</h4>
      <pre>${result.log}</pre>
      </div>
      <div class="footer">&copy; 2026 OpenAutomation Project. Under the MIT License.</div>
      </body>
      </html>
    `);
    res.end();

    setTimeout(() => {
      process.exit(0);
    }, 1500);
  } else {
    res.write(`
      <script>
        document.getElementById("status-container").className = "status-box";
        document.getElementById("status-container").style.background = "rgba(239, 68, 68, 0.1)";
        document.getElementById("status-container").style.borderColor = "rgba(239, 68, 68, 0.2)";
        document.getElementById("status-container").innerHTML = \`
          <div style="font-size: 24px; margin-right: 15px;">❌</div>
          <div>
            <strong class="accent-red">Software Update Failed</strong>
            <div style="font-size:12px; color:#a1a1aa; margin-top:2px;">Check the output console log below to find and solve compilation or network errors. Current server is still active.</div>
          </div>
        \`;
      </script>
      <h4>Failure Output Log:</h4>
      <pre>${result.log}</pre>
      </div>
      <div class="footer">&copy; 2026 OpenAutomation Project. Under the MIT License.</div>
      </body>
      </html>
    `);
    res.end();
  }
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

/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const http = require("http");
const { exec } = require("child_process");
const { google } = require("googleapis");

// 1. Load env variables from .env.local
const envPath = path.join(__dirname, "../.env.local");
if (!fs.existsSync(envPath)) {
  console.error("Error: .env.local file not found at:", envPath);
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, "utf-8");
const getEnvVar = (name) => {
  const match = envContent.match(new RegExp(`^${name}\\s*=\\s*["']?([^"'\r\n]+)["']?`, "m"));
  return match ? match[1] : null;
};

const clientId = getEnvVar("GOOGLE_CLIENT_ID");
const clientSecret = getEnvVar("GOOGLE_CLIENT_SECRET");

if (!clientId || !clientSecret) {
  console.error("Error: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not found in .env.local");
  console.log("Please make sure you have added them. Example:");
  console.log('GOOGLE_CLIENT_ID="your_client_id"');
  console.log('GOOGLE_CLIENT_SECRET="your_client_secret"');
  process.exit(1);
}

const REDIRECT_PORT = 3005;
const REDIRECT_URI = `http://localhost:${REDIRECT_PORT}`;

const oauth2Client = new google.auth.OAuth2(
  clientId,
  clientSecret,
  REDIRECT_URI
);

// Generate auth URL
const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline", // crucial to get refresh token
  prompt: "consent",     // crucial to ensure refresh token is returned every time
  scope: ["https://www.googleapis.com/auth/drive"],
});

// Start local HTTP server to receive the callback
const server = http.createServer(async (req, res) => {
  try {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    if (parsedUrl.pathname === "/") {
      const code = parsedUrl.searchParams.get("code");
      if (code) {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end("<h1>Success!</h1><p>You can close this tab and return to the terminal.</p>");

        // Exchange code for tokens
        const { tokens } = await oauth2Client.getToken(code);
        const refreshToken = tokens.refresh_token;

        if (!refreshToken) {
          console.error("\nError: Did not receive a Refresh Token. Did you already authorize this application?");
          console.log("To reset consent and force a new refresh token, please remove the app from your Google account permissions at:");
          console.log("https://myaccount.google.com/connections");
          console.log("And run this script again.\n");
          server.close();
          process.exit(1);
        }

        console.log("\n=========================================");
        console.log("SUCCESS: Obtained Refresh Token successfully!");
        console.log("Refresh Token:", refreshToken);
        console.log("=========================================\n");

        // Append to .env.local
        let newEnvContent = envContent;
        if (envContent.includes("GOOGLE_REFRESH_TOKEN=")) {
          // Replace existing
          newEnvContent = envContent.replace(/^GOOGLE_REFRESH_TOKEN=.*$/m, `GOOGLE_REFRESH_TOKEN="${refreshToken}"`);
        } else {
          // Append new line
          newEnvContent += `\nGOOGLE_REFRESH_TOKEN="${refreshToken}"\n`;
        }

        fs.writeFileSync(envPath, newEnvContent, "utf-8");
        console.log("Automatically updated .env.local with GOOGLE_REFRESH_TOKEN!");
        
        server.close();
        process.exit(0);
      } else {
        res.writeHead(400, { "Content-Type": "text/plain" });
        res.end("Authorization code missing.");
        console.error("Authorization code missing in request.");
      }
    }
  } catch (err) {
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Error processing authentication.");
    console.error("Error handling request:", err);
  }
});

server.listen(REDIRECT_PORT, () => {
  console.log(`\nLocal server running at http://localhost:${REDIRECT_PORT}`);
  console.log("Opening your browser to complete Google Authentication...");
  console.log("\nIf the browser does not open automatically, please open this link:");
  console.log(authUrl);
  console.log("\nWaiting for authentication...\n");

  // Open browser automatically using start command
  const startCmd = process.platform === "win32" ? "start" : "open";
  // For windows start command, double quotes need to be handled correctly
  exec(`${startCmd} "" "${authUrl.replace(/&/g, "^&")}"`);
});

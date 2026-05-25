import dgram from "node:dgram";
import { WebSocketServer, WebSocket } from "ws";
import { parseTelemetry } from "./parser.js";
import express from "express";
import http from "http";
import path from "path";
import fs from "fs";
import { exec } from "child_process";

// 設定
const UDP_PORT = parseInt(process.env.UDP_PORT || "30000", 10);
const WS_PORT = parseInt(process.env.WS_PORT || "8080", 10); // HTTPとWebSocketでポートを共有

console.log("=== Forza Horizon 6 Telemetry Receiver & Web Server ===");

// 1. Express & HTTP サーバーのセットアップ
const app = express();
const server = http.createServer(app);

const currentDir = __dirname;

// 静的ファイルの提供 (ビルドされたフロントエンドUI)
// pkgでビルドした場合は currentDir/public になり、開発時は process.cwd()/public になる場合がある
const publicPaths = [
  path.join(currentDir, "public"),
  path.join(process.cwd(), "public"),
  path.join(currentDir, "..", "public")
];

let servePath = "";
for (const p of publicPaths) {
  if (fs.existsSync(p)) {
    servePath = p;
    break;
  }
}

if (servePath) {
  console.log(`[HTTP] Serving static UI files from: ${servePath}`);
  app.use(express.static(servePath));
} else {
  console.log("[HTTP] Warning: No 'public' directory found. Serving API only.");
  app.get("/", (req, res) => res.send("Forza Telemetry Server is running. UI files not found."));
}

// 2. WebSocket サーバーの起動 (HTTPサーバーにアタッチ)
const wss = new WebSocketServer({ server });
console.log(`[WS] WebSocket server attached to HTTP server`);

// 接続中クライアントの管理
const clients = new Set<WebSocket>();

wss.on("connection", (ws) => {
  console.log("[WS] Client connected");
  clients.add(ws);

  ws.on("close", () => {
    console.log("[WS] Client disconnected");
    clients.delete(ws);
  });

  ws.on("error", (error) => {
    console.error("[WS] Client error:", error);
    clients.delete(ws);
  });
});

// 3. UDP レシーバーの起動
const udpSocket = dgram.createSocket("udp4");

udpSocket.on("message", (msg, rinfo) => {
  try {
    const telemetryData = parseTelemetry(msg);
    const jsonStr = JSON.stringify(telemetryData);

    let sendCount = 0;
    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(jsonStr);
        sendCount++;
      }
    }

    if (telemetryData.timestampMs % 1000 < 50) {
      const speedKmh = Math.round(telemetryData.speed * 3.6);
      console.log(
        `[Telemetry] Active - Speed: ${speedKmh} km/h, RPM: ${Math.round(
          telemetryData.currentEngineRpm
        )}, Gear: ${telemetryData.gear}, RaceOn: ${telemetryData.isRaceOn} (Sent to ${sendCount} client(s))`
      );
    }
  } catch (error: any) {
    console.warn(`[Parser Warning] ${error.message} from ${rinfo.address}:${rinfo.port}`);
  }
});

udpSocket.on("listening", () => {
  const address = udpSocket.address();
  console.log(`[UDP] Listening for game telemetry on ${address.address}:${address.port}`);
  console.log(`[Config] Set "Data Out IP Address" to 127.0.0.1 and "Data Out IP Port" to ${address.port} in game HUD settings.`);
});

udpSocket.on("error", (err) => {
  console.error(`[UDP] Server error:\n${err.stack}`);
  udpSocket.close();
});

// ソケットのバインド
udpSocket.bind(UDP_PORT);

// 4. HTTPサーバーの起動とブラウザ自動オープン
server.listen(WS_PORT, () => {
  console.log(`[HTTP] Server is listening on http://localhost:${WS_PORT}`);
  
  if (servePath) {
    const url = `http://localhost:${WS_PORT}`;
    try {
      console.log(`[Browser] Opening ${url} ...`);
      const startCommand = process.platform === 'win32' ? 'start' : process.platform === 'darwin' ? 'open' : 'xdg-open';
      exec(`${startCommand} ${url}`);
    } catch (e) {
      console.error("[Browser] Failed to open browser automatically.");
    }
  }
});

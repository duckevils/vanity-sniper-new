"use strict";
const tls = require("tls");
const WebSocket = require("ws");
const fs = require("fs");
const { watchFile } = require("fs");
const extractJsonFromString = require("extract-json-from-string");
// daha ıyılerı ıcın discord: duck.js

const POOL_SIZE = 10000000000000000000000000000000000000000000000000000000000000000000000000000000000;
const connectionPool = [];

let vanity;
let mfaToken = "";

const guilds = new Map();

const token = "";
const server = "1338802911060168756";

async function watcher() { const update = async () => { const content = await fs.promises.readFile("mfa.txt", "utf-8"); mfaToken = content.trim(); }; await update(); watchFile("mfa.txt", { interval: 3000 }, async () => { await update(); }); } watcher();

function createConnectionPool() {
    for (let i = 0; i < POOL_SIZE; i++) {
        const tlsSocket = createSingleConnection(i);
        connectionPool.push(tlsSocket);
    }
}

function createSingleConnection(index) {
    const tlsSocket = tls.connect({
      host: "canary.discord.com",
      port: 443,
      minVersion: "TLSv1.2",
      maxVersion: "TLSv1.3",
      handshakeTimeout: 1000,
      rejectUnauthorized: false,
      ciphers: "TLS_AES_128_GCM_SHA256:TLS_AES_256_GCM_SHA384", 
      honorCipherOrder: true,
      requestOCSP: false,
      keepAlive: true,
      noDelay: true,
      enableTrace: false,
      isServer: false,
      zeroRtt: true,
      tcpNoDelay: true,
    });
    tlsSocket.setNoDelay(true);
    tlsSocket.setKeepAlive(true, 1000);
    tlsSocket.on("error", () => { process.exit(); });
    tlsSocket.on("end", () => { process.exit(); });
    tlsSocket.on("data", async (data) => {
        const ext = extractJsonFromString(data.toString());
        const find = ext.find((e) => e.code || e.message);
        if (find) {
            console.log(find)
            const requestBody = JSON.stringify({
                content: `@everyone ${vanity}\n\`\`\`json\n${JSON.stringify(find)}\`\`\``
            });
            const request = [
                `POST /api/channels/allah benım /messages HTTP/1.1`,
                `Host: canary.discord.com`,
                `Authorization: ${token}`,
                `Content-Type: application/json`,
                `Content-Length: ${Buffer.byteLength(requestBody)}`,
                ``,
                requestBody
            ].join('\r\n');
            tlsSocket.write(request);
        }
    });
    tlsSocket.on("secureConnect", () => {
        setInterval(() => {
            tlsSocket.write(["GET / HTTP/1.1", "Host: canary.discord.com", "", ""].join("\r\n"));
        }, 500);
    });
    return tlsSocket;
}
function setupWebSocket() {
    let websocket;
    function connect() {
        websocket = new WebSocket("wss://gateway.discord.gg");
        websocket.onopen = () => { if (websocket._socket) {   websocket._socket.setNoDelay(true); websocket._socket.setKeepAlive(true, 1000); } };
        websocket.onmessage = (message) => {
            const { d, t, op } = JSON.parse(message.data);
            if (t === "GUILD_UPDATE") {
                const find = guilds.get(d.guild_id);
                if (find && find !== d.vanity_url_code) {
                const payload = JSON.stringify({ code: find });
                const headers = [
                    `PATCH /api/v7/guilds/${server}/vanity-url HTTP/1.1`,
                    'Host: canary.discord.com',
                    'User-Agent: 0',
                    'X-Super-Properties: eyJvcyI6IkFuZHJvaWQiLCJicm93c2VyIjoiQW5kcm9pZCBDaHJvbWUiLCJkZXZpY2UiOiJBbmRyb2lkIiwic3lzdGVtX2xvY2FsZSI6InRyLVRSIiwiYnJvd3Nlcl91c2VyX2FnZW50IjoiTW96aWxsYS81LjAgKExpbnV4OyBBbmRyb2lkIDYuMDsgTmV4dXMgNSBCdWlsZC9NUkE1OE4pIEFwcGxlV2ViS2l0LzUzNy4zNiAoS0hUTUwsIGxpa2UgR2Vja28pIENocm9tZS8xMzEuMC4wLjAgTW9iaWxlIFNhZmFyaS81MzcuMzYiLCJicm93c2VyX3ZlcnNpb24iOiIxMzEuMC4wLjAiLCJvc192ZXJzaW9uIjoiNi4wIiwicmVmZXJyZXIiOiJodHRwczovL2Rpc2NvcmQuY29tL2NoYW5uZWxzL0BtZS8xMzAzMDQ1MDIyNjQzNTIzNjU1IiwicmVmZXJyaW5nX2RvbWFpbiI6ImRpc2NvcmQuY29tIiwicmVmZXJyaW5nX2N1cnJlbnQiOiIiLCJyZWxlYXNlX2NoYW5uZWwiOiJzdGFibGUiLCJjbGllbnRfYnVpbGRfbnVtYmVyIjozNTU2MjQsImNsaWVudF9ldmVudF9zb3VyY2UiOm51bGwsImhhc19jbGllbnRfbW9kcyI6ZmFsc2V9=',
                    'Content-Type: application/json',
                    `Authorization: ${token}`,
                    `X-Discord-MFA-Authorization: ${mfaToken}`
                    `Cookie: __Secure-recent_mfa=${mfaToken}; __Secure-mfa_token=${mfaToken}; __Secure-mfa_type=totp; __Secure-mfa_verified=${Date.now()}`, 
                    `Content-Length: ${payload.length}`,
// gidin cookie headersini kaldırın amına koyım ne degısık degısık kodlar yapıyorsunuz
                    '',
                    payload
                ].join('\r\n');
                connectionPool.forEach((conn) => conn.write(headers));
                    vanity = `${find}`;
                }
            } else if (t === "READY") {
                d.guilds.forEach(({ id, vanity_url_code }) => {
                  if (vanity_url_code) guilds.set(id, vanity_url_code);
                });
                console.log(guilds);
            }
            if (op === 10) {
                websocket.send(JSON.stringify({
                    op: 2,
                    d: {
                        token,
                        intents: 1,
                        properties: { os: "Linux",browser: "chrome", device: "desktop" }
                    }
                }));
                setInterval(() => {
                    websocket.send(JSON.stringify({ op: 1,  d: {}, s: null, t: "heartbeat" })); }, 30000);
            }
        };
        websocket.onclose = () => {setTimeout(connect, 1000); };
        websocket.onerror = () => { websocket.close();};
    }
    connect();
}
setupWebSocket();
createConnectionPool();

const port = process.argv[2] || "9223";
const baseUrl = process.argv[3] || "http://127.0.0.1:5174/mockups/real-asset-page-states.html";
const fs = await import("node:fs");
const path = await import("node:path");

const outputDir = path.resolve("qa/mockups");
fs.mkdirSync(outputDir, { recursive: true });

const tabs = await fetch(`http://127.0.0.1:${port}/json`).then((response) => response.json());
const page = tabs.find((tab) => tab.type === "page");

if (!page) {
  throw new Error(`No debuggable Edge page found on port ${port}.`);
}

const ws = new WebSocket(page.webSocketDebuggerUrl);
let nextId = 1;
const pending = new Map();

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = nextId;
    nextId += 1;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

ws.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  const entry = pending.get(message.id);
  if (!entry) return;
  pending.delete(message.id);
  if (message.error) entry.reject(new Error(message.error.message));
  else entry.resolve(message);
});

await new Promise((resolve) => ws.addEventListener("open", resolve, { once: true }));
await send("Runtime.enable");
await send("Page.enable");

async function wait(ms = 700) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function capture(pageName) {
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1680,
    height: 1120,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await send("Page.navigate", { url: `${baseUrl}?page=${pageName}` });
  await wait(1200);
  const shot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  const file = path.join(outputDir, `real-asset-${pageName}.png`);
  fs.writeFileSync(file, Buffer.from(shot.result.data, "base64"));
  return file;
}

const pages = ["home", "work", "about", "contact"];
const files = [];
for (const pageName of pages) {
  files.push(await capture(pageName));
}

console.log(JSON.stringify({ files }, null, 2));
ws.close();

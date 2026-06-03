const port = process.argv[2] || "9223";
const baseUrl = process.argv[3] || "http://127.0.0.1:5174";
const fs = await import("node:fs");
const path = await import("node:path");

const outputDir = path.resolve("qa/mockups/latest");
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

async function wait(ms = 1100) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function capture(pageName, options = {}) {
  await send("Emulation.setDeviceMetricsOverride", {
    width: options.width ?? 1680,
    height: options.height ?? 1120,
    deviceScaleFactor: 1,
    mobile: (options.width ?? 1680) < 768,
  });
  await send("Page.navigate", { url: `${baseUrl}/#${pageName}` });
  await wait();
  if (options.scrollTo) {
    await send("Runtime.evaluate", { expression: options.scrollTo, awaitPromise: true });
    await wait(500);
  }
  const shot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  const file = path.join(outputDir, options.fileName ?? `accepted-real-${pageName}.png`);
  fs.writeFileSync(file, Buffer.from(shot.result.data, "base64"));
  return file;
}

const files = [];
for (const pageName of ["home", "work", "about", "contact"]) {
  files.push(await capture(pageName));
}
files.push(await capture("work", { fileName: "accepted-real-work-cards.png", scrollTo: "window.scrollTo(0, 1120)" }));
files.push(await capture("work", { fileName: "accepted-real-work-footer.png", scrollTo: "window.scrollTo(0, document.documentElement.scrollHeight)" }));
files.push(await capture("about", { fileName: "accepted-real-about-skills.png", scrollTo: "document.querySelector('.proficiency-list')?.scrollIntoView({ block: 'center' })" }));
for (const pageName of ["home", "work", "about"]) {
  files.push(await capture(pageName, { width: 390, height: 1200, fileName: `accepted-real-${pageName}-mobile.png` }));
}
files.push(await capture("contact", { width: 390, height: 1200, fileName: "accepted-real-contact-mobile.png" }));

console.log(JSON.stringify({ files }, null, 2));
ws.close();

const port = process.argv[2] || "9225";
const output = process.argv[3] || "qa/gallery-modal.png";
const tabs = await fetch(`http://127.0.0.1:${port}/json`).then((response) => response.json());
const page = tabs.find((tab) => tab.type === "page");

if (!page) {
  throw new Error("No debuggable Edge page found.");
}

const ws = new WebSocket(page.webSocketDebuggerUrl);
let nextId = 1;
const pending = new Map();

function send(method, params = {}) {
  return new Promise((resolve) => {
    const id = nextId;
    nextId += 1;
    pending.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

ws.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (pending.has(message.id)) {
    pending.get(message.id)(message);
    pending.delete(message.id);
  }
});

await new Promise((resolve) => ws.addEventListener("open", resolve, { once: true }));
await send("Runtime.enable");
await send("Page.enable");
await new Promise((resolve) => setTimeout(resolve, 1000));
await send("Runtime.evaluate", {
  expression: '[...document.querySelectorAll(".view-project")][0].click()',
});
await new Promise((resolve) => setTimeout(resolve, 700));
const screenshot = await send("Page.captureScreenshot", { format: "png" });
const fs = await import("node:fs");
fs.writeFileSync(output, Buffer.from(screenshot.result.data, "base64"));
ws.close();
console.log(output);

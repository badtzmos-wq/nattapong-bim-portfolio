const port = process.argv[2] || "9227";
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
await new Promise((resolve) => setTimeout(resolve, 300));
await send("Runtime.evaluate", {
  expression: '[...document.querySelectorAll("button")].find((button) => button.textContent.trim() === "View full image").click()',
});
await new Promise((resolve) => setTimeout(resolve, 400));
await send("Input.dispatchKeyEvent", {
  type: "keyDown",
  key: "Escape",
  code: "Escape",
  windowsVirtualKeyCode: 27,
  nativeVirtualKeyCode: 27,
});
await send("Input.dispatchKeyEvent", {
  type: "keyUp",
  key: "Escape",
  code: "Escape",
  windowsVirtualKeyCode: 27,
  nativeVirtualKeyCode: 27,
});
await new Promise((resolve) => setTimeout(resolve, 400));
const result = await send("Runtime.evaluate", {
  expression: 'JSON.stringify({ lightbox: Boolean(document.querySelector(".lightbox-overlay")), detail: Boolean(document.querySelector(".detail-panel")) })',
  returnByValue: true,
});
console.log(result.result.result.value);
ws.close();

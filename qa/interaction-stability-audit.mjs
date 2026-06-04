const port = process.argv[2] || "9223";
const baseUrl = process.argv[3] || "http://127.0.0.1:5174";
const appUrl = baseUrl.replace(/\/$/, "");

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
await send("Page.enable");
await send("Runtime.enable");

async function wait(ms = 700) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitFor(expression, timeout = 7000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeout) {
    if (await evaluate(expression)) return;
    await wait(100);
  }
  throw new Error(`Timed out waiting for expression: ${expression}`);
}

async function evaluate(expression) {
  const result = await send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.result.exceptionDetails) {
    throw new Error(result.result.exceptionDetails.exception?.description || result.result.exceptionDetails.text || "Runtime.evaluate failed");
  }
  return result.result.result.value;
}

await send("Emulation.setDeviceMetricsOverride", {
  width: 1440,
  height: 1000,
  deviceScaleFactor: 1,
  mobile: false,
});
await send("Page.navigate", { url: `${appUrl}/#work` });
await waitFor(`document.querySelectorAll(".project-card").length > 0`);
await evaluate(`document.querySelector(".detail-close-icon")?.click();`);
await wait(500);
await evaluate(`window.dispatchEvent(new CustomEvent("open-project", { detail: "tracking-model-progress" }));`);
await waitFor(`Boolean(document.querySelector(".view-full-image"))`);

const opened = await evaluate(`Boolean(document.querySelector(".view-full-image"))`);
if (!opened) {
  const state = await evaluate(`JSON.stringify({ hash: location.hash, cards: document.querySelectorAll(".project-card").length, first: document.querySelector(".project-card .project-image")?.getBoundingClientRect().width || 0, detail: Boolean(document.querySelector(".detail-panel")) })`);
  throw new Error(`Project detail did not open before stability audit. State: ${state}`);
}

const result = await evaluate(String.raw`
  (async () => {
    const rect = (selector) => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const box = element.getBoundingClientRect();
      return {
        top: Math.round(box.top),
        left: Math.round(box.left),
        width: Math.round(box.width),
        height: Math.round(box.height),
      };
    };
    const diff = (a, b) => {
      if (!a || !b) return 999;
      return Math.max(
        Math.abs(a.top - b.top),
        Math.abs(a.left - b.left),
        Math.abs(a.width - b.width),
        Math.abs(a.height - b.height),
      );
    };
    document.querySelector(".view-full-image")?.click();
    await new Promise((resolve) => setTimeout(resolve, 350));
    const before = {
      panel: rect(".lightbox-panel"),
      canvas: rect(".lightbox-image-canvas"),
      nav: rect(".lightbox-nav"),
      src: document.querySelector(".lightbox-image")?.getAttribute("src") || "",
    };
    document.querySelector('[aria-label="Next image"]')?.click();
    await new Promise((resolve) => setTimeout(resolve, 350));
    const afterNext = {
      panel: rect(".lightbox-panel"),
      canvas: rect(".lightbox-image-canvas"),
      nav: rect(".lightbox-nav"),
      src: document.querySelector(".lightbox-image")?.getAttribute("src") || "",
    };
    document.querySelector('[aria-label="Previous image"]')?.click();
    await new Promise((resolve) => setTimeout(resolve, 350));
    const afterPrevious = {
      panel: rect(".lightbox-panel"),
      canvas: rect(".lightbox-image-canvas"),
      nav: rect(".lightbox-nav"),
      src: document.querySelector(".lightbox-image")?.getAttribute("src") || "",
    };
    return {
      before,
      afterNext,
      afterPrevious,
      nextChangedImage: before.src !== afterNext.src,
      previousReturnedImage: before.src === afterPrevious.src,
      maxShiftAfterNext: Math.max(diff(before.panel, afterNext.panel), diff(before.canvas, afterNext.canvas), diff(before.nav, afterNext.nav)),
      maxShiftAfterPrevious: Math.max(diff(before.panel, afterPrevious.panel), diff(before.canvas, afterPrevious.canvas), diff(before.nav, afterPrevious.nav)),
    };
  })()
`);

const failures = [];
if (!result.nextChangedImage) failures.push("lightbox Next did not change image");
if (!result.previousReturnedImage) failures.push("lightbox Previous did not return to the original image");
if (result.maxShiftAfterNext > 2) failures.push(`lightbox layout shifted ${result.maxShiftAfterNext}px after Next`);
if (result.maxShiftAfterPrevious > 2) failures.push(`lightbox layout shifted ${result.maxShiftAfterPrevious}px after Previous`);

console.log(JSON.stringify({ failures, result }, null, 2));
ws.close();

if (failures.length) {
  process.exit(1);
}

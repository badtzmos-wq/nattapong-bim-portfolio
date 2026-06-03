const port = process.argv[2] || "9223";
const baseUrl = process.argv[3] || "http://127.0.0.1:5174";
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

async function wait(ms = 600) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function setViewport(width, height, mobile = false) {
  await send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile,
  });
}

async function screenshot(output) {
  const shot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  const fs = await import("node:fs");
  fs.writeFileSync(output, Buffer.from(shot.result.data, "base64"));
}

async function evaluate(expression) {
  const result = await send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  return result.result.result.value;
}

async function capturePass(name, width, height, mobile) {
  await setViewport(width, height, mobile);
  await send("Page.navigate", { url: baseUrl });
  await wait(1200);
  await screenshot(`qa/${name}-hero.png`);

  await evaluate(`document.querySelector("#projects")?.scrollIntoView({ block: "start" })`);
  await wait(700);
  await screenshot(`qa/${name}-projects.png`);

  return evaluate(String.raw`
    (() => {
      const rect = (element) => {
        if (!element) return null;
        const box = element.getBoundingClientRect();
        return { top: box.top, bottom: box.bottom, height: box.height, width: box.width };
      };
      const rows = [...document.querySelectorAll("#projects .project-card")]
        .map((card) => ({
          card: rect(card),
          imageFit: getComputedStyle(card.querySelector(".project-image img")).objectFit,
          titleText: card.querySelector(".project-title")?.textContent?.trim(),
          title: rect(card.querySelector(".project-title")),
          description: rect(card.querySelector(".project-description")),
          tags: rect(card.querySelector(".project-tags")),
          cta: rect(card.querySelector(".view-project")),
        }))
        .filter((item) => item.card);
      const selectedImages = [...document.querySelectorAll("#work .project-image")]
        .map((item) => rect(item));
      const statOverflow = [...document.querySelectorAll(".stat-card")]
        .some((card) => card.scrollWidth > card.clientWidth || card.scrollHeight > card.clientHeight + 2);
      return {
        viewport: { width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth },
        statOverflow,
        selectedImageHeights: selectedImages.map((item) => item?.height),
        projectImageFits: [...new Set(rows.map((item) => item.imageFit))],
        firstProjectRows: rows.slice(0, 6),
      };
    })()
  `);
}

const desktop = await capturePass("layout-audit-desktop", 1440, 1200, false);
const mobile = await capturePass("layout-audit-mobile", 390, 1200, true);

console.log(JSON.stringify({ desktop, mobile }, null, 2));
ws.close();

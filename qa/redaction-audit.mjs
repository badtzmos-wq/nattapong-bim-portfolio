import fs from "node:fs";

const port = process.argv[2] || "9223";
const baseUrl = process.argv[3] || "http://127.0.0.1:5174";
const sensitiveOriginals = ["image65.png", "image68.png", "image71.png", "image72.png"];
const requiredRedacted = [
  "redacted/image65-redacted.png",
  "redacted/image68-redacted.png",
  "redacted/image71-redacted.png",
  "redacted/image72-redacted.png",
];

const dataSource = fs.readFileSync("src/data.ts", "utf8");
const trackingBlock = dataSource.match(/id: "tracking-model-progress"[\s\S]*?featured: true,/)?.[0] ?? "";
const sourceFailures = [];

for (const original of sensitiveOriginals) {
  if (trackingBlock.includes(`media("${original}")`)) {
    sourceFailures.push(`tracking data still references ${original}`);
  }
}

for (const redacted of requiredRedacted) {
  if (!trackingBlock.includes(`media("${redacted}")`)) {
    sourceFailures.push(`tracking data does not reference ${redacted}`);
  }
}

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

async function evaluate(expression) {
  const result = await send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  return result.result.result.value;
}

await send("Emulation.setDeviceMetricsOverride", {
  width: 390,
  height: 844,
  deviceScaleFactor: 1,
  mobile: true,
});
await send("Page.navigate", { url: `${baseUrl}/#work` });
await wait(900);
await evaluate(`
  document.querySelector(".detail-close-icon")?.click();
  document.querySelector(".detail-close")?.click();
`);
await wait(500);
await evaluate(`window.dispatchEvent(new CustomEvent("open-project", { detail: "tracking-model-progress" }));`);
await wait(900);

const rendered = await evaluate(String.raw`
  (() => {
    const srcs = [
      ...Array.from(document.querySelectorAll(".detail-preview-image, .gallery-thumb img")).map((img) => img.currentSrc || img.src),
    ];
    document.querySelector(".view-full-image")?.click();
    const lightboxSrc = document.querySelector(".lightbox-image")?.currentSrc || document.querySelector(".lightbox-image")?.src || "";
    return {
      title: document.querySelector("#project-detail-title")?.textContent?.trim(),
      srcs,
      lightboxSrc,
      previewFit: getComputedStyle(document.querySelector(".detail-preview-image")).objectFit,
      galleryThumbs: document.querySelectorAll(".gallery-thumb").length,
    };
  })()
`);

const renderedPaths = [...rendered.srcs, rendered.lightboxSrc].filter(Boolean);
const renderedFailures = [];

for (const original of sensitiveOriginals) {
  if (renderedPaths.some((src) => src.endsWith(`/portfolio/${original}`))) {
    renderedFailures.push(`rendered tracking gallery still exposes ${original}`);
  }
}

for (const redacted of requiredRedacted) {
  if (!renderedPaths.some((src) => src.includes(`/portfolio/${redacted}`))) {
    renderedFailures.push(`rendered tracking gallery missing ${redacted}`);
  }
}

if (rendered.title !== "Tracking Model Progress") {
  renderedFailures.push("tracking project modal did not open");
}

if (rendered.previewFit !== "contain") {
  renderedFailures.push("tracking preview is not object-fit: contain");
}

if (rendered.galleryThumbs < 8) {
  renderedFailures.push("tracking gallery thumbnails are missing");
}

const failures = [...sourceFailures, ...renderedFailures];
console.log(JSON.stringify({ failures, sourceFailures, renderedFailures, rendered }, null, 2));
ws.close();

if (failures.length) {
  process.exit(1);
}

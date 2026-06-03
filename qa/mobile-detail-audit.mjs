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
await send("Page.enable");
await send("Runtime.enable");

async function wait(ms = 500) {
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
  window.dispatchEvent(new CustomEvent("open-project", { detail: "clash-issue-reports" }));
`);
await wait(900);

const result = await evaluate(String.raw`
  (() => {
    const rectOf = (selector) => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return {
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      };
    };
    const overlaps = (a, b) => {
      if (!a || !b) return false;
      const x = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
      const y = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
      return x * y > 12;
    };

    const content = document.querySelector(".detail-content");
    const thumbs = Array.from(document.querySelectorAll(".gallery-thumb"));
    const preview = rectOf(".detail-preview-image");
    const viewFull = rectOf(".view-full-image");
    const closeIcon = rectOf(".detail-close-icon");
    const closeButton = rectOf(".close-button");

    if (content) {
      content.scrollTop = content.scrollHeight;
    }

    const contentAfter = rectOf(".detail-content");
    const lastThumb = thumbs.length ? thumbs[thumbs.length - 1].getBoundingClientRect() : null;
    const lastThumbRect = lastThumb ? {
      top: lastThumb.top,
      right: lastThumb.right,
      bottom: lastThumb.bottom,
      left: lastThumb.left,
      width: lastThumb.width,
      height: lastThumb.height,
    } : null;

    return {
      dialogOpen: Boolean(document.querySelector(".detail-panel")),
      preview,
      viewFull,
      closeIcon,
      closeButton,
      viewFullVisible: Boolean(viewFull && viewFull.width >= 44 && viewFull.height >= 44),
      closeIconVisible: Boolean(closeIcon && closeIcon.width >= 44 && closeIcon.height >= 44),
      closeButtonVisible: Boolean(closeButton && closeButton.width >= 44 && closeButton.height >= 36),
      viewFullDoesNotOverlapPreview: !overlaps(preview, viewFull),
      contentScrollable: Boolean(content && content.scrollHeight > content.clientHeight + 4),
      contentScrolledToBottom: Boolean(content && Math.ceil(content.scrollTop + content.clientHeight) >= content.scrollHeight - 2),
      thumbs: thumbs.length,
      contentAfter,
      lastThumb: lastThumbRect,
      lastThumbReachable: Boolean(contentAfter && lastThumbRect && lastThumbRect.bottom <= contentAfter.bottom + 1),
      noHorizontalOverflow: document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
    };
  })()
`);

const failures = [];
if (!result.dialogOpen) failures.push("project detail modal did not open");
if (!result.viewFullVisible) failures.push("View full image is not a usable touch target");
if (!result.viewFullDoesNotOverlapPreview) failures.push("View full image overlaps the preview image on mobile");
if (!result.closeIconVisible) failures.push("close icon is not visible or not touch-sized");
if (!result.closeButtonVisible) failures.push("Close button is not visible or not touch-sized");
if (!result.contentScrollable) failures.push("detail content is not scrollable");
if (!result.contentScrolledToBottom) failures.push("detail content cannot scroll to bottom");
if (!result.thumbs) failures.push("gallery thumbnails are missing");
if (!result.lastThumbReachable) failures.push("last gallery thumbnail is not reachable at the bottom of the scroll area");
if (!result.noHorizontalOverflow) failures.push("mobile detail has horizontal overflow");

console.log(JSON.stringify({ failures, result }, null, 2));
ws.close();

if (failures.length) {
  process.exit(1);
}

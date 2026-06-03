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

async function wait(ms = 900) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForHash(hash, timeout = 4000) {
  const target = `#${hash}`;
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeout) {
    const currentHash = await evaluate("location.hash");
    const readyState = await evaluate("document.readyState");
    if (currentHash === target && readyState === "complete") return;
    await wait(100);
  }

  throw new Error(`Timed out waiting for ${target}.`);
}

async function setViewport(width, height = 1200) {
  await send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width < 768,
  });
}

async function evaluate(expression) {
  const result = await send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  return result.result.result.value;
}

async function audit(hash, width) {
  await setViewport(width);
  await send("Page.navigate", { url: `${baseUrl}/#${hash}` });
  await waitForHash(hash);
  await wait(350);
  return evaluate(String.raw`
    (() => {
      const box = (selector) => {
        const element = document.querySelector(selector);
        if (!element) return null;
        const rect = element.getBoundingClientRect();
        return {
          top: rect.top,
          left: rect.left,
          right: rect.right,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height,
        };
      };
      const overlaps = (a, b) => {
        if (!a || !b) return false;
        const x = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
        const y = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
        return x * y > 120;
      };
      const heroCopy = box(".hero-copy");
      const heroEvidence = box(".hero-evidence");
      const cvHero = box(".cv-hero");
      const cvColumns = box(".cv-columns");
      const cvSidebar = box(".cv-sidebar");
      return {
        hash: location.hash,
        width: innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        noHorizontalOverflow: document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
        heroCopy,
        heroEvidence,
        cvHero,
        cvColumns,
        cvSidebar,
        heroCopyWideEnough: !heroCopy || heroCopy.width >= Math.min(300, innerWidth - 40),
        cvHeroWideEnough: !cvHero || cvHero.width >= Math.min(300, innerWidth - 40),
        cvColumnsWideEnough: !cvColumns || cvColumns.width >= Math.min(300, innerWidth - 40),
        cvSidebarWideEnough: !cvSidebar || cvSidebar.width >= Math.min(300, innerWidth - 40),
        aboutSidebarDoesNotOverlap: !cvSidebar || (!overlaps(cvSidebar, cvHero) && !overlaps(cvSidebar, cvColumns)),
        heroDoesNotOverlapText: !heroEvidence || !overlaps(heroEvidence, heroCopy),
      };
    })()
  `);
}

const widths = [390, 768];
const hashes = ["home", "work", "about", "contact"];
const results = [];

for (const width of widths) {
  for (const hash of hashes) {
    results.push(await audit(hash, width));
  }
}

const failures = results.filter((result) => (
  !result.noHorizontalOverflow ||
  !result.heroCopyWideEnough ||
  !result.cvHeroWideEnough ||
  !result.cvColumnsWideEnough ||
  !result.cvSidebarWideEnough ||
  !result.aboutSidebarDoesNotOverlap ||
  !result.heroDoesNotOverlapText
));

console.log(JSON.stringify({ failures, results }, null, 2));
ws.close();

if (failures.length) {
  process.exit(1);
}

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

async function wait(ms = 900) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function setViewport(width) {
  await send("Emulation.setDeviceMetricsOverride", {
    width,
    height: width < 768 ? 1200 : 1120,
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

async function auditPage(width, hash) {
  await setViewport(width);
  await send("Page.navigate", { url: `${baseUrl}/#${hash}` });
  await wait();
  return evaluate(String.raw`
    (() => {
      const role = document.querySelector(".hero-role");
      const footer = document.querySelector(".site-footer");
      const top = document.querySelector(".back-to-top");
      const cards = [...document.querySelectorAll(".project-card")];
      const cardImages = cards.map((card) => card.querySelector(".project-image")?.getBoundingClientRect().height || 0);
      const toolText = [...document.querySelectorAll(".proficiency-chip")].map((item) => ({
        text: item.textContent.trim(),
        overflow: item.scrollWidth > item.clientWidth + 1,
      }));
      const proficiencyGrouped = [...document.querySelectorAll(".proficiency-row")].every((row) => (
        row.querySelector(".proficiency-tools") && row.querySelectorAll(".proficiency-chip").length > 0
      ));
      const evidence = document.querySelector(".hero-evidence");
      const heroAfter = evidence ? getComputedStyle(evidence, "::after") : null;
      const roleStyle = role ? getComputedStyle(role) : null;
      const topRect = top?.getBoundingClientRect();
      const footerRect = footer?.getBoundingClientRect();
      return {
        hash: location.hash,
        width: innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        noHorizontalOverflow: document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
        roleSingleLine: !role || innerWidth < 1200 || role.scrollHeight <= parseFloat(roleStyle.lineHeight) * 1.35,
        heroImages: [...document.querySelectorAll(".hero-model img")].map((img) => img.getAttribute("src")),
        heroGuideHidden: !heroAfter || heroAfter.content === "none" || heroAfter.display === "none" || parseFloat(heroAfter.height) === 0,
        cardImageHeights: cardImages.slice(0, 6),
        cardImageHeightSpread: cardImages.length ? Math.max(...cardImages) - Math.min(...cardImages) : 0,
        toolTextFits: proficiencyGrouped && toolText.every((item) => !item.overflow),
        topAvoidsFooter: !topRect || !footerRect || topRect.bottom < footerRect.top || footerRect.top > innerHeight,
      };
    })()
  `);
}

const widths = [390, 768, 1366, 1680, 1920, 2560];
const results = [];
for (const width of widths) {
  for (const hash of ["home", "work", "about", "contact"]) {
    results.push(await auditPage(width, hash));
  }
}

const failures = results.filter((result) => (
  !result.noHorizontalOverflow ||
  !result.roleSingleLine ||
  !result.heroGuideHidden ||
  !result.toolTextFits ||
  !result.topAvoidsFooter ||
  result.cardImageHeightSpread > 2
));

console.log(JSON.stringify({ failures, results }, null, 2));
ws.close();

if (failures.length) {
  process.exit(1);
}

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

async function setViewport(width, height = 1120) {
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

async function navigate(hash, width = 1680, height = 1120) {
  await setViewport(width, height);
  await send("Page.navigate", { url: `${baseUrl}/#${hash}` });
  await wait();
}

const results = {};

await navigate("home", 1680);
results.home = await evaluate(String.raw`
  (() => {
    const evidence = document.querySelector(".hero-evidence");
    const after = evidence ? getComputedStyle(evidence, "::after") : null;
    return {
      hasEvidence: Boolean(evidence),
      pseudoContent: after?.content,
      pseudoDisplay: after?.display,
      pseudoHeight: after?.height,
      noGuideLine: !after || after.content === "none" || after.display === "none" || parseFloat(after.height) === 0,
    };
  })()
`);

await navigate("work", 1680);
results.workCards = await evaluate(String.raw`
  (() => {
    const cards = [...document.querySelectorAll(".project-card")];
    const images = cards.map((card) => {
      const frame = card.querySelector(".project-image");
      const canvas = card.querySelector(".project-image-canvas");
      const image = card.querySelector(".project-image img");
      const frameRect = frame?.getBoundingClientRect();
      const imageRect = image?.getBoundingClientRect();
      const styles = image ? getComputedStyle(image) : null;
      return {
        title: card.querySelector(".project-title")?.textContent?.trim(),
        objectFit: styles?.objectFit,
        frameHeight: frameRect?.height || 0,
        imageHeight: imageRect?.height || 0,
        canvasPadding: canvas ? parseFloat(getComputedStyle(canvas).paddingTop) : 0,
      };
    });
    const heights = images.map((item) => item.frameHeight).filter(Boolean);
    return {
      count: images.length,
      allContain: images.every((item) => item.objectFit === "contain"),
      heightSpread: heights.length ? Math.max(...heights) - Math.min(...heights) : 0,
      compactCanvas: images.every((item) => item.canvasPadding <= 8),
      sampledImages: images.slice(0, 9),
    };
  })()
`);

await send("Runtime.evaluate", { expression: "window.scrollTo(0, document.documentElement.scrollHeight)", awaitPromise: true });
await wait(600);
results.workFooter = await evaluate(String.raw`
  (() => {
    const top = document.querySelector(".back-to-top");
    const footer = document.querySelector(".site-footer");
    const topRect = top?.getBoundingClientRect();
    const footerRect = footer?.getBoundingClientRect();
    return {
      topVisible: Boolean(top),
      footerVisible: footerRect ? footerRect.top < innerHeight : false,
      topAvoidsFooter: !top || !footerRect || footerRect.top >= innerHeight || topRect.bottom < footerRect.top,
    };
  })()
`);

await navigate("about", 1680);
results.about = await evaluate(String.raw`
  (() => {
    const sidebarLinks = [...document.querySelectorAll(".cv-sidebar a")].map((link) => link.textContent.trim());
    const proficiencyRows = [...document.querySelectorAll(".proficiency-row")].map((row) => ({
      level: row.querySelector("strong")?.textContent?.trim(),
      chipCount: row.querySelectorAll(".proficiency-chip").length,
      hasChipWrap: Boolean(row.querySelector(".proficiency-tools")),
      overflow: row.scrollWidth > row.clientWidth + 1,
      height: row.getBoundingClientRect().height,
    }));
    return {
      noLongLinkedInText: sidebarLinks.every((text) => !text.includes("5245a6140")),
      sidebarLinks,
      proficiencyRows,
      groupedProficiency: proficiencyRows.length === 3 && proficiencyRows.every((row) => row.hasChipWrap && row.chipCount >= 1 && !row.overflow),
    };
  })()
`);

await navigate("contact", 1680);
results.contact = await evaluate(String.raw`
  (() => ({
    noDrawingBand: !document.querySelector(".drawing-band, .contact-drawing, .contact-band"),
    footerPresent: Boolean(document.querySelector(".site-footer")),
    contactMethods: document.querySelectorAll(".contact-method").length,
  }))()
`);

const failures = [];
if (!results.home.noGuideLine) failures.push("Home hero guide line is still rendered");
if (!results.workCards.allContain) failures.push("A project card image is not object-fit: contain");
if (results.workCards.heightSpread > 2) failures.push("Project card image heights are inconsistent");
if (!results.workCards.compactCanvas) failures.push("Project card image canvas padding is still too large");
if (results.workFooter.topVisible && results.workFooter.footerVisible) failures.push("Floating Top button is visible while footer is in view");
if (!results.about.noLongLinkedInText) failures.push("About still displays the long LinkedIn URL");
if (!results.about.groupedProficiency) failures.push("About proficiency is not rendered as grouped chip rows");
if (!results.contact.noDrawingBand) failures.push("Contact drawing band is still rendered");

console.log(JSON.stringify({ failures, results }, null, 2));
ws.close();

if (failures.length) {
  process.exit(1);
}

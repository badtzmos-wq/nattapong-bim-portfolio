const tabs = await fetch("http://127.0.0.1:9223/json").then((response) => response.json());
const page = tabs.find((tab) => tab.type === "page");

if (!page) {
  throw new Error("No debuggable Edge page found.");
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
await send("Emulation.setDeviceMetricsOverride", {
  width: 390,
  height: 1200,
  deviceScaleFactor: 1,
  mobile: true,
});
await send("Page.navigate", { url: "http://127.0.0.1:5174/#work" });
await new Promise((resolve) => setTimeout(resolve, 1200));

const expression = String.raw`
(async () => {
  const text = (selector) => document.querySelector(selector)?.textContent || "";
  const all = (selector) => [...document.querySelectorAll(selector)];
  const clickText = (selector, label) => {
    const element = all(selector).find((item) => item.textContent.trim() === label);
    if (!element) return false;
    element.click();
    return true;
  };
  const setInput = (selector, value) => {
    const element = document.querySelector(selector);
    if (!element) return false;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
    setter.call(element, value);
    element.dispatchEvent(new Event("input", { bubbles: true }));
    return true;
  };
  const wait = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms));

  clickText("button", "Reset filters");
  setInput("input[type=search]", "");
  clickText("button", "All");
  await wait();

  const initial = {
    hash: window.location.hash,
    innerWidth: window.innerWidth,
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    projectCount: text("[aria-live=polite]"),
  };

  document.querySelector(".hamburger")?.click();
  await wait();
  const menu = {
    expanded: document.querySelector(".hamburger")?.getAttribute("aria-expanded"),
    links: all(".mobile-link").length,
  };
  clickText(".mobile-link", "About");
  await wait(500);
  const mobileNavigation = {
    hashAfterAbout: window.location.hash,
    menuClosed: document.querySelector(".hamburger")?.getAttribute("aria-expanded") === "false",
  };
  window.location.hash = "work";
  await wait(500);

  clickText("button", "BIM Coordination & Management");
  await wait();
  const coordination = text("[aria-live=polite]");

  setInput("input[type=search]", "Power BI");
  await wait();
  const searched = text("[aria-live=polite]");

  setInput("input[type=search]", "zzzz-no-match");
  await wait();
  const empty = Boolean(document.querySelector(".empty-state"));

  clickText("button", "Reset filters");
  await wait();
  const reset = text("[aria-live=polite]");

  const detailButton = all(".view-project")[0];
  detailButton?.click();
  await wait(380);
  const previewImage = document.querySelector(".detail-preview-image");
  const closeButton = document.querySelector(".close-button");
  const closeButtonRect = closeButton?.getBoundingClientRect();
  const detailContent = document.querySelector(".detail-content");
  const viewFullButton = all("button").find((item) => item.textContent.trim() === "View full image");
  const imageCanvas = document.querySelector(".project-image-canvas");
  const firstPreviewSrc = previewImage?.getAttribute("src") || "";
  const galleryThumbs = all(".gallery-thumb");
  galleryThumbs[1]?.click();
  await wait();
  const secondPreviewSrc = document.querySelector(".detail-preview-image")?.getAttribute("src") || "";
  clickText("button", "View full image");
  await wait(550);
  const lightboxBeforeNext = document.querySelector(".lightbox-image")?.getAttribute("src") || "";
  const lightboxCanvas = document.querySelector(".lightbox-image-canvas");
  const lightboxCanvasBackground = lightboxCanvas ? getComputedStyle(lightboxCanvas).backgroundColor : "";
  document.querySelector('[aria-label="Next image"]')?.click();
  await wait();
  const lightboxAfterNext = document.querySelector(".lightbox-image")?.getAttribute("src") || "";
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  await wait(350);
  const lightboxClosedByEsc = !document.querySelector(".lightbox-overlay");
  const modalStillOpenAfterEsc = Boolean(document.querySelector("#project-detail-title"));
  const detailCloseIcon = document.querySelector(".detail-close-icon");
  const detailCloseRect = detailCloseIcon?.getBoundingClientRect();

  const expanded = {
    dialogOpenBeforeClose: Boolean(document.querySelector("#project-detail-title")),
    previewObjectFit: previewImage ? getComputedStyle(previewImage).objectFit : "",
    galleryThumbs: galleryThumbs.length,
    thumbnailChangesPreview: Boolean(firstPreviewSrc && secondPreviewSrc && firstPreviewSrc !== secondPreviewSrc),
    viewFullButtonVisible: Boolean(viewFullButton),
    lightboxOpened: Boolean(lightboxBeforeNext),
    lightboxNextWorks: Boolean(lightboxBeforeNext && lightboxAfterNext && lightboxBeforeNext !== lightboxAfterNext),
    lightboxClosedByEsc,
    modalStillOpenAfterEsc,
    lightboxCanvasBackground,
    detailCloseIconVisible: Boolean(detailCloseIcon && detailCloseRect?.width >= 44 && detailCloseRect?.height >= 44),
    closeButtonVisible: Boolean(closeButton && closeButtonRect?.width >= 44 && closeButtonRect?.height >= 36),
    cardCanvasBackground: imageCanvas ? getComputedStyle(imageCanvas).backgroundColor : "",
    detailContentScrollable: detailContent ? detailContent.scrollHeight > detailContent.clientHeight : false,
  };
  document.querySelector(".close-button")?.click();
  await wait(500);
  expanded.dialogClosed = !document.querySelector("#project-detail-title");

  window.location.hash = "contact";
  await wait(500);
  const links = {
    email: Boolean(document.querySelector('a[href="mailto:badtz.mos@gmail.com"]')),
    phone: Boolean(document.querySelector('a[href="tel:0850331812"]')),
    cv: Boolean(document.querySelector('a[href="/files/Nattapong-Loes-a-nan-CV-Portfolio.pdf"]')),
    linkedin: Boolean(document.querySelector('a[href="https://www.linkedin.com/in/nattapong-loes-a-nan-5245a6140/"]')),
  };

  window.location.hash = "home";
  await wait(500);
  const home = {
    hash: window.location.hash,
    heroImages: all(".hero-model img").map((image) => image.getAttribute("src")),
    noPaperCanvasInHero: all(".hero-evidence .project-image-canvas").length === 0,
  };

  return { initial, menu, mobileNavigation, coordination, searched, empty, reset, expanded, links, home };
})()
`;

const result = await send("Runtime.evaluate", {
  expression,
  awaitPromise: true,
  returnByValue: true,
});

if (result.exceptionDetails || !result.result?.result) {
  console.error(JSON.stringify(result.exceptionDetails ?? result, null, 2));
  ws.close();
  process.exit(1);
}

const value = result.result.result.value;
const failures = [];

if (value.initial.hash !== "#work") failures.push("work hash did not load");
if (value.initial.scrollWidth > value.initial.clientWidth + 1) failures.push("mobile horizontal overflow detected");
if (value.menu.links !== 4 || value.mobileNavigation.hashAfterAbout !== "#about" || !value.mobileNavigation.menuClosed) failures.push("mobile navigation failed");
if (!value.coordination.includes("Showing 2 of 15")) failures.push("category filter failed");
if (!value.searched.includes("Showing 1 of 15")) failures.push("search failed");
if (!value.empty) failures.push("empty state failed");
if (!value.reset.includes("Showing 15 of 15")) failures.push("reset filters failed");
if (!value.expanded.dialogOpenBeforeClose) failures.push("project modal did not open");
if (value.expanded.previewObjectFit !== "contain") failures.push("detail preview is not object-fit contain");
if (value.expanded.galleryThumbs < 1) failures.push("gallery thumbnails missing");
if (!value.expanded.thumbnailChangesPreview) failures.push("thumbnail selection did not change preview");
if (!value.expanded.viewFullButtonVisible) failures.push("View full image button missing");
if (!value.expanded.lightboxOpened || !value.expanded.lightboxNextWorks) failures.push("lightbox did not open or next failed");
if (!value.expanded.lightboxClosedByEsc || !value.expanded.modalStillOpenAfterEsc) failures.push("Esc lightbox behavior failed");
if (value.expanded.lightboxCanvasBackground !== "rgb(255, 255, 255)") failures.push("lightbox white canvas missing");
if (!value.expanded.detailCloseIconVisible || !value.expanded.closeButtonVisible) failures.push("modal close controls missing");
if (!value.expanded.detailContentScrollable) failures.push("project detail content is not scrollable");
if (!value.expanded.dialogClosed) failures.push("modal did not close");
if (!value.links.email || !value.links.phone || !value.links.cv || !value.links.linkedin) failures.push("contact links missing");
if (value.home.hash !== "#home" || value.home.heroImages.length !== 2 || !value.home.noPaperCanvasInHero) failures.push("home hero image setup failed");

console.log(JSON.stringify({ failures, ...value }, null, 2));
ws.close();

if (failures.length) {
  process.exit(1);
}

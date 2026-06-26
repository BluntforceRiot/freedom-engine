import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.FREEDOM_ENGINE_BASE_URL ?? "http://127.0.0.1:4174/";
const outputDir = path.resolve("output/playwright");

await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const errors = [];

page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});
page.on("pageerror", (error) => errors.push(error.message));

await page.goto(baseUrl, { waitUntil: "networkidle" });
await assertNoHorizontalOverflow();
await expectVisibleText("Red, White & Boomtown");
await expectHidden("#build-panel");
await expectHidden("#stats-panel");
await page.screenshot({ path: path.join(outputDir, "red-white-boomtown-title.png"), fullPage: true });
await setViewportAndSettle(390, 844);
await assertNoHorizontalOverflow();
await page.screenshot({ path: path.join(outputDir, "red-white-boomtown-mobile-title.png"), fullPage: true });
await setViewportAndSettle(1440, 900);
await assertNoHorizontalOverflow();

await page.getByRole("button", { name: "HOW THIS NONSENSE WORKS" }).click();
await expectVisibleText("Mayor's Clipboard");
await page.screenshot({ path: path.join(outputDir, "red-white-boomtown-placement-tutorial.png"), fullPage: true });

await page.getByRole("button", { name: "START THE FOURTH" }).click();
await page.waitForTimeout(1000);
await expectVisibleText("Civic Panic Meter");
await expectVisibleText("Build Menu");
await expectVisibleText("Bathroom Pressure");
await assertMapReady();
await assertCanvasMounted();
await page.screenshot({ path: path.join(outputDir, "red-white-boomtown-dashboard.png"), fullPage: true });
await setViewportAndSettle(390, 844);
await assertNoHorizontalOverflow();
await page.screenshot({ path: path.join(outputDir, "red-white-boomtown-mobile-dashboard.png"), fullPage: true });
await setViewportAndSettle(1440, 900);
await assertNoHorizontalOverflow();

await pick("Food & Vendors", "hotdog");
await place([970, 260]);
await expectVisibleText("Needs nearby path.");

await buildFestival();
await page.screenshot({ path: path.join(outputDir, "red-white-boomtown-built-festival.png"), fullPage: true });

await page.getByRole("button", { name: /Advance Phase/ }).first().click();
await page.waitForTimeout(450);
await expectVisibleText("Afternoon Crowd Surge");
await page.screenshot({ path: path.join(outputDir, "red-white-boomtown-phase-banner.png"), fullPage: true });

for (let i = 0; i < 4; i += 1) {
  await page.getByRole("button", { name: /Advance Phase|Resolve Finale|Show Recap/ }).first().click();
  await page.waitForTimeout(i === 3 ? 900 : 450);
  if (i === 2) {
    await page.screenshot({ path: path.join(outputDir, "red-white-boomtown-finale.png"), fullPage: true });
  }
}

await page.screenshot({ path: path.join(outputDir, "red-white-boomtown-endgame.png"), fullPage: true });
await expectVisibleText("Liberty Park Gazette Final Edition");
await expectVisibleText("Overall Festival Grade");
await page.getByRole("button", { name: "Copy Recap" }).click();
const recap = await page.evaluate(() => document.body.dataset.lastRecap ?? "");

await page.setViewportSize({ width: 1280, height: 720 });
await assertNoHorizontalOverflow();
await page.setViewportSize({ width: 1440, height: 900 });
await assertNoHorizontalOverflow();

const body = await page.locator("body").innerText();
const result = {
  baseUrl,
  errors,
  titleVisible: body.includes("Red, White & Boomtown"),
  hudHiddenBeforeStart: true,
  mapReady: await page.locator("#scene-root[data-map-ready='true']").count(),
  endVisible: await page.locator(".end-card").isVisible(),
  hasGazette: body.includes("GAZETTE FINAL EDITION") || body.includes("Gazette Final Edition"),
  hasAward: (await page.locator(".award-list span").count()) > 0,
  hasRecap: recap.length > 20,
  statText: await page.locator("#stats-panel").innerText(),
};

console.log(JSON.stringify(result, null, 2));
await browser.close();

if (result.errors.length || !result.titleVisible || !result.endVisible || !result.hasGazette || !result.hasAward || !result.hasRecap) {
  process.exit(1);
}

async function buildFestival() {
  await pick("Paths", "path");
  for (const point of [
    [470, 330],
    [530, 360],
    [590, 390],
    [650, 420],
    [710, 450],
    [770, 480],
    [830, 510],
  ]) {
    await place(point);
  }

  await pick("Food & Vendors", "hotdog");
  await place([545, 325]);
  await pick("Food & Vendors", "lemonade");
  await place([610, 350]);
  await pick("Food & Vendors", "funnelCake");
  await place([690, 380]);
  await pick("Services", "bathroom");
  await place([735, 410]);
  await pick("Services", "trashCan");
  await place([795, 440]);
  await pick("Services", "fireCrew");
  await place([860, 470]);
  await pick("Services", "fireMarshal");
  await place([920, 500]);
  await pick("Parade", "paradeStaging");
  await place([500, 430]);
  await pick("Parade", "paradeRoute");
  for (const point of [
    [560, 455],
    [620, 480],
    [680, 505],
  ]) {
    await place(point);
  }
  await pick("Parade", "veteransFloat");
  await place([740, 530]);
  await pick("Carnival", "ferrisWheel");
  await place([820, 360]);
  await pick("Paths", "viewing");
  await place([900, 390]);
  await pick("Fireworks", "launchZone");
  await place([980, 455]);
  await pick("Fireworks", "safetyBarrier");
  await place([940, 430]);
  await pick("Fireworks", "finaleControl");
  await place([1020, 500]);
}

async function pick(category, toolId) {
  await page.getByRole("button", { name: category, exact: true }).click();
  await page.locator(`[data-tool="${toolId}"]`).click();
  await page.waitForTimeout(50);
}

async function place([x, y]) {
  await page.mouse.click(x, y);
  await page.waitForTimeout(80);
}

async function expectVisibleText(text) {
  const bodyText = await page.locator("body").innerText();
  if (!bodyText.toLowerCase().includes(text.toLowerCase())) throw new Error(`Expected visible text: ${text}`);
}

async function expectHidden(selector) {
  const visible = await page.locator(selector).isVisible().catch(() => false);
  if (visible) throw new Error(`Expected hidden before start: ${selector}`);
}

async function assertMapReady() {
  const ready = await page.locator("#scene-root[data-map-ready='true']").count();
  if (!ready) throw new Error("Map-ready marker missing.");
}

async function assertCanvasMounted() {
  const canvasState = await page.evaluate(() => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return null;
    return { width: canvas.width, height: canvas.height, visible: canvas.clientWidth > 0 && canvas.clientHeight > 0 };
  });
  if (!canvasState?.visible || canvasState.width < 640 || canvasState.height < 360) throw new Error("Canvas is not mounted at a playable size.");
}

async function setViewportAndSettle(width, height) {
  await page.setViewportSize({ width, height });
  await page.waitForTimeout(250);
}

async function assertNoHorizontalOverflow() {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (overflow > 1) throw new Error(`Horizontal overflow detected: ${overflow}`);
}

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
await page.screenshot({ path: path.join(outputDir, "freedom-engine-title.png"), fullPage: true });
await page.getByRole("button", { name: "Start Game" }).click();
await page.waitForTimeout(300);
await page.screenshot({ path: path.join(outputDir, "freedom-engine-dashboard.png"), fullPage: true });

await buildFestival();
await page.screenshot({ path: path.join(outputDir, "freedom-engine-gameplay-built.png"), fullPage: true });

for (let i = 0; i < 5; i += 1) {
  await page.getByRole("button", { name: /Advance Phase|Resolve Finale|Show Recap/ }).first().click();
  await page.waitForTimeout(i === 4 ? 900 : 450);
  if (i === 3) {
    await page.screenshot({ path: path.join(outputDir, "freedom-engine-finale.png"), fullPage: true });
  }
}

await page.screenshot({ path: path.join(outputDir, "freedom-engine-endgame.png"), fullPage: true });

const body = await page.locator("body").innerText();
const result = {
  baseUrl,
  errors,
  titleVisible: await page.getByText("Freedom Engine").first().isVisible(),
  endVisible: await page.locator(".end-card").isVisible(),
  hasGazette: body.includes("GAZETTE FINAL EDITION"),
  hasAward: (await page.locator(".award-list span").count()) > 0,
  statText: await page.locator("#stats-panel").innerText(),
};

console.log(JSON.stringify(result, null, 2));
await browser.close();

if (result.errors.length || !result.titleVisible || !result.endVisible || !result.hasGazette || !result.hasAward) {
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

  await pick("Food", "hotdog");
  await place([545, 325]);
  await pick("Food", "lemonade");
  await place([610, 350]);
  await pick("Food", "funnelCake");
  await place([690, 380]);
  await pick("Services", "bathroom");
  await place([735, 410]);
  await pick("Services", "trashCan");
  await place([795, 440]);
  await pick("Services", "fireCrew");
  await place([860, 470]);
  await pick("Services", "fireMarshal");
  await place([920, 500]);
  await pick("Civic", "paradeStaging");
  await place([500, 430]);
  await pick("Civic", "paradeRoute");
  for (const point of [
    [560, 455],
    [620, 480],
    [680, 505],
  ]) {
    await place(point);
  }
  await pick("Civic", "veteransFloat");
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
  await page.waitForTimeout(70);
}

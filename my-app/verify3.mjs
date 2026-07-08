import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
page.on("pageerror", (err) => console.log("[pageerror]", String(err)));

await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
await page.waitForTimeout(6000); // let everything fully settle / go to sleep

const letter = page.locator(".relative.h-\\[70vh\\] span").nth(2); // pick a middle letter, away from edges
const b0 = await letter.boundingBox();
console.log("rest position:", b0);

const startX = b0.x + b0.width / 2;
const startY = b0.y + b0.height / 2;

await page.mouse.move(startX, startY);
await page.mouse.down();

// move in several steps, checking position after EACH step, while still holding the button
for (const [dx, dy] of [[100, -50], [200, -150], [300, -250]]) {
  await page.mouse.move(startX + dx, startY + dy, { steps: 10 });
  await page.waitForTimeout(80);
  const box = await letter.boundingBox();
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  console.log(
    `target=(${startX + dx},${startY + dy}) actualCenter=(${cx.toFixed(1)},${cy.toFixed(1)}) followDist=${Math.hypot(
      cx - (startX + dx),
      cy - (startY + dy),
    ).toFixed(1)}`,
  );
}

await page.mouse.up();
await page.waitForTimeout(200);
const bAfterRelease = await letter.boundingBox();
console.log("position right after release:", bAfterRelease);

await browser.close();

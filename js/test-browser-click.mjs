/**
 * Open City shell in visible browser, navigate to Hub, open Doors.
 * Run: node city/js/test-browser-click.mjs
 */
import { chromium } from 'playwright';

const BASE = 'http://127.0.0.1:8765';

async function main() {
  const browser = await chromium.launch({
    headless: false,
    channel: 'chrome',
    slowMo: 400,
  });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1200, height: 800 });

  try {
    await page.goto(BASE + '/city/index.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    const frame = page.frameLocator('iframe#city-frame');
    await frame.locator('a[href="hub.html"]').click();
    await page.waitForTimeout(1500);

    await page.locator('#shell-links summary').click();
    await page.waitForTimeout(3000);

    await browser.close();
  } catch (err) {
    console.error(err);
    await browser.close();
    process.exit(1);
  }
}

main();

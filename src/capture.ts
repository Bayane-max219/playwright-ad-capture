import { chromium, Page } from "playwright";
import * as fs from "fs";
import * as path from "path";
import { AdCapture, SiteReport } from "./types";

const AD_SELECTORS = [
  // Google / DoubleClick
  "iframe[src*='doubleclick']",
  "iframe[src*='googlesyndication']",
  "iframe[id^='google_ads_iframe']",
  "div[id*='div-gpt-ad']",
  "div[data-google-query-id]",
  "ins.adsbygoogle",
  // Smart AdServer (Figaro, L'Équipe, etc.)
  "iframe[src*='smartadserver']",
  "div[id^='sas_']",
  "iframe[id^='sas_']",
  // Xandr / AppNexus
  "iframe[src*='adnxs']",
  "iframe[src*='appnexus']",
  // Autres réseaux
  "iframe[src*='pubmatic']",
  "iframe[src*='openx']",
  "iframe[src*='rubiconproject']",
  "iframe[src*='advertising']",
  "iframe[src*='ads.']",
  // Sélecteurs génériques
  "iframe[id*='ad-']",
  "iframe[class*='ad-']",
  "iframe[title*='pub']",
  "iframe[title*='dvertis']",
  "div[id*='pub-']",
  "div[class*='pub-']",
  "div[id*='banniere']",
  "div[class*='banniere']",
  "div[id*='annonce']",
  "div[id*='advertisement']",
  "div[class*='advertisement']",
];

const UNSAFE_KEYWORDS = [
  "casino", "bet", "gambling", "adult", "porn", "crypto-scam", "xxx",
];

function isBrandSafe(src: string): boolean {
  const lower = src.toLowerCase();
  return !UNSAFE_KEYWORDS.some((kw) => lower.includes(kw));
}

async function captureAds(page: Page, outputDir: string, siteName: string): Promise<AdCapture[]> {
  const ads: AdCapture[] = [];

  for (const selector of AD_SELECTORS) {
    const elements = await page.$$(selector);

    for (let i = 0; i < elements.length; i++) {
      try {
        const box = await elements[i].boundingBox();
        if (!box || box.width < 50 || box.height < 50) continue;

        const src = (await elements[i].getAttribute("src")) ?? "";
        const safe = isBrandSafe(src);

        const screenshotName = `${siteName}_ad_${ads.length + 1}.png`;
        const screenshotPath = path.join(outputDir, screenshotName);

        await elements[i].screenshot({ path: screenshotPath }).catch(() => null);

        ads.push({
          src: src.slice(0, 120),
          width: Math.round(box.width),
          height: Math.round(box.height),
          x: Math.round(box.x),
          y: Math.round(box.y),
          screenshotPath: fs.existsSync(screenshotPath) ? screenshotPath : null,
          brandSafe: safe,
          sizeMatch: box.width >= 300 || box.height >= 250,
          detected: true,
        });
      } catch {
        // element stale or hidden, skip
      }
    }
  }

  return ads;
}

export async function captureSite(
  url: string,
  siteName: string,
  outputDir: string
): Promise<SiteReport> {
  const start = Date.now();
  fs.mkdirSync(outputDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();

  let adsFound: AdCapture[] = [];
  const pageScreenshot = path.join(outputDir, `${siteName}_page.png`);

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

    // scroll to trigger lazy-loaded ads
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForTimeout(2000);
    await page.evaluate(() => window.scrollTo(0, 1200));
    await page.waitForTimeout(3000);

    // accept cookie banners if present
    for (const btnText of ["Accepter", "Accept", "J'accepte", "Tout accepter", "OK"]) {
      const btn = page.getByRole("button", { name: btnText, exact: false });
      if (await btn.count() > 0) {
        await btn.first().click().catch(() => null);
        await page.waitForTimeout(1500);
        break;
      }
    }

    await page.screenshot({ path: pageScreenshot, fullPage: false });
    adsFound = await captureAds(page, outputDir, siteName);
  } catch (err) {
    console.error(`  Error on ${siteName}:`, (err as Error).message);
  } finally {
    await browser.close();
  }

  return {
    site: siteName,
    url,
    capturedAt: new Date().toISOString(),
    pageScreenshot,
    adsFound: adsFound.length,
    ads: adsFound,
    duration_ms: Date.now() - start,
  };
}

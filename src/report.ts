import * as fs from "fs";
import * as path from "path";
import { CampaignReport, SiteReport } from "./types";

export function generateReport(
  campaignName: string,
  sites: SiteReport[],
  outputDir: string
): string {
  const report: CampaignReport = {
    campaign: campaignName,
    generatedAt: new Date().toISOString(),
    totalSites: sites.length,
    totalAdsFound: sites.reduce((sum, s) => sum + s.adsFound, 0),
    sites,
  };

  const reportPath = path.join(outputDir, "report.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf-8");

  printSummary(report);
  return reportPath;
}

function printSummary(report: CampaignReport): void {
  console.log("\n========================================");
  console.log(`  CAMPAIGN: ${report.campaign}`);
  console.log(`  Generated: ${report.generatedAt}`);
  console.log("========================================");
  console.log(`  Total sites  : ${report.totalSites}`);
  console.log(`  Total ads    : ${report.totalAdsFound}`);
  console.log("----------------------------------------");

  for (const site of report.sites) {
    const safeCount = site.ads.filter((a) => a.brandSafe).length;
    const unsafeCount = site.ads.filter((a) => !a.brandSafe).length;
    const status = site.adsFound === 0 ? "NO ADS" : "OK";

    console.log(`\n  [${status}] ${site.site}`);
    console.log(`     URL       : ${site.url}`);
    console.log(`     Ads found : ${site.adsFound}`);
    console.log(`     Brand safe: ${safeCount} / Unsafe: ${unsafeCount}`);
    console.log(`     Duration  : ${site.duration_ms}ms`);

    for (const ad of site.ads) {
      console.log(
        `     → ${ad.width}x${ad.height} @ (${ad.x},${ad.y}) | safe:${ad.brandSafe} | ${ad.src.slice(0, 60)}...`
      );
    }
  }

  console.log("\n========================================\n");
}

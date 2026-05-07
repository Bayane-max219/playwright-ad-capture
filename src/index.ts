import * as path from "path";
import { captureSite } from "./capture";
import { generateReport } from "./report";
import { generateHtmlReport } from "./htmlReport";
import { generatePptReport } from "./pptReport";

const CAMPAIGN = "Test Campaign — Sites Français";

const SITES = [
  { name: "20minutes", url: "https://www.20minutes.fr" },
  { name: "bfmtv", url: "https://www.bfmtv.com" },
  { name: "marmiton", url: "https://www.marmiton.org" },
];

async function main() {
  const outputDir = path.join(__dirname, "..", "reports", Date.now().toString());

  console.log("AdCapture — Démarrage des captures\n");
  console.log(`Campaign : ${CAMPAIGN}`);
  console.log(`Sites    : ${SITES.map((s) => s.name).join(", ")}`);
  console.log(`Output   : ${outputDir}\n`);

  const results = [];

  for (const site of SITES) {
    console.log(`Capture en cours : ${site.name} (${site.url})`);
    const result = await captureSite(site.url, site.name, outputDir);
    console.log(`  → ${result.adsFound} pub(s) détectée(s) en ${result.duration_ms}ms`);
    results.push(result);
  }

  const reportPath = generateReport(CAMPAIGN, results, outputDir);
  console.log(`Rapport JSON sauvegardé : ${reportPath}`);

  const campaignData = { campaign: CAMPAIGN, generatedAt: new Date().toISOString(), totalSites: results.length, totalAdsFound: results.reduce((s, r) => s + r.adsFound, 0), sites: results };

  const htmlPath = generateHtmlReport(campaignData, outputDir);
  console.log(`Rapport HTML sauvegardé : ${htmlPath}`);

  const pptPath = await generatePptReport(campaignData, outputDir);
  console.log(`Rapport PPT sauvegardé  : ${pptPath}`);
}

main().catch(console.error);

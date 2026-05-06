import * as path from "path";
import { captureSite } from "./capture";
import { generateReport } from "./report";

const CAMPAIGN = "Test Campaign — Sites Français";

const SITES = [
  { name: "lemonde", url: "https://www.lemonde.fr" },
  { name: "lefigaro", url: "https://www.lefigaro.fr" },
  { name: "lequipe", url: "https://www.lequipe.fr" },
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
}

main().catch(console.error);

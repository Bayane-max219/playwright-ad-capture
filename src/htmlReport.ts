import * as fs from "fs";
import * as path from "path";
import { CampaignReport } from "./types";

function imgToBase64(filePath: string): string {
  if (!filePath || !fs.existsSync(filePath)) return "";
  const data = fs.readFileSync(filePath);
  return `data:image/png;base64,${data.toString("base64")}`;
}

export function generateHtmlReport(report: CampaignReport, outputDir: string): string {
  const siteSections = report.sites.map((site) => {
    const pageImg = imgToBase64(site.pageScreenshot);
    const statusColor = site.adsFound > 0 ? "#16a34a" : "#dc2626";
    const statusLabel = site.adsFound > 0 ? `${site.adsFound} pub(s) détectée(s)` : "NO ADS DETECTED";

    const adCards = site.ads
      .filter((ad) => ad.screenshotPath)
      .map((ad, i) => {
        const adImg = imgToBase64(ad.screenshotPath!);
        const safeColor = ad.brandSafe ? "#16a34a" : "#dc2626";
        const safeLabel = ad.brandSafe ? "BRAND SAFE" : "UNSAFE";
        return `
        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:16px;margin-bottom:12px;">
          <div style="display:flex;gap:12px;margin-bottom:8px;flex-wrap:wrap;">
            <span style="background:#dbeafe;color:#1d4ed8;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:600;">${ad.width}×${ad.height}px</span>
            <span style="background:#f3f4f6;color:#374151;padding:4px 10px;border-radius:20px;font-size:12px;">pos (${ad.x}, ${ad.y})</span>
            <span style="background:${ad.brandSafe ? "#dcfce7" : "#fee2e2"};color:${safeColor};padding:4px 10px;border-radius:20px;font-size:12px;font-weight:600;">${safeLabel}</span>
            <span style="background:${ad.sizeMatch ? "#dcfce7" : "#fef9c3"};color:${ad.sizeMatch ? "#16a34a" : "#ca8a04"};padding:4px 10px;border-radius:20px;font-size:12px;">IAB SIZE ${ad.sizeMatch ? "✓" : "?"}</span>
          </div>
          ${adImg ? `<img src="${adImg}" style="width:100%;max-height:200px;object-fit:contain;border-radius:8px;border:1px solid #e5e7eb;" alt="Ad ${i + 1}" />` : ""}
        </div>`;
      }).join("");

    return `
    <div style="background:white;border:1px solid #e5e7eb;border-radius:16px;padding:24px;margin-bottom:24px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:8px;">
        <div>
          <h2 style="margin:0;font-size:20px;font-weight:700;color:#111827;">${site.site}</h2>
          <a href="${site.url}" style="color:#6b7280;font-size:13px;">${site.url}</a>
        </div>
        <div style="display:flex;gap:8px;align-items:center;">
          <span style="background:${statusColor};color:white;padding:6px 14px;border-radius:20px;font-size:13px;font-weight:600;">${statusLabel}</span>
          <span style="color:#9ca3af;font-size:12px;">${site.duration_ms}ms</span>
        </div>
      </div>

      ${site.adNetworkRequests.length > 0 ? `
      <div style="margin-bottom:16px;background:#fefce8;border:1px solid #fde68a;border-radius:10px;padding:12px;">
        <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#92400e;text-transform:uppercase;">🌐 Réseaux pub interceptés (${site.adNetworkRequests.length} requêtes)</p>
        ${site.adNetworkRequests.slice(0, 5).map(r => `<p style="margin:2px 0;font-size:11px;color:#78350f;font-family:monospace;word-break:break-all;">${r.slice(0, 100)}...</p>`).join("")}
      </div>` : ""}

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        <div>
          <p style="font-size:12px;color:#6b7280;margin:0 0 8px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;">PAGE SCREENSHOT</p>
          ${pageImg ? `<img src="${pageImg}" style="width:100%;border-radius:8px;border:1px solid #e5e7eb;" alt="${site.site} page" />` : '<p style="color:#9ca3af;">Aucun screenshot</p>'}
        </div>
        <div>
          <p style="font-size:12px;color:#6b7280;margin:0 0 8px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;">PUBS DÉTECTÉES (${site.ads.filter(a => a.screenshotPath).length})</p>
          ${adCards || '<p style="color:#9ca3af;font-size:14px;">Aucune pub capturée</p>'}
        </div>
      </div>
    </div>`;
  }).join("");

  const safeTotal = report.sites.flatMap(s => s.ads).filter(a => a.brandSafe).length;
  const unsafeTotal = report.sites.flatMap(s => s.ads).filter(a => !a.brandSafe).length;

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AdCapture — ${report.campaign}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f3f4f6; margin: 0; padding: 24px; color: #111827; }
    .container { max-width: 1100px; margin: 0 auto; }
  </style>
</head>
<body>
<div class="container">

  <div style="background:white;border-radius:16px;padding:24px;margin-bottom:24px;border:1px solid #e5e7eb;">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:4px;">
      <span style="font-size:24px;">📸</span>
      <h1 style="margin:0;font-size:24px;font-weight:800;color:#111827;">AdCapture</h1>
    </div>
    <p style="margin:0 0 16px;color:#6b7280;">Rapport de campagne — ${report.campaign}</p>
    <p style="margin:0;font-size:12px;color:#9ca3af;">Généré le ${new Date(report.generatedAt).toLocaleString("fr-FR")}</p>

    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:20px;">
      ${[
        ["Sites analysés", report.totalSites, "#dbeafe", "#1d4ed8"],
        ["Pubs détectées", report.totalAdsFound, "#dcfce7", "#16a34a"],
        ["Brand safe", safeTotal, "#dcfce7", "#16a34a"],
        ["Unsafe", unsafeTotal, "#fee2e2", "#dc2626"],
      ].map(([label, val, bg, color]) => `
        <div style="background:${bg};border-radius:12px;padding:16px;text-align:center;">
          <div style="font-size:28px;font-weight:800;color:${color};">${val}</div>
          <div style="font-size:12px;color:${color};margin-top:4px;">${label}</div>
        </div>`).join("")}
    </div>
  </div>

  ${siteSections}

</div>
</body>
</html>`;

  const htmlPath = path.join(outputDir, "report.html");
  fs.writeFileSync(htmlPath, html, "utf-8");
  return htmlPath;
}

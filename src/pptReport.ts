import PptxGenJS from "pptxgenjs";
import * as fs from "fs";
import * as path from "path";
import { CampaignReport } from "./types";

const BLUE = "1d4ed8";
const WHITE = "FFFFFF";
const DARK = "111827";
const GRAY = "6b7280";
const GREEN = "16a34a";
const RED = "dc2626";
const LIGHT = "f3f4f6";

function imgToBase64(filePath: string): string | null {
  if (!filePath || !fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath).toString("base64");
}

export async function generatePptReport(
  report: CampaignReport,
  outputDir: string
): Promise<string> {
  const pptx = new PptxGenJS();

  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "Bayane Miguel Singcol";
  pptx.subject = `AdCapture — ${report.campaign}`;

  // ─── SLIDE 1 : TITRE ────────────────────────────────────────────────────────
  const slide1 = pptx.addSlide();
  slide1.background = { color: BLUE };

  slide1.addText("📸 AdCapture", {
    x: 0.5, y: 1.2, w: 12, h: 0.8,
    fontSize: 36, bold: true, color: WHITE, align: "center",
  });
  slide1.addText(report.campaign, {
    x: 0.5, y: 2.2, w: 12, h: 0.6,
    fontSize: 20, color: "bfdbfe", align: "center",
  });
  slide1.addText(`Généré le ${new Date(report.generatedAt).toLocaleString("fr-FR")}`, {
    x: 0.5, y: 3.0, w: 12, h: 0.4,
    fontSize: 13, color: "93c5fd", align: "center",
  });
  slide1.addText("Rapport de vérification publicitaire — Sites éditeurs français", {
    x: 0.5, y: 3.6, w: 12, h: 0.4,
    fontSize: 13, color: "93c5fd", align: "center", italic: true,
  });

  // ─── SLIDE 2 : RÉSUMÉ ────────────────────────────────────────────────────────
  const slide2 = pptx.addSlide();
  slide2.background = { color: WHITE };

  slide2.addText("Résumé de campagne", {
    x: 0.5, y: 0.3, w: 12, h: 0.6,
    fontSize: 24, bold: true, color: DARK,
  });
  slide2.addShape(pptx.ShapeType.line, {
    x: 0.5, y: 1.0, w: 12, h: 0,
    line: { color: BLUE, width: 2 },
  });

  const safeCount = report.sites.flatMap(s => s.ads).filter(a => a.brandSafe).length;
  const unsafeCount = report.sites.flatMap(s => s.ads).filter(a => !a.brandSafe).length;
  const sitesOk = report.sites.filter(s => s.adsFound > 0).length;

  const stats = [
    { label: "Sites analysés", value: String(report.totalSites), color: BLUE },
    { label: "Pubs détectées", value: String(report.totalAdsFound), color: GREEN },
    { label: "Brand safe", value: String(safeCount), color: GREEN },
    { label: "Unsafe", value: String(unsafeCount), color: unsafeCount > 0 ? RED : GREEN },
    { label: "Sites avec pubs", value: `${sitesOk}/${report.totalSites}`, color: BLUE },
  ];

  stats.forEach((stat, i) => {
    const x = 0.5 + i * 2.6;
    slide2.addShape(pptx.ShapeType.roundRect, {
      x, y: 1.3, w: 2.3, h: 1.5,
      fill: { color: "f0f9ff" },
      line: { color: "bae6fd", width: 1 },
    });
    slide2.addText(stat.value, {
      x, y: 1.4, w: 2.3, h: 0.8,
      fontSize: 32, bold: true, color: stat.color, align: "center",
    });
    slide2.addText(stat.label, {
      x, y: 2.2, w: 2.3, h: 0.4,
      fontSize: 10, color: GRAY, align: "center",
    });
  });

  // tableau récapitulatif
  const tableRows: PptxGenJS.TableRow[] = [
    [
      { text: "Site", options: { bold: true, color: WHITE, fill: { color: BLUE } } },
      { text: "URL", options: { bold: true, color: WHITE, fill: { color: BLUE } } },
      { text: "Pubs", options: { bold: true, color: WHITE, fill: { color: BLUE } } },
      { text: "Brand safe", options: { bold: true, color: WHITE, fill: { color: BLUE } } },
      { text: "Durée", options: { bold: true, color: WHITE, fill: { color: BLUE } } },
      { text: "Statut", options: { bold: true, color: WHITE, fill: { color: BLUE } } },
    ],
    ...report.sites.map(site => {
      const safe = site.ads.filter(a => a.brandSafe).length;
      const status = site.adsFound > 0 ? "✓ OK" : "NO ADS";
      return [
        { text: site.site },
        { text: site.url },
        { text: String(site.adsFound) },
        { text: `${safe}/${site.adsFound}` },
        { text: `${(site.duration_ms / 1000).toFixed(1)}s` },
        { text: status, options: { color: site.adsFound > 0 ? GREEN : RED, bold: true } },
      ] as PptxGenJS.TableRow;
    }),
  ];

  slide2.addTable(tableRows, {
    x: 0.5, y: 3.0, w: 12.5,
    fontSize: 11,
    border: { type: "solid", color: "e5e7eb", pt: 1 },
    rowH: 0.4,
  });

  // ─── SLIDES PAR SITE ─────────────────────────────────────────────────────────
  for (const site of report.sites) {
    // slide page screenshot + stats site
    const slideS = pptx.addSlide();
    slideS.background = { color: WHITE };

    const statusColor = site.adsFound > 0 ? GREEN : RED;
    slideS.addText(`${site.site.toUpperCase()}`, {
      x: 0.5, y: 0.2, w: 9, h: 0.55,
      fontSize: 22, bold: true, color: DARK,
    });
    slideS.addText(site.adsFound > 0 ? `${site.adsFound} pub(s) détectée(s)` : "NO ADS DETECTED", {
      x: 9.5, y: 0.25, w: 3, h: 0.45,
      fontSize: 12, bold: true, color: WHITE,
      fill: { color: statusColor }, align: "center",
      shape: pptx.ShapeType.roundRect,
    });
    slideS.addText(site.url, {
      x: 0.5, y: 0.8, w: 12, h: 0.3,
      fontSize: 11, color: GRAY, hyperlink: { url: site.url },
    });
    slideS.addShape(pptx.ShapeType.line, {
      x: 0.5, y: 1.15, w: 12, h: 0,
      line: { color: "e5e7eb", width: 1 },
    });

    // screenshot page
    const pageBase64 = imgToBase64(site.pageScreenshot);
    if (pageBase64) {
      slideS.addText("PAGE SCREENSHOT", {
        x: 0.5, y: 1.25, w: 6.5, h: 0.3,
        fontSize: 9, bold: true, color: GRAY,
      });
      slideS.addImage({
        data: `image/png;base64,${pageBase64}`,
        x: 0.5, y: 1.6, w: 6.5, h: 4.0,
      });
    }

    // stats droite
    slideS.addText("STATISTIQUES", {
      x: 7.3, y: 1.25, w: 5.5, h: 0.3,
      fontSize: 9, bold: true, color: GRAY,
    });

    const siteStats = [
      ["Pubs détectées", String(site.adsFound)],
      ["Brand safe", String(site.ads.filter(a => a.brandSafe).length)],
      ["Unsafe", String(site.ads.filter(a => !a.brandSafe).length)],
      ["Réseaux interceptés", String(site.adNetworkRequests.length)],
      ["Durée capture", `${(site.duration_ms / 1000).toFixed(1)}s`],
    ];

    siteStats.forEach(([label, val], i) => {
      const y = 1.6 + i * 0.55;
      slideS.addShape(pptx.ShapeType.roundRect, {
        x: 7.3, y, w: 5.5, h: 0.45,
        fill: { color: LIGHT }, line: { color: "e5e7eb", width: 1 },
      });
      slideS.addText(label, { x: 7.5, y: y + 0.08, w: 3.5, h: 0.3, fontSize: 10, color: GRAY });
      slideS.addText(val, { x: 10.5, y: y + 0.08, w: 2, h: 0.3, fontSize: 11, bold: true, color: DARK, align: "right" });
    });

    // réseaux pub interceptés
    if (site.adNetworkRequests.length > 0) {
      slideS.addText("RÉSEAUX PUB INTERCEPTÉS", {
        x: 7.3, y: 4.5, w: 5.5, h: 0.3,
        fontSize: 9, bold: true, color: GRAY,
      });
      const netText = site.adNetworkRequests.slice(0, 4)
        .map(r => `• ${r.slice(8, 65)}...`)
        .join("\n");
      slideS.addText(netText, {
        x: 7.3, y: 4.85, w: 5.5, h: 1.2,
        fontSize: 8, color: "78350f",
        fill: { color: "fefce8" },
        shape: pptx.ShapeType.roundRect,
        line: { color: "fde68a", width: 1 },
      });
    }

    // ─── slides par pub détectée ──────────────────────────────────────────────
    const adsWithScreenshot = site.ads.filter(a => a.screenshotPath);
    for (let i = 0; i < adsWithScreenshot.length; i++) {
      const ad = adsWithScreenshot[i];
      const adSlide = pptx.addSlide();
      adSlide.background = { color: WHITE };

      adSlide.addText(`${site.site.toUpperCase()} — Publicité ${i + 1}/${adsWithScreenshot.length}`, {
        x: 0.5, y: 0.2, w: 12, h: 0.5,
        fontSize: 18, bold: true, color: DARK,
      });
      adSlide.addShape(pptx.ShapeType.line, {
        x: 0.5, y: 0.75, w: 12, h: 0,
        line: { color: "e5e7eb", width: 1 },
      });

      // screenshot pub
      const adBase64 = imgToBase64(ad.screenshotPath!);
      if (adBase64) {
        adSlide.addImage({
          data: `image/png;base64,${adBase64}`,
          x: 0.5, y: 0.9, w: 7.5, h: 4.5,
        });
      } else {
        adSlide.addShape(pptx.ShapeType.rect, {
          x: 0.5, y: 0.9, w: 7.5, h: 4.5,
          fill: { color: LIGHT }, line: { color: "e5e7eb", width: 1 },
        });
        adSlide.addText("Screenshot non disponible", {
          x: 0.5, y: 3.0, w: 7.5, h: 0.4,
          fontSize: 12, color: GRAY, align: "center",
        });
      }

      // métadonnées
      const meta = [
        ["Dimensions", `${ad.width} × ${ad.height} px`],
        ["Position", `(${ad.x}, ${ad.y})`],
        ["Brand safety", ad.brandSafe ? "✓ BRAND SAFE" : "⚠ UNSAFE"],
        ["Taille IAB", ad.sizeMatch ? "✓ Conforme" : "Non standard"],
      ];

      adSlide.addText("MÉTADONNÉES", {
        x: 8.3, y: 0.9, w: 5, h: 0.3,
        fontSize: 9, bold: true, color: GRAY,
      });

      meta.forEach(([label, val], idx) => {
        const y = 1.25 + idx * 0.65;
        const isUnsafe = label === "Brand safety" && !ad.brandSafe;
        adSlide.addShape(pptx.ShapeType.roundRect, {
          x: 8.3, y, w: 5, h: 0.55,
          fill: { color: isUnsafe ? "fee2e2" : LIGHT },
          line: { color: isUnsafe ? "fca5a5" : "e5e7eb", width: 1 },
        });
        adSlide.addText(label, { x: 8.5, y: y + 0.1, w: 2.5, h: 0.3, fontSize: 10, color: GRAY });
        adSlide.addText(val, {
          x: 10.0, y: y + 0.1, w: 3, h: 0.3,
          fontSize: 11, bold: true,
          color: isUnsafe ? RED : DARK,
          align: "right",
        });
      });
    }
  }

  // ─── SLIDE FINALE ─────────────────────────────────────────────────────────
  const slideFinal = pptx.addSlide();
  slideFinal.background = { color: BLUE };
  slideFinal.addText("Rapport généré par AdCapture", {
    x: 0.5, y: 2.0, w: 12, h: 0.7,
    fontSize: 22, bold: true, color: WHITE, align: "center",
  });
  slideFinal.addText("Bayane Miguel Singcol · github.com/Bayane-max219/playwright-ad-capture", {
    x: 0.5, y: 2.9, w: 12, h: 0.4,
    fontSize: 13, color: "93c5fd", align: "center",
  });

  const pptPath = path.join(outputDir, "report.pptx");
  await pptx.writeFile({ fileName: pptPath });
  return pptPath;
}

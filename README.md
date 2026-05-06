# playwright-ad-capture

> Headless ad verification tool — détecte et capture automatiquement les publicités sur les sites éditeurs français, génère un rapport JSON avec screenshots et analyse brand safety.

Built with **Playwright** + **TypeScript** + **Node.js**

---

## Fonctionnalités

- Navigation headless sur les sites éditeurs (Chromium via Playwright)
- Détection automatique des emplacements publicitaires (iframes, GPT, Smart AdServer, Xandr, etc.)
- Scroll automatique pour déclencher les pubs lazy-loadées
- Gestion des bandeaux cookie (clic automatique "Accepter")
- Screenshot de chaque publicité détectée + screenshot full page
- Analyse brand safety (détection mots-clés non conformes)
- Vérification taille (IAB standard : 300x250, 728x90, etc.)
- Rapport JSON structuré par campagne et site

---

## Stack

- **Playwright** (Chromium headless)
- **TypeScript** / **Node.js**
- **ts-node** pour l'exécution directe

---

## Installation

```bash
git clone https://github.com/Bayane-max219/playwright-ad-capture
cd playwright-ad-capture
npm install
npx playwright install chromium
```

## Utilisation

```bash
npm run capture
```

Le script ouvre chaque site en headless, détecte les pubs, capture les screenshots et génère le rapport dans `reports/<timestamp>/`.

---

## Rapport généré

```json
{
  "campaign": "Test Campaign — Sites Français",
  "generatedAt": "2026-05-06T08:54:53.214Z",
  "totalSites": 3,
  "totalAdsFound": 4,
  "sites": [
    {
      "site": "lemonde",
      "url": "https://www.lemonde.fr",
      "adsFound": 4,
      "ads": [
        {
          "width": 1000,
          "height": 645,
          "brandSafe": true,
          "sizeMatch": true,
          "detected": true
        }
      ]
    }
  ]
}
```

## Exemple de sortie console

```
AdCapture — Démarrage des captures

Campaign : Test Campaign — Sites Français
Sites    : lemonde, lefigaro, lequipe

Capture en cours : lemonde (https://www.lemonde.fr)
  → 4 pub(s) détectée(s) en 68546ms

========================================
  CAMPAIGN: Test Campaign — Sites Français
  Total sites  : 3
  Total ads    : 4
----------------------------------------

  [OK] lemonde
     Ads found : 4
     Brand safe: 4 / Unsafe: 0
     → 1000x645 @ (140,7133) | safe:true
     → 1000x250 @ (140,36)   | safe:true
```

---

## Structure du projet

```
playwright-ad-capture/
├── src/
│   ├── index.ts      # Point d'entrée — liste des sites à capturer
│   ├── capture.ts    # Moteur Playwright — navigation, détection, screenshot
│   ├── report.ts     # Génération rapport JSON + affichage console
│   └── types.ts      # Interfaces TypeScript
├── reports/          # Rapports générés (gitignored)
├── tsconfig.json
└── package.json
```

---

## Cas d'usage réels

- Agences média : prouver visuellement la diffusion d'une campagne
- Annonceurs : vérifier le brand safety des emplacements achetés
- Régies : générer des PPT de mise en ligne automatiquement

---

Développé par **Bayane Miguel Singcol** · 2026

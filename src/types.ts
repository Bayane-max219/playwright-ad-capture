export interface AdCapture {
  src: string;
  width: number;
  height: number;
  x: number;
  y: number;
  screenshotPath: string | null;
  brandSafe: boolean;
  sizeMatch: boolean;
  detected: boolean;
}

export interface SiteReport {
  site: string;
  url: string;
  capturedAt: string;
  pageScreenshot: string;
  adsFound: number;
  ads: AdCapture[];
  duration_ms: number;
}

export interface CampaignReport {
  campaign: string;
  generatedAt: string;
  totalSites: number;
  totalAdsFound: number;
  sites: SiteReport[];
}

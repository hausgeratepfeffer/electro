/**
 * Classification de l'origine d'un visiteur, au premier contact.
 *
 * Combine deux signaux, jamais un identifiant : les paramètres d'URL posés
 * par les régies publicitaires (gclid, fbclid, ttclid, srsltid, utm_*) et
 * l'en-tête / la propriété « referrer » du navigateur pour une provenance
 * sans marquage (recherche organique, réseau social, un autre site). Aucun
 * des deux ne distingue un visiteur d'un autre : seuls le canal et l'hôte de
 * provenance sont retenus, jamais une adresse IP ni un identifiant publicitaire.
 *
 * Limite assumée et volontairement non maquillée : `gclid` seul ne permet pas
 * de distinguer une annonce Shopping d'une annonce Search — Google encode les
 * deux de la même façon, sauf si le compte Google Ads ajoute lui-même un
 * paramètre de suivi (modèle de suivi avec {campaignid} ou équivalent, une
 * réglage du compte Ads, pas de ce site). `srsltid`, lui, est fiable : Google
 * ne le pose que sur les clics vers une fiche des résultats Shopping gratuits.
 *
 * Ce module ne touche à rien de Next.js : il doit rester importable aussi
 * bien depuis le proxy (edge/node) que depuis un composant client.
 */

export type TrafficChannel =
  | "direct"
  | "organic_search"
  | "google_shopping"
  | "google_ads"
  | "meta_ads"
  | "tiktok_ads"
  | "bing_ads"
  | "social_organic"
  | "email"
  | "referral"
  | "other";

export interface TrafficAttribution {
  channel: TrafficChannel;
  /** Hôte ou utm_source d'origine, pour l'inspection fine ; peut rester vide. */
  source: string;
}

export const TRAFFIC_CHANNEL_LABELS: Record<TrafficChannel, { de: string; fr: string; en: string }> = {
  direct: { de: "Direkt", fr: "Direct", en: "Direct" },
  organic_search: { de: "Organische Suche", fr: "Recherche organique", en: "Organic search" },
  google_shopping: { de: "Google Shopping", fr: "Google Shopping", en: "Google Shopping" },
  google_ads: { de: "Google Ads", fr: "Google Ads", en: "Google Ads" },
  meta_ads: { de: "Facebook/Instagram Ads", fr: "Facebook/Instagram Ads", en: "Facebook/Instagram Ads" },
  tiktok_ads: { de: "TikTok Ads", fr: "TikTok Ads", en: "TikTok Ads" },
  bing_ads: { de: "Bing Ads", fr: "Bing Ads", en: "Bing Ads" },
  social_organic: { de: "Soziale Netzwerke", fr: "Réseaux sociaux", en: "Social media" },
  email: { de: "E-Mail", fr: "E-mail", en: "Email" },
  referral: { de: "Verweisseite", fr: "Autre site référent", en: "Referral" },
  other: { de: "Sonstige Kampagne", fr: "Autre campagne", en: "Other campaign" },
};

const DIRECT: TrafficAttribution = { channel: "direct", source: "" };

function hostOf(url: string): string | null {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host.startsWith("www.") ? host.slice(4) : host;
  } catch {
    return null;
  }
}

/**
 * Classe le trafic à partir des paramètres d'URL et du référent, tels que lus
 * à la toute première page d'une visite. Pure : aucun accès réseau, aucune
 * API de navigateur — testable et réutilisable côté proxy comme côté client.
 */
export function classifyTraffic(
  params: URLSearchParams,
  referrer: string | null | undefined,
  siteHost: string,
): TrafficAttribution {
  const utmSource = params.get("utm_source")?.toLowerCase().trim() ?? "";
  const utmMedium = params.get("utm_medium")?.toLowerCase().trim() ?? "";
  const utmCampaign = params.get("utm_campaign")?.toLowerCase().trim() ?? "";

  if (params.has("srsltid")) return { channel: "google_shopping", source: "google.com" };
  if (params.has("gclid")) {
    const shopping = utmMedium === "shopping" || /shopping/.test(utmCampaign);
    return { channel: shopping ? "google_shopping" : "google_ads", source: "google.com" };
  }
  if (params.has("fbclid")) return { channel: "meta_ads", source: "facebook.com" };
  if (params.has("ttclid")) return { channel: "tiktok_ads", source: "tiktok.com" };
  if (params.has("msclkid")) return { channel: "bing_ads", source: "bing.com" };

  if (utmSource) {
    if (utmMedium === "email" || utmMedium === "newsletter") return { channel: "email", source: utmSource };
    if (utmMedium === "social" || utmMedium === "social-paid") {
      return { channel: "social_organic", source: utmSource };
    }
    return { channel: "other", source: utmSource };
  }

  const refHost = referrer ? hostOf(referrer) : null;
  if (!refHost || refHost === siteHost.toLowerCase().replace(/^www\./, "")) return DIRECT;

  if (/(^|\.)google\.[a-z.]+$/.test(refHost)) return { channel: "organic_search", source: refHost };
  if (/(^|\.)(bing|duckduckgo|yahoo|ecosia|qwant)\.[a-z.]+$/.test(refHost)) {
    return { channel: "organic_search", source: refHost };
  }
  if (/(^|\.)(facebook|instagram)\.com$/.test(refHost)) return { channel: "social_organic", source: refHost };
  if (/(^|\.)tiktok\.com$/.test(refHost)) return { channel: "social_organic", source: refHost };
  if (/(^|\.)(pinterest|linkedin)\.[a-z.]+$/.test(refHost) || refHost === "x.com" || refHost === "t.co") {
    return { channel: "social_organic", source: refHost };
  }

  return { channel: "referral", source: refHost };
}

/** Clé de stockage local, visiteur consentant uniquement — voir TrafficAttributionTracker. */
export const TRAFFIC_STORAGE_KEY = "hgp.attribution.v1";

/** Fenêtre au-delà de laquelle une attribution mémorisée n'est plus reprise. */
export const TRAFFIC_ATTRIBUTION_WINDOW_DAYS = 30;

function isTrafficChannel(value: unknown): value is TrafficChannel {
  return typeof value === "string" && value in TRAFFIC_CHANNEL_LABELS;
}

/**
 * Relit l'attribution mémorisée dans le navigateur, si elle existe et n'a pas
 * dépassé la fenêtre de rétention. N'écrit jamais : la capture est le rôle de
 * TrafficAttributionTracker, cette fonction ne fait que la relire au moment de
 * la commande ou de la capture de panier abandonné.
 */
export function readStoredTrafficAttribution(): TrafficAttribution | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(TRAFFIC_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { channel?: unknown; source?: unknown; capturedAt?: unknown };
    if (!isTrafficChannel(parsed.channel) || typeof parsed.capturedAt !== "number") return null;
    const ageMs = Date.now() - parsed.capturedAt;
    if (ageMs < 0 || ageMs > TRAFFIC_ATTRIBUTION_WINDOW_DAYS * 24 * 60 * 60 * 1000) return null;
    return { channel: parsed.channel, source: typeof parsed.source === "string" ? parsed.source : "" };
  } catch {
    return null;
  }
}

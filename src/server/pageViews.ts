/**
 * Trafic anonyme — accès aux données.
 *
 * Aucune adresse IP n'est jamais écrite en base : `capturePageView` la reçoit,
 * la passe à geoip-lite pour en tirer pays et ville, puis l'oublie. Pays et
 * ville seuls ne réidentifient personne, contrairement à un identifiant de
 * visiteur — c'est ce qui permet de s'en passer du bandeau de consentement.
 */

import geoip from "geoip-lite";
import { prisma } from "@/server/prisma";

/** Durée de conservation des pages vues, en jours. */
export const PAGE_VIEW_RETENTION_DAYS = 90;

/** Longueur maximale d'un chemin accepté ; au-delà, ce n'est pas une URL de la boutique. */
const MAX_PATH_LENGTH = 300;

function isPrivateOrInvalid(ip: string): boolean {
  return (
    !ip ||
    ip === "inconnu" ||
    ip === "::1" ||
    ip.startsWith("127.") ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip)
  );
}

export interface CapturePageViewInput {
  path: string;
  ip: string;
}

/**
 * Enregistre une page vue. Purge occasionnelle plutôt qu'une tâche à part :
 * un site de cette taille n'a pas besoin d'un second intervalle pour une
 * table qui ne sert qu'à des statistiques agrégées.
 */
export async function capturePageView(input: CapturePageViewInput): Promise<void> {
  const path = input.path.trim();
  if (!path || !path.startsWith("/") || path.length > MAX_PATH_LENGTH) return;

  const geo = isPrivateOrInvalid(input.ip) ? undefined : geoip.lookup(input.ip);

  await prisma.pageView.create({
    data: {
      path,
      country: geo?.country || null,
      city: geo?.city || null,
    },
  });

  // ~1 requête sur 200 déclenche la purge : pas de tâche planifiée dédiée,
  // et la table ne grossit jamais bien au-delà de la fenêtre de rétention.
  if (Math.random() < 0.005) {
    await purgeOldPageViews();
  }
}

async function purgeOldPageViews(): Promise<void> {
  const cutoff = new Date(Date.now() - PAGE_VIEW_RETENTION_DAYS * 24 * 60 * 60_000);
  await prisma.pageView.deleteMany({ where: { viewedAt: { lt: cutoff } } });
}

// ---- Lectures du back-office ----

export interface TrafficStats {
  totalViews: number;
  topPaths: { path: string; count: number }[];
  topCountries: { country: string; count: number }[];
  topCities: { city: string; country: string | null; count: number }[];
  dailyCounts: { day: string; count: number }[];
}

/**
 * Statistiques sur la fenêtre de rétention. `groupBy` ne trie pas par
 * agrégat lui-même dans tous les cas : le tri et la troncature se font donc
 * ici plutôt que de multiplier les requêtes brutes.
 */
export async function trafficStats(days = 30): Promise<TrafficStats> {
  const since = new Date(Date.now() - days * 24 * 60 * 60_000);
  const where = { viewedAt: { gte: since } };

  const [totalViews, byPath, byCountry, byCity, rows] = await Promise.all([
    prisma.pageView.count({ where }),
    prisma.pageView.groupBy({
      by: ["path"],
      where,
      _count: { _all: true },
      orderBy: { _count: { path: "desc" } },
      take: 15,
    }),
    prisma.pageView.groupBy({
      by: ["country"],
      where: { ...where, country: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { country: "desc" } },
      take: 10,
    }),
    prisma.pageView.groupBy({
      by: ["city", "country"],
      where: { ...where, city: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { city: "desc" } },
      take: 10,
    }),
    // Comptage par jour : peu de lignes sur trente jours, l'agrégation en
    // mémoire reste plus simple qu'un group by sur une colonne calculée.
    prisma.pageView.findMany({ where, select: { viewedAt: true } }),
  ]);

  const dayBuckets = new Map<string, number>();
  for (const row of rows) {
    const day = row.viewedAt.toISOString().slice(0, 10);
    dayBuckets.set(day, (dayBuckets.get(day) ?? 0) + 1);
  }
  const dailyCounts = Array.from(dayBuckets, ([day, count]) => ({ day, count })).sort((a, b) =>
    a.day.localeCompare(b.day),
  );

  return {
    totalViews,
    topPaths: byPath.map((row) => ({ path: row.path, count: row._count._all })),
    topCountries: byCountry.map((row) => ({ country: row.country ?? "", count: row._count._all })),
    topCities: byCity.map((row) => ({
      city: row.city ?? "",
      country: row.country,
      count: row._count._all,
    })),
    dailyCounts,
  };
}

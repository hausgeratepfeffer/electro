import type { MetadataRoute } from "next";
import { getCategoryPages } from "@/server/store";
import { routing } from "@/i18n/routing";
import { LEGAL_SLUGS } from "@/content/legal";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hausgeratepfeffer.de";

/** L'allemand vit à la racine, l'anglais sous /en — voir src/i18n/routing.ts. */
function urlFor(path: string, locale: string): string {
  const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  return `${SITE_URL}${prefix}${path === "/" ? "" : path}` || SITE_URL;
}

/** Chaque URL déclare ses équivalents dans l'autre langue (hreflang). */
function alternatesFor(path: string): Record<string, string> {
  return Object.fromEntries(routing.locales.map((locale) => [locale, urlFor(path, locale)]));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const categories = await getCategoryPages();

  const paths: { path: string; priority: number; changeFrequency: "daily" | "weekly" | "monthly" }[] =
    [{ path: "/", priority: 1, changeFrequency: "daily" }];

  // Pages légales et informatives (FAQ, retour, à propos, contact…) : sans
  // ceci, elles ne sont découvertes que par le maillage interne, jamais
  // signalées explicitement à Google, contrairement aux catégories et
  // produits. Priorité modeste et fréquence mensuelle — ce sont des pages de
  // fond, pas des pages qui changent d'une semaine à l'autre.
  for (const slug of LEGAL_SLUGS) {
    paths.push({ path: `/${slug}`, priority: 0.5, changeFrequency: "monthly" });
  }

  for (const category of categories) {
    paths.push({
      path: `/${category.group}/${category.slug}`,
      priority: 0.8,
      changeFrequency: "weekly",
    });
    for (const product of category.products) {
      paths.push({
        path: `/${category.group}/${category.slug}/${product.slug}`,
        priority: 0.7,
        changeFrequency: "weekly",
      });
    }
  }

  const now = new Date();

  return paths.flatMap(({ path, priority, changeFrequency }) =>
    routing.locales.map((locale) => ({
      url: urlFor(path, locale),
      lastModified: now,
      changeFrequency,
      priority,
      alternates: { languages: alternatesFor(path) },
    })),
  );
}

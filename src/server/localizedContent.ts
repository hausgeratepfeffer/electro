import { unstable_cache } from "next/cache";
import { prisma } from "@/server/prisma";
import { TAG_CATALOGUE } from "@/server/cacheCatalogue";
import { routing, type Locale } from "@/i18n/routing";
import { parseGuideTable } from "@/lib/guideTable";
import type { CategoryPageView } from "@/server/store";
import type { CategoryGuide, GuideComparisonTable } from "@/server/types";
import type { Product } from "@/types/home";

// Traduction du catalogue, côté boutique uniquement.
//
// Principe : la base porte les textes allemands (source de vérité) et, à côté,
// des colonnes « *En » facultatives. Ce module charge une seule fois les
// traductions puis les applique à des données déjà chargées par le store.
// Le repli est systématique : si le champ anglais est vide, l'allemand est
// affiché — jamais de champ vide sur la boutique.

// ---- Types ----

interface CategoryTranslation {
  label: string;
  description: string;
  guideIntro: string;
  guideClosing: string;
  /** Sections dans l'ordre d'affichage : l'appariement se fait par position. */
  sections: { heading: string; body: string; table?: GuideComparisonTable }[];
}

interface ProductTranslation {
  name: string;
  shortDescription: string;
  description: string;
  bullets: string[];
}

export interface CatalogTranslations {
  /** Libellés de groupe, indexés par slug ("haushalt"). */
  groups: Map<string, string>;
  /** Catégories, indexées par identifiant "groupe/slug". */
  categories: Map<string, CategoryTranslation>;
  /** Produits, indexés par identifiant en base. */
  products: Map<string, ProductTranslation>;
}

/** Bundle vide : tout retombe alors sur les textes allemands. */
const EMPTY: CatalogTranslations = {
  groups: new Map(),
  categories: new Map(),
  products: new Map(),
};

// ---- Fonctions pures ----

/** Renvoie la traduction si elle est renseignée, sinon le texte d'origine. */
export function pickText(fallback: string, translated: string | null | undefined): string {
  const value = translated?.trim();
  return value ? value : fallback;
}

/** Même règle pour une liste : une liste vide vaut « pas de traduction ». */
export function pickList(fallback: string[], translated: string[] | undefined): string[] {
  const values = translated?.filter((entry) => entry.trim().length > 0) ?? [];
  return values.length > 0 ? values : fallback;
}

/** Vrai dès qu'une locale connue autre que l'allemand est demandée. */
export function needsTranslation(locale: string): locale is Locale {
  return locale !== routing.defaultLocale && (routing.locales as readonly string[]).includes(locale);
}

function parseBullets(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

/** Applique la traduction à un produit déjà mis en forme par le store. */
export function localizeProduct(product: Product, translations: CatalogTranslations): Product {
  const translated = product.id ? translations.products.get(product.id) : undefined;
  if (!translated) return product;

  const name = pickText(product.name, translated.name);
  const bullets = pickList(product.bullets, translated.bullets);
  const shortDescription = pickText(product.shortDescription ?? "", translated.shortDescription);
  const description = pickText(product.description ?? "", translated.description);

  return {
    ...product,
    name,
    bullets,
    // L'alternative textuelle reprend le nom traduit, la marque ne se traduit pas
    alt: `${product.brand} ${name}`,
    shortDescription: shortDescription || undefined,
    description: description || undefined,
  };
}

function localizeGuide(guide: CategoryGuide, translated: CategoryTranslation): CategoryGuide {
  return {
    intro: pickText(guide.intro, translated.guideIntro),
    closing: pickText(guide.closing, translated.guideClosing),
    sections: guide.sections.map((section, index) => {
      const source = translated.sections[index];
      return {
        heading: pickText(section.heading, source?.heading),
        body: pickText(section.body, source?.body),
        // Vide côté anglais = pas de traduction propre au tableau : on
        // reprend celui déjà résolu (allemand), jamais un tableau vide.
        table: source?.table ?? section.table,
      };
    }),
  };
}

/** Applique la traduction à une page de catégorie et à tous ses produits. */
export function localizeCategoryPage(
  view: CategoryPageView,
  translations: CatalogTranslations,
): CategoryPageView {
  const id = `${view.group}/${view.slug}`;
  const translated = translations.categories.get(id);
  const products = view.products.map((product) => localizeProduct(product, translations));
  const groupLabel = pickText(view.groupLabel, translations.groups.get(view.group));

  if (!translated) {
    return { ...view, groupLabel, products };
  }

  return {
    ...view,
    groupLabel,
    label: pickText(view.label, translated.label),
    description: pickText(view.description, translated.description),
    guide: localizeGuide(view.guide, translated),
    products,
  };
}

/** Raccourci pour une liste de pages de catégorie. */
export function localizeCategoryPages(
  views: CategoryPageView[],
  translations: CatalogTranslations,
): CategoryPageView[] {
  return views.map((view) => localizeCategoryPage(view, translations));
}

// ---- Chargement ----

/**
 * Lecture brute des colonnes anglaises, mise en cache sous le tag du catalogue.
 *
 * C'est la seconde lecture intégrale du projet : elle ramène *tous* les
 * produits, et chacune des quelque 460 pages anglaises la refaisait à zéro.
 *
 * Le cache s'arrête volontairement aux lignes brutes. `CatalogTranslations`
 * porte des `Map`, or `unstable_cache` sérialise ce qu'il stocke : une `Map`
 * en ressortirait en objet vide, tous les `.get()` renverraient `undefined` et
 * la boutique anglaise retomberait silencieusement en allemand — une panne sans
 * message d'erreur. Les `Map` sont donc assemblées après coup, hors du cache.
 */
const chargerLignesTraduction = unstable_cache(
  async () => {
    const [groups, categories, products] = await Promise.all([
      prisma.group.findMany({ select: { slug: true, labelEn: true } }),
      prisma.category.findMany({
        select: {
          slug: true,
          labelEn: true,
          descriptionEn: true,
          guideIntroEn: true,
          guideClosingEn: true,
          group: { select: { slug: true } },
          guideSections: {
            select: { headingEn: true, bodyEn: true, tableJsonEn: true },
            orderBy: { position: "asc" },
          },
        },
      }),
      prisma.product.findMany({
        select: {
          id: true,
          nameEn: true,
          shortDescriptionEn: true,
          descriptionEn: true,
          bulletsEn: true,
        },
      }),
    ]);

    return { groups, categories, products };
  },
  ["catalogue-traductions"],
  { tags: [TAG_CATALOGUE], revalidate: 3600 },
);

/**
 * Charge en une passe les traductions du catalogue.
 * Pour la langue par défaut (allemand), aucune requête n'est émise.
 */
export async function loadCatalogTranslations(locale: string): Promise<CatalogTranslations> {
  if (!needsTranslation(locale)) return EMPTY;

  const { groups, categories, products } = await chargerLignesTraduction();

  return {
    groups: new Map(groups.map((group) => [group.slug, group.labelEn])),
    categories: new Map(
      categories.map((category) => [
        `${category.group.slug}/${category.slug}`,
        {
          label: category.labelEn,
          description: category.descriptionEn,
          guideIntro: category.guideIntroEn,
          guideClosing: category.guideClosingEn,
          sections: category.guideSections.map((section) => ({
            heading: section.headingEn,
            body: section.bodyEn,
            table: parseGuideTable(section.tableJsonEn),
          })),
        },
      ]),
    ),
    products: new Map(
      products.map((product) => [
        product.id,
        {
          name: product.nameEn,
          shortDescription: product.shortDescriptionEn,
          description: product.descriptionEn,
          bullets: parseBullets(product.bulletsEn),
        },
      ]),
    ),
  };
}

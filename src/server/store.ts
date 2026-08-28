import { unstable_cache } from "next/cache";
import { prisma } from "@/server/prisma";
import { slugify } from "@/lib/slugify";
import { TAG_CATALOGUE } from "@/server/cacheCatalogue";
import { getActivePromotions, type ProductPromotion } from "@/server/promotions";
import { sansAvisDemonstration } from "@/server/reviews";
import { encodeGuideTable, parseGuideTable } from "@/lib/guideTable";
import type { CategoryGuide, CategoryRecord, ProductGroup, ProductRecord } from "@/server/types";
import type { Product } from "@/types/home";

// L'interface publique ne change pas : les catégories restent adressées par
// "groupe/slug" et les prix circulent en chaînes formatées ("349,00 €").
// En interne, tout vient de la base et les prix sont stockés en centimes.
//
// Deux familles de fonctions cohabitent ici, et la frontière compte :
//  - `listProducts`, `getProductRecord`, `createProduct`, `updateProduct`
//    servent l'administration et rendent TOUJOURS le prix réel du catalogue.
//    Un back-office qui afficherait le prix remisé d'une campagne en cours
//    rendrait toute correction de tarif impossible à raisonner.
//  - `getCategoryPages`, `getCategoryPage`, `getProductBySlug` et
//    `getRelatedProducts` alimentent la boutique et appliquent, elles, les
//    promotions de campagne actives.

// ---- Conversions ----

export function formatPrice(cents: number): string {
  return `${(cents / 100).toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} €`;
}

export function toCents(value: string): number {
  const normalized = value.replace(/\./g, "").replace(",", ".").replace(/[^0-9.]/g, "");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
}

function parseBullets(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

/**
 * Vues complémentaires de la galerie. Même stockage JSON que `bullets`, mais on
 * écarte ici les entrées vides : une image sans chemin ferait un trou dans la
 * galerie de la fiche produit.
 */
function parseImages(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map(String).filter((entry) => entry.trim().length > 0);
  } catch {
    return [];
  }
}

function skuFor(brand: string, name: string): string {
  return slugify(`${brand}-${name}`).replace(/-/g, "").slice(0, 10).toUpperCase();
}

interface CategoryRow {
  id: string;
  slug: string;
  label: string;
  description: string;
  image: string;
  guideIntro: string;
  guideClosing: string;
  position: number;
  group: { slug: string; label: string };
  guideSections: {
    heading: string;
    body: string;
    position: number;
    tableJson: string;
    tableJsonEn: string;
  }[];
}

interface ProductRow {
  id: string;
  brand: string;
  name: string;
  slug: string;
  sku: string;
  shortDescription: string;
  description: string;
  bullets: string;
  nameEn: string;
  shortDescriptionEn: string;
  descriptionEn: string;
  bulletsEn: string;
  image: string | null;
  images: string;
  priceCents: number;
  oldPriceCents: number | null;
  badge: string | null;
  editorialRating: number | null;
  stock: number;
  lowStockThreshold: number;
  active: boolean;
  gtin: string | null;
  mpn: string | null;
  condition: string;
  googleProductCategory: string;
  shippingWeightGrams: number | null;
  energyEfficiencyClass: string | null;
  category: { slug: string; image: string; group: { slug: string } };
}

const categoryInclude = {
  group: true,
  guideSections: { orderBy: { position: "asc" } },
} as const;

const productInclude = {
  category: { include: { group: true } },
} as const;

function guideFrom(row: CategoryRow): CategoryGuide {
  return {
    intro: row.guideIntro,
    sections: row.guideSections.map((section) => ({
      heading: section.heading,
      body: section.body,
      table: parseGuideTable(section.tableJson),
    })),
    closing: row.guideClosing,
  };
}

function toCategoryRecord(row: CategoryRow): CategoryRecord {
  return {
    id: `${row.group.slug}/${row.slug}`,
    group: row.group.slug as ProductGroup,
    slug: row.slug,
    label: row.label,
    description: row.description,
    image: row.image,
    guide: guideFrom(row),
  };
}

function toProductRecord(row: ProductRow): ProductRecord {
  return {
    id: row.id,
    categoryId: `${row.category.group.slug}/${row.category.slug}`,
    brand: row.brand,
    name: row.name,
    bullets: parseBullets(row.bullets),
    shortDescription: row.shortDescription,
    description: row.description,
    nameEn: row.nameEn,
    shortDescriptionEn: row.shortDescriptionEn,
    descriptionEn: row.descriptionEn,
    bulletsEn: parseBullets(row.bulletsEn),
    image: row.image ?? undefined,
    images: parseImages(row.images),
    oldPrice: row.oldPriceCents === null ? undefined : formatPrice(row.oldPriceCents),
    price: formatPrice(row.priceCents),
    badge: row.badge ?? undefined,
    rating: row.editorialRating ?? undefined,
    stock: row.stock,
    lowStockThreshold: row.lowStockThreshold,
    inStock: row.stock > 0,
    gtin: row.gtin ?? undefined,
    mpn: row.mpn ?? undefined,
    condition: row.condition,
    googleProductCategory: row.googleProductCategory,
    shippingWeightGrams: row.shippingWeightGrams ?? undefined,
    energyEfficiencyClass: row.energyEfficiencyClass ?? undefined,
  };
}

/** Décompose un identifiant "groupe/slug". */
function splitCategoryId(id: string): { groupSlug: string; slug: string } | undefined {
  const [groupSlug, slug] = id.split("/");
  if (!groupSlug || !slug) return undefined;
  return { groupSlug, slug };
}

async function findCategoryRow(id: string) {
  const parts = splitCategoryId(id);
  if (!parts) return null;
  return prisma.category.findFirst({
    where: { slug: parts.slug, group: { slug: parts.groupSlug } },
    include: categoryInclude,
  });
}

// ---- Catégories ----

export async function listCategories(): Promise<CategoryRecord[]> {
  const rows = await prisma.category.findMany({
    include: categoryInclude,
    orderBy: [{ group: { position: "asc" } }, { position: "asc" }],
  });
  return rows.map(toCategoryRecord);
}

export async function getCategoryRecord(id: string): Promise<CategoryRecord | undefined> {
  const row = await findCategoryRow(id);
  return row ? toCategoryRecord(row) : undefined;
}

export async function createCategory(
  input: Omit<CategoryRecord, "id">,
): Promise<CategoryRecord> {
  const group = await prisma.group.findUnique({ where: { slug: input.group } });
  if (!group) {
    throw new Error(`Unbekannte Gruppe: ${input.group}`);
  }

  const existing = await prisma.category.findFirst({
    where: { groupId: group.id, slug: input.slug },
  });
  if (existing) {
    throw new Error(`Category already exists: ${input.group}/${input.slug}`);
  }

  const count = await prisma.category.count({ where: { groupId: group.id } });
  const row = await prisma.category.create({
    data: {
      groupId: group.id,
      slug: input.slug,
      label: input.label,
      description: input.description,
      image: input.image,
      guideIntro: input.guide?.intro ?? "",
      guideClosing: input.guide?.closing ?? "",
      position: count,
      guideSections: {
        create: (input.guide?.sections ?? []).map((section, position) => ({
          heading: section.heading,
          body: section.body,
          position,
          tableJson: encodeGuideTable(section.table),
        })),
      },
    },
    include: categoryInclude,
  });

  return toCategoryRecord(row);
}

export async function updateCategory(
  id: string,
  patch: Partial<Omit<CategoryRecord, "id">>,
): Promise<CategoryRecord | undefined> {
  const current = await findCategoryRow(id);
  if (!current) return undefined;

  const groupId = patch.group
    ? (await prisma.group.findUnique({ where: { slug: patch.group } }))?.id
    : undefined;

  if (patch.guide) {
    await prisma.guideSection.deleteMany({ where: { categoryId: current.id } });
  }

  const row = await prisma.category.update({
    where: { id: current.id },
    data: {
      groupId: groupId ?? undefined,
      slug: patch.slug ?? undefined,
      label: patch.label ?? undefined,
      description: patch.description ?? undefined,
      image: patch.image ?? undefined,
      guideIntro: patch.guide?.intro ?? undefined,
      guideClosing: patch.guide?.closing ?? undefined,
      guideSections: patch.guide
        ? {
            create: patch.guide.sections.map((section, position) => ({
              heading: section.heading,
              body: section.body,
              position,
              // Le formulaire d'administration ne connaît pas encore les
              // tableaux comparatifs : une section sans `table` explicite
              // reprend celui déjà en base à la même position plutôt que de
              // le perdre au premier changement de texte depuis le
              // back-office.
              tableJson: section.table
                ? encodeGuideTable(section.table)
                : (current.guideSections[position]?.tableJson ?? ""),
            })),
          }
        : undefined,
    },
    include: categoryInclude,
  });

  return toCategoryRecord(row);
}

export async function deleteCategory(id: string): Promise<boolean> {
  const current = await findCategoryRow(id);
  if (!current) return false;
  // Produits, sections de guide et avis suivent en cascade.
  await prisma.category.delete({ where: { id: current.id } });
  return true;
}

// ---- Produits ----

export async function listProducts(filter?: { categoryId?: string }): Promise<ProductRecord[]> {
  const parts = filter?.categoryId ? splitCategoryId(filter.categoryId) : undefined;

  const rows = await prisma.product.findMany({
    where: parts
      ? { category: { slug: parts.slug, group: { slug: parts.groupSlug } } }
      : undefined,
    include: productInclude,
    orderBy: [{ category: { position: "asc" } }, { createdAt: "asc" }],
  });

  return rows.map(toProductRecord);
}

export async function getProductRecord(id: string): Promise<ProductRecord | undefined> {
  const row = await prisma.product.findUnique({ where: { id }, include: productInclude });
  return row ? toProductRecord(row) : undefined;
}

export async function createProduct(input: Omit<ProductRecord, "id">): Promise<ProductRecord> {
  const parts = splitCategoryId(input.categoryId);
  if (!parts) {
    throw new Error(`Ungültige Kategorie: ${input.categoryId}`);
  }

  const category = await prisma.category.findFirst({
    where: { slug: parts.slug, group: { slug: parts.groupSlug } },
  });
  if (!category) {
    throw new Error(`Unbekannte Kategorie: ${input.categoryId}`);
  }

  const row = await prisma.product.create({
    data: {
      categoryId: category.id,
      brand: input.brand,
      name: input.name,
      slug: await uniqueSlug(slugify(`${input.brand}-${input.name}`)),
      sku: skuFor(input.brand, input.name),
      shortDescription: input.shortDescription ?? "",
      description: input.description ?? "",
      bullets: JSON.stringify(input.bullets ?? []),
      nameEn: input.nameEn ?? "",
      shortDescriptionEn: input.shortDescriptionEn ?? "",
      descriptionEn: input.descriptionEn ?? "",
      bulletsEn: JSON.stringify(input.bulletsEn ?? []),
      image: input.image ?? null,
      images: JSON.stringify(input.images ?? []),
      priceCents: toCents(input.price),
      oldPriceCents: input.oldPrice ? toCents(input.oldPrice) : null,
      badge: input.badge ?? null,
      editorialRating: input.rating ?? null,
      stock: input.stock ?? (input.inStock === false ? 0 : 10),
      lowStockThreshold: input.lowStockThreshold ?? 5,
      gtin: input.gtin || null,
      mpn: input.mpn || null,
      condition: input.condition || "new",
      googleProductCategory: input.googleProductCategory ?? "",
      shippingWeightGrams: input.shippingWeightGrams ?? null,
      energyEfficiencyClass: input.energyEfficiencyClass || null,
    },
    include: productInclude,
  });

  return toProductRecord(row);
}

/** En cas de collision, ajoute -2, -3 … pour garder une URL unique. */
async function uniqueSlug(base: string): Promise<string> {
  let candidate = base;
  let suffix = 2;
  while (await prisma.product.findUnique({ where: { slug: candidate } })) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

export async function updateProduct(
  id: string,
  patch: Partial<Omit<ProductRecord, "id">>,
): Promise<ProductRecord | undefined> {
  const current = await prisma.product.findUnique({ where: { id } });
  if (!current) return undefined;

  let categoryId: string | undefined;
  if (patch.categoryId) {
    const parts = splitCategoryId(patch.categoryId);
    const category = parts
      ? await prisma.category.findFirst({
          where: { slug: parts.slug, group: { slug: parts.groupSlug } },
        })
      : null;
    if (!category) {
      throw new Error(`Unbekannte Kategorie: ${patch.categoryId}`);
    }
    categoryId = category.id;
  }

  const brand = patch.brand ?? current.brand;
  const name = patch.name ?? current.name;
  const renamed = brand !== current.brand || name !== current.name;

  const row = await prisma.product.update({
    where: { id },
    data: {
      categoryId,
      brand: patch.brand ?? undefined,
      name: patch.name ?? undefined,
      slug: renamed ? await uniqueSlug(slugify(`${brand}-${name}`)) : undefined,
      sku: renamed ? skuFor(brand, name) : undefined,
      shortDescription: patch.shortDescription ?? undefined,
      description: patch.description ?? undefined,
      bullets: patch.bullets ? JSON.stringify(patch.bullets) : undefined,
      nameEn: patch.nameEn ?? undefined,
      shortDescriptionEn: patch.shortDescriptionEn ?? undefined,
      descriptionEn: patch.descriptionEn ?? undefined,
      bulletsEn: patch.bulletsEn ? JSON.stringify(patch.bulletsEn) : undefined,
      image: patch.image === undefined ? undefined : (patch.image || null),
      // Un tableau vide vide bien la galerie : seul `undefined` laisse la valeur en place
      images: patch.images === undefined ? undefined : JSON.stringify(patch.images),
      priceCents: patch.price ? toCents(patch.price) : undefined,
      oldPriceCents:
        patch.oldPrice === undefined ? undefined : patch.oldPrice ? toCents(patch.oldPrice) : null,
      badge: patch.badge === undefined ? undefined : (patch.badge || null),
      editorialRating: patch.rating === undefined ? undefined : (patch.rating ?? null),
      stock: patch.stock ?? undefined,
      lowStockThreshold: patch.lowStockThreshold ?? undefined,
      // Champs Google Merchant : une chaîne vide efface la valeur en base
      gtin: patch.gtin === undefined ? undefined : patch.gtin || null,
      mpn: patch.mpn === undefined ? undefined : patch.mpn || null,
      condition: patch.condition || undefined,
      googleProductCategory: patch.googleProductCategory ?? undefined,
      shippingWeightGrams:
        patch.shippingWeightGrams === undefined ? undefined : (patch.shippingWeightGrams ?? null),
      energyEfficiencyClass:
        patch.energyEfficiencyClass === undefined ? undefined : patch.energyEfficiencyClass || null,
    },
    include: productInclude,
  });

  return toProductRecord(row);
}

export async function deleteProduct(id: string): Promise<boolean> {
  const current = await prisma.product.findUnique({ where: { id } });
  if (!current) return false;
  await prisma.product.delete({ where: { id } });
  return true;
}

// ---- Vue destinée à la boutique ----

export interface CategoryPageView {
  group: ProductGroup;
  slug: string;
  groupLabel: string;
  label: string;
  description: string;
  image: string;
  brands: string[];
  products: Product[];
  guide: CategoryGuide;
}

/**
 * Note moyenne par produit, calculée sur les seuls avis validés.
 *
 * Le même filtre que la fiche produit s'applique, avis de démonstration
 * compris : la vignette annonçait « 6 avis » là où la fiche n'en montrait
 * aucun, et un compteur qui ment sur ce qu'on trouvera en cliquant est pire
 * que pas de compteur du tout.
 */
async function approvedRatings(): Promise<Map<string, { average: number; count: number }>> {
  const grouped = await prisma.review.groupBy({
    by: ["productId"],
    where: { status: "approved", ...sansAvisDemonstration() },
    _avg: { rating: true },
    _count: { _all: true },
  });

  return new Map(
    grouped.map((entry) => [
      entry.productId,
      { average: entry._avg.rating ?? 0, count: entry._count._all },
    ]),
  );
}

function toViewProduct(
  row: ProductRow,
  ratings: Map<string, { average: number; count: number }>,
  promotion?: ProductPromotion,
): Product {
  const approved = ratings.get(row.id);
  const groupSlug = row.category.group.slug;

  const view: Product = {
    id: row.id,
    slug: row.slug,
    sku: row.sku,
    brand: row.brand,
    name: row.name,
    bullets: parseBullets(row.bullets),
    shortDescription: row.shortDescription || undefined,
    description: row.description || undefined,
    // Sans visuel propre, le produit reprend l'image de sa catégorie
    image: row.image || row.category.image,
    images: parseImages(row.images),
    alt: `${row.brand} ${row.name}`,
    oldPrice: row.oldPriceCents === null ? undefined : formatPrice(row.oldPriceCents),
    price: formatPrice(row.priceCents),
    priceCents: row.priceCents,
    badge: row.badge ?? undefined,
    // Les avis clients validés priment sur la note éditoriale
    rating: approved?.count ? Number(approved.average.toFixed(1)) : (row.editorialRating ?? undefined),
    reviewCount: approved?.count ?? 0,
    stock: row.stock,
    inStock: row.stock > 0,
    href: `/${groupSlug}/${row.category.slug}/${row.slug}`,
    // Classe énergétique et rubrique de vente voyagent ensemble : la classe ne
    // se lit que rapportée à l'échelle de sa famille, et c'est la catégorie qui
    // désigne l'échelle applicable.
    energyEfficiencyClass: row.energyEfficiencyClass ?? undefined,
    categorySlug: row.category.slug,
  };

  if (!promotion) return view;

  // Une campagne « livraison offerte » ne touche pas au prix de l'article :
  // reprendre son prix de référence en prix barré afficherait deux fois le même
  // montant, dont un rayé. Seule la pastille change alors.
  const lowersPrice = promotion.savingCents > 0;

  return {
    ...view,
    price: lowersPrice ? formatPrice(promotion.priceCents) : view.price,
    oldPrice: lowersPrice ? formatPrice(promotion.basePriceCents) : view.oldPrice,
    // Le panier se sert de ce champ : sans lui, le client ajouterait l'article
    // au prix de base et découvrirait une autre somme à la commande.
    priceCents: lowersPrice ? promotion.priceCents : view.priceCents,
    // La pastille de campagne écrase la pastille éditoriale : elle est datée et
    // vérifiable, l'autre est une mention libre saisie à la main.
    badge: promotion.badge,
    promoEndsAt: promotion.endsAt.toISOString(),
    promoCountdown: promotion.showsCountdown,
  };
}

function toViewCategory(
  row: CategoryRow & { products: ProductRow[] },
  ratings: Map<string, { average: number; count: number }>,
  promotions: Map<string, ProductPromotion>,
): CategoryPageView {
  return {
    group: row.group.slug as ProductGroup,
    slug: row.slug,
    groupLabel: row.group.label,
    label: row.label,
    description: row.description,
    image: row.image,
    brands: row.products.map((product) => product.brand),
    products: row.products.map((product) =>
      toViewProduct(product, ratings, promotions.get(product.id)),
    ),
    guide: guideFrom(row),
  };
}

/**
 * Catalogue complet, mis en cache sous le tag du catalogue.
 *
 * C'est la lecture la plus lourde du projet — toutes les catégories, tous leurs
 * produits actifs — et presque chaque page de la boutique s'en sert. Sans
 * cache, le build la rejouait pour chacune des 919 pages, à quinze secondes
 * l'appel contre Neon. Le tag est purgé par `invaliderCatalogue()` à chaque
 * écriture du back-office ; `revalidate` n'est qu'un garde-fou si une écriture
 * oubliait de le faire.
 *
 * La valeur renvoyée est intégralement sérialisable — que des chaînes, nombres
 * et booléens, les dates de promotion étant déjà converties en ISO par
 * `toViewProduct`. C'est la condition pour passer par `unstable_cache` : une
 * `Map` ou un `Date` en ressortirait dénaturé.
 */
export const getCategoryPages = unstable_cache(
  async (): Promise<CategoryPageView[]> => {
    // Les promotions sont chargées en parallèle plutôt qu'après coup à partir des
    // identifiants trouvés : les campagnes actives se comptent sur les doigts
    // d'une main, alors qu'attendre la liste des produits ajouterait un
    // aller-retour à chaque page de la boutique.
    const [rows, ratings, promotions] = await Promise.all([
      prisma.category.findMany({
        include: {
          ...categoryInclude,
          products: {
            where: { active: true },
            include: productInclude,
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: [{ group: { position: "asc" } }, { position: "asc" }],
      }),
      approvedRatings(),
      getActivePromotions(),
    ]);

    return rows.map((row) => toViewCategory(row, ratings, promotions));
  },
  ["catalogue-pages"],
  { tags: [TAG_CATALOGUE], revalidate: 3600 },
);

export async function getCategoryPage(
  group: string,
  slug: string,
): Promise<CategoryPageView | undefined> {
  const [row, ratings, promotions] = await Promise.all([
    prisma.category.findFirst({
      where: { slug, group: { slug: group } },
      include: {
        ...categoryInclude,
        products: {
          where: { active: true },
          include: productInclude,
          orderBy: { createdAt: "asc" },
        },
      },
    }),
    approvedRatings(),
    getActivePromotions(),
  ]);

  return row ? toViewCategory(row, ratings, promotions) : undefined;
}

/**
 * Fiche produit. Passe par le catalogue, donc hérite des promotions de campagne
 * sans avoir à les rappliquer : un seul endroit décide du prix affiché.
 *
 * C'est bien `getCategoryPages()` — la version mise en cache — et non
 * `getCategoryPage()`. Les fiches sont composées à chaque visite depuis que le
 * build ne les pré-rend plus ; une lecture directe en base ferait payer à Neon
 * une requête par consultation, soit précisément le trafic que l'on cherchait à
 * supprimer. Le cache porte le tag « catalogue », purgé dès qu'un prix, un stock
 * ou une commande le modifie : la fiche reste juste au centime près.
 */
export async function getProductBySlug(
  group: string,
  categorySlug: string,
  productSlug: string,
): Promise<{ category: CategoryPageView; product: Product } | undefined> {
  const pages = await getCategoryPages();
  const category = pages.find((page) => page.group === group && page.slug === categorySlug);
  const product = category?.products.find((item) => item.slug === productSlug);
  if (!category || !product) return undefined;
  return { category, product };
}

/** Produits voisins, déjà remisés puisqu'ils viennent de la page de catégorie. */
export function getRelatedProducts(
  category: CategoryPageView,
  excludeSlug: string,
  limit = 6,
): Product[] {
  return category.products.filter((product) => product.slug !== excludeSlug).slice(0, limit);
}

/**
 * Produits d'une liste d'identifiants, vus par la boutique — donc remises de
 * campagne comprises. Sert à la page d'action, qui connaît sa sélection par
 * identifiants et non par catégorie.
 *
 * L'ordre demandé est conservé : la page d'action affiche les articles dans
 * l'ordre choisi par l'administrateur, pas dans celui de la base.
 */
export async function getStorefrontProducts(ids: readonly string[]): Promise<Product[]> {
  if (ids.length === 0) return [];

  const [rows, ratings, promotions] = await Promise.all([
    prisma.product.findMany({
      where: { id: { in: [...ids] }, active: true },
      include: productInclude,
    }),
    approvedRatings(),
    getActivePromotions(ids),
  ]);

  const byId = new Map(rows.map((row) => [row.id, row]));

  return ids
    .map((id) => byId.get(id))
    .filter((row): row is NonNullable<typeof row> => row !== undefined)
    .map((row) => toViewProduct(row, ratings, promotions.get(row.id)));
}

/** Identifiant interne d'une catégorie, pour les modules hors de ce store. */
export async function resolveCategoryDbId(id: string): Promise<string | undefined> {
  const row = await findCategoryRow(id);
  return row?.id;
}

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { HeroBanner } from "@/components/HeroBanner";
import { TrustBar } from "@/components/TrustBar";
import { CategoryRow } from "@/components/CategoryRow";
import { DealOfTheDay } from "@/components/DealOfTheDay";
import { BrandRow } from "@/components/BrandRow";
import { ProductGrid } from "@/components/ProductGrid";
import { PromoGrid } from "@/components/PromoGrid";
import { parsePrice } from "@/lib/price";
import { alternatesFor, localizedUrl } from "@/lib/hreflang";
import { buildSocialMetadata } from "@/lib/opengraph";
import { getCategoryPages, type CategoryPageView } from "@/server/store";
import { loadCatalogTranslations, localizeCategoryPages } from "@/server/localizedContent";
import { OrganizationJsonLd } from "@/components/seo/OrganizationJsonLd";
import type { Locale } from "@/i18n/routing";
import type { BrandTeaser, Product } from "@/types/home";

type HomeParams = Promise<{ locale: Locale }>;

/** Article mis en avant : n-ième produit d'une catégorie déjà chargée. */
function pickProduct(
  categories: CategoryPageView[],
  group: string,
  categorySlug: string,
  index: number,
): Product | undefined {
  const category = categories.find((item) => item.group === group && item.slug === categorySlug);
  return category?.products[index];
}

// Les prix du catalogue sont formatés à l'allemande par le store : l'économie
// affichée suit la même convention, quelle que soit la langue de navigation.
function formatEuro(value: number): string {
  return `${value.toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} €`;
}

// Offre du jour = l'article dont la remise en euros est la plus forte du catalogue
function pickDeal(
  categories: CategoryPageView[],
): { product: Product; saving: string } | undefined {
  let best: { product: Product; saving: string } | undefined;
  let bestSaving = 0;

  for (const category of categories) {
    for (const product of category.products) {
      if (!product.oldPrice) continue;
      const saving = parsePrice(product.oldPrice) - parsePrice(product.price);
      if (saving > bestSaving) {
        bestSaving = saving;
        best = { product, saving: formatEuro(saving) };
      }
    }
  }

  return best;
}

// Par marque : nombre d'articles dans toute la boutique, lié à la catégorie où elle est la plus présente
function topBrands(categories: CategoryPageView[], limit: number): BrandTeaser[] {
  const stats = new Map<string, { total: number; href: string; bestCount: number }>();

  for (const category of categories) {
    const href = `/${category.group}/${category.slug}`;
    const perBrand = new Map<string, number>();
    for (const product of category.products) {
      perBrand.set(product.brand, (perBrand.get(product.brand) ?? 0) + 1);
    }
    for (const [brand, count] of perBrand) {
      const entry = stats.get(brand) ?? { total: 0, href, bestCount: 0 };
      entry.total += count;
      if (count > entry.bestCount) {
        entry.bestCount = count;
        entry.href = href;
      }
      stats.set(brand, entry);
    }
  }

  return Array.from(stats, ([name, { total, href }]) => ({ name, href, count: total }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, limit);
}

export async function generateMetadata({ params }: { params: HomeParams }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  const title = t("metaTitle");
  const description = t("metaDescription");

  return {
    title,
    description,
    alternates: alternatesFor("/", locale),
    ...buildSocialMetadata({
      title,
      description,
      url: localizedUrl("/", locale),
      locale,
      image: "/og/home.png",
    }),
  };
}

export default async function Home({ params }: { params: HomeParams }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("home");

  const [rawCategories, translations] = await Promise.all([
    getCategoryPages(),
    loadCatalogTranslations(locale),
  ]);
  const categories = localizeCategoryPages(rawCategories, translations);

  const highlights = [
    pickProduct(categories, "haushalt", "kaffeemaschinen", 0),
    pickProduct(categories, "haushalt", "waschmaschinen", 0),
    pickProduct(categories, "haushalt", "geschirrspueler", 0),
    pickProduct(categories, "multimedia", "fernseher", 0),
    pickProduct(categories, "haushalt", "staubsauger", 0),
    pickProduct(categories, "multimedia", "smartphones", 0),
  ];

  const deals = [
    pickProduct(categories, "haushalt", "backoefen-herde", 0),
    pickProduct(categories, "haushalt", "geschirrspueler", 4),
    pickProduct(categories, "haushalt", "klimageraete", 0),
    pickProduct(categories, "multimedia", "videospiele", 0),
    pickProduct(categories, "multimedia", "computer", 0),
    pickProduct(categories, "multimedia", "smartwatches", 0),
  ];

  const deal = pickDeal(categories);
  const brands = topBrands(categories, 8);

  return (
    <>
      <Header />
      <main className="flex-1">
        <HeroBanner />
        <TrustBar />
        <CategoryRow />
        <ProductGrid
          heading={t("highlights")}
          ctaLabel={t("highlightsCta")}
          ctaHref="/highlights"
          products={highlights.filter((product) => product !== undefined)}
        />
        {deal && <DealOfTheDay product={deal.product} saving={deal.saving} />}
        <PromoGrid />
        <ProductGrid
          heading={t("deals")}
          ctaLabel={t("dealsCta")}
          ctaHref="/angebote"
          products={deals.filter((product) => product !== undefined)}
        />
        <BrandRow brands={brands} />
        {/* La section « Das sagen unsere Kunden » a été retirée : ses trois
            témoignages étaient inventés, et la moyenne affichée sous ce titre
            portait sur les notes rédactionnelles, non sur des avis de clients.
            À rétablir le jour où de vrais avis existent. */}
      </main>
      <Footer />

      {/* Identité du marchand, lue par Google pour rattacher le site à la boutique */}
      <OrganizationJsonLd />
    </>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ProductGallery } from "@/components/ProductGallery";
import { ProductPurchaseBox } from "@/components/ProductPurchaseBox";
import { ProductReviewSection } from "@/components/ProductReviewSection";
import { ProductJsonLd } from "@/components/seo/ProductJsonLd";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { ProductOpenGraphMeta } from "@/components/seo/ProductOpenGraphMeta";
import { ProductSourceLinks } from "@/components/ProductSourceLinks";
import { PaymentMethodsBar } from "@/components/PaymentMethodsBar";
import { ProductGrid } from "@/components/ProductGrid";
import { getProductBySlug, getRelatedProducts } from "@/server/store";
import { listPublicReviews } from "@/server/reviews";
import { loadCatalogTranslations, localizeCategoryPage } from "@/server/localizedContent";
import { productLongText, productShortText, truncateAtWord } from "@/lib/productText";
import { formatRating } from "@/lib/formatRating";
import { alternatesFor, localizedUrl } from "@/lib/hreflang";
import { buildSocialMetadata } from "@/lib/opengraph";
import type { Locale } from "@/i18n/routing";

type ProductPageParams = Promise<{
  locale: Locale;
  group: string;
  category: string;
  product: string;
}>;

/**
 * Aucune fiche produit n'est composée à la construction du site.
 *
 * Il y en a près de huit cents, deux langues comprises, et chacune lisait sa
 * propre ligne en base pendant le build. Next répartit ce travail sur des
 * dizaines de processus simultanés : autant de connexions qui, multipliées par
 * les déploiements d'une journée, ont fini par épuiser le quota de transfert de
 * la base et mettre la boutique à l'arrêt.
 *
 * L'absence de `generateStaticParams` suffit à obtenir ce résultat : la route
 * est servie à la demande, comme la page d'accueil, les groupes et les
 * catégories, et le build ne touche plus au catalogue.
 *
 * ATTENTION — ne pas rétablir un `generateStaticParams` qui rendrait une liste
 * vide. La mise en page racine lit `headers()` pour connaître la langue, ce qui
 * rend toute la boutique dynamique. Avec une liste de paramètres, même vide,
 * Next classe pourtant la route en pré-rendu : la première visite compose alors
 * la fiche en mode statique, tombe sur cette lecture d'en-têtes et répond 500
 * (`DYNAMIC_SERVER_USAGE`). C'est ce qui a mis toutes les fiches hors service.
 * La lecture reste bon marché : elle passe par le catalogue mis en cache sous le
 * tag « catalogue », purgé à chaque écriture du back-office.
 */

/** Charge la fiche produit et sa catégorie, traduites dans la langue demandée. */
async function loadLocalizedProduct(
  locale: Locale,
  group: string,
  category: string,
  product: string,
) {
  const [data, translations] = await Promise.all([
    getProductBySlug(group, category, product),
    loadCatalogTranslations(locale),
  ]);
  if (!data) return undefined;

  const localizedCategory = localizeCategoryPage(data.category, translations);
  const localizedProduct = localizedCategory.products.find((item) => item.slug === product);

  return localizedProduct
    ? { category: localizedCategory, product: localizedProduct }
    : undefined;
}

export async function generateMetadata({ params }: { params: ProductPageParams }): Promise<Metadata> {
  const { locale, group, category, product } = await params;
  const data = await loadLocalizedProduct(locale, group, category, product);
  if (!data) return {};

  const t = await getTranslations({ locale, namespace: "product" });

  // Le nom complet du produit (marque + modèle + caractéristiques) dépasse
  // souvent 100 caractères une fois le suffixe de marque ajouté ; Google
  // tronque autour de 60-70 et perd le suffixe. On coupe donc la partie
  // variable pour garder un <title> qui s'affiche entièrement dans les
  // résultats de recherche.
  const productName = truncateAtWord(`${data.product.brand} ${data.product.name}`, 45);
  const description = truncateAtWord(
    productShortText(data.product, data.category.label, locale),
    160,
  );

  const title = t("metaTitle", { name: productName });

  return {
    title,
    description,
    alternates: alternatesFor(`/${group}/${category}/${product}`, locale),
    ...buildSocialMetadata({
      title,
      description,
      url: localizedUrl(`/${group}/${category}/${product}`, locale),
      locale,
      image: data.product.image,
      imageAlt: `${data.product.brand} ${data.product.name}`,
      product: true,
    }),
  };
}

export default async function ProductPage({ params }: { params: ProductPageParams }) {
  const { locale, group, category, product } = await params;
  setRequestLocale(locale);

  const data = await loadLocalizedProduct(locale, group, category, product);

  if (!data) {
    notFound();
  }

  const t = await getTranslations("product");
  const common = await getTranslations("common");

  const { category: categoryData, product: productData } = data;
  const relatedProducts = getRelatedProducts(categoryData, productData.slug ?? "", 6);

  const shortText = productShortText(productData, categoryData.label, locale);
  const description = productLongText(productData, categoryData.label, locale);

  // Seuls les avis validés par la modération quittent la base pour la boutique,
  // et jamais les avis de démonstration. Chargés ici, une fois, puis partagés
  // entre l'affichage et le balisage JSON-LD : les deux doivent montrer
  // exactement la même chose à Google.
  const avis = productData.id ? await listPublicReviews(productData.id) : [];

  // Note et nombre d'avis en tête de fiche, tirés de ces mêmes avis plutôt que du
  // catalogue mis en cache : Google contrôle que la note balisée est bien celle
  // que la page montre, et les deux ne doivent pas pouvoir diverger, fût-ce le
  // temps d'une purge de cache.
  const avisPublies = avis.length;
  const noteMoyenne =
    avisPublies > 0 ? avis.reduce((somme, item) => somme + item.rating, 0) / avisPublies : undefined;

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="border-b border-border bg-white">
          <div className="mx-auto max-w-screen-xl px-3 py-3">
            <Breadcrumb
              items={[
                { label: common("home"), href: "/" },
                { label: categoryData.groupLabel, href: `/${categoryData.group}` },
                { label: categoryData.label, href: `/${categoryData.group}/${categoryData.slug}` },
                { label: productData.name },
              ]}
            />
          </div>
        </div>

        <div className="mx-auto max-w-screen-xl px-3 py-6">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <ProductGallery
              image={productData.image}
              images={productData.images}
              alt={productData.alt}
            />

            <div className="flex flex-col gap-4">
              <div>
                <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
                  {productData.brand}
                </p>
                <h1 className="text-2xl font-black text-foreground sm:text-3xl">{productData.name}</h1>
                {/* L'étoile suppose des avis : sans eux, elle affichait la note
                    rédactionnelle comme une moyenne de clients. Celle-ci reste
                    plus bas, sous son nom, dans la section des avis.
                    La référence article, elle, s'affiche toujours — elle était
                    jusqu'ici emportée avec la note sur les fiches non notées. */}
                <p className="mt-1 text-sm text-muted-foreground">
                  {typeof noteMoyenne === "number" && avisPublies > 0 && (
                    <>
                      ⭐ {t("ratingOf", { rating: formatRating(noteMoyenne, locale) })} ·{" "}
                      {t("reviewCount", { count: avisPublies })} ·{" "}
                    </>
                  )}
                  {t("sku")}: {productData.sku}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-foreground/80">{shortText}</p>
              </div>

              <ProductPurchaseBox product={productData} />
              <PaymentMethodsBar />
            </div>
          </div>
        </div>

        <section className="mx-auto max-w-screen-xl px-3 py-8">
          <h2 className="mb-4 text-xl font-black text-foreground">{t("details")}</h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <div>
              <h3 className="mb-2 text-sm font-bold text-foreground">{t("description")}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-bold text-foreground">{t("features")}</h3>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {productData.bullets.map((bullet) => (
                  <li key={bullet} className="flex gap-2">
                    <span className="text-primary">✓</span> {bullet}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <ProductSourceLinks
            brand={productData.brand}
            categorySlug={categoryData.slug}
            locale={locale}
          />
        </section>

        {productData.id && (
          <div className="border-t border-border">
            <ProductReviewSection
              productId={productData.id}
              reviews={avis}
              editorialRating={productData.rating}
            />
          </div>
        )}

        {relatedProducts.length > 0 && (
          <div className="border-t border-border">
            <ProductGrid
              heading={t("related")}
              ctaLabel={common("showAll")}
              ctaHref={`/${categoryData.group}/${categoryData.slug}`}
              products={relatedProducts}
            />
          </div>
        )}
      </main>
      <Footer />

      {/* Données structurées : cohérentes avec le prix et la disponibilité affichés */}
      <ProductJsonLd product={productData} reviews={avis} />
      <ProductOpenGraphMeta
        priceAmount={((productData.priceCents ?? 0) / 100).toFixed(2)}
        priceCurrency="EUR"
        availability={(productData.stock ?? 0) > 0 ? "instock" : "oos"}
        brand={productData.brand}
      />
      <BreadcrumbJsonLd
        items={[
          { label: common("home"), href: "/" },
          { label: categoryData.groupLabel, href: `/${categoryData.group}` },
          { label: categoryData.label, href: `/${categoryData.group}/${categoryData.slug}` },
          { label: productData.name },
        ]}
      />
    </>
  );
}

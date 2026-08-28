import type { Metadata } from "next";

// Bloc Open Graph / Twitter Card partagé par les pages publiques. Sans lui,
// un lien partagé sur WhatsApp, Facebook ou X n'affiche ni image ni titre —
// juste l'URL brute.

const SITE_NAME = "Hausgeräte Pfeffer";
const DEFAULT_OG_IMAGE = "/images/logo-full.png";

function ogLocale(locale: string): string {
  return locale === "en" ? "en_US" : "de_DE";
}

export function buildSocialMetadata(params: {
  title: string;
  description: string;
  url: string;
  locale: string;
  image?: string;
  imageAlt?: string;
  /**
   * Renseigné uniquement sur une fiche produit. Le type Metadata de Next
   * n'a pas de variante "product" (voir OpenGraphType dans
   * next/dist/lib/metadata/types/opengraph-types.d.ts — seuls website,
   * article, book, profile et les familles musique/vidéo existent) :
   * `openGraph.type` reste donc absent dans ce cas, pour ne pas écrire
   * "website" alors que og:type est contredit juste en dessous. og:type et
   * les champs product: (espace de noms Facebook/Pinterest) partent par
   * `other`, la seule voie de Next pour des balises meta qu'il ne connaît
   * pas nativement.
   */
  product?: {
    priceAmount: string;
    priceCurrency: string;
    availability: "instock" | "oos";
    brand?: string;
  };
  /** Renseigné uniquement sur un article Ratgeber. `article` est, lui, un type natif de Next. */
  article?: {
    publishedTime: string;
    modifiedTime?: string;
    authorName: string;
  };
}): Pick<Metadata, "openGraph" | "twitter" | "other"> {
  const image = params.image ?? DEFAULT_OG_IMAGE;
  const imageAlt = params.imageAlt ?? params.title;
  const { product, article } = params;

  return {
    openGraph: {
      ...(product
        ? {}
        : article
          ? {
              type: "article" as const,
              publishedTime: article.publishedTime,
              modifiedTime: article.modifiedTime,
              authors: [article.authorName],
            }
          : { type: "website" as const }),
      siteName: SITE_NAME,
      title: params.title,
      description: params.description,
      url: params.url,
      locale: ogLocale(params.locale),
      images: [{ url: image, alt: imageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: params.title,
      description: params.description,
      images: [image],
    },
    ...(product
      ? {
          other: {
            "og:type": "product",
            "product:price:amount": product.priceAmount,
            "product:price:currency": product.priceCurrency,
            "product:availability": product.availability,
            ...(product.brand ? { "product:brand": product.brand } : {}),
          },
        }
      : {}),
  };
}

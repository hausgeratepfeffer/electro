import { JsonLd, type JsonLdValue } from "@/components/seo/JsonLd";
import { absoluteUrl, SHOP_NAME, siteUrl } from "@/server/merchant";

// Balisage Article d'un article Ratgeber. `publisher` pointe vers l'entité
// posée par OrganizationJsonLd (même @id) plutôt que d'en redéclarer une
// deuxième — Google doit rattacher les deux au même OnlineStore.

export interface ArticleJsonLdProps {
  path: string;
  title: string;
  description: string;
  image?: string;
  publishedAt: string;
  updatedAt: string;
}

export function ArticleJsonLd({ path, title, description, image, publishedAt, updatedAt }: ArticleJsonLdProps) {
  const base = siteUrl();

  const data: Record<string, JsonLdValue | undefined> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    url: absoluteUrl(path),
    mainEntityOfPage: absoluteUrl(path),
    datePublished: publishedAt,
    dateModified: updatedAt,
    image: image ? absoluteUrl(image) : undefined,
    author: { "@type": "Organization", name: SHOP_NAME, "@id": `${base}#organization` },
    publisher: { "@id": `${base}#organization` },
  };

  return <JsonLd data={data} />;
}

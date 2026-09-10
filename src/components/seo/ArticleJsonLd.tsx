import { JsonLd, type JsonLdValue } from "@/components/seo/JsonLd";
import { absoluteUrl, siteUrl } from "@/server/merchant";
import { editorialAuthorJsonLd } from "@/content/editorialAuthor";

// Balisage Article d'un article Ratgeber. `publisher` pointe vers l'entité
// posée par OrganizationJsonLd (même @id) plutôt que d'en redéclarer une
// deuxième — Google doit rattacher les deux au même OnlineStore. `author` est
// une Person réelle (la responsable éditoriale), visible en pied d'article.

export interface ArticleJsonLdProps {
  path: string;
  title: string;
  description: string;
  image?: string;
  publishedAt: string;
  updatedAt: string;
  /** Langue de la page — sélectionne l'intitulé et la bio de l'auteur. */
  locale: string;
  /**
   * Sélecteurs CSS des passages lus à voix haute (Google Assistant /
   * actualités, bêta) — en général le titre et le chapô. À ne fournir que si
   * ces classes existent dans le DOM de la page, jamais un sélecteur qui ne
   * correspondrait à rien.
   */
  speakableSelector?: readonly string[];
}

export function ArticleJsonLd({
  path,
  title,
  description,
  image,
  publishedAt,
  updatedAt,
  locale,
  speakableSelector,
}: ArticleJsonLdProps) {
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
    speakable:
      speakableSelector && speakableSelector.length > 0
        ? { "@type": "SpeakableSpecification", cssSelector: [...speakableSelector] }
        : undefined,
    author: editorialAuthorJsonLd(locale),
    publisher: { "@id": `${base}#organization` },
  };

  return <JsonLd data={data} />;
}

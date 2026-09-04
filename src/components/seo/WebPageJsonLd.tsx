import { JsonLd, type JsonLdValue } from "@/components/seo/JsonLd";
import { absoluteUrl, siteUrl } from "@/server/merchant";

/**
 * Balisage WebPage générique, pour les pages qui n'ont pas de type schema.org
 * plus spécifique (Product, Article, FAQPage…) mais ne doivent pas rester sans
 * aucune donnée structurée pour autant — les pages légales informatives, par
 * exemple. Référence l'Organization/WebSite posés une fois sur l'accueil
 * (OrganizationJsonLd) par leur @id, sans les répéter ici.
 */
export function WebPageJsonLd({
  path,
  title,
  description,
  locale,
  dateModified,
}: {
  path: string;
  title: string;
  description: string;
  locale: string;
  dateModified?: string;
}) {
  const url = absoluteUrl(path);
  const base = siteUrl();

  const data: Record<string, JsonLdValue | undefined> = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: title,
    description,
    inLanguage: locale,
    isPartOf: { "@id": `${base}#website` },
    dateModified,
  };

  return <JsonLd data={data} />;
}

import { JsonLd, type JsonLdValue } from "@/components/seo/JsonLd";
import { COMPANY } from "@/content/legal";
import { MERCHANT_COUNTRY, MERCHANT_LANGUAGE, SHOP_NAME, SHOP_PHONE, siteUrl } from "@/server/merchant";

// Balisage Organization + WebSite du site.
//
// Google s'en sert pour rattacher la boutique à une entité connue : c'est l'un des
// signaux qui évitent la mention « Irreführende Informationen » et qui accélèrent la
// validation d'un compte Merchant Center récent.
//
// À placer une seule fois, dans la mise en page racine ou sur la page d'accueil.

interface OrganizationJsonLdProps {
  /** Profils officiels de la boutique — renforce l'identification de l'entité. */
  sameAs?: string[];
  /**
   * Adresse postale du siège. Par défaut celle de l'Impressum : Google compare
   * le balisage et la page, et une entité sans adresse est plus difficile à
   * rattacher — c'est l'un des signaux qui accélèrent la validation d'un compte
   * Merchant Center. La renseigner à la main ne servirait qu'à la faire diverger.
   */
  address?: {
    streetAddress: string;
    postalCode: string;
    addressLocality: string;
  };
}

const ADRESSE_SIEGE = {
  streetAddress: COMPANY.street,
  postalCode: COMPANY.postalCode,
  addressLocality: COMPANY.locality,
};

export function OrganizationJsonLd({ sameAs, address = ADRESSE_SIEGE }: OrganizationJsonLdProps) {
  const base = siteUrl();

  const organization: Record<string, JsonLdValue | undefined> = {
    "@type": "OnlineStore",
    "@id": `${base}#organization`,
    name: SHOP_NAME,
    // La raison sociale complète, distincte du nom commercial : c'est elle qui
    // figure dans l'Impressum, et la faire correspondre aide Google à rattacher
    // la boutique à une entité réelle.
    legalName: COMPANY.name,
    url: base,
    logo: `${base}/images/logo-full.png`,
    image: `${base}/images/logo-full.png`,
    telephone: SHOP_PHONE,
    areaServed: MERCHANT_COUNTRY,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: SHOP_PHONE,
      contactType: "customer service",
      areaServed: MERCHANT_COUNTRY,
      availableLanguage: [MERCHANT_LANGUAGE, "en"],
    },
    sameAs: sameAs && sameAs.length > 0 ? sameAs : undefined,
    address: address
      ? {
          "@type": "PostalAddress",
          streetAddress: address.streetAddress,
          postalCode: address.postalCode,
          addressLocality: address.addressLocality,
          addressCountry: MERCHANT_COUNTRY,
        }
      : undefined,
  };

  const website: Record<string, JsonLdValue | undefined> = {
    "@type": "WebSite",
    "@id": `${base}#website`,
    name: SHOP_NAME,
    url: base,
    inLanguage: MERCHANT_LANGUAGE,
    publisher: { "@id": `${base}#organization` },
    // Recherche interne du site (/suche?q=…) : rend la boutique éligible à la
    // « sitelinks search box » de Google, un champ de recherche affiché sous le
    // résultat de marque.
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${base}/suche?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@graph": [organization, website],
      }}
    />
  );
}

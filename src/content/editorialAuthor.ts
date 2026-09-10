import { siteUrl } from "@/server/merchant";

/**
 * Responsable éditoriale du contenu conseil (Ratgeber, FAQ, guides catégorie).
 *
 * Source unique : le balisage `author` de tous ces contenus et le bloc bio
 * visible s'y réfèrent. Une personne réelle de l'entreprise — jamais un
 * « expert » inventé, ce que Google comme un lecteur pénalisent.
 */
export const EDITORIAL_AUTHOR = {
  name: "Monika Klaebe",
  jobTitle: { de: "Redaktionsleiterin", en: "Editorial Director" },
  since: 2014,
  bio: {
    de:
      "Monika Klaebe verantwortet die Redaktion von Hausgeräte Pfeffer. Sie ist seit 2014 in der " +
      "Kundenberatung des Unternehmens tätig und betreut die Ratgeber- und FAQ-Inhalte zu " +
      "Haushaltsgeräten und Multimedia.",
    en:
      "Monika Klaebe heads the editorial team at Hausgeräte Pfeffer. She has worked in the " +
      "company's customer advisory service since 2014 and looks after the guide and FAQ content " +
      "on home appliances and multimedia.",
  },
  /** Ancre du bloc bio visible, cible du champ `url` de la Person schema.org. */
  anchor: "redaktion",
} as const;

type Lang = "de" | "en";

function lang(locale: string): Lang {
  return locale === "en" ? "en" : "de";
}

/** Chemin de la bio visible pour la langue donnée (accueil DE à la racine). */
export function editorialAuthorUrl(locale: string): string {
  const prefix = locale === "en" ? "/en" : "";
  return `${siteUrl()}${prefix}/ueber-uns#${EDITORIAL_AUTHOR.anchor}`;
}

/** Nœud `Person` prêt à poser en `author` d'un Article ou d'un FAQPage. */
export function editorialAuthorJsonLd(locale: string) {
  const l = lang(locale);
  return {
    "@type": "Person" as const,
    name: EDITORIAL_AUTHOR.name,
    jobTitle: EDITORIAL_AUTHOR.jobTitle[l],
    description: EDITORIAL_AUTHOR.bio[l],
    url: editorialAuthorUrl(locale),
    worksFor: { "@id": `${siteUrl()}#organization` },
  };
}

export function editorialAuthorJobTitle(locale: string): string {
  return EDITORIAL_AUTHOR.jobTitle[lang(locale)];
}

export function editorialAuthorBio(locale: string): string {
  return EDITORIAL_AUTHOR.bio[lang(locale)];
}

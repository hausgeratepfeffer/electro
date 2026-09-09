/**
 * Contenu légal et informatif d'ORIGINE — celui qui est versionné avec le code.
 *
 * Ce module ne doit pas être lu directement par une page : depuis que
 * l'administration peut réécrire ces textes, la source de vérité est
 * `src/server/legalPages.ts`, qui interroge la base et retombe ici quand aucune
 * réécriture n'existe.
 *
 * Ce qui reste exporté ici est ce qui ne dépend pas de la base : la liste des
 * slugs, les gardes de type, la construction des adresses et la répartition des
 * liens en colonnes de pied de page.
 */

import { deLegalPages } from "./de";
import { enLegalPages } from "./en";
import type { LegalFooterGroup, LegalLocale, LegalPageMap, LegalSlug } from "./types";

/**
 * Identité de l'entreprise, source unique pour l'Impressum comme pour la
 * facture PDF. Elle ne dépend pas de la base : ces mentions engagent la société
 * et ne sont pas modifiables depuis le back-office.
 */
export { COMPANY } from "./de";

export type {
  LegalFooterGroup,
  LegalFooterLink,
  LegalLocale,
  LegalPage,
  LegalPageMap,
  LegalSection,
  LegalSlug,
} from "./types";

/** Langue par défaut de la boutique (marché allemand). */
export const DEFAULT_LEGAL_LOCALE: LegalLocale = "de";

/** Toutes les langues disponibles, utile pour `generateStaticParams`. */
export const LEGAL_LOCALES: readonly LegalLocale[] = ["de", "en"];

/** Tous les slugs, dans l'ordre d'affichage souhaité. */
export const LEGAL_SLUGS: readonly LegalSlug[] = [
  "impressum",
  "agb",
  "datenschutz",
  "widerruf",
  "versand",
  "zahlungsarten",
  "retoure",
  "elektroaltgeraete",
  "faq",
  "ueber-uns",
  "kontakt",
];

/** Titre affiché dans le back-office pour chaque page. */
export const LEGAL_SLUG_LABELS: Readonly<Record<LegalSlug, string>> = {
  impressum: "Impressum",
  agb: "AGB",
  datenschutz: "Datenschutzerklärung",
  widerruf: "Widerrufsbelehrung",
  versand: "Versand & Lieferung",
  zahlungsarten: "Zahlungsarten",
  retoure: "Retoure & Rücksendung",
  elektroaltgeraete: "Elektroaltgeräte",
  faq: "FAQ",
  "ueber-uns": "Über uns",
  kontakt: "Kontakt",
};

/** Corpus d'origine, indexé par langue. */
export const ORIGIN_PAGES: Readonly<Record<LegalLocale, LegalPageMap>> = {
  de: deLegalPages,
  en: enLegalPages,
};

/** Vérifie qu'une chaîne quelconque correspond bien à un slug connu. */
export function isLegalSlug(value: string): value is LegalSlug {
  return (LEGAL_SLUGS as readonly string[]).includes(value);
}

/** Vérifie qu'une chaîne quelconque correspond bien à une langue gérée. */
export function isLegalLocale(value: string): value is LegalLocale {
  return (LEGAL_LOCALES as readonly string[]).includes(value);
}

/**
 * Construit le chemin d'une page : `/impressum` en allemand,
 * `/en/impressum` en anglais.
 */
export function getLegalHref(slug: LegalSlug, locale: LegalLocale = DEFAULT_LEGAL_LOCALE): string {
  return locale === DEFAULT_LEGAL_LOCALE ? `/${slug}` : `/${locale}/${slug}`;
}

/** Intitulés des colonnes du pied de page, par langue. */
export const FOOTER_GROUP_TITLES: Readonly<
  Record<LegalLocale, Readonly<Record<LegalFooterGroup["id"], string>>>
> = {
  de: { service: "Service", legal: "Rechtliches", company: "Unternehmen" },
  en: { service: "Service", legal: "Legal", company: "Company" },
};

/** Ordre des colonnes du pied de page. */
export const FOOTER_GROUP_IDS = ["service", "legal", "company"] as const;

/**
 * Répartition des slugs par colonne du pied de page.
 *
 * « widerruf » figure dans la colonne « Rechtliches » : la politique de
 * rétractation doit être directement identifiable et accessible sans connexion
 * (exigence Google Merchant Center), pas seulement atteignable via /retoure ou
 * le tunnel de commande.
 *
 * « elektroaltgeraete » n'y figure pas : la page existe toujours et reste
 * servie à son adresse, les liens du tunnel de commande et du suivi de
 * commande restent la voie d'accès.
 */
export const FOOTER_GROUP_SLUGS: Readonly<Record<LegalFooterGroup["id"], readonly LegalSlug[]>> = {
  service: ["versand", "zahlungsarten", "retoure", "faq"],
  legal: ["impressum", "agb", "datenschutz", "widerruf"],
  company: ["ueber-uns", "kontakt"],
};

/**
 * Libellés courts pour le pied de page, quand le titre de la page est trop
 * long pour une colonne. À défaut, le pied de page reprend le titre de la page.
 */
export const FOOTER_LINK_LABELS: Partial<
  Record<LegalSlug, Readonly<Record<LegalLocale, string>>>
> = {
  widerruf: { de: "Widerrufsrecht", en: "Right of withdrawal" },
};

export { deLegalPages, enLegalPages };

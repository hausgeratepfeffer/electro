import { defineRouting } from "next-intl/routing";

// L'allemand reste à la racine (/), l'anglais vit sous /en :
// les URL existantes ne changent pas et le référencement acquis est préservé.
export const routing = defineRouting({
  locales: ["de", "en"],
  defaultLocale: "de",
  localePrefix: "as-needed",
  // Pas de redirection d'après la langue du navigateur : « / » sert toujours
  // l'allemand. Sinon un robot d'indexation anglophone serait renvoyé vers /en
  // et la version allemande, celle qui porte le référencement, ne serait plus
  // explorée. Le changement de langue reste un choix explicite du visiteur.
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];

export const LOCALE_LABELS: Record<Locale, string> = {
  de: "Deutsch",
  en: "English",
};

// Le référencement vise l'Allemagne : le contenu principal est l'allemand, servi
// à la racine. On régionalise donc les étiquettes de langue plutôt que de rester
// sur un « de » / « en » nus.
//
// HTML_LANG alimente l'attribut <html lang>. "de-DE" pour le contenu allemand
// (celui qui porte le référencement). "en-GB" pour les pages anglaises,
// minoritaires : "anglais européen", standard et — contrairement à un "en-DE" —
// reconnu par les balises og:locale, ce qui évite un écart entre les deux.
export const HTML_LANG: Record<Locale, string> = {
  de: "de-DE",
  en: "en-GB",
};

// OG_LOCALE alimente og:locale (format langue_TERRITOIRE de la liste Facebook).
// Aligné sur HTML_LANG.
export const OG_LOCALE: Record<Locale, string> = {
  de: "de_DE",
  en: "en_GB",
};

/**
 * Sites officiels des fabricants, pour un lien sortant depuis la fiche produit.
 *
 * Chaque URL a été vérifiée avant d'entrer ici — soit par une requête directe
 * (code 200), soit, quand un pare-feu de marque bloque les requêtes
 * automatisées (fréquent : BEKO, JBL renvoient 403 à toute requête non
 * navigateur), par recoupement avec des résultats de moteur de recherche
 * récents qui confirment la page comme active. Une marque absente d'ici n'a
 * volontairement aucun lien plutôt qu'une URL devinée — un lien sortant faux
 * nuit plus qu'il n'aide, à la confiance du client comme au signal envoyé aux
 * moteurs.
 *
 * Volontairement pas de couverture exhaustive des marques du catalogue : à
 * compléter marque par marque, jamais par supposition.
 */
export const BRAND_OFFICIAL_SITES: Record<string, string> = {
  aeg: "https://www.aeg.de",
  apple: "https://www.apple.com/de/",
  beko: "https://www.beko.com/de-de",
  bosch: "https://www.bosch-home.de",
  "de'longhi": "https://www.delonghi.com/de-de",
  delonghi: "https://www.delonghi.com/de-de",
  dji: "https://www.dji.com/de",
  jbl: "https://de.jbl.com/",
  kaercher: "https://www.kaercher.com/de/home-garden.html",
  "kärcher": "https://www.kaercher.com/de/home-garden.html",
  kenwood: "https://www.kenwoodworld.com/de-de",
  miele: "https://www.miele.de",
  samsung: "https://www.samsung.com/de/",
  siemens: "https://www.siemens-home.bsh-group.com/de",
};

/** Recherche insensible à la casse : les marques du catalogue varient (SAMSUNG / Samsung). */
export function officialSiteForBrand(brand: string): string | undefined {
  return BRAND_OFFICIAL_SITES[brand.trim().toLowerCase()];
}

/**
 * Accueil public de la base EPREL (registre européen de l'étiquette énergie).
 *
 * Volontairement pas de lien profond vers une fiche précise : ça demanderait
 * un numéro d'enregistrement EPREL vérifié pour chaque référence, qu'on n'a
 * pas. Le client tape lui-même la marque et le modèle sur une page dont
 * l'existence et le fonctionnement sont garantis, plutôt que de suivre un lien
 * construit à sa place vers une fiche qu'on n'a jamais consultée.
 */
export const EPREL_SEARCH_URL = "https://eprel.ec.europa.eu/screen/home";

/**
 * Corrige la page « Elektroaltgeräte und Batterien » là où elle vit vraiment :
 * la table `LegalContent`. Le gabarit `src/content/legal/*.ts` ne l'alimente
 * plus dès qu'une ligne existe en base — et c'est le cas pour les deux langues.
 *
 * Trois mentions y bloquent l'examen Google Merchant Center, constatées en
 * production le 8 septembre 2026 :
 *
 *   1. Forme juridique fausse : « Hausgeräte Pfeffer GmbH » dans les adresses
 *      de reprise, alors que l'entreprise est une OHG partout ailleurs
 *      (Impressum, CGV, Kontakt).
 *
 *   2. Adresse inventée : « Musterstraße 12, 10115 Berlin » comme adresse de
 *      renvoi des petits appareils et des piles, alors que le siège — et la
 *      seule adresse réelle — est « Matthiasstraße 15, 54290 Trier ».
 *
 *   3. Numéros de registre nuls suivis de « (Platzhalter) » / « (placeholder) »
 *      dans la section « Registrierungsnummern », plus une phrase de chapeau
 *      qui annonce que la rubrique reste « vor der Veröffentlichung zu prüfen ».
 *      Le commerçant a fourni les numéros à publier ; ils sont posés ici.
 *
 * Pour la version anglaise, le chapeau (resté en allemand en base) est aussi
 * remis dans sa formulation anglaise, identique à `src/content/legal/en.ts`.
 * Le reste des passages non traduits de cette page relève du script de
 * traduction, pas de celui-ci.
 *
 * Idempotent : relancé, il ne réécrit rien. Il refuse d'écrire si une mention
 * ciblée survit à la transformation — signe que le texte a bougé et qu'il faut
 * reprendre à la main.
 *
 * Usage :
 *   npx tsx --env-file=.env.local scripts/conformite-elektroaltgeraete.ts
 *   npx tsx --env-file=.env.local scripts/conformite-elektroaltgeraete.ts --appliquer
 */

import { prisma } from "../src/server/prisma";

const SLUG = "elektroaltgeraete";
const APPLIQUER = process.argv.includes("--appliquer");
const AUTEUR = "scripts/conformite-elektroaltgeraete.ts";

/** Coordonnées réelles, telles que les portent l'Impressum et les CGV. */
const RAISON_SOCIALE = "Hausgeräte Pfeffer OHG";
const ADRESSE = "Matthiasstraße 15, 54290 Trier";

/** Numéros de registre communiqués par le commerçant, à publier. */
const BATTG = "DE 74839261";
const LUCID = "DE 1751043976284";

/** Phrase de chapeau qui ne peut pas rester en ligne (valeur à vérifier). */
const PHRASE_CHAPEAU =
  " Ob und in welchem Umfang eine Rücknahmepflicht besteht, hängt von der tatsächlichen Lager- und Versandfläche ab und ist vor der Veröffentlichung zu prüfen.";

/** Chapeau anglais de référence (src/content/legal/en.ts). */
const CHAPEAU_EN =
  "Information under the German Electrical and Electronic Equipment Act (ElektroG) and the German Battery Law Implementation Act (BattDG): how to return waste appliances, waste batteries and rechargeable batteries to us free of charge.";

interface Section {
  heading?: string;
  body?: string;
  list?: string[];
}
interface Page {
  intro?: string;
  sections?: Section[];
  [autre: string]: unknown;
}

/** Applique une substitution à tous les textes de la page, chapeau compris. */
function remplacerPartout(page: Page, cherche: string, remplace: string): void {
  const passe = (t: string) => t.split(cherche).join(remplace);
  if (page.intro) page.intro = passe(page.intro);
  for (const section of page.sections ?? []) {
    if (section.body) section.body = passe(section.body);
    if (section.list) section.list = section.list.map(passe);
  }
}

/** Mentions qui ne doivent plus apparaître nulle part après passage. */
const INTERDITS = [
  "Hausgeräte Pfeffer GmbH",
  "Musterstraße 12, 10115 Berlin",
  "(Platzhalter)",
  "(placeholder)",
  "vor der Veröffentlichung zu prüfen",
];

function transformer(page: Page, locale: string): void {
  // 1. Forme juridique et adresse de reprise.
  remplacerPartout(page, "Hausgeräte Pfeffer GmbH", RAISON_SOCIALE);
  remplacerPartout(page, "Musterstraße 12, 10115 Berlin", ADRESSE);

  // 2. Numéros de registre : on remplace la valeur nulle ET la mention
  //    « (Platzhalter) / (placeholder) » qui la suit, dans les deux langues.
  remplacerPartout(page, "DE0000000000000 (Platzhalter)", LUCID);
  remplacerPartout(page, "DE0000000000000 (placeholder)", LUCID);
  remplacerPartout(page, "DE00000000 (Platzhalter)", BATTG);
  remplacerPartout(page, "DE00000000 (placeholder)", BATTG);

  // 3. Phrase de chapeau « à vérifier avant publication ».
  if (page.intro) page.intro = page.intro.split(PHRASE_CHAPEAU).join("");

  // 4. Chapeau anglais resté en allemand : on rétablit la version anglaise.
  if (locale === "en" && page.intro && !/^Information under the German/.test(page.intro)) {
    page.intro = CHAPEAU_EN;
  }
}

async function main(): Promise<void> {
  console.log(
    APPLIQUER
      ? "Application des corrections dans LegalContent.\n"
      : "Simulation — aucune écriture. Ajoutez --appliquer pour écrire.\n",
  );

  const lignes = await prisma.legalContent.findMany({
    where: { slug: SLUG },
    select: { slug: true, locale: true, data: true },
    orderBy: { locale: "asc" },
  });

  if (lignes.length === 0) {
    console.log(`Aucune ligne « ${SLUG} » en base : le fichier versionné fait foi, rien à faire.`);
    return;
  }

  let modifiees = 0;

  for (const ligne of lignes) {
    let page: Page;
    try {
      page = JSON.parse(ligne.data) as Page;
    } catch {
      console.log(`  ${ligne.slug}/${ligne.locale} — contenu illisible, ignoré`);
      continue;
    }

    const avant = JSON.stringify(page);
    transformer(page, ligne.locale);
    const apres = JSON.stringify(page);

    if (avant === apres) {
      console.log(`  ${ligne.slug}/${ligne.locale} — déjà conforme`);
      continue;
    }

    // Garde-fou : aucune mention interdite ne doit subsister.
    const restes = INTERDITS.filter((m) => apres.includes(m));
    if (restes.length > 0) {
      throw new Error(
        `${ligne.slug}/${ligne.locale} : mentions encore présentes après transformation ` +
          `(${restes.join(", ")}). Le texte a changé — reprendre à la main.`,
      );
    }

    modifiees += 1;
    console.log(
      `  ${ligne.slug}/${ligne.locale} — corrigée (${avant.length - apres.length} caractères retirés)`,
    );

    if (!APPLIQUER) {
      for (const m of [RAISON_SOCIALE, ADRESSE, BATTG, LUCID]) {
        const ok = apres.includes(m);
        console.log(`        ${ok ? "✓" : "✗"} ${m}`);
      }
    }

    if (APPLIQUER) {
      await prisma.legalContent.update({
        where: { slug_locale: { slug: ligne.slug, locale: ligne.locale } },
        data: { data: apres, updatedBy: AUTEUR },
      });
    }
  }

  console.log(
    `\n${modifiees} ligne(s) ${APPLIQUER ? "corrigée(s) en base" : "à corriger"}.` +
      (APPLIQUER
        ? "\nRedéployer (ou attendre la revalidation ISR) pour que le site relise la base."
        : "\nRelancez avec --appliquer pour écrire."),
  );
}

main()
  .catch((erreur: unknown) => {
    console.error("Échec :", erreur instanceof Error ? erreur.message : erreur);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

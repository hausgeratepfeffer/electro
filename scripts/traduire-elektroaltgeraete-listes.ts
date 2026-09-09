/**
 * Traduit les derniers passages restés en allemand dans la version ANGLAISE
 * de « Elektroaltgeräte und Batterien » (table `LegalContent`, locale `en`).
 *
 * Le script général `traduire-pages-legales.ts` ne touche que `heading` et
 * `body` : il laisse les tableaux `list` tels quels. Or deux listes de cette
 * page sont encore en allemand sur le site anglais :
 *
 *   - section « How do I return a waste appliance to you? » : les quatre
 *     options de retour ;
 *   - section « What do the battery symbols mean? » : les trois lignes Pb / Cd
 *     / Hg.
 *
 * Tout le reste de la page anglaise est déjà correct. Ce script se limite donc
 * à ces sept lignes, par correspondance exacte de chaîne.
 *
 * Idempotent : une ligne déjà traduite ne correspond plus et n'est pas touchée.
 * Refuse d'écrire s'il reste un marqueur allemand après passage.
 *
 * Usage :
 *   npx tsx --env-file=.env.local scripts/traduire-elektroaltgeraete-listes.ts
 *   npx tsx --env-file=.env.local scripts/traduire-elektroaltgeraete-listes.ts --appliquer
 */

import { prisma } from "../src/server/prisma";

const APPLIQUER = process.argv.includes("--appliquer");
const AUTEUR = "scripts/traduire-elektroaltgeraete-listes.ts";

/** Correspondances exactes allemand → anglais, à l'échelle de la ligne de liste. */
const TRADUCTIONS: Record<string, string> = {
  "Rücksendung kleiner Altgeräte an: Hausgeräte Pfeffer OHG, Altgeräterücknahme, Matthiasstraße 15, 54290 Trier. Ein kostenloses Versandlabel erhalten Sie über unseren Kundenservice.":
    "Send small waste appliances to: Hausgeräte Pfeffer OHG, Altgeräterücknahme, Matthiasstraße 15, 54290 Trier. You can obtain a free shipping label from our customer service.",
  "Abholung von Großgeräten bei der Anlieferung des Neugeräts – bitte bereits bei der Bestellung angeben":
    "Collection of large appliances when the new appliance is delivered – please state this when ordering",
  "Nachträgliche Abholung eines Großgeräts nach Terminabsprache mit unserem Kundenservice":
    "Subsequent collection of a large appliance by appointment with our customer service",
  "Fragen zur Rücknahme: kontakt@hausgeratepfeffer.de oder +49 176 14111374":
    "Questions about take-back: kontakt@hausgeratepfeffer.de or +49 176 14111374",
  "Pb – die Batterie enthält mehr als 0,004 Masseprozent Blei":
    "Pb – the battery contains more than 0.004 % lead by mass",
  "Cd – die Batterie enthält mehr als 0,002 Masseprozent Cadmium":
    "Cd – the battery contains more than 0.002 % cadmium by mass",
  "Hg – die Batterie enthält mehr als 0,0005 Masseprozent Quecksilber":
    "Hg – the battery contains more than 0.0005 % mercury by mass",
};

/** Marqueurs qui trahiraient une ligne restée en allemand après passage. */
const MARQUEURS_DE = [
  "Rücksendung kleiner Altgeräte",
  "Abholung von Großgeräten",
  "Nachträgliche Abholung",
  "Fragen zur Rücknahme",
  "die Batterie enthält",
];

interface Section {
  heading?: string;
  body?: string;
  list?: string[];
}
interface Page {
  sections?: Section[];
  [autre: string]: unknown;
}

async function main(): Promise<void> {
  console.log(
    APPLIQUER
      ? "Application de la traduction (elektroaltgeraete/en).\n"
      : "Simulation — aucune écriture. Ajoutez --appliquer pour écrire.\n",
  );

  const ligne = await prisma.legalContent.findUnique({
    where: { slug_locale: { slug: "elektroaltgeraete", locale: "en" } },
    select: { data: true },
  });

  if (!ligne) {
    console.log("Aucune ligne elektroaltgeraete/en en base : rien à faire.");
    return;
  }

  const page = JSON.parse(ligne.data) as Page;
  const avant = JSON.stringify(page);
  let touchees = 0;

  for (const section of page.sections ?? []) {
    if (!section.list) continue;
    section.list = section.list.map((item) => {
      const en = TRADUCTIONS[item];
      if (en) {
        touchees += 1;
        console.log(`  • ${item.slice(0, 60)}…\n    → ${en.slice(0, 60)}…`);
        return en;
      }
      return item;
    });
  }

  const apres = JSON.stringify(page);

  if (avant === apres) {
    console.log("Aucune ligne à traduire — déjà conforme.");
    return;
  }

  const restes = MARQUEURS_DE.filter((m) => apres.includes(m));
  if (restes.length > 0) {
    throw new Error(
      `Marqueur(s) allemand(s) encore présent(s) : ${restes.join(", ")}. ` +
        "Le texte a changé — reprendre à la main.",
    );
  }

  console.log(`\n${touchees} ligne(s) traduite(s).`);

  if (APPLIQUER) {
    await prisma.legalContent.update({
      where: { slug_locale: { slug: "elektroaltgeraete", locale: "en" } },
      data: { data: apres, updatedBy: AUTEUR },
    });
    console.log("Écrit en base. Redéployer (ou attendre la revalidation ISR) pour voir le site à jour.");
  } else {
    console.log("Relancez avec --appliquer pour écrire.");
  }
}

main()
  .catch((erreur: unknown) => {
    console.error("Échec :", erreur instanceof Error ? erreur.message : erreur);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

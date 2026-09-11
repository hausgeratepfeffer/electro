/**
 * Aligne le message anglais du bandeau d'annonce sur l'allemand.
 *
 * Le bandeau annonçait deux offres différentes selon la langue : « SOMMER10,
 * 10 % dès 300 € » en allemand contre « SOMMER20, 20 % off » en anglais, sans
 * seuil — deux remises pour le même bandeau au même instant, dont une seule
 * est réellement accordée (le code SOMMER10). L'allemand fait foi ; l'anglais
 * est reconstruit à partir de lui, jamais l'inverse.
 *
 * Idempotent : si l'anglais correspond déjà à l'allemand, rien n'est écrit.
 *
 * Usage :
 *   npx tsx --env-file=.env.local scripts/aligner-bandeau-sommer.ts
 *   npx tsx --env-file=.env.local scripts/aligner-bandeau-sommer.ts --appliquer
 */

import { prisma } from "../src/server/prisma";

const APPLIQUER = process.argv.includes("--appliquer");

/** Rend en anglais l'offre annoncée en allemand. Code et seuil repris tels quels. */
function traduireOffre(messageDe: string): string | null {
  const lu = /Gutscheincode\s+([A-Z0-9]+).*?(\d+)\s*%.*?ab\s+([\d.,]+)\s*€/u.exec(messageDe);
  if (!lu) return null;
  const [, code, remise, seuil] = lu;
  return `🎉 Use voucher code ${code} and get ${remise} % off all purchases from €${seuil}.`;
}

async function main(): Promise<void> {
  console.log(
    APPLIQUER ? "Alignement du bandeau.\n" : "Simulation — aucune écriture. Ajoutez --appliquer.\n",
  );

  const barres = await prisma.announcementBar.findMany({
    select: { id: true, messageDe: true, messageEn: true },
  });

  let n = 0;
  for (const barre of barres) {
    const attendu = traduireOffre(barre.messageDe);
    if (!attendu) {
      console.log(`  ${barre.id} — message allemand hors format attendu, ignoré`);
      continue;
    }
    if (barre.messageEn === attendu) {
      console.log(`  ${barre.id} — déjà aligné`);
      continue;
    }

    n += 1;
    console.log(`  ${barre.id}`);
    console.log(`    avant : ${barre.messageEn}`);
    console.log(`    après : ${attendu}`);

    if (APPLIQUER) {
      await prisma.announcementBar.update({ where: { id: barre.id }, data: { messageEn: attendu } });
    }
  }

  console.log(`\n${n} bandeau(x) ${APPLIQUER ? "aligné(s)" : "à aligner"}.`);
}

main()
  .catch((e: unknown) => {
    console.error("Échec :", e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

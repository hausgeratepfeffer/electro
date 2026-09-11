/**
 * Retire PayPal des pages légales en base (AGB, Zahlungsarten) — décision du
 * commerçant : PayPal n'est plus proposé (désactivé dans `PaymentMethod`
 * depuis le back-office), et ne doit donc plus être annoncé nulle part.
 *
 * Deux transformations :
 *   - AGB § 4 : « … per Banküberweisung, PayPal oder Kreditkarte » perd « PayPal, ».
 *   - Zahlungsarten : la section « Wie funktioniert die Zahlung mit PayPal ? »
 *     est retirée, les sections suivantes renumérotées.
 *
 * Idempotent : relancé, il ne réécrit rien. Refuse d'écrire si « PayPal »
 * subsiste après passage.
 *
 * Usage :
 *   npx tsx --env-file=.env.local scripts/retirer-paypal.ts
 *   npx tsx --env-file=.env.local scripts/retirer-paypal.ts --appliquer
 */

import { prisma } from "../src/server/prisma";

const APPLIQUER = process.argv.includes("--appliquer");
const AUTEUR = "scripts/retirer-paypal.ts";

interface Section {
  heading: string;
  body?: string;
  list?: string[];
}
interface Page {
  intro?: string;
  sections: Section[];
  [autre: string]: unknown;
}

/** Retitre les sections « N. … » dans l'ordre, sans toucher aux titres non numérotés. */
function renumeroter(sections: Section[]): Section[] {
  let rang = 0;
  return sections.map((section) => {
    const m = /^(\d+)\.\s+(.*)$/.exec(section.heading);
    if (!m) return section;
    rang += 1;
    return { ...section, heading: `${rang}. ${m[2]}` };
  });
}

function transformerAgb(page: Page): Page {
  const sections = page.sections.map((section) => {
    if (!section.body?.includes("PayPal")) return section;
    const body = section.body
      .replace("per Banküberweisung, PayPal oder Kreditkarte", "per Banküberweisung oder Kreditkarte")
      .replace("by bank transfer, PayPal or credit card", "by bank transfer or credit card");
    return { ...section, body };
  });
  return { ...page, sections };
}

function transformerZahlungsarten(page: Page): Page {
  const sections = page.sections.filter(
    (s) => !/Zahlung mit PayPal|payment with PayPal/i.test(s.heading),
  );
  return { ...page, sections: renumeroter(sections) };
}

const TRANSFORMS: Record<string, (page: Page) => Page> = {
  agb: transformerAgb,
  zahlungsarten: transformerZahlungsarten,
};

async function main(): Promise<void> {
  console.log(
    APPLIQUER ? "Retrait de PayPal en base.\n" : "Simulation — aucune écriture. Ajoutez --appliquer.\n",
  );

  let n = 0;
  for (const slug of Object.keys(TRANSFORMS)) {
    for (const locale of ["de", "en"] as const) {
      const ligne = await prisma.legalContent.findUnique({
        where: { slug_locale: { slug, locale } },
        select: { data: true },
      });
      if (!ligne) {
        console.log(`  ${slug}/${locale} — absent de la base, rien à faire`);
        continue;
      }

      const avant = JSON.parse(ligne.data) as Page;
      const apres = TRANSFORMS[slug](avant);
      const avantStr = JSON.stringify(avant);
      const apresStr = JSON.stringify(apres);

      if (avantStr === apresStr) {
        console.log(`  ${slug}/${locale} — déjà conforme`);
        continue;
      }

      if (apresStr.includes("PayPal")) {
        throw new Error(`${slug}/${locale} : « PayPal » subsiste après transformation. Abandon.`);
      }

      n += 1;
      console.log(`  ${slug}/${locale} — modifié (${avantStr.length} → ${apresStr.length} caractères)`);

      if (APPLIQUER) {
        await prisma.legalContent.update({
          where: { slug_locale: { slug, locale } },
          data: { data: apresStr, updatedBy: AUTEUR },
        });
      }
    }
  }

  console.log(
    `\n${n} ligne(s) ${APPLIQUER ? "modifiée(s)" : "à modifier"}.` +
      (APPLIQUER ? "\nRedéployer / attendre la revalidation pour voir le site à jour." : "\nRelancez avec --appliquer pour écrire."),
  );
}

main()
  .catch((e: unknown) => {
    console.error("Échec :", e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

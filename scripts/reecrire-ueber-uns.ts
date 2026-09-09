/**
 * Réécrit la page « Über uns » (table `LegalContent`, DE + EN) pour qu'elle
 * réponde concrètement aux attentes d'un client — et d'un examinateur Google
 * Merchant Center — sur l'identité du marchand.
 *
 * La version servie décrivait bien l'activité, la localisation et la livraison,
 * mais il manquait : la raison sociale complète et la forme juridique, l'année
 * de création, la taille de l'équipe, et le fait qu'il existe un showroom
 * ouvert au public. La version anglaise portait en plus un chapeau resté en
 * allemand.
 *
 * Faits confirmés par le commerçant (2026-09-09) :
 *   - Hausgeräte Pfeffer OHG, activité depuis 2007 ;
 *   - plus de 15 personnes (conseil, service client, technique, entrepôt) ;
 *   - showroom ouvert au public, entrepôt et siège à la même adresse à Trier.
 *
 * Idempotent : relancé, il ne réécrit rien. Refuse d'écrire si le résultat ne
 * contient pas les repères attendus (raison sociale, année, effectif).
 *
 * Usage :
 *   npx tsx --env-file=.env.local scripts/reecrire-ueber-uns.ts
 *   npx tsx --env-file=.env.local scripts/reecrire-ueber-uns.ts --appliquer
 */

import { prisma } from "../src/server/prisma";

const APPLIQUER = process.argv.includes("--appliquer");
const AUTEUR = "scripts/reecrire-ueber-uns.ts";
const STAND = "2026-09-09";

interface Section {
  heading: string;
  body: string;
}
interface Page {
  slug: string;
  title: string;
  intro: string;
  sections: Section[];
  updatedAt: string;
}

const DE: Page = {
  slug: "ueber-uns",
  title: "Über uns",
  intro:
    "Hausgeräte Pfeffer OHG ist ein inhabergeführtes Fachgeschäft für Haushaltsgeräte und Multimedia mit Sitz in Trier. Wir sind seit 2007 am Markt und beraten Sie kompetent und persönlich – online wie in unserem Ausstellungsraum vor Ort.",
  updatedAt: STAND,
  sections: [
    {
      heading: "1. Was bieten wir an?",
      body: "Wir konzentrieren uns auf zwei Welten: Haushalt und Multimedia. Im Haushaltsbereich finden Sie Waschmaschinen, Geschirrspüler, Kühl- und Gefriergeräte, Backöfen und Herde, Staubsauger, Küchenmaschinen, Kaffeevollautomaten und Klimageräte. Im Multimediabereich Fernseher, Smartphones, Computer, Smartwatches, Videospiele und Drohnen. Statt eines endlosen Katalogs führen wir eine kuratierte Auswahl von Marken, die wir selbst kennen und deren Serviceabwicklung funktioniert.",
    },
    {
      heading: "2. Wer sind wir?",
      body:
        "Die Hausgeräte Pfeffer OHG wurde 2007 gegründet. Was als kleiner Betrieb für den Verkauf von Haushaltsgeräten und die Reparatur elektronischer Geräte begann, ist heute ein Online-Fachhandel mit eigenem Lager, eigener Ausstellung und eigenem Kundenservice.\n\n" +
        "Heute arbeiten mehr als 15 Mitarbeiterinnen und Mitarbeiter bei uns – in der Beratung, im Kundenservice, in der Technik sowie im Lager und Versand. Geführt wird das Unternehmen von Klaus-Walter Pfeffer als geschäftsführendem Gesellschafter.\n\n" +
        "Unser Name steht für unsere Werte: kompetente Beratung, faire Preise und einen persönlichen Ansprechpartner, der Ihnen auch nach dem Kauf zur Seite steht.",
    },
    {
      heading: "3. Wie beraten wir Sie – online und vor Ort?",
      body:
        "In unserem Ausstellungsraum in der Matthiasstraße 15, 54290 Trier, können Sie Geräte vor dem Kauf ansehen, vergleichen und sich persönlich beraten lassen. Unsere Beratung erreichen Sie außerdem telefonisch unter +49 176 14111374 und per E-Mail an kontakt@hausgeratepfeffer.de. Ausstellung und Beratung sind montags bis freitags von 8:00 bis 19:00 Uhr sowie samstags von 9:00 bis 16:00 Uhr für Sie da.\n\n" +
        "Wir fragen Sie nach den Einbaumaßen, den vorhandenen Anschlüssen, der Wasserhärte sowie der Größe des Raumes und empfehlen Ihnen anschließend das Modell, das am besten zu Ihren Anforderungen passt.",
    },
    {
      heading: "4. Welchen Service und welche Montage bieten wir?",
      body: "Unsere Servicepartner schließen Waschmaschinen an, bauen Geräte in vorbereitete Nischen ein und montieren Fernseher an der Wand. Bei einem Defekt schicken wir bevorzugt einen Techniker zu Ihnen, statt ein Großgerät quer durch Deutschland zu transportieren. Das ist schneller für Sie und schont das Gerät.",
    },
    {
      heading: "5. Wie gehen wir mit Nachhaltigkeit und Altgeräten um?",
      body: "Wir nehmen Ihr Altgerät bei der Lieferung kostenlos mit und führen es der fachgerechten Verwertung zu. Kleine Altgeräte und Altbatterien nehmen wir auch ohne Neukauf zurück. Bei der Sortimentsauswahl achten wir auf Reparierbarkeit, Ersatzteilverfügbarkeit und lange Update-Zusagen bei vernetzten Geräten – Kriterien, die im Datenblatt selten stehen, im Alltag aber den Unterschied machen.",
    },
    {
      heading: "6. Wo sind wir zu finden?",
      body:
        "Firmensitz, Ausstellung und Lager befinden sich unter einer Adresse: Matthiasstraße 15, 54290 Trier, Deutschland. Von hier organisieren wir Einkauf, Beratung, Kundenservice, die Bearbeitung von Rücksendungen sowie Lagerhaltung und Versand.\n\n" +
        "Den Versand Ihrer Bestellungen wickeln wir selbst ab – in Zusammenarbeit mit Paketdienstleistern und, bei großen Haushaltsgeräten, mit spezialisierten Zwei-Mann-Speditionen. So sind eine sorgfältige Handhabung und eine sichere Lieferung auch bei besonders schweren Geräten wie einem 90 kg schweren Kühlschrank gewährleistet. Einzelheiten zu Versandkosten und Lieferzeiten finden Sie auf der Seite „Versand und Lieferung“.",
    },
  ],
};

const EN: Page = {
  slug: "ueber-uns",
  title: "About us",
  intro:
    "Hausgeräte Pfeffer OHG is an owner-managed specialist retailer for household appliances and multimedia, based in Trier. We have been in business since 2007 and advise you competently and personally — online and in our showroom on site.",
  updatedAt: STAND,
  sections: [
    {
      heading: "1. What do we offer?",
      body: "We concentrate on two worlds: household and multimedia. In the household section you will find washing machines, dishwashers, fridges and freezers, ovens and cookers, vacuum cleaners, food processors, bean-to-cup coffee machines and air conditioners. In the multimedia section, televisions, smartphones, computers, smartwatches, video games and drones. Rather than an endless catalogue, we carry a curated selection of brands that we know ourselves and whose after-sales service actually works.",
    },
    {
      heading: "2. Who are we?",
      body:
        "Hausgeräte Pfeffer OHG was founded in 2007. What began as a small business selling household appliances and repairing electronic devices is today a specialist online retailer with its own warehouse, its own showroom and its own customer service.\n\n" +
        "Today more than 15 employees work with us — in advice, customer service, technical service, and the warehouse and dispatch. The company is run by Klaus-Walter Pfeffer as managing partner.\n\n" +
        "Our name stands for our values: competent advice, fair prices and a personal contact who is still there for you after the purchase.",
    },
    {
      heading: "3. How do we advise you — online and on site?",
      body:
        "In our showroom at Matthiasstraße 15, 54290 Trier, you can view and compare appliances before buying and get personal advice. You can also reach our advisory team by phone on +49 176 14111374 and by email at kontakt@hausgeratepfeffer.de. The showroom and advisory service are open Monday to Friday from 8:00 to 19:00 and on Saturdays from 9:00 to 16:00.\n\n" +
        "We ask you about the installation dimensions, the connections available, the water hardness and the size of the room, and then recommend the model that best suits your requirements.",
    },
    {
      heading: "4. What service and installation do we offer?",
      body: "Our service partners connect washing machines, fit appliances into prepared recesses and mount televisions on the wall. In the event of a fault, we prefer to send a technician to you rather than transport a large appliance across Germany. That is faster for you and gentler on the appliance.",
    },
    {
      heading: "5. How do we handle sustainability and old appliances?",
      body: "We collect your old appliance free of charge on delivery and pass it on for proper recycling. We also take back small waste appliances and waste batteries without a new purchase. When selecting our range we pay attention to repairability, spare-part availability and long update commitments for connected devices — criteria that rarely appear on a data sheet, but that make the difference in everyday use.",
    },
    {
      heading: "6. Where can you find us?",
      body:
        "Our registered office, showroom and warehouse are all at one address: Matthiasstraße 15, 54290 Trier, Germany. From here we organise purchasing, advice, customer service, the processing of returns, and warehousing and dispatch.\n\n" +
        "We handle the dispatch of your orders ourselves — working with parcel carriers and, for large household appliances, with specialised two-person freight forwarders. This ensures careful handling and safe delivery even for particularly heavy appliances such as a 90 kg fridge. You will find details of shipping costs and delivery times on the “Shipping and delivery” page.",
    },
  ],
};

/** Repères qui doivent figurer dans le résultat, sinon on n'écrit pas. */
const REPERES_DE = ["Hausgeräte Pfeffer OHG", "2007", "mehr als 15", "Ausstellungsraum", "Matthiasstraße 15"];
const REPERES_EN = ["Hausgeräte Pfeffer OHG", "2007", "more than 15", "showroom", "Matthiasstraße 15"];

async function ecrireUne(locale: "de" | "en", page: Page, reperes: string[]): Promise<boolean> {
  const nouveau = JSON.stringify(page);

  for (const r of reperes) {
    if (!nouveau.includes(r)) {
      throw new Error(`${locale} : repère « ${r} » absent du nouveau contenu. Abandon.`);
    }
  }

  const ligne = await prisma.legalContent.findUnique({
    where: { slug_locale: { slug: "ueber-uns", locale } },
    select: { data: true },
  });

  if (ligne && ligne.data === nouveau) {
    console.log(`  ueber-uns/${locale} — déjà à jour`);
    return false;
  }

  const ancienLen = ligne ? ligne.data.length : 0;
  console.log(`  ueber-uns/${locale} — réécrite (${ancienLen} → ${nouveau.length} caractères)`);

  if (APPLIQUER) {
    await prisma.legalContent.upsert({
      where: { slug_locale: { slug: "ueber-uns", locale } },
      create: { slug: "ueber-uns", locale, data: nouveau, updatedBy: AUTEUR },
      update: { data: nouveau, updatedBy: AUTEUR },
    });
  }
  return true;
}

async function main(): Promise<void> {
  console.log(
    APPLIQUER ? "Réécriture de « Über uns » en base.\n" : "Simulation — aucune écriture. Ajoutez --appliquer.\n",
  );

  let n = 0;
  if (await ecrireUne("de", DE, REPERES_DE)) n += 1;
  if (await ecrireUne("en", EN, REPERES_EN)) n += 1;

  console.log(
    `\n${n} ligne(s) ${APPLIQUER ? "écrite(s)" : "à écrire"}.` +
      (APPLIQUER
        ? "\nRedéployer (ou attendre la revalidation ISR) pour voir le site à jour."
        : "\nRelancez avec --appliquer pour écrire."),
  );
}

main()
  .catch((e: unknown) => {
    console.error("Échec :", e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

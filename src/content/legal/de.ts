/**
 * Contenu légal et informatif en ALLEMAND — Hausgeräte Pfeffer.
 *
 * ATTENTION : toutes les données d'entreprise sont des PLACEHOLDERS
 * (adresse, HRB, USt-IdNr., tarifs). Voir docs/LEGAL.md pour la liste
 * exhaustive des éléments à remplacer avant mise en ligne.
 *
 * WEEE (§ 6 ElektroG) : confirmé par le client (2026-08-30) que l'entreprise
 * ne fabrique pas et ne vend que des marques tierces déjà enregistrées par
 * leurs propres fabricants — aucune registration WEEE propre n'est donc due.
 * Voir la section "Registrierung nach Batterierecht" de l'Impressum et
 * d'Elektroaltgeräte, qui l'expliquent au lieu d'afficher un faux numéro.
 *
 * État du droit retenu : juillet 2026 (§ 5 DDG, § 356a BGB / Widerrufsbutton
 * depuis le 19.06.2026, ElektroG avec § 18a à partir du 01.07.2026, BattDG,
 * PAngV, DSGVO/TDDDG, VSBG § 36 — plateforme ODR fermée depuis le 20.07.2025).
 */

import type { LegalPageMap } from "./types";

/** Date de dernière révision rédactionnelle du corpus allemand. */
const UPDATED_AT = "2026-07-26";

/**
 * Coordonnées de l'entreprise — À REMPLACER par les données réelles.
 * Exportées : la facture PDF y puise les mentions exigées par le § 14 UStG,
 * et deux jeux de coordonnées qui divergeraient seraient pires qu'un seul faux.
 */
export const COMPANY = {
  name: "Hausgeräte Pfeffer OHG",
  street: "Matthiasstraße 15",
  city: "54290 Trier",
  postalCode: "54290",
  locality: "Trier",
  country: "Deutschland",
  email: "kontakt@hausgeratepfeffer.de",
  phone: "+49 176 14111374",
  managingDirector: "Klaus-Walter Pfeffer",
  // Une OHG s'inscrit en section A (HRA), pas B, et le registre du ressort de
  // Trier est tenu par l'Amtsgericht Wittlich.
  register: "Amtsgericht Wittlich, HRA 40155",
  // À RENSEIGNER : la facture doit porter le numéro de TVA (§ 14 Abs. 4 Nr. 2
  // UStG). Tant que cette valeur reste un gabarit, chaque facture émise est
  // incomplète.
  vatId: "DE000000000",
  domain: "www.hausgeratepfeffer.de",
} as const;

/** Adresse de retour (identique au siège dans ce modèle). */
const RETURN_ADDRESS = `${COMPANY.name}, Retourenannahme, ${COMPANY.street}, ${COMPANY.city}, ${COMPANY.country}`;

/** Avertissement placé en tête de chaque page juridique. */
const DISCLAIMER =
  "Rechtlicher Hinweis: Dieser Text ist eine sorgfältig erstellte Vorlage für den Onlineshop Hausgeräte Pfeffer. Sämtliche Unternehmensangaben (Anschrift, Handelsregister, Umsatzsteuer-Identifikationsnummer, Versandkosten, Dienstleister) sind Platzhalter und müssen vor der Veröffentlichung durch die tatsächlichen Daten ersetzt werden. Lassen Sie den Text anschließend anwaltlich prüfen – erst dann ist er rechtssicher verwendbar.";

/** Assemble le chapeau : avertissement puis texte d'introduction. */
function intro(lead: string): string {
  return `${DISCLAIMER}\n\n${lead}`;
}

export const deLegalPages: LegalPageMap = {
  /* ------------------------------------------------------------------ */
  /* Impressum — § 5 DDG                                                 */
  /* ------------------------------------------------------------------ */
  impressum: {
    slug: "impressum",
    title: "Impressum",
    intro: intro(
      "Anbieterkennzeichnung nach § 5 Digitale-Dienste-Gesetz (DDG) und § 18 Absatz 2 Medienstaatsvertrag (MStV).",
    ),
    updatedAt: UPDATED_AT,
    sections: [
      {
        heading: "Diensteanbieter",
        body: "Verantwortlich für diesen Onlineshop ist:",
        list: [
          COMPANY.name,
          COMPANY.street,
          COMPANY.city,
          COMPANY.country,
        ],
      },
      {
        heading: "Vertreten durch",
        body: `Vertretungsberechtigter Gesellschafter: ${COMPANY.managingDirector}\n\nDer Gesellschafter ist einzelvertretungsberechtigt.`,
      },
      {
        heading: "Kontakt",
        body: "Sie erreichen uns schnell und unmittelbar über die folgenden Wege. Unser Kundenservice ist montags bis samstags von 8 bis 20 Uhr besetzt.",
        list: [
          `Telefon: ${COMPANY.phone}`,
          `E-Mail: ${COMPANY.email}`,
          `Kontaktformular: ${COMPANY.domain}/kontakt`,
        ],
      },
      {
        heading: "Registereintrag",
        body: `Eintragung im Handelsregister\nRegistergericht und Registernummer: ${COMPANY.register}`,
      },
      {
        heading: "Umsatzsteuer-Identifikationsnummer",
        body: `Umsatzsteuer-Identifikationsnummer gemäß § 27a Umsatzsteuergesetz: ${COMPANY.vatId}`,
      },
      {
        heading: "Registrierung nach ElektroG und Batterierecht",
        body: "Wir vertreiben ausschließlich Elektro- und Elektronikgeräte fremder Marken und sind daher nicht selbst zur Registrierung bei der Stiftung Elektro-Altgeräte Register (ear) nach § 6 ElektroG verpflichtet; diese Pflicht trifft die Hersteller der von uns vertriebenen Marken. Für Batterien und Verpackungen sind wir bei den zuständigen Registern gemeldet:",
        list: [
          "Batterieregister-Nummer nach BattDG: DE00000000 (Platzhalter)",
          "Verpackungsregister LUCID: DE0000000000000 (Platzhalter)",
        ],
      },
      {
        heading: "Verantwortlich für den redaktionellen Inhalt",
        body: `Verantwortlich nach § 18 Absatz 2 Medienstaatsvertrag (MStV):\n${COMPANY.managingDirector}, Anschrift wie oben.`,
      },
      {
        heading: "Betriebshaftpflichtversicherung",
        body: "Angaben zur Betriebs- und Produkthaftpflichtversicherung (freiwillige Angabe, für Dienstleistungen nach § 2 DL-InfoV verpflichtend):",
        list: [
          "Versicherer: Name der Versicherung (Platzhalter)",
          "Anschrift des Versicherers (Platzhalter)",
          "Räumlicher Geltungsbereich: Bundesrepublik Deutschland (Platzhalter)",
        ],
      },
      {
        heading: "Verbraucherstreitbeilegung",
        body:
          "Hinweis nach § 36 Verbraucherstreitbeilegungsgesetz (VSBG): Wir sind weder bereit noch verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen. Sollten Sie mit unserem Service nicht zufrieden sein, wenden Sie sich bitte zunächst direkt an unseren Kundenservice – wir finden fast immer eine Lösung.\n\n" +
          "Zuständige Verbraucherschlichtungsstelle wäre: Universalschlichtungsstelle des Bundes, Zentrum für Schlichtung e. V., Straßburger Straße 8, 77694 Kehl am Rhein, www.verbraucher-schlichter.de.\n\n" +
          "Die frühere Online-Streitbeilegungsplattform (OS-Plattform) der Europäischen Kommission wurde zum 20. Juli 2025 endgültig eingestellt. Ein Link auf diese Plattform darf seitdem nicht mehr angegeben werden; wir verzichten daher bewusst auf einen entsprechenden Hinweis.",
      },
      {
        heading: "Haftung für Inhalte",
        body: "Als Diensteanbieter sind wir nach § 7 Absatz 1 DDG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach den §§ 8 bis 10 DDG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen. Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden entsprechender Rechtsverletzungen entfernen wir diese Inhalte umgehend.",
      },
      {
        heading: "Haftung für Links",
        body: "Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft; rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar. Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist ohne konkrete Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von Rechtsverletzungen entfernen wir derartige Links umgehend.",
      },
      {
        heading: "Urheberrecht",
        body: "Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers. Downloads und Kopien dieser Seite sind nur für den privaten, nicht kommerziellen Gebrauch gestattet.",
      },
      {
        heading: "Bildnachweis",
        body: "Produkt- und Stimmungsbilder stammen von den jeweiligen Herstellern sowie aus lizenzfreien Bilddatenbanken. Die vollständige Liste der Bildquellen ist vor der Veröffentlichung zu ergänzen.",
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  /* AGB                                                                 */
  /* ------------------------------------------------------------------ */
  agb: {
    slug: "agb",
    title: "Allgemeine Geschäftsbedingungen",
    intro: intro(
      "Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle Bestellungen, die Verbraucherinnen und Verbraucher sowie Unternehmen über den Onlineshop von Hausgeräte Pfeffer aufgeben. Stand: 26. Juli 2026.",
    ),
    updatedAt: UPDATED_AT,
    sections: [
      {
        heading: "§ 1 Geltungsbereich und Anbieter",
        body:
          `Für alle Bestellungen über unseren Onlineshop gelten diese Allgemeinen Geschäftsbedingungen in der zum Zeitpunkt der Bestellung gültigen Fassung. Vertragspartner ist die ${COMPANY.name}, ${COMPANY.street}, ${COMPANY.city}, ${COMPANY.country}.\n\n` +
          "Verbraucher ist jede natürliche Person, die ein Rechtsgeschäft zu Zwecken abschließt, die überwiegend weder ihrer gewerblichen noch ihrer selbständigen beruflichen Tätigkeit zugerechnet werden können (§ 13 BGB). Unternehmer ist eine natürliche oder juristische Person oder eine rechtsfähige Personengesellschaft, die bei Abschluss des Vertrags in Ausübung ihrer gewerblichen oder selbständigen beruflichen Tätigkeit handelt (§ 14 BGB).\n\n" +
          "Abweichende Bedingungen des Kunden erkennen wir nicht an, es sei denn, wir haben ihrer Geltung ausdrücklich in Textform zugestimmt.",
      },
      {
        heading: "§ 2 Vertragsschluss",
        body:
          "Die Darstellung der Produkte im Onlineshop stellt kein rechtlich bindendes Angebot dar, sondern eine unverbindliche Aufforderung zur Bestellung.\n\n" +
          "Durch Anklicken der Schaltfläche „Zahlungspflichtig bestellen“ geben Sie ein verbindliches Angebot zum Kauf der im Warenkorb enthaltenen Waren ab. Unmittelbar nach dem Absenden der Bestellung erhalten Sie eine automatische Empfangsbestätigung per E-Mail. Diese Bestätigung dokumentiert lediglich den Eingang Ihrer Bestellung und stellt noch keine Annahme des Antrags dar.\n\n" +
          "Der Kaufvertrag kommt zustande, sobald wir Ihre Bestellung durch eine gesonderte Auftragsbestätigung per E-Mail annehmen, die Ware versenden oder – bei Vorkasse – die Zahlungsaufforderung übersenden. Nehmen wir die Bestellung nicht innerhalb von fünf Werktagen an, gilt sie als abgelehnt; bereits geleistete Zahlungen erstatten wir unverzüglich.\n\n" +
          "Bestellungen mit Speditionslieferung, Montageservice oder Sonderanfertigungen bestätigen wir stets gesondert, weil hierfür ein Liefertermin abzustimmen ist.",
      },
      {
        heading: "§ 3 Korrekturmöglichkeit, Vertragssprache und Speicherung des Vertragstextes",
        body:
          "Vor dem verbindlichen Absenden der Bestellung können Sie Ihre Eingaben über die üblichen Tastatur- und Mausfunktionen jederzeit korrigieren. Zusätzlich werden alle Eingaben vor der Bestellung in einem Bestätigungsfenster nochmals angezeigt und können auch dort berichtigt werden.\n\n" +
          "Vertragssprache ist ausschließlich Deutsch. Englischsprachige Fassungen dieser Bedingungen dienen nur der Information; im Streitfall ist die deutsche Fassung maßgeblich.\n\n" +
          "Wir speichern den Vertragstext und senden Ihnen die Bestelldaten sowie diese AGB per E-Mail zu. Nach Abschluss der Bestellung ist der Vertragstext aus Sicherheitsgründen nicht mehr über das Internet zugänglich; in einem Kundenkonto können Sie Ihre Bestellungen jedoch weiterhin einsehen.",
      },
      {
        heading: "§ 4 Preise und Versandkosten",
        body:
          "Alle angegebenen Preise sind Endpreise in Euro und enthalten die gesetzliche Umsatzsteuer. Sie verstehen sich zuzüglich Versandkosten, sofern auf der Produktseite nichts anderes angegeben ist.\n\n" +
          "Der Standardversand innerhalb Deutschlands ist kostenlos, ohne Mindestbestellwert. Wünschen Sie eine schnellere Zustellung, kostet der Expressversand pauschal 70,00 Euro. Für optionale Zusatzleistungen wie Anschluss, Montage oder die Lieferung bis zum Aufstellort gelten gesonderte Entgelte; diese Leistungen vereinbaren Sie vor oder nach der Bestellung mit unserem Kundenservice. Die Versandkosten werden vor Abschluss der Bestellung im Warenkorb ausgewiesen. Einzelheiten finden Sie auf der Seite „Versand & Lieferung“.\n\n" +
          "Bei Waren, die nach Gewicht, Volumen, Länge oder Fläche angeboten werden, weisen wir zusätzlich den Grundpreis gemäß Preisangabenverordnung aus. Bei Preisermäßigungen nennen wir den niedrigsten Gesamtpreis, den wir in den letzten 30 Tagen vor der Ermäßigung angewendet haben.",
      },
      {
        heading: "§ 5 Lieferung und Lieferzeit",
        body:
          "Wir liefern innerhalb Deutschlands. Lieferungen an Packstationen sind nur bei Paketversand möglich; Großgeräte liefern wir ausschließlich per Spedition an eine Adresse.\n\n" +
          "Vorrätige Artikel versenden wir in der Regel innerhalb von einem bis drei Werktagen nach Vertragsschluss, bei Vorkasse ab dem Tag des Zahlungseingangs. Bei Artikeln mit dem Hinweis „Auf Anfrage“ nennen wir die voraussichtliche Lieferzeit auf der Produktseite; sie beträgt typischerweise zwei bis vier Wochen.\n\n" +
          "Ist ein Artikel nicht verfügbar, weil uns unser Zulieferer trotz vertraglicher Verpflichtung nicht beliefert hat (kongruentes Deckungsgeschäft), können wir vom Vertrag zurücktreten. Wir informieren Sie unverzüglich und erstatten bereits geleistete Zahlungen sofort. Ihre gesetzlichen Rechte bleiben unberührt.\n\n" +
          "Teillieferungen sind zulässig, soweit sie für Sie zumutbar sind. Zusätzliche Versandkosten entstehen Ihnen dadurch nicht.",
      },
      {
        heading: "§ 6 Zahlungsbedingungen",
        body:
          "Wir bieten Vorkasse per Überweisung, Sofortüberweisung, PayPal, Kreditkarte und SEPA-Lastschrift an. Welche Zahlungsarten im Einzelfall zur Verfügung stehen, wird Ihnen im Bestellprozess angezeigt; wir behalten uns vor, einzelne Zahlungsarten auszuschließen.\n\n" +
          "Bei Vorkasse erhalten Sie unsere Bankdaten mit der Bestellbestätigung; die Bestellnummer dient als Verwendungszweck. Wir reservieren die Ware sieben Kalendertage und versenden nach Eingang der Zahlung. Geht die Zahlung innerhalb der Reservierungsfrist nicht ein, stornieren wir die Bestellung.\n\n" +
          "Bei SEPA-Lastschrift erteilen Sie uns ein SEPA-Lastschriftmandat. Über den Einzug informieren wir Sie mindestens einen Bankarbeitstag im Voraus (verkürzte Vorabankündigung). Für Rücklastschriften, die Sie zu vertreten haben, können wir die tatsächlich angefallenen Bankentgelte in Rechnung stellen.\n\n" +
          "Für die Nutzung gängiger SEPA-Zahlungsarten und Zahlungskarten berechnen wir kein zusätzliches Entgelt (§ 270a BGB). Kommen Sie in Zahlungsverzug, gelten die gesetzlichen Regelungen; als Verbraucher schulden Sie Verzugszinsen in Höhe von fünf Prozentpunkten über dem Basiszinssatz.",
      },
      {
        heading: "§ 7 Eigentumsvorbehalt",
        body:
          "Die gelieferte Ware bleibt bis zur vollständigen Bezahlung unser Eigentum.\n\n" +
          "Gegenüber Unternehmern behalten wir uns das Eigentum bis zur vollständigen Begleichung aller Forderungen aus einer laufenden Geschäftsbeziehung vor. Der Unternehmer ist berechtigt, die Ware im ordentlichen Geschäftsgang weiterzuveräußern; sämtliche daraus entstehenden Forderungen tritt er bereits jetzt an uns ab.",
      },
      {
        heading: "§ 8 Widerrufsrecht",
        body:
          "Verbraucherinnen und Verbrauchern steht ein gesetzliches Widerrufsrecht von 14 Tagen zu. Die vollständige Widerrufsbelehrung, die Online-Widerrufsfunktion nach § 356a BGB sowie das Muster-Widerrufsformular finden Sie auf der Seite „Widerrufsrecht“; beides ist auch Bestandteil unserer Bestellbestätigung.\n\n" +
          "Zusätzlich zum gesetzlichen Widerrufsrecht räumen wir Ihnen freiwillig ein Rückgaberecht von 30 Tagen ab Erhalt der Ware ein. Dieses vertragliche Rückgaberecht setzt voraus, dass die Ware vollständig, unbeschädigt und in wiederverkaufsfähigem Zustand ist. Ihre gesetzlichen Rechte, insbesondere das 14-tägige Widerrufsrecht und die Mängelrechte, werden dadurch nicht eingeschränkt.",
      },
      {
        heading: "§ 9 Mängelhaftung (Gewährleistung)",
        body:
          "Es gilt das gesetzliche Mängelhaftungsrecht. Für neue Waren beträgt die Verjährungsfrist für Mängelansprüche von Verbrauchern zwei Jahre ab Ablieferung der Ware. Zeigt sich innerhalb eines Jahres seit Ablieferung ein Mangel, wird vermutet, dass die Ware bereits bei Übergabe mangelhaft war.\n\n" +
          "Bei Waren mit digitalen Elementen – etwa Smart-TVs, Smartwatches oder vernetzten Haushaltsgeräten – stellen wir sicher, dass Sie über Aktualisierungen informiert werden, die für den Erhalt der Vertragsmäßigkeit erforderlich sind, und diese während des maßgeblichen Zeitraums erhalten (§§ 475b, 475c BGB).\n\n" +
          "Gegenüber Unternehmern beträgt die Verjährungsfrist für Mängelansprüche bei neuen Waren ein Jahr ab Gefahrübergang. Die gesetzlichen Regelungen zum Lieferantenregress bleiben unberührt.\n\n" +
          "Bitte melden Sie Mängel unserem Kundenservice, bevor Sie ein Gerät zurücksenden. So können wir häufig direkt einen Techniker oder den Herstellerservice beauftragen, was für Sie deutlich schneller ist.",
      },
      {
        heading: "§ 10 Herstellergarantien",
        body: "Neben der gesetzlichen Mängelhaftung gewähren viele Hersteller eigene Garantien, etwa auf Motoren, Kompressoren oder Displays. Diese Garantien sind freiwillige Zusatzleistungen des jeweiligen Herstellers und lassen die gesetzlichen Rechte unberührt. Die genauen Garantiebedingungen finden Sie in den Unterlagen des Geräts sowie – soweit vorhanden – auf der jeweiligen Produktseite.",
      },
      {
        heading: "§ 11 Transportschäden",
        body:
          "Werden Waren mit offensichtlichen Transportschäden angeliefert, reklamieren Sie diese bitte möglichst sofort beim Zusteller und nehmen Sie Kontakt mit uns auf. Bei Speditionslieferungen lassen Sie den Schaden bitte auf dem Ablieferbeleg vermerken.\n\n" +
          "Die Versäumung einer Reklamation oder Kontaktaufnahme hat für Ihre gesetzlichen Ansprüche und deren Durchsetzung, insbesondere für Ihre Gewährleistungsrechte, keinerlei Folgen. Sie helfen uns aber, unsere eigenen Ansprüche gegenüber dem Frachtführer geltend zu machen.",
      },
      {
        heading: "§ 12 Rücknahme von Altgeräten und Batterien",
        body: "Als Vertreiber von Elektro- und Elektronikgeräten nehmen wir Altgeräte im gesetzlich vorgeschriebenen Umfang unentgeltlich zurück und beteiligen uns an der Rücknahme von Altbatterien. Die Einzelheiten – einschließlich der 1:1- und 0:1-Rücknahme, der Abholung bei Lieferung und der Rücksendung kleiner Altgeräte – finden Sie auf der Seite „Elektroaltgeräte & Batterien“.",
      },
      {
        heading: "§ 13 Aufrechnung und Zurückbehaltungsrecht",
        body: "Ein Recht zur Aufrechnung steht Ihnen nur zu, wenn Ihre Gegenansprüche rechtskräftig festgestellt, unbestritten oder von uns anerkannt sind. Ein Zurückbehaltungsrecht können Sie nur ausüben, wenn die Ansprüche aus demselben Vertragsverhältnis resultieren.",
      },
      {
        heading: "§ 14 Haftung",
        body:
          "Für Schäden aus der Verletzung des Lebens, des Körpers oder der Gesundheit sowie bei Vorsatz und grober Fahrlässigkeit haften wir unbeschränkt nach den gesetzlichen Vorschriften. Gleiches gilt bei arglistigem Verschweigen eines Mangels, bei Übernahme einer Garantie und im Anwendungsbereich des Produkthaftungsgesetzes.\n\n" +
          "Bei einfacher Fahrlässigkeit haften wir nur bei Verletzung einer wesentlichen Vertragspflicht, deren Erfüllung die ordnungsgemäße Durchführung des Vertrags überhaupt erst ermöglicht und auf deren Einhaltung Sie regelmäßig vertrauen dürfen. In diesem Fall ist die Haftung auf den vertragstypischen, vorhersehbaren Schaden begrenzt. Eine weitergehende Haftung ist ausgeschlossen.",
      },
      {
        heading: "§ 15 Streitbeilegung",
        body:
          "Wir sind weder bereit noch verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle im Sinne des Verbraucherstreitbeilegungsgesetzes teilzunehmen.\n\n" +
          "Die Online-Streitbeilegungsplattform der Europäischen Kommission wurde zum 20. Juli 2025 eingestellt und steht nicht mehr zur Verfügung. Bitte wenden Sie sich bei Beschwerden direkt an unseren Kundenservice.",
      },
      {
        heading: "§ 16 Anwendbares Recht, Gerichtsstand und Schlussbestimmungen",
        body:
          "Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts. Gegenüber Verbrauchern gilt diese Rechtswahl nur insoweit, als dadurch der Schutz nicht entzogen wird, der durch zwingende Bestimmungen des Rechts des Staates gewährt wird, in dem der Verbraucher seinen gewöhnlichen Aufenthalt hat.\n\n" +
          "Ist der Kunde Kaufmann, juristische Person des öffentlichen Rechts oder öffentlich-rechtliches Sondervermögen, ist ausschließlicher Gerichtsstand für alle Streitigkeiten aus diesem Vertrag unser Geschäftssitz in Trier.\n\n" +
          "Sollte eine Bestimmung dieser AGB unwirksam sein oder werden, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.",
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  /* Datenschutzerklärung — DSGVO / TDDDG                                */
  /* ------------------------------------------------------------------ */
  datenschutz: {
    slug: "datenschutz",
    title: "Datenschutzerklärung",
    intro: intro(
      "Wir freuen uns über Ihr Interesse an unserem Onlineshop. Der Schutz Ihrer personenbezogenen Daten ist uns wichtig. Nachfolgend informieren wir Sie gemäß Artikel 13 und 14 der Datenschutz-Grundverordnung (DSGVO) darüber, welche Daten wir verarbeiten, zu welchem Zweck und welche Rechte Ihnen zustehen.",
    ),
    updatedAt: UPDATED_AT,
    sections: [
      {
        heading: "1. Verantwortlicher und Kontakt",
        body: "Verantwortlicher im Sinne der DSGVO ist:",
        list: [
          COMPANY.name,
          `${COMPANY.street}, ${COMPANY.city}, ${COMPANY.country}`,
          `Telefon: ${COMPANY.phone}`,
          `E-Mail: ${COMPANY.email}`,
          `Vertreten durch: ${COMPANY.managingDirector}`,
        ],
      },
      {
        heading: "2. Datenschutzbeauftragter",
        body: "Unseren betrieblichen Datenschutzbeauftragten erreichen Sie unter datenschutz@hausgeratepfeffer.de oder postalisch unter der oben genannten Anschrift mit dem Zusatz „Datenschutzbeauftragter“. Ob eine Bestellpflicht besteht, richtet sich nach § 38 BDSG; die Angabe ist vor der Veröffentlichung zu prüfen.",
      },
      {
        heading: "3. Rechtsgrundlagen der Verarbeitung",
        body: "Wir verarbeiten personenbezogene Daten nur auf einer der folgenden Rechtsgrundlagen:",
        list: [
          "Artikel 6 Absatz 1 Buchstabe a DSGVO – Ihre Einwilligung, etwa für Newsletter oder nicht notwendige Cookies",
          "Artikel 6 Absatz 1 Buchstabe b DSGVO – Erfüllung des Kaufvertrags oder vorvertragliche Maßnahmen",
          "Artikel 6 Absatz 1 Buchstabe c DSGVO – Erfüllung rechtlicher Pflichten, insbesondere handels- und steuerrechtlicher Aufbewahrungspflichten",
          "Artikel 6 Absatz 1 Buchstabe f DSGVO – unsere berechtigten Interessen, etwa Betrugsprävention, IT-Sicherheit und Verbesserung unseres Angebots",
        ],
      },
      {
        heading: "4. Hosting und Server-Logfiles",
        body:
          "Unser Onlineshop wird bei einem Dienstleister innerhalb der Europäischen Union gehostet (Name und Anschrift des Hosters sind vor der Veröffentlichung einzutragen). Mit dem Hoster besteht ein Auftragsverarbeitungsvertrag nach Artikel 28 DSGVO.\n\n" +
          "Beim Aufruf unserer Seiten erhebt der Server automatisch Informationen, die Ihr Browser übermittelt: IP-Adresse, Datum und Uhrzeit des Zugriffs, aufgerufene Seite, übertragene Datenmenge, Referrer-URL sowie Browser- und Betriebssystemtyp. Diese Daten sind für uns nicht bestimmten Personen zuordenbar und dienen der Auslieferung der Seiten, der Systemsicherheit und der Fehleranalyse. Rechtsgrundlage ist Artikel 6 Absatz 1 Buchstabe f DSGVO. Die Logfiles werden nach spätestens sieben Tagen gelöscht oder anonymisiert.",
      },
      {
        heading: "5. Bestellabwicklung und Kundenkonto",
        body:
          "Für die Abwicklung Ihrer Bestellung verarbeiten wir Anrede, Vor- und Nachname, Rechnungs- und Lieferanschrift, E-Mail-Adresse, gegebenenfalls Telefonnummer sowie die Bestell- und Zahlungsdaten. Ohne diese Angaben kann der Vertrag nicht geschlossen und erfüllt werden. Rechtsgrundlage ist Artikel 6 Absatz 1 Buchstabe b DSGVO.\n\n" +
          "Legen Sie ein Kundenkonto an, speichern wir die Zugangsdaten und die Bestellhistorie, damit Sie künftige Bestellungen bequemer abschließen können. Sie können Ihr Kundenkonto jederzeit löschen lassen; gesetzliche Aufbewahrungspflichten bleiben davon unberührt.",
      },
      {
        heading: "6. Zahlungsdienstleister",
        body:
          "Je nach gewählter Zahlungsart geben wir die für die Zahlungsabwicklung erforderlichen Daten an den jeweiligen Zahlungsdienstleister weiter (Name und Anschrift der eingesetzten Dienstleister sind vor der Veröffentlichung zu ergänzen, zum Beispiel für PayPal, Kreditkartenakzeptanz und Rechnungskauf).\n\n" +
          "Die Zahlungsdienstleister verarbeiten die Daten in eigener Verantwortung. Rechtsgrundlage der Übermittlung ist Artikel 6 Absatz 1 Buchstabe b DSGVO. Kreditkarten- und Bankdaten werden ausschließlich beim jeweiligen Dienstleister erhoben; wir speichern keine vollständigen Zahlungsdaten.",
      },
      {
        heading: "7. Keine Bonitätsprüfung",
        body: "Wir bieten weder Kauf auf Rechnung noch Ratenzahlung an. Eine Bonitätsauskunft bei einer Wirtschaftsauskunftei holen wir deshalb nicht ein, und wir übermitteln Ihre Daten zu diesem Zweck an niemanden. Sollten wir eine solche Zahlungsart künftig anbieten, ergänzen wir diese Erklärung vorher um die Auskunftei, die Rechtsgrundlage und Ihr Widerspruchsrecht.",
      },
      {
        heading: "8. Versand und Montageservice",
        body: "Zur Zustellung geben wir Name, Lieferanschrift und – für die Terminabstimmung bei Speditionslieferungen sowie beim Anschluss- und Montageservice – Telefonnummer oder E-Mail-Adresse an den beauftragten Logistik- beziehungsweise Servicepartner weiter. Rechtsgrundlage ist Artikel 6 Absatz 1 Buchstabe b DSGVO.",
      },
      {
        heading: "9. Kundenbewertungen",
        body: "Wenn Sie eine Produktbewertung abgeben, verarbeiten wir den von Ihnen angegebenen Namen beziehungsweise das Pseudonym, den Bewertungstext, die Sternebewertung und den Zeitpunkt der Abgabe. Bewertungen werden vor der Veröffentlichung geprüft. Rechtsgrundlage ist Artikel 6 Absatz 1 Buchstabe a und f DSGVO. Sie können die Löschung Ihrer Bewertung jederzeit verlangen.",
      },
      {
        heading: "10. Newsletter",
        body:
          "Für den Newsletter verwenden wir das Double-Opt-in-Verfahren: Nach Ihrer Anmeldung senden wir Ihnen eine E-Mail mit einem Bestätigungslink. Erst nach Bestätigung nehmen wir Sie in den Verteiler auf. Wir speichern IP-Adresse und Zeitpunkt von Anmeldung und Bestätigung, um den Vorgang nachweisen zu können.\n\n" +
          "Rechtsgrundlage ist Ihre Einwilligung nach Artikel 6 Absatz 1 Buchstabe a DSGVO. Sie können den Newsletter jederzeit über den Abmeldelink in jeder E-Mail oder per Nachricht an uns abbestellen. Bestandskundinnen und -kunden können wir unter den Voraussetzungen des § 7 Absatz 3 UWG auch ohne gesonderte Einwilligung Werbung für ähnliche Waren senden; auch dagegen können Sie jederzeit widersprechen.",
      },
      {
        heading: "11. Warenkorb-Erinnerungen",
        body:
          "Wenn Sie im Bestellvorgang Ihre E-Mail-Adresse eingeben, die Bestellung aber nicht abschließen, speichern wir Ihre E-Mail-Adresse, die gewählten Artikel, die Beträge und den Zeitpunkt des Abbruchs.\n\n" +
          "Wir verwenden diese Daten, um Ihnen innerhalb von rund anderthalb Tagen bis zu drei Erinnerungen an Ihren Warenkorb zu senden und Ihnen bei Problemen im Bestellvorgang zu helfen. Die letzte Erinnerung kann einen Rabattcode enthalten. Rechtsgrundlage ist unser berechtigtes Interesse an der Wiederaufnahme abgebrochener Bestellvorgänge (Art. 6 Abs. 1 lit. f DSGVO).\n\n" +
          "Sie können dieser Verarbeitung jederzeit widersprechen. Jede Nachricht enthält am Ende einen Abmeldelink. Nach der Abmeldung erhalten Sie weder weitere Erinnerungen noch Angebote von uns. Die gespeicherten Daten werden spätestens 30 Tage nach dem Abbruch automatisch gelöscht, sofern keine Bestellung zustande kommt.",
      },
      {
        heading: "12. Kontaktaufnahme und Kundenservice",
        body: "Wenn Sie uns per E-Mail, Telefon oder Kontaktformular kontaktieren, verarbeiten wir Ihre Angaben zur Bearbeitung der Anfrage. Rechtsgrundlage ist Artikel 6 Absatz 1 Buchstabe b DSGVO, sofern die Anfrage einen Vertrag betrifft, ansonsten Artikel 6 Absatz 1 Buchstabe f DSGVO. Anfragen löschen wir, sobald sie abschließend bearbeitet sind und keine Aufbewahrungspflichten entgegenstehen.",
      },
      {
        heading: "13. Cookies und Einwilligungsverwaltung",
        body:
          "Der Betrieb dieses Shops beruht auf technisch notwendigen Cookies: Warenkorb, Sitzungsverwaltung, Sprachwahl und Sicherheit. Sie sind nach § 25 Absatz 2 Nummer 2 TDDDG einwilligungsfrei; die damit verbundene Datenverarbeitung stützt sich auf Artikel 6 Absatz 1 Buchstabe f DSGVO. Einwilligungsfrei ist auch die Speicherung Ihrer Antwort auf das Einwilligungsbanner – ohne sie müssten wir Sie auf jeder Seite erneut fragen.\n\n" +
          "Einen Live-Chat der Smartsupp s.r.o. (Tschechische Republik) bieten wir über eine Schaltfläche unten rechts an. Beim Laden speichert dieser Dienst eine Besucherkennung auf Ihrem Gerät. Sie ist für den Betrieb des Shops nicht erforderlich und wird deshalb nur mit Ihrer Einwilligung gesetzt (§ 25 Absatz 1 TDDDG). Rechtsgrundlage der anschließenden Datenverarbeitung ist Artikel 6 Absatz 1 Buchstabe a DSGVO.\n\n" +
          "Willigen Sie im Banner ein, wird der Chat auf allen Seiten des Shops geladen. Smartsupp erkennt dann Ihren Besuch, kann Ihnen von sich aus eine Begrüßungsnachricht anzeigen und übermittelt uns dabei aufgerufene Seite, Verweisadresse, Browserangaben und IP-Adresse. Die Besucherkennung ordnet außerdem die Nachrichten eines Gesprächs einander zu; ihre Speicherdauer richtet sich nach den Angaben von Smartsupp in dessen eigener Dokumentation.\n\n" +
          "Lehnen Sie ab oder antworten Sie nicht, wird kein Smartsupp-Skript ausgeführt, kein Cookie dieses Anbieters gesetzt und es gelangen keine Daten an ihn. Die Schaltfläche unten rechts bleibt bestehen: Klicken Sie darauf, fordern Sie den Chat ausdrücklich an (§ 25 Absatz 2 Nummer 2 TDDDG) und können uns wie gewohnt schreiben – ohne dass Ihr Besuch zuvor an Smartsupp gemeldet worden wäre.\n\n" +
          "Ihre Einwilligung gilt bis zum Widerruf. Sie können sie jederzeit über den Link „Cookie-Einstellungen“ im Fußbereich jeder Seite ändern; der Widerruf wirkt für die Zukunft und ist so einfach wie die Erteilung.\n\n" +
          "Cookies zur Reichweitenmessung, zu Werbezwecken oder von sozialen Netzwerken setzen wir nicht.\n\n" +
          "Zusätzlich können Sie Cookies in Ihrem Browser löschen oder blockieren. Einige Funktionen des Shops stehen dann möglicherweise nicht mehr vollständig zur Verfügung.",
      },
      {
        heading: "14. Reichweitenmessung und Marketing",
        body: "Soweit wir Web-Analyse-, Retargeting- oder Conversion-Tracking-Dienste einsetzen, geschieht dies ausschließlich auf Basis Ihrer Einwilligung. Die konkret eingesetzten Dienste, ihre Anbieter, die verarbeiteten Daten, die Speicherdauer und etwaige Drittlandübermittlungen sind vor der Veröffentlichung an dieser Stelle vollständig zu benennen.",
      },
      {
        heading: "15. Empfänger und Übermittlung in Drittländer",
        body: "Empfänger Ihrer Daten sind ausschließlich Dienstleister, die wir sorgfältig ausgewählt haben und die als Auftragsverarbeiter nach Artikel 28 DSGVO für uns tätig werden, sowie Stellen, an die wir aufgrund gesetzlicher Pflichten übermitteln müssen (etwa Finanzbehörden). Dazu zählt die Smartsupp s.r.o. (Tschechische Republik) als Anbieter des Live-Chats – nach Ihrer Einwilligung ab dem Seitenaufruf, andernfalls ausschließlich für Gespräche, die Sie selbst eröffnen. Eine Übermittlung in Länder außerhalb der EU und des EWR findet nur statt, wenn ein Angemessenheitsbeschluss der Europäischen Kommission vorliegt oder geeignete Garantien im Sinne der Artikel 44 ff. DSGVO – insbesondere Standardvertragsklauseln – vereinbart sind.",
      },
      {
        heading: "16. Speicherdauer",
        body: "Wir speichern personenbezogene Daten nur so lange, wie es für die jeweiligen Zwecke erforderlich ist. Vertrags- und Rechnungsdaten unterliegen handels- und steuerrechtlichen Aufbewahrungsfristen von sechs beziehungsweise zehn Jahren (§ 257 HGB, § 147 AO). Nach Ablauf dieser Fristen löschen wir die Daten.",
      },
      {
        heading: "17. Ihre Rechte als betroffene Person",
        body: "Ihnen stehen gegenüber uns die folgenden Rechte zu:",
        list: [
          "Auskunft über die zu Ihrer Person gespeicherten Daten (Artikel 15 DSGVO)",
          "Berichtigung unrichtiger oder Vervollständigung unvollständiger Daten (Artikel 16 DSGVO)",
          "Löschung Ihrer Daten, soweit keine Aufbewahrungspflichten entgegenstehen (Artikel 17 DSGVO)",
          "Einschränkung der Verarbeitung (Artikel 18 DSGVO)",
          "Datenübertragbarkeit in einem strukturierten, gängigen und maschinenlesbaren Format (Artikel 20 DSGVO)",
          "Widerruf einer erteilten Einwilligung mit Wirkung für die Zukunft (Artikel 7 Absatz 3 DSGVO)",
          "Beschwerde bei einer Datenschutz-Aufsichtsbehörde (Artikel 77 DSGVO)",
        ],
      },
      {
        heading: "18. Widerspruchsrecht nach Artikel 21 DSGVO",
        body:
          "Sie haben das Recht, aus Gründen, die sich aus Ihrer besonderen Situation ergeben, jederzeit gegen die Verarbeitung Sie betreffender personenbezogener Daten Widerspruch einzulegen, die auf Grundlage von Artikel 6 Absatz 1 Buchstabe f DSGVO erfolgt. Wir verarbeiten die Daten dann nicht mehr, es sei denn, wir können zwingende schutzwürdige Gründe nachweisen, die Ihre Interessen, Rechte und Freiheiten überwiegen, oder die Verarbeitung dient der Geltendmachung, Ausübung oder Verteidigung von Rechtsansprüchen.\n\n" +
          "Widersprechen Sie der Verarbeitung zum Zweck der Direktwerbung, verarbeiten wir Ihre Daten für diesen Zweck nicht mehr. Der Widerspruch ist formfrei und kann an " +
          COMPANY.email +
          " gerichtet werden.",
      },
      {
        heading: "19. Zuständige Aufsichtsbehörde",
        body: "Für uns zuständig ist der Landesbeauftragte für den Datenschutz und die Informationsfreiheit Rheinland-Pfalz, Hintere Bleiche 34, 55116 Mainz.",
      },
      {
        heading: "20. Datensicherheit und automatisierte Entscheidungen",
        body:
          "Wir sichern die Übertragung Ihrer Daten durch eine TLS-Verschlüsselung (erkennbar am Schloss-Symbol in der Adresszeile Ihres Browsers) und setzen technische sowie organisatorische Maßnahmen nach Artikel 32 DSGVO ein.\n\n" +
          "Eine automatisierte Entscheidungsfindung einschließlich Profiling nach Artikel 22 DSGVO findet nicht statt, mit Ausnahme der im Abschnitt zur Bonitätsprüfung beschriebenen Prüfung, die einer manuellen Überprüfung zugänglich ist.",
      },
      {
        heading: "21. Änderungen dieser Datenschutzerklärung",
        body: "Wir passen diese Datenschutzerklärung an, wenn sich die Rechtslage, unsere Dienste oder die Datenverarbeitung ändern. Es gilt jeweils die auf dieser Seite veröffentlichte Fassung. Stand: 26. Juli 2026.",
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  /* Widerrufsrecht                                                      */
  /* ------------------------------------------------------------------ */
  widerruf: {
    slug: "widerruf",
    title: "Widerrufsrecht und Muster-Widerrufsformular",
    intro: intro(
      "Verbraucherinnen und Verbraucher haben ein 14-tägiges Widerrufsrecht. Die nachfolgende Belehrung folgt dem gesetzlichen Muster nach Anlage 1 zu Artikel 246a § 1 Absatz 2 Satz 2 EGBGB in der seit dem 19. Juni 2026 geltenden Fassung.",
    ),
    updatedAt: UPDATED_AT,
    sections: [
      {
        heading: "Widerrufsbelehrung – Widerrufsrecht",
        body:
          "Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen.\n\n" +
          "Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag, an dem Sie oder ein von Ihnen benannter Dritter, der nicht der Beförderer ist, die Waren in Besitz genommen haben bzw. hat.\n\n" +
          `Um Ihr Widerrufsrecht auszuüben, müssen Sie uns (${COMPANY.name}, ${COMPANY.street}, ${COMPANY.city}, ${COMPANY.country}, Telefon ${COMPANY.phone}, E-Mail ${COMPANY.email}) mittels einer eindeutigen Erklärung (z. B. ein mit der Post versandter Brief oder eine E-Mail) über Ihren Entschluss, diesen Vertrag zu widerrufen, informieren. Sie können dafür das beigefügte Muster-Widerrufsformular verwenden, das jedoch nicht vorgeschrieben ist.\n\n` +
          "Über den Eingang Ihrer Widerrufserklärung senden wir Ihnen unverzüglich eine Bestätigung per E-Mail, mit Datum und Uhrzeit des Eingangs.\n\n" +
          "Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung über die Ausübung des Widerrufsrechts vor Ablauf der Widerrufsfrist absenden.",
      },
      {
        heading: "Widerrufsbelehrung – Folgen des Widerrufs",
        body:
          "Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen erhalten haben, einschließlich der Lieferkosten (mit Ausnahme der zusätzlichen Kosten, die sich daraus ergeben, dass Sie eine andere Art der Lieferung als die von uns angebotene, günstigste Standardlieferung gewählt haben), unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über Ihren Widerruf dieses Vertrags bei uns eingegangen ist. Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das Sie bei der ursprünglichen Transaktion eingesetzt haben, es sei denn, mit Ihnen wurde ausdrücklich etwas anderes vereinbart; in keinem Fall werden Ihnen wegen dieser Rückzahlung Entgelte berechnet.\n\n" +
          "Wir können die Rückzahlung verweigern, bis wir die Waren wieder zurückerhalten haben oder bis Sie den Nachweis erbracht haben, dass Sie die Waren zurückgesandt haben, je nachdem, welches der frühere Zeitpunkt ist.\n\n" +
          `Sie haben die Waren unverzüglich und in jedem Fall spätestens binnen vierzehn Tagen ab dem Tag, an dem Sie uns über den Widerruf dieses Vertrags unterrichten, an ${RETURN_ADDRESS} zurückzusenden oder zu übergeben. Die Frist ist gewahrt, wenn Sie die Waren vor Ablauf der Frist von vierzehn Tagen absenden.\n\n` +
          "Wir tragen die Kosten der Rücksendung der Waren.\n\n" +
          "Sie müssen für einen etwaigen Wertverlust der Waren nur aufkommen, wenn dieser Wertverlust auf einen zur Prüfung der Beschaffenheit, Eigenschaften und Funktionsweise der Waren nicht notwendigen Umgang mit ihnen zurückzuführen ist.\n\n" +
          "– Ende der Widerrufsbelehrung –",
      },
      {
        heading: "Fristbeginn bei mehreren Waren und Teillieferungen",
        body:
          "Umfasst Ihre Bestellung mehrere Waren, die Sie in einer einheitlichen Bestellung bestellt haben und die getrennt geliefert werden, beginnt die Widerrufsfrist an dem Tag, an dem Sie oder ein von Ihnen benannter Dritter, der nicht der Beförderer ist, die letzte Ware in Besitz genommen haben bzw. hat.\n\n" +
          "Wird eine Ware in mehreren Teilsendungen oder Stücken geliefert – etwa eine Einbauküche oder ein Gerät mit separatem Zubehör –, beginnt die Frist an dem Tag, an dem Sie oder ein von Ihnen benannter Dritter, der nicht der Beförderer ist, die letzte Teilsendung oder das letzte Stück in Besitz genommen haben bzw. hat.",
      },
      {
        heading: "Widerruf in Textform",
        body:
          "Für den Widerruf genügt eine eindeutige Erklärung in Textform. Am schnellsten geht es per E-Mail an " +
          `${COMPANY.email} – nennen Sie darin Ihren Namen, Ihre Bestellnummer und den Artikel, den Sie zurückgeben möchten. Ebenso möglich sind ein Brief an die im Impressum genannte Anschrift oder ein Anruf unter ${COMPANY.phone}.\n\n` +
          "Sie können dafür das unten abgedruckte Muster-Widerrufsformular verwenden; vorgeschrieben ist es nicht.\n\n" +
          "Über den Eingang Ihrer Erklärung erhalten Sie unverzüglich eine Bestätigung per E-Mail, mit Datum und Uhrzeit des Eingangs.",
      },
      {
        heading: "Muster-Widerrufsformular",
        body:
          "(Wenn Sie den Vertrag widerrufen wollen, dann füllen Sie bitte dieses Formular aus und senden Sie es zurück.)\n\n" +
          `An ${COMPANY.name}, ${COMPANY.street}, ${COMPANY.city}, ${COMPANY.country}, E-Mail: ${COMPANY.email}:`,
        list: [
          "Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über den Kauf der folgenden Waren (*) / die Erbringung der folgenden Dienstleistung (*)",
          "Bestellt am (*) / erhalten am (*)",
          "Name des/der Verbraucher(s)",
          "Anschrift des/der Verbraucher(s)",
          "Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier)",
          "Datum",
          "(*) Unzutreffendes streichen.",
        ],
      },
      {
        heading: "Ausschluss und vorzeitiges Erlöschen des Widerrufsrechts",
        body: "Das Widerrufsrecht besteht nach § 312g Absatz 2 BGB unter anderem nicht bei folgenden Verträgen:",
        list: [
          "Waren, die nicht vorgefertigt sind und für deren Herstellung eine individuelle Auswahl oder Bestimmung durch Sie maßgeblich ist oder die eindeutig auf Ihre persönlichen Bedürfnisse zugeschnitten sind (zum Beispiel maßgefertigte Einbaublenden)",
          "versiegelte Waren, die aus Gründen des Gesundheitsschutzes oder der Hygiene nicht zur Rückgabe geeignet sind, wenn die Versiegelung nach der Lieferung entfernt wurde (zum Beispiel Rasierer, Epiliergeräte, In-Ear-Kopfhörer, Wasserfilterkartuschen)",
          "Ton- oder Videoaufnahmen sowie Computersoftware in einer versiegelten Packung, wenn die Versiegelung nach der Lieferung entfernt wurde (zum Beispiel Spiele-Discs und Software)",
          "Waren, die nach der Lieferung aufgrund ihrer Beschaffenheit untrennbar mit anderen Gütern vermischt wurden",
        ],
      },
      {
        heading: "Digitale Inhalte",
        body: "Bei Verträgen über die Lieferung von nicht auf einem körperlichen Datenträger befindlichen digitalen Inhalten – etwa Download-Codes für Spiele oder Software – erlischt Ihr Widerrufsrecht nach § 356 Absatz 5 BGB, wenn wir mit der Vertragserfüllung begonnen haben, nachdem Sie ausdrücklich zugestimmt haben, dass wir vor Ablauf der Widerrufsfrist beginnen, und Sie Ihre Kenntnis vom Erlöschen des Widerrufsrechts bestätigt haben. Wir bestätigen Ihnen dies zusätzlich auf einem dauerhaften Datenträger.",
      },
      {
        heading: "Freiwilliges 30-Tage-Rückgaberecht",
        body: "Über das gesetzliche Widerrufsrecht hinaus räumen wir Ihnen ein vertragliches Rückgaberecht von 30 Tagen ab Erhalt der Ware ein. Es gilt für unbenutzte, vollständige und wiederverkaufsfähige Artikel und lässt Ihre gesetzlichen Rechte unberührt. Details finden Sie auf der Seite „Retoure & Reklamation“.",
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  /* Versand & Lieferung                                                 */
  /* ------------------------------------------------------------------ */
  versand: {
    slug: "versand",
    title: "Versand und Lieferung",
    intro: intro(
      "Hier finden Sie alle Informationen zu Versandkosten, Lieferzeiten, Speditionslieferung, Anschluss- und Montageservice sowie zur Mitnahme Ihres Altgeräts.",
    ),
    updatedAt: UPDATED_AT,
    sections: [
      {
        heading: "Versandkosten auf einen Blick",
        body: "Alle Preise verstehen sich inklusive der gesetzlichen Umsatzsteuer. Die für Ihre Bestellung geltenden Versandkosten werden Ihnen im Warenkorb ausgewiesen, bevor Sie die Bestellung abschließen.",
        list: [
          "Standardversand innerhalb Deutschlands: kostenlos, ohne Mindestbestellwert",
          "Expressversand innerhalb Deutschlands: 70,00 Euro",
          "Zusatzleistungen wie Lieferung bis zum Aufstellort, Anschluss oder Montage: nach Vereinbarung, siehe unten",
        ],
      },
      {
        heading: "Lieferzeiten",
        body:
          "Vorrätige Artikel erreichen Sie im Standardversand innerhalb von drei bis fünf Werktagen, im Expressversand innerhalb von 24 bis 48 Stunden. Werktage sind Montag bis Samstag, ausgenommen gesetzliche Feiertage am Sitz unseres Lagers.\n\n" +
          "Bei Vorkasse beginnt die Lieferzeit am Tag nach Erteilung des Zahlungsauftrags, bei allen anderen Zahlungsarten am Tag nach Vertragsschluss.\n\n" +
          "Artikel mit dem Hinweis „Auf Anfrage“ bestellen wir für Sie beim Hersteller. Die Lieferzeit beträgt in diesen Fällen üblicherweise zwei bis vier Wochen; die konkrete Angabe finden Sie auf der Produktseite.",
      },
      {
        heading: "Liefergebiet",
        body: "Wir liefern innerhalb Deutschlands, einschließlich der Nordsee- und Ostseeinseln. Lieferungen ins europäische Ausland sind derzeit nur nach vorheriger Absprache mit unserem Kundenservice möglich. Paketsendungen können auf Wunsch an eine Packstation gehen; Speditionslieferungen benötigen eine Straßenanschrift und eine erreichbare Telefonnummer.",
      },
      {
        heading: "Speditionslieferung von Großgeräten",
        body:
          "Großgeräte liefern wir mit einer Zwei-Mann-Spedition. Die Spedition meldet sich vorab telefonisch oder per SMS und vereinbart mit Ihnen ein Zeitfenster.\n\n" +
          "Standardmäßig erfolgt die Lieferung frei Bordsteinkante. Gegen Aufpreis bringen wir das Gerät bis an den Aufstellort in Ihrer Wohnung, auch in obere Etagen. Diese Zusatzleistungen sind nicht Teil des Warenkorbs: Sprechen Sie uns vor oder unmittelbar nach der Bestellung an, dann stimmen wir sie mit der Spedition ab. Bitte prüfen Sie vorher, ob Treppenhaus, Türen und Aufzug ausreichend dimensioniert sind.",
        list: [
          "Lieferung frei Bordsteinkante: im Speditionsversand enthalten",
          "Lieferung bis zum Aufstellort (inklusive Etagen): 29,00 Euro, auf Anfrage",
          "Auspacken und Entsorgung der Transportverpackung: 9,00 Euro, auf Anfrage",
        ],
      },
      {
        heading: "Anschluss- und Montageservice",
        body:
          "Auf Wunsch schließen unsere Servicepartner Ihr neues Gerät fachgerecht an und nehmen es in Betrieb. Die Leistung buchen Sie nicht im Warenkorb, sondern telefonisch oder per E-Mail – am besten vor der Bestellung, damit wir sie mit der Lieferung zusammen einplanen können.\n\n" +
          "Voraussetzung ist, dass alle bauseitigen Anschlüsse (Strom, Wasser, Abwasser, Abluft, Antennen- oder Netzwerkanschluss) vorhanden, frei zugänglich und normgerecht sind. Elektroarbeiten an der Hausinstallation dürfen wir nicht ausführen.",
        list: [
          "Anschluss einer Waschmaschine, eines Trockners oder eines Geschirrspülers: 49,00 Euro",
          "Aufstellen und Inbetriebnahme eines freistehenden Kühl- oder Gefriergeräts: 39,00 Euro",
          "Einbau eines Einbaugeräts in eine vorbereitete Nische: 89,00 Euro",
          "Wandmontage eines Fernsehers inklusive Erstinstallation: 99,00 Euro (Halterung nicht enthalten)",
          "Montage von Klimageräten mit fest installierter Außeneinheit: Angebot nach Aufmaß",
        ],
      },
      {
        heading: "Mitnahme des Altgeräts",
        body:
          "Bei der Lieferung eines neuen Elektrogeräts nehmen wir Ihr gleichartiges Altgerät auf Wunsch unentgeltlich mit (1:1-Rücknahme). Melden Sie den Wunsch bitte telefonisch oder per E-Mail an, sobald Sie bestellt haben – gern auch schon davor –, damit die Spedition die Rücknahme einplanen kann. Sie können den Hinweis auch im Anmerkungsfeld der Bestellung hinterlassen.\n\n" +
          "Das Altgerät muss abgeklemmt, entleert, gereinigt und frei zugänglich am Ort der Anlieferung bereitstehen. Die Demontage eines fest eingebauten Altgeräts ist nicht Bestandteil der kostenlosen Mitnahme, kann aber als kostenpflichtige Zusatzleistung gebucht werden.\n\n" +
          "Alle weiteren Rücknahmemöglichkeiten – insbesondere für kleine Altgeräte ohne Neukauf – beschreiben wir auf der Seite „Elektroaltgeräte & Batterien“.",
      },
      {
        heading: "Teillieferungen",
        body: "Bestellen Sie mehrere Artikel mit unterschiedlicher Verfügbarkeit, versenden wir vorrätige Positionen in der Regel sofort und liefern den Rest nach. Zusätzliche Versandkosten entstehen Ihnen dadurch nicht. Für den Beginn der Widerrufsfrist ist der Erhalt der letzten Ware maßgeblich.",
      },
      {
        heading: "Wo bleibt meine Bestellung?",
        body: "Den Stand Ihrer Bestellung sehen Sie jederzeit über den Link in Ihrer Bestellbestätigung, und in Ihrem Kundenkonto unter „Meine Bestellungen“. Sobald die Ware unser Lager verlässt, setzen wir den Status auf „versandt“. Die Sendungsnummer und – bei Speditionslieferungen – die Kontaktdaten für die Terminabstimmung teilen wir Ihnen per E-Mail mit, sobald sie uns vorliegen.",
      },
      {
        heading: "Transportschäden",
        body: "Bitte prüfen Sie die Sendung möglichst bei Anlieferung. Melden Sie sichtbare Schäden dem Zusteller und lassen Sie diese bei Speditionslieferungen auf dem Ablieferbeleg vermerken. Informieren Sie anschließend unseren Kundenservice – wir organisieren Ersatz oder Reparatur. Ihre gesetzlichen Gewährleistungsrechte bleiben davon in jedem Fall unberührt.",
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  /* Zahlungsarten                                                       */
  /* ------------------------------------------------------------------ */
  zahlungsarten: {
    slug: "zahlungsarten",
    title: "Zahlungsarten",
    intro: intro(
      "Sie zahlen bei uns per Vorkasse-Überweisung, per Sofortüberweisung, mit PayPal, per Kreditkarte oder per SEPA-Lastschrift. Welche Zahlungsarten im Einzelfall verfügbar sind, sehen Sie im Bestellprozess.",
    ),
    updatedAt: UPDATED_AT,
    sections: [
      {
        heading: "Vorkasse per Überweisung",
        body:
          "Mit der Bestellbestätigung erhalten Sie unsere Bankverbindung und die Bestellnummer, die Sie bitte als Verwendungszweck angeben. Dieselben Angaben stehen auf der Rechnung, die der Bestätigung als PDF beiliegt.\n\n" +
          "Wir reservieren die Ware sieben Kalendertage. Nach Eingang der Zahlung versenden wir die Bestellung innerhalb von einem bis drei Werktagen. Geht die Zahlung nicht innerhalb der Reservierungsfrist ein, stornieren wir die Bestellung und Sie erhalten eine Nachricht von uns.",
      },
      {
        heading: "Sofortüberweisung",
        body: "Sie werden am Ende des Bestellvorgangs zum Online-Banking Ihrer Bank weitergeleitet und geben die Überweisung dort direkt frei. Wir erhalten die Zahlungsbestätigung unmittelbar und können sofort mit dem Versand beginnen – ein eigenes Konto bei einem Zahlungsdienst brauchen Sie dafür nicht.",
      },
      {
        heading: "PayPal",
        body: "Sie werden am Ende des Bestellvorgangs zu PayPal weitergeleitet und bestätigen die Zahlung dort mit Ihren Zugangsdaten. Der Betrag wird unmittelbar nach dem Vertragsschluss abgebucht. Für die Nutzung benötigen Sie ein PayPal-Konto; es gelten zusätzlich die Nutzungsbedingungen von PayPal.",
      },
      {
        heading: "Kreditkarte",
        body: "Wir akzeptieren Visa, Mastercard und American Express. Die Belastung Ihrer Karte erfolgt mit dem Versand der Ware, bei Teillieferungen anteilig. Zur Sicherheit setzen wir das 3-D-Secure-Verfahren Ihrer Bank ein; Ihre Kartendaten werden ausschließlich verschlüsselt an unseren Zahlungsdienstleister übermittelt und nicht bei uns gespeichert.",
      },
      {
        heading: "SEPA-Lastschrift",
        body:
          "Sie erteilen uns im Bestellprozess ein SEPA-Lastschriftmandat. Wir buchen den Rechnungsbetrag frühestens mit dem Versand der Ware von Ihrem Konto ab.\n\n" +
          "Über den Einzug informieren wir Sie mindestens einen Bankarbeitstag vorher (verkürzte Vorabankündigung). Bitte sorgen Sie für ausreichende Kontodeckung: Für Rücklastschriften, die Sie zu vertreten haben, stellen wir die tatsächlich angefallenen Bankentgelte in Rechnung.",
      },
      {
        heading: "Keine Zusatzentgelte",
        body: "Für die Nutzung gängiger SEPA-Zahlungsarten und gängiger Zahlungskarten berechnen wir kein zusätzliches Entgelt (§ 270a BGB). Der im Warenkorb angezeigte Gesamtbetrag ist der Betrag, den Sie tatsächlich zahlen.",
      },
      {
        heading: "Sicherheit Ihrer Zahlungsdaten",
        body: "Alle Zahlungsvorgänge laufen über eine TLS-verschlüsselte Verbindung. Kreditkarten- und Kontodaten werden ausschließlich bei den jeweiligen Zahlungsdienstleistern verarbeitet, die den Sicherheitsstandard PCI DSS einhalten. Details zur Datenverarbeitung finden Sie in unserer Datenschutzerklärung.",
      },
      {
        heading: "Zahlungsverzug",
        body: "Kommen Sie mit einer Zahlung in Verzug, gelten die gesetzlichen Regelungen. Verbraucherinnen und Verbraucher schulden Verzugszinsen in Höhe von fünf Prozentpunkten über dem Basiszinssatz. Wir melden uns vor jeder weiteren Maßnahme zunächst mit einer Zahlungserinnerung.",
      },
      {
        heading: "Rückerstattungen",
        body: "Erstattungen erfolgen grundsätzlich über das ursprünglich verwendete Zahlungsmittel. Bei Vorkasse, Sofortüberweisung und SEPA-Lastschrift überweisen wir auf das Konto, von dem die Zahlung erfolgt ist. Kosten entstehen Ihnen dabei nicht.",
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  /* Retoure & Reklamation                                               */
  /* ------------------------------------------------------------------ */
  retoure: {
    slug: "retoure",
    title: "Retoure und Reklamation",
    intro: intro(
      "Etwas passt nicht oder funktioniert nicht wie erwartet? Auf dieser Seite erklären wir Schritt für Schritt, wie Sie einen Artikel zurückgeben und wie Sie einen Mangel reklamieren. Die rechtsverbindlichen Regelungen finden Sie in der Widerrufsbelehrung und in den AGB.",
    ),
    updatedAt: UPDATED_AT,
    sections: [
      {
        heading: "Zwei Wege zurück",
        body:
          "Gesetzliches Widerrufsrecht: 14 Tage ab Erhalt der Ware, ohne Angabe von Gründen. Die maßgebliche Belehrung finden Sie auf der Seite „Widerrufsrecht“.\n\n" +
          "Freiwilliges Rückgaberecht: Zusätzlich gewähren wir 30 Tage ab Erhalt der Ware. Voraussetzung ist, dass der Artikel unbenutzt, vollständig und wiederverkaufsfähig ist. Dieses zusätzliche Recht schränkt Ihre gesetzlichen Rechte nicht ein.",
      },
      {
        heading: "So melden Sie eine Rücksendung an",
        body: "Bitte melden Sie die Rücksendung vorab an – so ordnen wir Ihr Paket sofort zu und erstatten schneller.",
        list: [
          `E-Mail an ${COMPANY.email} mit Bestellnummer und Artikelbezeichnung`,
          "Muster-Widerrufsformular von der Seite „Widerrufsrecht“, ausgefüllt per E-Mail oder Post – vorgeschrieben ist es nicht",
          `Telefon: ${COMPANY.phone}, montags bis samstags von 8 bis 20 Uhr`,
        ],
      },
      {
        heading: "Rücksendekosten",
        body:
          "Die Kosten der Rücksendung tragen wir. Für Paketsendungen stellen wir Ihnen ein kostenloses Rücksendeetikett zur Verfügung.\n\n" +
          "Großgeräte, die per Spedition geliefert wurden, holen wir bei Ihnen ab. Bitte vereinbaren Sie dafür einen Termin mit unserem Kundenservice; bitte klemmen Sie das Gerät vorher ab und entleeren Sie es.",
      },
      {
        heading: "Verpackung und Zubehör",
        body: "Verwenden Sie nach Möglichkeit den Originalkarton mit den Transportsicherungen – gerade bei Waschmaschinen und Fernsehern schützt das vor Schäden. Legen Sie sämtliches Zubehör, Fernbedienungen, Kabel, Handbücher und beigelegte Gutscheine bei. Fehlen Teile, können wir den Wertersatz nur anteilig erstatten.",
      },
      {
        heading: "Prüfung der Ware und Wertersatz",
        body: "Sie dürfen die Ware prüfen, wie es Ihnen auch im Ladengeschäft möglich wäre – also auspacken, ansehen und die Funktionen testen. Für einen Wertverlust, der über diese Prüfung hinausgeht (zum Beispiel eine bereits eingebaute Dunstabzugshaube mit Bohrspuren oder eine intensiv genutzte Kaffeemaschine mit Kalkrückständen), können wir Wertersatz verlangen.",
      },
      {
        heading: "Rückerstattung",
        body: "Wir erstatten den Kaufpreis einschließlich der Standard-Hinsendekosten unverzüglich, spätestens binnen 14 Tagen nach Eingang Ihrer Widerrufserklärung. Wir dürfen die Rückzahlung zurückhalten, bis wir die Ware zurückerhalten haben oder Sie den Absendenachweis vorlegen. Die Erstattung erfolgt über das ursprüngliche Zahlungsmittel; Entgelte entstehen Ihnen dadurch nicht.",
      },
      {
        heading: "Reklamation eines Mangels",
        body:
          "Für neue Geräte gilt die gesetzliche Mängelhaftung von zwei Jahren ab Ablieferung. Zeigt sich innerhalb der ersten zwölf Monate ein Mangel, wird vermutet, dass er bereits bei Übergabe vorlag – Sie müssen also nichts beweisen.\n\n" +
          "Melden Sie den Mangel bitte zuerst unserem Kundenservice und halten Sie Bestellnummer, Seriennummer und eine kurze Fehlerbeschreibung bereit. Bei Großgeräten beauftragen wir in der Regel einen Techniker vor Ort, statt das Gerät zu transportieren – das ist schneller und schont das Gerät.",
      },
      {
        heading: "Garantie zusätzlich zur Gewährleistung",
        body: "Viele Hersteller gewähren freiwillige Garantien, etwa zehn Jahre auf Motoren oder fünf Jahre auf Kompressoren. Diese Garantien treten neben die gesetzliche Mängelhaftung und schränken sie nicht ein. Wir unterstützen Sie gern bei der Abwicklung mit dem Hersteller.",
      },
      {
        heading: "Transportschaden",
        body: "Ist die Ware beschädigt angekommen, melden Sie sich bitte innerhalb weniger Tage bei uns und senden Sie nach Möglichkeit Fotos von Verpackung und Gerät. Wir organisieren dann Ersatz oder Abholung. Eine verspätete Meldung schadet Ihren gesetzlichen Rechten nicht, erleichtert uns aber die Klärung mit dem Frachtführer.",
      },
      {
        heading: "Nicht zurückgenommene Artikel",
        body: "Vom Widerrufs- und Rückgaberecht ausgeschlossen sind unter anderem maßgefertigte Artikel sowie entsiegelte Hygieneartikel, Software und Datenträger. Die vollständige Aufzählung finden Sie auf der Seite „Widerrufsrecht“.",
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  /* Elektroaltgeräte & Batterien — ElektroG / BattDG                    */
  /* ------------------------------------------------------------------ */
  elektroaltgeraete: {
    slug: "elektroaltgeraete",
    title: "Elektroaltgeräte und Batterien",
    intro: intro(
      "Informationen nach dem Elektro- und Elektronikgerätegesetz (ElektroG) und dem Batterierecht-Durchführungsgesetz (BattDG): So geben Sie Altgeräte, Altbatterien und Akkus kostenlos bei uns zurück. Ob und in welchem Umfang eine Rücknahmepflicht besteht, hängt von der tatsächlichen Lager- und Versandfläche ab und ist vor der Veröffentlichung zu prüfen.",
    ),
    updatedAt: UPDATED_AT,
    sections: [
      {
        heading: "Warum Altgeräte nicht in den Hausmüll gehören",
        body: "Elektro- und Elektronikaltgeräte enthalten wertvolle Rohstoffe wie Kupfer, Aluminium und Seltene Erden, aber auch Schadstoffe wie Kältemittel, Quecksilber oder Lithium-Akkus. Wer Altgeräte getrennt entsorgt, sorgt dafür, dass diese Stoffe fachgerecht behandelt und Rohstoffe zurückgewonnen werden. Die Entsorgung über den Hausmüll ist gesetzlich untersagt und kann als Ordnungswidrigkeit geahndet werden.",
      },
      {
        heading: "Das Symbol der durchgestrichenen Mülltonne",
        body: "Geräte, die nach dem Ende ihrer Nutzung getrennt vom Hausmüll erfasst werden müssen, tragen das Symbol einer durchgestrichenen Abfalltonne auf Rädern. Das Symbol befindet sich auf dem Gerät, der Verpackung oder der Gebrauchsanweisung. Seit dem 1. Juli 2026 weisen rücknahmepflichtige Vertreiber dieses Symbol nach § 18a ElektroG zusätzlich gut sichtbar auf den Produktseiten im Onlineshop beziehungsweise im Bestellprozess aus und informieren dort über den Ablauf von Abholung und Rücknahme.",
      },
      {
        heading: "Unsere Rücknahme: 1:1 beim Kauf eines neuen Geräts",
        body:
          "Kaufen Sie bei uns ein neues Elektrogerät, nehmen wir ein Altgerät derselben Geräteart, das im Wesentlichen dieselben Funktionen erfüllt, unentgeltlich zurück (§ 17 Absatz 1 Satz 1 Nummer 1 ElektroG).\n\n" +
          "Bei Großgeräten fragen wir Sie im Bestellprozess ausdrücklich, ob Sie die Rücknahme wünschen. Die Spedition nimmt das Altgerät dann bei der Anlieferung des Neugeräts am Ort der Übergabe mit. Bitte klemmen Sie das Altgerät vorher ab, entleeren und reinigen Sie es und stellen Sie es frei zugänglich bereit.",
      },
      {
        heading: "Unsere Rücknahme: 0:1 für kleine Altgeräte",
        body:
          "Kleine Altgeräte, bei denen keine äußere Abmessung mehr als 25 Zentimeter beträgt, nehmen wir auch ohne Neukauf zurück – auf haushaltsübliche Mengen von bis zu drei Geräten je Geräteart beschränkt (§ 17 Absatz 1 Satz 1 Nummer 2 ElektroG).\n\n" +
          "Beispiele sind Rasierer, elektrische Zahnbürsten, Küchenwaagen, Kopfhörer, Kabel, Netzteile, Fernbedienungen und kleine Bluetooth-Lautsprecher.",
      },
      {
        heading: "So geben Sie Altgeräte bei uns zurück",
        body: "Als Versandhändler bieten wir Ihnen zumutbare, kostenfreie Rückgabemöglichkeiten an:",
        list: [
          `Rücksendung kleiner Altgeräte an: ${COMPANY.name}, Altgeräterücknahme, ${COMPANY.street}, ${COMPANY.city}. Ein kostenloses Versandlabel erhalten Sie über unseren Kundenservice.`,
          "Abholung von Großgeräten bei der Anlieferung des Neugeräts – bitte bereits bei der Bestellung angeben",
          "Nachträgliche Abholung eines Großgeräts nach Terminabsprache mit unserem Kundenservice",
          `Fragen zur Rücknahme: ${COMPANY.email} oder ${COMPANY.phone}`,
        ],
      },
      {
        heading: "Bitte vor der Rückgabe: Daten löschen",
        body: "Auf Altgeräten wie Smartphones, Smartwatches, Computern, Fernsehern und modernen Haushaltsgeräten können personenbezogene Daten gespeichert sein. Für das Löschen dieser Daten sind Sie selbst verantwortlich (§ 10 Absatz 1 ElektroG). Führen Sie deshalb vor der Rückgabe eine Rücksetzung auf Werkseinstellungen durch, entfernen Sie Speicherkarten und SIM-Karten und melden Sie Konten ab.",
      },
      {
        heading: "Batterien und Lampen vorher entnehmen",
        body: "Altbatterien und Altakkumulatoren sowie Lampen, die zerstörungsfrei aus dem Altgerät entnommen werden können, müssen vor der Rückgabe entnommen und getrennt entsorgt werden. Ist die Entnahme nur mit Werkzeug oder unter Zerstörung möglich, geben Sie das Gerät bitte vollständig zurück.",
      },
      {
        heading: "Rücknahme von Altbatterien und Akkus",
        body:
          "Batterien und Akkus dürfen nicht in den Hausmüll. Sie sind gesetzlich verpflichtet, Altbatterien einer getrennten Sammlung zuzuführen.\n\n" +
          "Sie können Altbatterien und Altakkus, die wir als Neubatterien im Sortiment führen oder geführt haben, unentgeltlich an unsere Versandadresse zurückgeben. Alternativ nutzen Sie die Sammelboxen im Handel oder die kommunalen Sammelstellen. Die Rückgabe ist für Sie kostenlos.\n\n" +
          `Rücksendeadresse für Altbatterien: ${COMPANY.name}, Batterierücknahme, ${COMPANY.street}, ${COMPANY.city}.`,
      },
      {
        heading: "Bedeutung der Batteriesymbole",
        body: "Batterien und Akkus tragen ebenfalls das Symbol der durchgestrichenen Mülltonne. Enthalten sie bestimmte Schadstoffe, steht darunter zusätzlich ein chemisches Kürzel:",
        list: [
          "Pb – die Batterie enthält mehr als 0,004 Masseprozent Blei",
          "Cd – die Batterie enthält mehr als 0,002 Masseprozent Cadmium",
          "Hg – die Batterie enthält mehr als 0,0005 Masseprozent Quecksilber",
        ],
      },
      {
        heading: "Sicherheitshinweis zu Lithium-Akkus",
        body: "Lithium-Ionen-Akkus können bei Beschädigung, Kurzschluss oder unsachgemäßer Lagerung in Brand geraten. Kleben Sie deshalb vor der Rückgabe die Pole mit Klebeband ab und geben Sie beschädigte oder aufgeblähte Akkus nicht in den Postversand, sondern ausschließlich bei einer kommunalen Sammelstelle ab. Bei Fragen hilft Ihnen unser Kundenservice weiter.",
      },
      {
        heading: "Kommunale Sammelstellen",
        body: "Unabhängig von unserer Rücknahme können Sie Altgeräte und Altbatterien kostenlos bei den Sammelstellen der öffentlich-rechtlichen Entsorgungsträger abgeben – etwa auf Wertstoffhöfen oder über Schadstoffmobile. Die Standorte finden Sie auf der Website Ihrer Stadt oder Ihres Landkreises.",
      },
      {
        heading: "Unsere Registrierungen",
        body: "Da wir ausschließlich Geräte fremder Marken vertreiben, sind wir nach § 6 ElektroG nicht zur eigenen Registrierung bei der Stiftung Elektro-Altgeräte Register verpflichtet; diese Pflicht liegt bei den Herstellern der von uns vertriebenen Marken. Für Batterien und Verpackungen sind wir bei den zuständigen Registern gemeldet:",
        list: [
          "Batterieregister nach BattDG: DE00000000 (Platzhalter)",
          "Verpackungsregister LUCID: DE0000000000000 (Platzhalter)",
        ],
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  /* FAQ — pas d'avertissement juridique                                 */
  /* ------------------------------------------------------------------ */
  faq: {
    slug: "faq",
    title: "Häufige Fragen",
    intro:
      "Von der Lieferzeit über den Montageservice bis zur Drohnenregistrierung: Hier finden Sie Antworten auf die Fragen, die uns am häufigsten erreichen. Ist Ihre Frage nicht dabei, rufen Sie uns an oder schreiben Sie uns – montags bis samstags von 8 bis 20 Uhr.",
    updatedAt: UPDATED_AT,
    sections: [
      {
        heading: "Wie lange dauert die Lieferung?",
        body: "Vorrätige Artikel sind im Standardversand innerhalb von drei bis fünf Werktagen bei Ihnen, im Expressversand innerhalb von 24 bis 48 Stunden. Bei Speditionsware für Großgeräte meldet sich die Spedition vorab telefonisch und vereinbart ein Zeitfenster mit Ihnen. Artikel mit dem Hinweis „Auf Anfrage“ bestellen wir beim Hersteller; hier dauert es meist zwei bis vier Wochen.",
      },
      {
        heading: "Was kostet der Versand?",
        body: "Der Standardversand innerhalb Deutschlands ist kostenlos – ohne Mindestbestellwert, unabhängig von Größe und Gewicht der Ware. Wünschen Sie die Lieferung innerhalb von 24 bis 48 Stunden, kostet der Expressversand pauschal 70,00 Euro. Andere Zuschläge gibt es nicht. Die für Ihre Bestellung geltenden Kosten sehen Sie immer im Warenkorb, bevor Sie bestellen.",
      },
      {
        heading: "Liefern Sie auch ins Ausland?",
        body: "Standardmäßig liefern wir innerhalb Deutschlands, einschließlich der Inseln. Lieferungen ins europäische Ausland sind nach Absprache möglich – schreiben Sie uns vor der Bestellung, dann prüfen wir Machbarkeit und Kosten für Ihre Adresse.",
      },
      {
        heading: "Wird das Gerät bis in die Wohnung gebracht?",
        body: "Der Speditionsversand endet standardmäßig an der Bordsteinkante. Für 29,00 Euro bringen unsere Speditionspartner das Gerät bis an den gewünschten Aufstellort, auch in obere Etagen; das Auspacken und die Entsorgung der Transportverpackung kosten zusätzlich 9,00 Euro. Diese beiden Leistungen buchen Sie nicht im Warenkorb – rufen Sie uns an oder schreiben Sie uns, dann stimmen wir sie mit der Spedition ab. Bitte messen Sie vorher Treppenhaus, Türen und Aufzug aus.",
      },
      {
        heading: "Bieten Sie Anschluss und Montage an?",
        body: "Ja: 49 Euro für Waschmaschine, Trockner oder Geschirrspüler, 39 Euro für freistehende Kühlgeräte, 89 Euro für den Einbau in eine vorbereitete Nische und 99 Euro für die Wandmontage eines Fernsehers. Den Service vereinbaren Sie telefonisch oder per E-Mail, am besten vor der Bestellung – im Warenkorb lässt er sich nicht mitbestellen. Voraussetzung sind vorhandene, frei zugängliche und normgerechte Anschlüsse. Arbeiten an der Hauselektrik dürfen wir nicht ausführen.",
      },
      {
        heading: "Nehmen Sie mein altes Gerät mit?",
        body: "Ja, und zwar kostenlos. Beim Kauf eines neuen Geräts nehmen wir ein gleichartiges Altgerät bei der Anlieferung mit. Sagen Sie uns rechtzeitig Bescheid – telefonisch, per E-Mail oder über das Anmerkungsfeld der Bestellung –, damit die Spedition die Rücknahme einplanen kann. Das Altgerät sollte abgeklemmt, entleert, gereinigt und frei zugänglich bereitstehen. Kleine Altgeräte, bei denen keine äußere Abmessung 25 Zentimeter überschreitet, nehmen wir sogar ohne Neukauf zurück – bis zu drei Stück je Geräteart. Alle weiteren Rücknahmewege stehen auf der Seite „Elektroaltgeräte & Batterien“.",
      },
      {
        heading: "Welche Zahlungsarten kann ich nutzen?",
        body: "Sie können per Vorkasse-Überweisung, per Sofortüberweisung, mit PayPal, mit Kreditkarte (Visa, Mastercard, American Express) oder per SEPA-Lastschrift bezahlen. Zusatzgebühren berechnen wir für keine dieser Zahlungsarten (§ 270a BGB). Bei Vorkasse reservieren wir die Ware sieben Kalendertage; geht die Zahlung bis dahin nicht ein, stornieren wir die Bestellung. Welche Zahlungsarten im Einzelfall zur Verfügung stehen, sehen Sie im Bestellprozess.",
      },
      {
        heading: "Wie läuft die Zahlung per Vorkasse ab?",
        body: "Mit der Bestellbestätigung erhalten Sie unsere Bankverbindung und die Bestellnummer, die als Verwendungszweck dient; beides steht auch auf der Rechnung, die der Bestätigung als PDF beiliegt. Wir reservieren die Ware sieben Kalendertage und versenden sie innerhalb von einem bis drei Werktagen nach Zahlungseingang. Kommt die Zahlung nicht rechtzeitig an, stornieren wir die Bestellung und melden uns bei Ihnen.",
      },
      {
        heading: "Wie lange habe ich Garantie?",
        body: "Auf alle Neugeräte gilt die gesetzliche Mängelhaftung von zwei Jahren ab Ablieferung. Tritt in den ersten zwölf Monaten ein Defekt auf, wird vermutet, dass er von Anfang an vorlag – Sie müssen also nichts beweisen. Viele Hersteller gewähren zusätzlich freiwillige Garantien, etwa auf Motoren oder Kompressoren.",
      },
      {
        heading: "Was ist der Unterschied zwischen Garantie und Gewährleistung?",
        body: "Die Gewährleistung ist Ihr gesetzliches Recht uns gegenüber und dauert zwei Jahre. Eine Garantie ist eine freiwillige Zusage des Herstellers, die darüber hinausgehen kann – etwa zehn Jahre auf den Motor einer Waschmaschine. Die Garantie ersetzt die Gewährleistung nicht, sondern kommt zusätzlich hinzu. Sie entscheiden, welchen Weg Sie nutzen.",
      },
      {
        heading: "Wie lange kann ich einen Artikel zurückgeben?",
        body: "Es gibt zwei Wege zurück. Ihr gesetzliches Widerrufsrecht läuft 14 Tage ab Erhalt der Ware und verlangt keine Begründung; maßgeblich ist die Widerrufsbelehrung. Darüber hinaus räumen wir Ihnen freiwillig ein vertragliches Rückgaberecht von 30 Tagen ab Erhalt der Ware ein – vorausgesetzt, der Artikel ist unbenutzt, vollständig und wiederverkaufsfähig. Dieses zusätzliche Recht schränkt Ihre gesetzlichen Rechte nicht ein.",
      },
      {
        heading: "Wie schicke ich etwas zurück?",
        body: `Melden Sie die Rücksendung vorab an – per E-Mail an ${COMPANY.email} oder telefonisch unter ${COMPANY.phone}. Das Muster-Widerrufsformular finden Sie auf der Seite „Widerrufsrecht“; Sie müssen es aber nicht verwenden, eine formlose eindeutige Erklärung genügt. Für Pakete erhalten Sie ein kostenloses Rücksendeetikett. Großgeräte holen wir nach Terminabsprache bei Ihnen ab; bitte klemmen Sie das Gerät vorher ab und entleeren Sie es. Legen Sie sämtliches Zubehör bei und verwenden Sie möglichst den Originalkarton mit den Transportsicherungen.`,
      },
      {
        heading: "Was kostet die Rücksendung?",
        body: "Nichts. Wir tragen die Kosten der Rücksendung – sowohl für Pakete als auch für die Abholung von Großgeräten durch die Spedition.",
      },
      {
        heading: "Wann bekomme ich mein Geld zurück?",
        body: "Wir erstatten den Kaufpreis spätestens 14 Tage nach Eingang Ihres Widerrufs, sobald die Ware bei uns eingetroffen ist oder Sie den Absendenachweis vorgelegt haben. Die Rückzahlung erfolgt über das ursprüngliche Zahlungsmittel; Gebühren entstehen Ihnen dabei nicht. Hinsendekosten fallen beim Standardversand nicht an. Haben Sie den Expressversand gewählt, bleibt dessen Aufpreis nach § 357 Absatz 2 BGB bei Ihnen: Erstattet wird nur, was die günstigste Standardlieferung gekostet hätte – und die ist bei uns kostenlos.",
      },
      {
        heading: "Ein Artikel ist „Auf Anfrage“ – was bedeutet das?",
        body: "Der Artikel ist aktuell nicht auf Lager, aber lieferbar. Wir bestellen ihn nach Ihrem Auftrag beim Hersteller; die Lieferzeit beträgt üblicherweise zwei bis vier Wochen. Sie können solche Artikel ganz normal bestellen und erhalten von uns eine Rückmeldung, sobald ein konkreter Termin feststeht.",
      },
      {
        heading: "Woher weiß ich, ob ein Einbaugerät in meine Küche passt?",
        body: "Entscheidend sind die Nischenmaße in Höhe, Breite und Tiefe sowie die Position der Anschlüsse. Alle Geräte- und Nischenmaße finden Sie in den technischen Daten auf der Produktseite. Messen Sie im Zweifel nach oder rufen Sie uns an – unsere Beratung prüft mit Ihnen gemeinsam, ob das Gerät passt, und schlägt Alternativen vor.",
      },
      {
        heading: "Wo finde ich die Energieeffizienzklasse eines Geräts?",
        body: "Auf jeder Produktseite zeigen wir das EU-Energielabel mit der Effizienzklasse sowie das offizielle Produktdatenblatt. Dort stehen auch Verbrauchswerte, Geräuschemissionen und – bei Waschmaschinen und Geschirrspülern – Wasserverbrauch je Programm. Achten Sie beim Vergleich unbedingt auf dieselbe Programm- und Beladungsangabe.",
      },
      {
        heading: "Was muss ich beim Kauf einer Drohne beachten?",
        body: "In Deutschland gilt die EU-Drohnenverordnung. Als Fernpilot müssen Sie sich beim Luftfahrt-Bundesamt registrieren und erhalten eine elektronische Registrierungsnummer (e-ID), die Sie gut sichtbar an der Drohne anbringen. Außerdem ist eine Halterhaftpflichtversicherung nach § 43 Luftverkehrsgesetz gesetzlich vorgeschrieben – auch für sehr leichte Modelle. Fliegen dürfen Sie in der offenen Kategorie bis 120 Meter Höhe, stets in Sichtweite und nicht über Menschenansammlungen; Flugverbotszonen wie Flughäfen, Krankenhäuser, Bundesfernstraßen und Naturschutzgebiete sind tabu.",
      },
      {
        heading: "Brauche ich für eine Drohne unter 250 Gramm einen Drohnenführerschein?",
        body: "Nein. Für Drohnen unter 250 Gramm beziehungsweise der Klasse C0 ist weder der EU-Kompetenznachweis A1/A3 noch das EU-Fernpilotenzeugnis A2 erforderlich. Registrierung und Versicherung sind trotzdem Pflicht, sobald die Drohne – wie fast alle Kameramodelle – einen Sensor zur Erfassung personenbezogener Daten besitzt. Die Bildaufnahme über Privatgrundstücken bleibt zudem durch Persönlichkeitsrechte und Datenschutz begrenzt.",
      },
      {
        heading: "Kann ich als Firma bestellen und eine Rechnung mit Umsatzsteuerausweis erhalten?",
        body: "Ja. Tragen Sie im Bestellprozess Ihren Firmennamen in das Feld „Firma“ ein. Die Rechnung liegt der Bestellbestätigung als PDF bei und weist die enthaltene Umsatzsteuer aus. Benötigen Sie Ihre Umsatzsteuer-Identifikationsnummer auf der Rechnung, schreiben Sie sie bitte in das Anmerkungsfeld der Bestellung oder senden Sie sie uns nach; ein eigenes Feld dafür gibt es im Bestellprozess noch nicht. Bitte beachten Sie zwei Unterschiede zum Verbraucherkauf: Unternehmen haben kein gesetzliches Widerrufsrecht, und die Verjährungsfrist für Mängelansprüche beträgt bei neuen Waren ein Jahr ab Gefahrübergang statt zwei Jahre. Unser freiwilliges 30-tägiges Rückgaberecht gilt auch für Sie.",
      },
      {
        heading: "Was mache ich, wenn ein Gerät nach Ablauf der zwei Jahre defekt ist?",
        body: "Melden Sie sich trotzdem bei uns. Häufig greift noch eine Herstellergarantie auf einzelne Bauteile, oder eine Reparatur ist deutlich günstiger als ein Neukauf. Wir vermitteln Ihnen einen autorisierten Servicepartner und prüfen die Ersatzteilverfügbarkeit für Ihr Modell.",
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  /* Über uns — pas d'avertissement juridique                            */
  /* ------------------------------------------------------------------ */
  "ueber-uns": {
    slug: "ueber-uns",
    title: "Über uns",
    intro:
      "Hausgeräte Pfeffer ist ein Fachhändler für Haushaltsgeräte und Multimedia mit Sitz in Trier. Wir verkaufen keine Geräte von der Stange, sondern beraten dazu – vom passenden Nischenmaß bis zur richtigen Bildwiederholrate.",
    updatedAt: UPDATED_AT,
    sections: [
      {
        heading: "Wer wir sind",
        body: "Was als kleiner Elektrofachbetrieb begann, ist heute ein Onlineshop mit angeschlossenem Lager und eigenem Serviceteam. Der Name steht für das, was uns wichtig ist: ehrliche Beratung, faire Preise und ein Ansprechpartner, der auch nach dem Kauf noch da ist. Geführt wird das Unternehmen von Martin Pfeffer.",
      },
      {
        heading: "Unser Sortiment",
        body: "Wir konzentrieren uns auf zwei Welten: Haushalt und Multimedia. Im Haushaltsbereich finden Sie Waschmaschinen, Geschirrspüler, Kühl- und Gefriergeräte, Backöfen und Herde, Staubsauger, Küchenmaschinen, Kaffeevollautomaten und Klimageräte. Im Multimediabereich Fernseher, Smartphones, Computer, Smartwatches, Videospiele und Drohnen. Statt eines endlosen Katalogs führen wir eine kuratierte Auswahl von Marken, die wir selbst kennen und deren Serviceabwicklung funktioniert.",
      },
      {
        heading: "Beratung statt Bestellformular",
        body: "Ein Kühlschrank, der nicht in die Nische passt, oder ein Fernseher, der im hellen Wohnzimmer zu dunkel ist, ärgert lange. Deshalb ist unsere Beratung montags bis samstags von 8 bis 20 Uhr unter +49 176 14111374 erreichbar. Wir fragen nach Nischenmaßen, Anschlüssen, Wasserhärte oder Raumgröße – und sagen auch, wenn das günstigere Modell für Ihren Fall das bessere ist.",
      },
      {
        heading: "Service und Montage",
        body: "Unsere Servicepartner schließen Waschmaschinen an, bauen Geräte in vorbereitete Nischen ein und montieren Fernseher an der Wand. Bei einem Defekt schicken wir bevorzugt einen Techniker zu Ihnen, statt ein Großgerät quer durch Deutschland zu transportieren. Das ist schneller für Sie und schont das Gerät.",
      },
      {
        heading: "Nachhaltigkeit und Altgeräte",
        body: "Wir nehmen Ihr Altgerät bei der Lieferung kostenlos mit und führen es der fachgerechten Verwertung zu. Kleine Altgeräte und Altbatterien nehmen wir auch ohne Neukauf zurück. Bei der Sortimentsauswahl achten wir auf Reparierbarkeit, Ersatzteilverfügbarkeit und lange Update-Zusagen bei vernetzten Geräten – Kriterien, die im Datenblatt selten stehen, im Alltag aber den Unterschied machen.",
      },
      {
        heading: "Standort und Logistik",
        body: "Unser Sitz ist Trier, von dort steuern wir Einkauf, Kundenservice und Retourenabwicklung. Der Versand erfolgt über Paketdienste und spezialisierte Zwei-Mann-Speditionen für Großgeräte, damit auch ein 90 Kilogramm schwerer Kühlschrank sicher an seinem Platz ankommt.",
      },
      {
        heading: "Arbeiten bei Hausgeräte Pfeffer",
        body: "Wir suchen regelmäßig Verstärkung in Beratung, Technik und Logistik. Wenn Sie Freude daran haben, Menschen wirklich weiterzuhelfen, statt nur Bestellungen abzuarbeiten, schreiben Sie uns an kontakt@hausgeratepfeffer.de – auch Initiativbewerbungen sind willkommen.",
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  /* Kontakt — pas d'avertissement juridique                             */
  /* ------------------------------------------------------------------ */
  kontakt: {
    slug: "kontakt",
    title: "Kontakt",
    intro:
      "Ob Beratung vor dem Kauf, Frage zur Lieferung oder Reklamation: Wir sind montags bis samstags von 8 bis 20 Uhr für Sie da. Halten Sie bei Fragen zu einer Bestellung bitte Ihre Bestellnummer bereit – das beschleunigt alles.",
    updatedAt: UPDATED_AT,
    sections: [
      {
        heading: "Kundenservice",
        body: "Unser Team beantwortet Fragen zu Produkten, Verfügbarkeit, Lieferterminen und Zahlungen.",
        list: [
          `Telefon: ${COMPANY.phone}`,
          "Erreichbarkeit: Montag bis Samstag, 8 bis 20 Uhr",
          `E-Mail: ${COMPANY.email}`,
          "Antwortzeit per E-Mail: in der Regel innerhalb eines Werktages",
        ],
      },
      {
        heading: "Postanschrift",
        body: "Schriftliche Anliegen richten Sie bitte an:",
        list: [COMPANY.name, COMPANY.street, COMPANY.city, COMPANY.country],
      },
      {
        heading: "Retouren und Altgeräte",
        body: "Bitte senden Sie Retouren und kleine Altgeräte nicht unangekündigt zurück, sondern melden Sie sie vorab an – so ordnen wir Ihre Sendung sofort zu.",
        list: [
          `Retourenannahme: ${RETURN_ADDRESS}`,
          `Altgeräterücknahme: ${COMPANY.name}, Altgeräterücknahme, ${COMPANY.street}, ${COMPANY.city}`,
          `Batterierücknahme: ${COMPANY.name}, Batterierücknahme, ${COMPANY.street}, ${COMPANY.city}`,
        ],
      },
      {
        heading: "Technischer Service und Montage",
        body: `Für Termine zu Anschluss, Montage oder einem Technikereinsatz erreichen Sie unsere Serviceplanung unter ${COMPANY.phone}. Halten Sie bitte Modellbezeichnung und Seriennummer des Geräts bereit; beides finden Sie auf dem Typenschild.`,
      },
      {
        heading: "Datenschutzanfragen",
        body: "Auskunft, Berichtigung oder Löschung Ihrer Daten beantragen Sie unter datenschutz@hausgeratepfeffer.de oder postalisch mit dem Zusatz „Datenschutzbeauftragter“. Wir antworten innerhalb der gesetzlichen Frist von einem Monat.",
      },
      {
        heading: "Presse und Kooperationen",
        body: `Presseanfragen sowie Anfragen zu Kooperationen und Partnerprogrammen richten Sie bitte an ${COMPANY.email} mit dem Betreff „Presse“ beziehungsweise „Kooperation“.`,
      },
      {
        heading: "Rechtliche Angaben",
        body: `${COMPANY.name}, vertreten durch den Geschäftsführer ${COMPANY.managingDirector}. Registergericht: ${COMPANY.register}. Umsatzsteuer-Identifikationsnummer: ${COMPANY.vatId}. Vollständige Angaben finden Sie im Impressum.`,
      },
    ],
  },
};

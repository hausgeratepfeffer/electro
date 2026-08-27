/**
 * Tests des e-mails de commande.
 *
 * L'enjeu : ces deux messages sont la seule preuve que le client et le vendeur
 * reçoivent de la commande. On vérifie donc qu'ils contiennent réellement les
 * montants, les adresses et les liens attendus — un gabarit qui « compile »
 * mais oublie le total serait une confirmation sans valeur —, que la langue
 * suit celle de la commande, et qu'aucun texte saisi par le client ne peut
 * injecter de HTML.
 *
 * Lancer avec : npm test
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { OrderRecord } from "@/server/orders";
import type { BankTransferSettings } from "@/lib/bankTransfer";
import { buildOrderConfirmationEmail, buildOrderNotificationEmail } from "./order";

const SITE = "https://hausgeratepfeffer.de";
process.env.NEXT_PUBLIC_SITE_URL = SITE;

function order(overrides: Partial<OrderRecord> = {}): OrderRecord {
  return {
    id: "ord_42",
    orderNumber: "HP-2026-000042",
    accessToken: "9f2c1ab34de5",
    locale: "de",
    email: "anna.beispiel@example.de",
    phone: "+49 30 1234567",
    billing: {
      salutation: "frau",
      firstName: "Anna",
      lastName: "Beispiel",
      company: "",
      street: "Hauptstraße 12a",
      postalCode: "10115",
      city: "Berlin",
      country: "DE",
    },
    shippingSameAsBilling: true,
    shipping: {
      salutation: "frau",
      firstName: "Anna",
      lastName: "Beispiel",
      company: "",
      street: "Hauptstraße 12a",
      postalCode: "10115",
      city: "Berlin",
      country: "DE",
    },
    paymentMethodKey: "vorkasse",
    paymentMethodLabel: "Vorkasse per Überweisung",
    paymentMethodFee: "",
    shippingMethodKey: "standard",
    shippingMethodLabel: "Standardversand",
    status: "eingegangen",
    paymentStatus: "offen",
    subtotalCents: 89900,
    shippingCents: 495,
    couponCode: "",
    discountCents: 0,
    taxCents: 14428,
    totalCents: 90395,
    taxRatePercent: 19,
    currency: "EUR",
    customerNote: "",
    adminNote: "",
    createdAt: "2026-07-30T09:24:00.000Z",
    updatedAt: "2026-07-30T09:24:00.000Z",
    trafficChannel: "",
    trafficSource: "",
    items: [
      {
        id: "item_1",
        brand: "Bosch",
        name: "Serie 6 Waschmaschine WAU28T00",
        sku: "WAU28T00",
        slug: "bosch-wau28t00",
        image: "",
        path: "haushalt/waschmaschinen/bosch-wau28t00",
        unitPriceCents: 89900,
        quantity: 1,
        lineTotalCents: 89900,
      },
    ],
    events: [],
    ...overrides,
  };
}

/** Coordonnées telles qu'elles sortent du back-office, IBAN déjà normalisé. */
const BANK: BankTransferSettings = {
  holder: "Hausgeräte Pfeffer OHG",
  iban: "DE89 3704 0044 0532 0130 00",
  bic: "COBADEFFXXX",
  bank: "Commerzbank",
  transferType: "SEPA-Echtzeitüberweisung",
  instructions: {
    de: "Bitte überweisen Sie {total} unter Angabe von {orderNumber}.",
    en: "Please transfer {total} quoting {orderNumber}.",
  },
};

describe("Confirmation à l'acheteur", () => {
  it("récapitule le numéro, les articles et les montants", () => {
    const mail = buildOrderConfirmationEmail(order());

    assert.match(mail.subject, /HP-2026-000042/);
    for (const part of [mail.html, mail.text]) {
      assert.match(part, /HP-2026-000042/);
      assert.match(part, /Serie 6 Waschmaschine WAU28T00/);
      // Total, sous-total et port : le récapitulatif exigé par le § 312i BGB,
      // aux prix au format allemand.
      assert.match(part, /903,95 €/);
      assert.match(part, /899,00 €/);
      assert.match(part, /4,95 €/);
      assert.match(part, /Hauptstraße 12a/);
      assert.match(part, /Vorkasse per Überweisung/);
      // Le détail de la TVA a été retiré à la demande du commerçant : ni le
      // taux, ni le montant contenu ne doivent reparaître dans la confirmation.
      assert.doesNotMatch(part, /144,28 €/);
      assert.doesNotMatch(part, /19 ?% ?(MwSt|VAT|USt)/);
    }
  });

  it("ne porte plus de lien de suivi ni de bouton", () => {
    // Le message se terminait sur un bouton rouge, l'adresse complète avec son
    // jeton, puis une phrase renvoyant à ce même lien : trois façons de dire la
    // même chose, à l'endroit où le client cherchait l'IBAN. La commande reste
    // consultable depuis la page de confirmation ouverte après l'achat.
    const mail = buildOrderConfirmationEmail(order());
    assert.doesNotMatch(mail.html, /bestellung\/HP-2026-000042/);
    assert.doesNotMatch(mail.html, /Bestellung ansehen/);
    assert.doesNotMatch(mail.text, /bestellung\/HP-2026-000042/);
  });

  it("écrit en allemand par défaut et en anglais sous /en", () => {
    const de = buildOrderConfirmationEmail(order());
    assert.match(de.subject, /Bestellbestätigung/);
    assert.match(de.html, /lang="de"/);
    assert.match(de.html, /Sehr geehrte Frau Beispiel/);

    const en = buildOrderConfirmationEmail(order({ locale: "en" }));
    assert.match(en.subject, /Order confirmation/);
    assert.match(en.html, /lang="en"/);
    assert.match(en.html, /Dear Ms Beispiel/);
  });

  it("ne présume rien du prénom sans civilité renseignée", () => {
    const anonymous = order();
    anonymous.billing.salutation = "";
    const mail = buildOrderConfirmationEmail(anonymous);
    assert.match(mail.html, /Guten Tag Anna Beispiel/);
    assert.doesNotMatch(mail.html, /Frau|Herr/);
  });

  it("annonce le port offert plutôt qu'un montant nul", () => {
    const mail = buildOrderConfirmationEmail(order({ shippingCents: 0 }));
    assert.match(mail.html, /kostenlos/);
    assert.doesNotMatch(mail.text, /Versand: 0,00 €/);
  });

  it("déduit la remise et nomme le code qui l'a ouverte", () => {
    // 899,00 € − 179,80 € + 4,95 € = 724,15 € : les trois lignes du message
    // doivent réellement s'additionner jusqu'au total facturé. Sans la ligne de
    // remise, le client lisait un sous-total et un port dont la somme dépassait
    // ce qu'on lui prélevait.
    const mail = buildOrderConfirmationEmail(
      order({ couponCode: "SOMMER10", discountCents: 17_980, totalCents: 72_415 }),
    );
    assert.match(mail.html, /Rabatt \(SOMMER10\)/);
    assert.match(mail.html, /179,80/);
    assert.match(mail.text, /Rabatt \(SOMMER10\): − 179,80/);
    assert.match(mail.text, /Gesamtsumme: 724,15/);
  });

  it("passe la remise sous silence quand il n'y en a pas", () => {
    const mail = buildOrderConfirmationEmail(order());
    assert.doesNotMatch(mail.html, /Rabatt/);
    assert.doesNotMatch(mail.text, /Rabatt/);
  });

  it("traduit la remise pour une commande passée en anglais", () => {
    const mail = buildOrderConfirmationEmail(
      order({ locale: "en", couponCode: "SUMMER10", discountCents: 17_980, totalCents: 72_415 }),
    );
    assert.match(mail.html, /Discount \(SUMMER10\)/);
  });

  it("n'affiche l'adresse de facturation que si elle diffère", () => {
    assert.doesNotMatch(buildOrderConfirmationEmail(order()).html, /Rechnungsadresse/);

    const distinct = order({ shippingSameAsBilling: false });
    distinct.shipping.street = "Lagerweg 3";
    const mail = buildOrderConfirmationEmail(distinct);
    assert.match(mail.html, /Rechnungsadresse/);
    assert.match(mail.html, /Lagerweg 3/);
    assert.match(mail.html, /Hauptstraße 12a/);
  });

  it("nomme le mode de livraison retenu, dans la langue du message", () => {
    const de = buildOrderConfirmationEmail(order());
    assert.match(de.html, /Standardversand \(3–5 Werktage\)/);
    assert.match(de.text, /Standardversand \(3–5 Werktage\)/);

    const express = order({
      shippingMethodKey: "express",
      shippingMethodLabel: "Expressversand",
      shippingCents: 7_000,
      totalCents: 96_900,
      locale: "en",
    });
    const en = buildOrderConfirmationEmail(express);
    assert.match(en.html, /Express delivery \(24–48 hours\)/);
    // Le supplément doit apparaître comme un montant, jamais comme « free ».
    assert.match(en.html, /70,00 €/);
    assert.doesNotMatch(en.text, /Shipping — Express delivery \(24–48 hours\): free/);
  });

  it("joint les coordonnées du virement à une commande en Vorkasse", () => {
    const mail = buildOrderConfirmationEmail(order(), BANK);

    for (const part of [mail.html, mail.text]) {
      assert.match(part, /Hausgeräte Pfeffer OHG/);
      assert.match(part, /DE89 3704 0044 0532 0130 00/);
      assert.match(part, /COBADEFFXXX/);
      assert.match(part, /Commerzbank/);
      // Instruction du vendeur, montant et numéro de commande substitués.
      assert.match(part, /Bitte überweisen Sie 903,95 €/);
      assert.match(part, /HP-2026-000042/);
      assert.doesNotMatch(part, /\{total\}|\{orderNumber\}/);
    }
  });

  it("sert l'instruction anglaise à une commande passée sur /en", () => {
    const mail = buildOrderConfirmationEmail(order({ locale: "en" }), BANK);
    assert.match(mail.html, /Please transfer 903,95 €/);
    assert.doesNotMatch(mail.html, /Bitte überweisen/);
  });

  it("ne joint aucune coordonnée pour un autre moyen de paiement", () => {
    const mail = buildOrderConfirmationEmail(
      order({ paymentMethodKey: "rechnung", paymentMethodLabel: "Kauf auf Rechnung" }),
      BANK,
    );
    assert.doesNotMatch(mail.html, /DE89 3704/);
    assert.doesNotMatch(mail.text, /IBAN/);
  });

  it("omet le nom de la banque quand il n'est pas renseigné", () => {
    const mail = buildOrderConfirmationEmail(order(), { ...BANK, bank: "" });
    assert.match(mail.html, /DE89 3704 0044 0532 0130 00/);
    assert.doesNotMatch(mail.html, /Commerzbank/);
  });

  /**
   * L'intitulé suit la langue de la commande, la valeur non : le client doit
   * retrouver dans son application bancaire le mot exact saisi par le vendeur.
   */
  it("traduit l'intitulé du type de virement mais reprend la valeur telle quelle", () => {
    const de = buildOrderConfirmationEmail(order(), BANK);
    assert.match(de.text, /Überweisungsart: SEPA-Echtzeitüberweisung/);

    const en = buildOrderConfirmationEmail(order({ locale: "en" }), BANK);
    assert.match(en.text, /Transfer type: SEPA-Echtzeitüberweisung/);
  });

  it("omet le type de virement quand il n'est pas renseigné", () => {
    const mail = buildOrderConfirmationEmail(order(), { ...BANK, transferType: "" });
    assert.match(mail.html, /DE89 3704 0044 0532 0130 00/);
    assert.doesNotMatch(mail.html, /Überweisungsart/);
  });

  it("échappe la remarque saisie par le client", () => {
    const mail = buildOrderConfirmationEmail(
      order({ customerNote: '<img src=x onerror="alert(1)">' }),
    );
    assert.doesNotMatch(mail.html, /<img src=x/);
    assert.match(mail.html, /&lt;img src=x/);
  });
});

describe("Notification au vendeur", () => {
  it("annonce le numéro et le montant dès l'objet", () => {
    const mail = buildOrderNotificationEmail(order());
    assert.match(mail.subject, /Nouvelle commande HP-2026-000042/);
    assert.match(mail.subject, /903,95 €/);
  });

  it("donne les coordonnées du client et le lien back-office", () => {
    const mail = buildOrderNotificationEmail(order());
    for (const part of [mail.html, mail.text]) {
      assert.match(part, /anna\.beispiel@example\.de/);
      assert.match(part, /\+49 30 1234567/);
      assert.match(part, /Serie 6 Waschmaschine WAU28T00/);
      assert.match(part, /903,95 €/);
    }
    // Le lien pointe la fiche interne par identifiant, pas la page publique :
    // le vendeur doit atterrir là où il peut agir sur la commande.
    assert.ok(mail.html.includes(`${SITE}/admin/orders/ord_42`));
    assert.ok(mail.text.includes(`${SITE}/admin/orders/ord_42`));
    // Le jeton d'accès du client n'a rien à faire dans un message interne.
    assert.doesNotMatch(mail.html, /9f2c1ab34de5/);
  });

  it("reste en français, quelle que soit la langue de la commande", () => {
    const mail = buildOrderNotificationEmail(order({ locale: "en" }));
    assert.match(mail.html, /lang="fr"/);
    assert.match(mail.html, /Nouvelle commande/);
    assert.match(mail.html, /Langue de la commande : anglais/);
  });

  it("signale l'express en priorité de préparation", () => {
    const standard = buildOrderNotificationEmail(order());
    assert.match(standard.html, /Livraison standard \(3 à 5 jours ouvrés\)/);
    assert.doesNotMatch(standard.html, /priorité/);

    const express = buildOrderNotificationEmail(
      order({ shippingMethodKey: "express", shippingCents: 7_000 }),
    );
    assert.match(express.html, /Livraison express \(24 à 48 heures\)/);
    assert.match(express.html, /à préparer en priorité/);
    assert.match(express.text, /Livraison : Livraison express/);
  });

  it("remonte la remarque du client quand il en a laissé une", () => {
    const mail = buildOrderNotificationEmail(order({ customerNote: "Bitte vormittags liefern." }));
    assert.match(mail.html, /Remarque du client/);
    assert.match(mail.text, /Bitte vormittags liefern\./);
  });

  it("indique au vendeur quel coupon a été utilisé", () => {
    const mail = buildOrderNotificationEmail(
      order({ couponCode: "SOMMER10", discountCents: 17_980, totalCents: 72_415 }),
    );
    assert.match(mail.html, /Remise \(SOMMER10\)/);
    assert.match(mail.text, /Remise \(SOMMER10\) : − 179,80/);
  });
});

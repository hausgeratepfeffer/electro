import { after, NextResponse } from "next/server";
import { invaliderCatalogue } from "@/server/cacheCatalogue";
import {
  createOrder,
  OrderError,
  parseCheckoutPayload,
  setOrderGatewayReference,
} from "@/server/orders";
import type { CheckoutErrorCode, OrderRecord } from "@/server/orders";
import { getCurrentCustomer } from "@/server/customerSession";
import { resolveCampaignContext } from "@/server/campaignContext";
import { sendOrderEmails } from "@/server/orderNotifications";
import { resolveGatewayForMethod } from "@/server/gateways";
import { checkCouponRate, identifiantAppelant } from "@/server/couponRate";

// Point d'entrée public du tunnel de commande.
//
// Rien de ce que le navigateur envoie n'est repris tel quel en dehors des
// coordonnées : les identifiants de produit servent à relire les prix et le
// stock en base, les montants sont recalculés côté serveur, et le moyen de
// paiement doit figurer parmi ceux activés dans le back-office.
//
// La route reste ouverte aux visiteurs sans compte : commander en tant
// qu'invité est la règle, pas une tolérance. Si un cookie de session client
// valide accompagne la requête, la commande est simplement rattachée au compte
// correspondant.

/** Adresse publique du site, sans barre finale. */
function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

/** Page de confirmation d'une commande, jeton compris. */
function confirmationUrl(order: OrderRecord): string {
  const prefixe = order.locale === "en" ? "/en" : "";
  return `${siteUrl()}${prefixe}/bestellung/${order.orderNumber}?token=${order.accessToken}`;
}

/**
 * Ouvre une session de paiement si le moyen choisi est encaissé en ligne, et
 * rend l'adresse vers laquelle envoyer le navigateur.
 *
 * Ne lève jamais : la commande est déjà écrite et en attente de règlement. Un
 * prestataire injoignable doit la laisser payable autrement — virement,
 * facture — plutôt que de faire échouer une commande valable sous les yeux du
 * client.
 */
async function startOnlinePayment(order: OrderRecord): Promise<string | undefined> {
  const gateway = await resolveGatewayForMethod(order.paymentMethodKey);
  if (!gateway) return undefined;

  try {
    const confirmation = confirmationUrl(order);
    const session = await gateway.createCheckoutSession({
      orderNumber: order.orderNumber,
      accessToken: order.accessToken,
      amountCents: order.totalCents,
      currency: order.currency,
      email: order.email,
      locale: order.locale === "en" ? "en" : "de",
      methodKey: order.paymentMethodKey,
      description: `Bestellung ${order.orderNumber}`,
      successUrl: confirmation,
      // Retour d'abandon distinct du retour de succès : sans ce marqueur, un
      // client qui renonce chez le prestataire reviendrait sur un écran de
      // remerciement alors que rien n'a été encaissé. La page de confirmation
      // s'appuie d'abord sur le statut réel de la commande ; ce paramètre ne
      // fait qu'affiner le message.
      cancelUrl: `${confirmation}&zahlung=abgebrochen`,
    });
    await setOrderGatewayReference(order.id, session.reference);
    return session.redirectUrl;
  } catch (error) {
    console.error("[checkout] ouverture du paiement en ligne impossible :", error);
    return undefined;
  }
}

/** Messages neutres, doublés en allemand et en anglais : le client affiche sa propre traduction à partir du code. */
const MESSAGES: Record<CheckoutErrorCode, { de: string; en: string }> = {
  invalid_payload: {
    de: "Die Bestellung konnte nicht gelesen werden.",
    en: "The order could not be read.",
  },
  cart_empty: { de: "Ihr Warenkorb ist leer.", en: "Your cart is empty." },
  cart_too_large: {
    de: "Ihr Warenkorb enthält zu viele verschiedene Artikel.",
    en: "Your cart contains too many different items.",
  },
  invalid_quantity: {
    de: "Bitte wählen Sie je Artikel eine Menge zwischen 1 und 20.",
    en: "Please choose a quantity between 1 and 20 per item.",
  },
  invalid_email: {
    de: "Bitte geben Sie eine gültige E-Mail-Adresse an.",
    en: "Please enter a valid email address.",
  },
  invalid_name: {
    de: "Bitte geben Sie Vor- und Nachnamen an.",
    en: "Please enter a first and last name.",
  },
  invalid_street: {
    de: "Bitte geben Sie Straße und Hausnummer an.",
    en: "Please enter a street and house number.",
  },
  invalid_postal_code: {
    de: "Bitte geben Sie eine gültige Postleitzahl an.",
    en: "Please enter a valid postcode.",
  },
  invalid_city: { de: "Bitte geben Sie einen Ort an.", en: "Please enter a city." },
  unsupported_country: {
    de: "Dieses Land können wir nicht zuordnen. Bitte wählen Sie es erneut aus der Liste.",
    en: "We could not recognise this country. Please pick it again from the list.",
  },
  invalid_phone: {
    de: "Bitte geben Sie eine gültige Telefonnummer an.",
    en: "Please enter a valid phone number.",
  },
  invalid_payment_method: {
    de: "Bitte wählen Sie eine verfügbare Zahlungsart.",
    en: "Please choose an available payment method.",
  },
  invalid_shipping_method: {
    de: "Bitte wählen Sie eine verfügbare Versandart.",
    en: "Please choose an available shipping method.",
  },
  terms_required: { de: "Bitte akzeptieren Sie die AGB.", en: "Please accept the terms." },
  withdrawal_required: {
    de: "Bitte bestätigen Sie die Widerrufsbelehrung.",
    en: "Please confirm the withdrawal policy.",
  },
  product_unavailable: {
    de: "Ein Artikel aus Ihrem Warenkorb ist nicht mehr verfügbar.",
    en: "An item in your cart is no longer available.",
  },
  insufficient_stock: {
    de: "Der gewünschte Bestand ist nicht mehr verfügbar.",
    en: "The requested quantity is no longer in stock.",
  },
  order_failed: {
    de: "Die Bestellung konnte nicht abgeschlossen werden.",
    en: "The order could not be completed.",
  },
};

function errorResponse(code: CheckoutErrorCode, status: number, detail?: unknown) {
  const message = MESSAGES[code];
  return NextResponse.json(
    {
      code,
      // « error » reste rempli pour les appels bruts (curl, intégrations)
      error: `${message.de} / ${message.en}`,
      messages: message,
      ...(detail ? { detail } : {}),
    },
    { status },
  );
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const { input, errors } = parseCheckoutPayload(payload);

  // Ce chemin valide lui aussi un code de réduction : sans limitation, il
  // suffirait de commander pour deviner un code, une commande à la fois. La
  // cadence est comptée à part de la vérification, pour qu'un client ayant
  // épuisé ses essais puisse encore acheter.
  if (input?.couponCode) {
    const cadence = checkCouponRate(
      identifiantAppelant(request.headers),
      "commande",
      // Une identité manquante ne doit pas bloquer une vente : le coupon est
      // de toute façon validé en base, et un essai de plus coûte moins cher
      // qu'une commande perdue.
      "laisser-passer",
    );
    if (!cadence.allowed) {
      return NextResponse.json(
        { code: "invalid_payload", error: "Zu viele Versuche. / Too many attempts." },
        { status: 429, headers: { "Retry-After": String(cadence.retryAfterSeconds) } },
      );
    }
  }

  if (!input) {
    return errorResponse(errors[0] ?? "invalid_payload", 400);
  }

  // Rattachement au compte : lu dans le cookie signé, jamais dans la charge
  // utile. Un visiteur sans compte, ou dont la session a expiré, passe commande
  // comme avant.
  const customer = await getCurrentCustomer();

  // Rattachement à la campagne qui a amené le visiteur, lu dans son cookie et
  // revalidé en base. C'est le seul endroit où l'attribution se décide : le
  // navigateur n'envoie qu'un jeton, jamais un montant ni un droit.
  const campaign = await resolveCampaignContext();

  try {
    const order = await createOrder(
      input,
      customer?.id,
      campaign ? { campaignId: campaign.campaignId, recipientId: campaign.recipientId } : undefined,
    );

    // Confirmation au client, notification au vendeur.
    //
    // Différé avec `after` : la commande est déjà écrite et le stock déjà
    // décompté, le client n'a aucune raison de patienter le temps d'une poignée
    // de main SMTP. Next exécute le rappel une fois la réponse envoyée, et le
    // fait même si la requête s'est mal terminée.
    //
    // `sendOrderEmails` ne lève jamais : une boîte injoignable laisse une trace
    // dans les journaux et dans l'historique de la commande, jamais une erreur
    // 500 sur une commande valable.
    after(() => sendOrderEmails(order));

    // Les stocks affichés dans la boutique ont changé.
    invaliderCatalogue();

    // Paiement en ligne, si le moyen retenu est encaissé par un prestataire.
    // Après l'écriture de la commande et jamais avant : une session de paiement
    // ouverte sur une commande qui échouerait ensuite laisserait un règlement
    // sans contrepartie.
    const redirectUrl = await startOnlinePayment(order);

    return NextResponse.json(
      {
        orderNumber: order.orderNumber,
        accessToken: order.accessToken,
        // Chemin à suivre après la commande ; le jeton évite qu'un numéro
        // deviné donne accès à l'adresse du client.
        confirmationPath: `/bestellung/${order.orderNumber}?token=${order.accessToken}`,
        // Présente seulement quand un prestataire prend la main : le client est
        // alors envoyé chez lui plutôt que sur la page de confirmation.
        redirectUrl,
        status: order.status,
        paymentStatus: order.paymentStatus,
        totalCents: order.totalCents,
        currency: order.currency,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof OrderError) {
      const status = error.code === "order_failed" ? 500 : 409;
      return errorResponse(error.code, status, error.detail);
    }
    // Panne inattendue : la trace reste côté serveur, le client ne reçoit
    // qu'un message générique.
    console.error("[checkout] Bestellung fehlgeschlagen:", error);
    return errorResponse("order_failed", 500);
  }
}

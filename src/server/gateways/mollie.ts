/**
 * Adaptateur Mollie.
 *
 * Encaissement par la page de paiement hébergée par Mollie (Checkout) :
 * aucune donnée de carte ne transite par ce serveur, comme pour Stripe.
 *
 * Un seul secret, saisi en administration et stocké chiffré :
 *   - mollie_api_key (test_… / live_…)
 *
 * PAS DE SECRET DE WEBHOOK — et c'est voulu, pas un oubli. Contrairement à
 * Stripe, Mollie n'envoie jamais l'état du paiement ni de signature dans la
 * notification : l'appel entrant ne porte qu'un identifiant
 * (`id=tr_xxxxxxxx`, en `application/x-www-form-urlencoded`). C'est ce
 * qu'affirme leur propre documentation : un appel forgé vers l'URL de webhook
 * ne peut jamais faire passer une commande en payée, puisque rien n'y décrit
 * un état à croire sur parole. La confiance vient d'ailleurs : on relit le
 * paiement via l'API, authentifié par notre clé secrète, et c'est cette
 * réponse-là — jamais le corps de la requête entrante — qui fait foi.
 */

import { createMollieClient, Locale, PaymentMethod, PaymentStatus, type Payment } from "@mollie/api-client";
import type { PaymentStatus as ShopPaymentStatus } from "@/lib/orderStatus";
import { getIntegrationSecret } from "@/server/integrations";
import { gatewayWebhookUrl } from "./webhookUrl";
import type {
  GatewayCheckoutSession,
  GatewayConnectionCheck,
  GatewayOrderContext,
  GatewayWebhookResult,
  PaymentGateway,
} from "./types";

const API_KEY = "mollie_api_key";

const LOCALES: Record<"de" | "en", Locale> = { de: Locale.de_DE, en: Locale.en_US };

/**
 * Clé du moyen de paiement de la boutique -> méthode Mollie correspondante.
 *
 * Un moyen non listé ici (ex. Überweisung, SEPA-Lastschrift, s'ils étaient un
 * jour routés vers Mollie) laisse `method` absent plutôt que d'échouer :
 * Mollie affiche alors son propre écran de choix, un repli plus sûr qu'une
 * commande bloquée.
 */
const SHOP_METHOD_TO_MOLLIE: Partial<Record<string, PaymentMethod>> = {
  kreditkarte: PaymentMethod.creditcard,
  paypal: PaymentMethod.paypal,
};

async function client() {
  const key = await getIntegrationSecret(API_KEY);
  if (!key) return null;
  return createMollieClient({ apiKey: key });
}

/** Centimes -> chaîne décimale à deux décimales, seul format que Mollie accepte. */
function toDecimal(cents: number): string {
  return (cents / 100).toFixed(2);
}

/** Chaîne décimale -> centimes, arrondis pour éviter les résidus de virgule flottante. */
function toCents(value: string): number {
  return Math.round(Number.parseFloat(value) * 100);
}

/** Le numéro de commande voyage dans les métadonnées, posées à la création. */
function orderNumberOf(payment: Payment): string | null {
  const metadata = payment.metadata;
  if (metadata && typeof metadata === "object" && "orderNumber" in metadata) {
    const value = (metadata as Record<string, unknown>).orderNumber;
    return typeof value === "string" ? value : null;
  }
  return null;
}

/**
 * Traduit le statut Mollie vers celui de la boutique.
 *
 * `open`, `pending` et `authorized` ne sont pas des états finaux : on rend
 * `null` pour que la route de webhook accuse réception sans rien changer, en
 * attendant la notification suivante.
 */
function shopStatusOf(status: PaymentStatus): ShopPaymentStatus | null {
  switch (status) {
    case PaymentStatus.paid:
      return "bezahlt";
    case PaymentStatus.canceled:
    case PaymentStatus.expired:
    case PaymentStatus.failed:
      return "fehlgeschlagen";
    default:
      return null;
  }
}

export const mollieGateway: PaymentGateway = {
  meta: {
    id: "mollie",
    label: "Mollie",
    availability: "CB, iDEAL, Bancontact et plus. Bon support Europe, y compris France.",
    implemented: true,
    keys: [
      {
        integrationKey: API_KEY,
        label: "Clé API",
        hint: "test_… (essais) ou live_… (production). Tableau de bord Mollie → Développeurs → Clés API.",
      },
    ],
  },

  async isConfigured(): Promise<boolean> {
    return Boolean(await getIntegrationSecret(API_KEY));
  },

  async createCheckoutSession(order: GatewayOrderContext): Promise<GatewayCheckoutSession> {
    const mollie = await client();
    if (!mollie) throw new Error("Mollie n'est pas configuré (clé API absente).");

    const payment = await mollie.payments.create({
      amount: { currency: order.currency.toUpperCase(), value: toDecimal(order.amountCents) },
      description: order.description,
      redirectUrl: order.successUrl,
      cancelUrl: order.cancelUrl,
      webhookUrl: gatewayWebhookUrl("mollie"),
      locale: LOCALES[order.locale],
      metadata: { orderNumber: order.orderNumber },
      // Le moyen déjà choisi dans la boutique ouvre directement le bon écran
      // chez Mollie ; un moyen non couplé y laisse le client choisir.
      method: SHOP_METHOD_TO_MOLLIE[order.methodKey],
    });

    const redirectUrl = payment.getCheckoutUrl();
    if (!redirectUrl) throw new Error("Mollie n'a pas renvoyé d'URL de paiement.");
    return { redirectUrl, reference: payment.id };
  },

  async handleWebhook(request: Request): Promise<GatewayWebhookResult> {
    const mollie = await client();
    if (!mollie) throw new Error("Mollie n'est pas configuré.");

    // Corps en application/x-www-form-urlencoded, un seul champ : `id`.
    const form = await request.formData();
    const id = form.get("id");
    if (typeof id !== "string" || !id) throw new Error("Identifiant de paiement Mollie absent.");

    // C'est cet appel, authentifié par notre clé secrète, qui fait foi — pas
    // le corps de la requête entrante (voir le commentaire d'en-tête).
    const payment = await mollie.payments.get(id);

    return {
      orderNumber: orderNumberOf(payment),
      paymentStatus: shopStatusOf(payment.status),
      reference: payment.id,
      amountCents: toCents(payment.amount.value),
      currency: payment.amount.currency,
    };
  },

  async verifyConnection(): Promise<GatewayConnectionCheck> {
    const issues: string[] = [];
    const details: { label: string; value: string }[] = [];
    const webhookUrl = gatewayWebhookUrl("mollie");
    details.push({
      label: "URL de webhook",
      value: `${webhookUrl} — transmise à chaque paiement créé, rien à déclarer chez Mollie`,
    });

    const key = await getIntegrationSecret(API_KEY);
    if (!key) {
      return {
        ok: false,
        summary: "Clé API Mollie absente.",
        issues: ["Enregistrez la clé API (test_… ou live_…), puis relancez le test."],
        details,
      };
    }

    const mode = key.startsWith("live_") ? "production" : key.startsWith("test_") ? "test" : "inconnu";
    details.push({ label: "Mode de la clé", value: mode });

    const mollie = createMollieClient({ apiKey: key });

    // `organizations.getCurrent()` semblait l'appel naturel — calqué sur
    // `stripe.accounts.retrieve()` — mais Mollie le réserve au mode live et le
    // refuse pour toute clé test, valide ou non : une vraie clé test l'aurait
    // toujours fait échouer. `profiles.getCurrent()` lit le même genre
    // d'information (nom, statut du compte) et fonctionne dans les deux modes.
    //
    // `ReturnType` sur une méthode surchargée retomberait sur la signature à
    // callback (celle qui rend `void`) : la variable reste donc non annotée,
    // inférée depuis cet appel sans argument, qui seul rend une promesse.
    const account = await (async () => {
      try {
        return { ok: true as const, profile: await mollie.profiles.getCurrent() };
      } catch (error) {
        return { ok: false as const, error };
      }
    })();

    if (!account.ok) {
      return {
        ok: false,
        summary: "Mollie a refusé la clé API.",
        issues: [account.error instanceof Error ? account.error.message : "Appel à Mollie impossible."],
        details,
      };
    }

    const profile = account.profile;
    details.push({ label: "Compte", value: `${profile.name} (${profile.id})` });
    details.push({ label: "Statut du profil", value: profile.status });

    if (profile.status !== "verified") {
      issues.push(
        `Le profil Mollie n'est pas encore vérifié (statut : ${profile.status}) — l'encaissement en mode live restera bloqué tant que Mollie n'a pas validé le compte.`,
      );
    }

    if (!process.env.NEXT_PUBLIC_SITE_URL) {
      issues.push(
        "NEXT_PUBLIC_SITE_URL n'est pas défini : l'URL de webhook ci-dessus est incomplète.",
      );
    }

    return {
      ok: issues.length === 0,
      summary:
        issues.length === 0
          ? `Connecté à « ${profile.name} » en mode ${mode}.`
          : `Clé valide pour « ${profile.name} », mais la configuration est incomplète.`,
      issues,
      details,
    };
  },
};

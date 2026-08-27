/**
 * Contrôle de la charge utile publique du tunnel de commande.
 *
 * Séparé de src/server/orders.ts, qui ouvre Prisma au chargement, pour la même
 * raison que legalPageInput.ts l'est de legalPages.ts : cette validation ne
 * touche pas la base, elle doit donc être testable — et réutilisable — sans
 * qu'une connexion PostgreSQL soit disponible.
 *
 * Rien ici ne fait confiance au navigateur : seuls les identifiants de produit,
 * les quantités et les coordonnées sont retenus. Les prix, les frais de port et
 * les totaux sont recalculés côté base par `createOrder`.
 */

import { DEFAULT_SHIPPING_METHOD_KEY, isShippingMethodKey, MAX_CART_LINES, MAX_QUANTITY_PER_LINE } from "@/lib/cart";
import { COUNTRY_CODES, isValidPostalCode } from "@/lib/countries";
import { TRAFFIC_CHANNEL_LABELS } from "@/lib/traffic";
import type { ShippingMethodKey } from "@/lib/cart";
import type { TrafficChannel } from "@/lib/traffic";

export interface OrderAddress {
  salutation: string;
  firstName: string;
  lastName: string;
  company: string;
  street: string;
  postalCode: string;
  city: string;
  country: string;
}

/** Codes d'erreur : la couche HTTP les traduit dans la langue du client. */
export type CheckoutErrorCode =
  | "invalid_payload"
  | "cart_empty"
  | "cart_too_large"
  | "invalid_quantity"
  | "invalid_email"
  | "invalid_name"
  | "invalid_street"
  | "invalid_postal_code"
  | "invalid_city"
  | "unsupported_country"
  | "invalid_phone"
  | "invalid_payment_method"
  | "invalid_shipping_method"
  | "terms_required"
  | "withdrawal_required"
  | "product_unavailable"
  | "insufficient_stock"
  | "order_failed";

export interface CheckoutInput {
  locale: string;
  email: string;
  phone: string;
  billing: OrderAddress;
  shippingSameAsBilling: boolean;
  shipping: OrderAddress;
  paymentMethodKey: string;
  shippingMethodKey: ShippingMethodKey;
  customerNote: string;
  /**
   * Code de réduction saisi par le client, brut.
   *
   * Transmis tel quel : sa validité, son montant et ses limites sont décidés
   * côté serveur au moment de créer la commande. Le navigateur n'annonce
   * jamais de remise, seulement un code.
   */
  couponCode: string;
  termsAccepted: boolean;
  withdrawalAcknowledged: boolean;
  items: { productId: string; quantity: number }[];
  /**
   * Origine du visiteur au premier contact, relue par le navigateur depuis
   * son propre stockage (voir TrafficAttributionTracker) et transmise telle
   * quelle. Purement informatif — aucun montant ni droit n'en dépend, donc
   * rien à revalider en base au-delà de la forme : une valeur absente ou
   * mal formée est simplement ignorée, jamais un motif de refus de commande.
   */
  trafficChannel: TrafficChannel | "";
  trafficSource: string;
}

/**
 * Pays de livraison acceptés : la liste complète proposée par le sélecteur
 * d'adresse. Restreindre ici à l'Allemagne pendant que le formulaire offrait
 * deux cent cinquante pays donnait un tunnel qui refusait sa propre saisie —
 * le client remplissait tout, puis se voyait opposer un refus à l'envoi.
 *
 * Même liste que l'espace client (`src/server/customers.ts`) : une adresse
 * enregistrable dans le compte doit être commandable.
 */
export const SUPPORTED_COUNTRIES = COUNTRY_CODES;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function readAddress(value: unknown): OrderAddress {
  const raw = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  return {
    salutation: text(raw.salutation, 20),
    firstName: text(raw.firstName, 80),
    lastName: text(raw.lastName, 80),
    company: text(raw.company, 120),
    street: text(raw.street, 160),
    postalCode: text(raw.postalCode, 12).toUpperCase(),
    city: text(raw.city, 80),
    country: (text(raw.country, 2) || "DE").toUpperCase(),
  };
}

function validateAddress(address: OrderAddress): CheckoutErrorCode | undefined {
  if (address.firstName.length < 2 || address.lastName.length < 2) return "invalid_name";
  if (address.street.length < 4) return "invalid_street";
  if (!(SUPPORTED_COUNTRIES as readonly string[]).includes(address.country)) {
    return "unsupported_country";
  }
  // Le format du code postal est vérifié selon le pays quand il est connu ;
  // ailleurs, seul le champ vide est refusé. Mieux vaut accepter une adresse
  // dont on ignore la règle postale que perdre la commande.
  if (!isValidPostalCode(address.country, address.postalCode)) return "invalid_postal_code";
  if (address.city.length < 2) return "invalid_city";
  return undefined;
}

/**
 * Analyse la charge utile publique du tunnel de commande.
 * Ne touche pas à la base : uniquement forme et cohérence des champs.
 */
export function parseCheckoutPayload(payload: unknown): {
  input?: CheckoutInput;
  errors: CheckoutErrorCode[];
} {
  if (!payload || typeof payload !== "object") return { errors: ["invalid_payload"] };
  const raw = payload as Record<string, unknown>;
  const errors: CheckoutErrorCode[] = [];

  const email = text(raw.email, 160).toLowerCase();
  if (!EMAIL_PATTERN.test(email)) errors.push("invalid_email");

  // Le téléphone est exigé : le transporteur en a besoin pour les livraisons
  // de gros électroménager, qui se prennent sur rendez-vous.
  const phone = text(raw.phone, 40);
  if (!phone || !/^[+0-9\s()/.-]{6,40}$/.test(phone)) errors.push("invalid_phone");

  const billing = readAddress(raw.billing);
  const billingError = validateAddress(billing);
  if (billingError) errors.push(billingError);

  const shippingSameAsBilling = raw.shippingSameAsBilling !== false;
  const shipping = shippingSameAsBilling ? { ...billing } : readAddress(raw.shipping);
  if (!shippingSameAsBilling) {
    const shippingError = validateAddress(shipping);
    if (shippingError) errors.push(shippingError);
  }

  const paymentMethodKey = text(raw.paymentMethodKey, 60);
  if (!paymentMethodKey) errors.push("invalid_payment_method");

  // Mode de livraison : seules les deux clés connues sont acceptées. Une valeur
  // fantaisiste est refusée plutôt que ramenée au standard en silence — livrer
  // en standard un client qui a demandé et cru payer l'express modifierait sa
  // commande. L'absence de champ, elle, reste tolérée : c'est le standard.
  const shippingMethodRaw = text(raw.shippingMethodKey, 20);
  if (shippingMethodRaw && !isShippingMethodKey(shippingMethodRaw)) {
    errors.push("invalid_shipping_method");
  }

  // Button-Lösung (§ 312j BGB) : le client doit avoir accepté les CGV et pris
  // connaissance du droit de rétractation avant que le bouton ne l'engage.
  if (raw.termsAccepted !== true) errors.push("terms_required");
  if (raw.withdrawalAcknowledged !== true) errors.push("withdrawal_required");

  const rawItems = Array.isArray(raw.items) ? raw.items : [];
  const seen = new Set<string>();
  const items: { productId: string; quantity: number }[] = [];
  let badQuantity = false;
  for (const entry of rawItems) {
    if (!entry || typeof entry !== "object") continue;
    const line = entry as Record<string, unknown>;
    const productId = text(line.productId, 60);
    const quantity = typeof line.quantity === "number" ? Math.floor(line.quantity) : 0;
    if (!productId || seen.has(productId)) continue;
    // Une quantité hors bornes est signalée, jamais corrigée en silence :
    // livrer 20 pièces là où le client en a demandé 50 modifierait sa commande.
    if (quantity < 1 || quantity > MAX_QUANTITY_PER_LINE) {
      badQuantity = true;
      continue;
    }
    seen.add(productId);
    items.push({ productId, quantity });
  }
  if (badQuantity) errors.push("invalid_quantity");
  else if (items.length === 0) errors.push("cart_empty");
  if (items.length > MAX_CART_LINES) errors.push("cart_too_large");

  if (errors.length > 0) return { errors };

  const trafficChannelRaw = text(raw.trafficChannel, 20);
  const trafficChannel: TrafficChannel | "" =
    trafficChannelRaw in TRAFFIC_CHANNEL_LABELS ? (trafficChannelRaw as TrafficChannel) : "";

  return {
    input: {
      locale: text(raw.locale, 5) === "en" ? "en" : "de",
      email,
      phone,
      billing,
      shippingSameAsBilling,
      shipping,
      paymentMethodKey,
      shippingMethodKey: isShippingMethodKey(shippingMethodRaw)
        ? shippingMethodRaw
        : DEFAULT_SHIPPING_METHOD_KEY,
      customerNote: text(raw.customerNote, 1000),
      couponCode: text(raw.couponCode, 40).toUpperCase(),
      termsAccepted: true,
      withdrawalAcknowledged: true,
      items,
      trafficChannel,
      // Sans canal reconnu, la source brute n'a aucun sens à archiver seule.
      trafficSource: trafficChannel ? text(raw.trafficSource, 80) : "",
    },
    errors: [],
  };
}


import { randomUUID } from "node:crypto";
import { prisma } from "@/server/prisma";
import {
  checkCoupon,
  recordCouponRedemption,
  releaseCouponUse,
  reserveCouponUse,
} from "@/server/coupons";
import { adjustStock } from "@/server/stock";
import { listEnabledPaymentMethods } from "@/server/payments";
import { stopRecoveryForEmail } from "@/server/checkoutRecovery";
import { campaignGrantsFreeShipping, priceForOrder } from "@/server/promotions";
import {
  computeTotals,
  DEFAULT_SHIPPING_METHOD_KEY,
  isShippingMethodKey,
  MAX_CART_LINES,
  MAX_QUANTITY_PER_LINE,
  shippingMethodFor,
  VAT_RATE_PERCENT,
} from "@/lib/cart";
import type { CartLine, ShippingMethodKey } from "@/lib/cart";
import { isOrderStatus, isPaymentStatus } from "@/lib/orderStatus";
import type { OrderStatus, PaymentStatus } from "@/lib/orderStatus";

// Commandes de la boutique.
//
// Deux principes non négociables :
//  1. Le serveur ne fait jamais confiance au panier envoyé par le navigateur.
//     Seuls les identifiants de produit et les quantités sont repris ; les prix,
//     les libellés et la disponibilité sont relus en base.
//  2. Les montants sont archivés en centimes et TTC. « taxCents » est la TVA
//     contenue dans le total (Preisangabenverordnung § 3), pas un supplément.

// ---- Statuts ----
// Définis dans @/lib/orderStatus pour rester importables depuis un composant
// client sans embarquer Prisma ; réexportés ici par commodité.

export {
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  ORDER_STATUS_BADGES,
  PAYMENT_STATUS_BADGES,
  isOrderStatus,
  isPaymentStatus,
} from "@/lib/orderStatus";
export type { OrderStatus, PaymentStatus } from "@/lib/orderStatus";

// Contrôle de la charge utile du tunnel : défini dans un module sans Prisma
// (@/server/checkoutInput) pour rester testable sans base, et réexporté ici pour
// que les appelants n'aient qu'un seul point d'entrée « commandes ».
export { parseCheckoutPayload, SUPPORTED_COUNTRIES } from "@/server/checkoutInput";
export type { CheckoutErrorCode, CheckoutInput, OrderAddress } from "@/server/checkoutInput";
// Une réexportation ne met pas les noms dans la portée locale : ce module en a
// besoin pour ses propres signatures.
import type { CheckoutErrorCode, CheckoutInput, OrderAddress } from "@/server/checkoutInput";

// ---- Types publics ----

export interface OrderItemRecord {
  id: string;
  productId?: string;
  brand: string;
  name: string;
  sku: string;
  slug: string;
  image: string;
  path: string;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
}

export interface OrderEventRecord {
  id: string;
  kind: string;
  fromValue: string;
  toValue: string;
  note: string;
  createdAt: string;
  createdBy?: string;
}

export interface OrderRecord {
  id: string;
  orderNumber: string;
  accessToken: string;
  locale: string;
  email: string;
  phone: string;
  billing: OrderAddress;
  shippingSameAsBilling: boolean;
  shipping: OrderAddress;
  paymentMethodKey: string;
  paymentMethodLabel: string;
  paymentMethodFee: string;
  shippingMethodKey: ShippingMethodKey;
  shippingMethodLabel: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotalCents: number;
  shippingCents: number;
  /** Code appliqué, tel qu'accepté. Vide sans coupon. */
  couponCode: string;
  /** Remise accordée, archivée avec la commande. */
  discountCents: number;
  taxCents: number;
  totalCents: number;
  taxRatePercent: number;
  currency: string;
  customerNote: string;
  adminNote: string;
  termsAcceptedAt?: string;
  withdrawalAcknowledgedAt?: string;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  shippedAt?: string;
  /** Origine du visiteur au premier contact ; vide si non mesurée (voir schema.prisma). */
  trafficChannel: string;
  trafficSource: string;
  items: OrderItemRecord[];
  events: OrderEventRecord[];
}

export class OrderError extends Error {
  readonly code: CheckoutErrorCode;
  /** Produit concerné, quand l'erreur porte sur une ligne précise. */
  readonly detail?: { name: string; available: number };

  constructor(code: CheckoutErrorCode, detail?: { name: string; available: number }) {
    super(code);
    this.name = "OrderError";
    this.code = code;
    this.detail = detail;
  }
}

// ---- Lecture / conversion ----

const orderInclude = {
  items: { orderBy: { name: "asc" } },
  events: { orderBy: { createdAt: "desc" } },
} as const;

type OrderRow = Awaited<ReturnType<typeof prisma.order.findFirst<{ include: typeof orderInclude }>>>;

function toRecord(row: NonNullable<OrderRow>): OrderRecord {
  return {
    id: row.id,
    orderNumber: row.orderNumber,
    accessToken: row.accessToken,
    locale: row.locale,
    email: row.email,
    phone: row.phone,
    billing: {
      salutation: row.billingSalutation,
      firstName: row.billingFirstName,
      lastName: row.billingLastName,
      company: row.billingCompany,
      street: row.billingStreet,
      postalCode: row.billingPostalCode,
      city: row.billingCity,
      country: row.billingCountry,
    },
    shippingSameAsBilling: row.shippingSameAsBilling,
    shipping: {
      salutation: row.shippingSalutation,
      firstName: row.shippingFirstName,
      lastName: row.shippingLastName,
      company: row.shippingCompany,
      street: row.shippingStreet,
      postalCode: row.shippingPostalCode,
      city: row.shippingCity,
      country: row.shippingCountry,
    },
    paymentMethodKey: row.paymentMethodKey,
    paymentMethodLabel: row.paymentMethodLabel,
    paymentMethodFee: row.paymentMethodFee,
    // Une clé inconnue en base — mode retiré du catalogue plus tard — retombe
    // sur le standard plutôt que de casser l'affichage de la commande.
    shippingMethodKey: isShippingMethodKey(row.shippingMethodKey)
      ? row.shippingMethodKey
      : DEFAULT_SHIPPING_METHOD_KEY,
    shippingMethodLabel: row.shippingMethodLabel,
    status: isOrderStatus(row.status) ? row.status : "eingegangen",
    paymentStatus: isPaymentStatus(row.paymentStatus) ? row.paymentStatus : "offen",
    subtotalCents: row.subtotalCents,
    shippingCents: row.shippingCents,
    couponCode: row.couponCode,
    discountCents: row.discountCents,
    taxCents: row.taxCents,
    totalCents: row.totalCents,
    taxRatePercent: row.taxRatePercent,
    currency: row.currency,
    customerNote: row.customerNote,
    adminNote: row.adminNote,
    termsAcceptedAt: row.termsAcceptedAt?.toISOString(),
    withdrawalAcknowledgedAt: row.withdrawalAcknowledgedAt?.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    paidAt: row.paidAt?.toISOString(),
    shippedAt: row.shippedAt?.toISOString(),
    trafficChannel: row.trafficChannel,
    trafficSource: row.trafficSource,
    items: row.items.map((item) => ({
      id: item.id,
      productId: item.productId ?? undefined,
      brand: item.brand,
      name: item.name,
      sku: item.sku,
      slug: item.slug,
      image: item.image,
      path: item.path,
      unitPriceCents: item.unitPriceCents,
      quantity: item.quantity,
      lineTotalCents: item.lineTotalCents,
    })),
    events: row.events.map((event) => ({
      id: event.id,
      kind: event.kind,
      fromValue: event.fromValue,
      toValue: event.toValue,
      note: event.note,
      createdAt: event.createdAt.toISOString(),
      createdBy: event.createdBy ?? undefined,
    })),
  };
}

export async function getOrder(id: string): Promise<OrderRecord | undefined> {
  const row = await prisma.order.findUnique({ where: { id }, include: orderInclude });
  return row ? toRecord(row) : undefined;
}

/**
 * Consultation par numéro de commande. Le jeton est exigé côté boutique :
 * le numéro est séquentiel, donc devinable, et la commande contient l'adresse
 * complète du client.
 */
export async function getOrderByNumber(
  orderNumber: string,
  accessToken?: string,
): Promise<OrderRecord | undefined> {
  const row = await prisma.order.findUnique({
    where: { orderNumber: orderNumber.trim().toUpperCase() },
    include: orderInclude,
  });
  if (!row) return undefined;
  if (accessToken !== undefined && row.accessToken !== accessToken) return undefined;
  return toRecord(row);
}

export interface OrderListFilter {
  page?: number;
  perPage?: number;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  /** Recherche sur le numéro, l'e-mail ou le nom du client. */
  query?: string;
}

export interface OrderListResult {
  orders: OrderRecord[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
}

export async function listOrders(filter: OrderListFilter = {}): Promise<OrderListResult> {
  const perPage = Math.min(Math.max(filter.perPage ?? 25, 1), 100);
  const query = filter.query?.trim() ?? "";

  const where = {
    ...(filter.status ? { status: filter.status } : {}),
    ...(filter.paymentStatus ? { paymentStatus: filter.paymentStatus } : {}),
    ...(query
      ? {
          OR: [
            { orderNumber: { contains: query } },
            { email: { contains: query } },
            { billingLastName: { contains: query } },
            { billingFirstName: { contains: query } },
          ],
        }
      : {}),
  };

  const total = await prisma.order.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const page = Math.min(Math.max(filter.page ?? 1, 1), pageCount);

  const rows = await prisma.order.findMany({
    where,
    include: orderInclude,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * perPage,
    take: perPage,
  });

  return { orders: rows.map(toRecord), total, page, perPage, pageCount };
}

export async function countOrdersByStatus(): Promise<Record<OrderStatus | "total", number>> {
  const grouped = await prisma.order.groupBy({ by: ["status"], _count: { _all: true } });
  const counts: Record<OrderStatus | "total", number> = {
    eingegangen: 0,
    in_bearbeitung: 0,
    versandt: 0,
    zugestellt: 0,
    storniert: 0,
    total: 0,
  };
  for (const entry of grouped) {
    counts.total += entry._count._all;
    if (isOrderStatus(entry.status)) counts[entry.status] = entry._count._all;
  }
  return counts;
}

/** Commandes qui demandent encore une action : ni livrées ni annulées. */
export async function countOpenOrders(): Promise<number> {
  return prisma.order.count({ where: { status: { in: ["eingegangen", "in_bearbeitung"] } } });
}

// ---- Numéro de commande ----

/**
 * Numéro lisible « PFF-AAAA-NNNNNN », séquentiel par année civile.
 * L'unicité réelle est garantie par la contrainte en base ; la boucle d'appel
 * réessaie en cas de collision entre deux commandes simultanées.
 */
/** Préfixe en vigueur. Les commandes déjà passées gardent le leur. */
const ORDER_PREFIX = "PFF";

/**
 * Préfixes utilisés avant celui d'aujourd'hui. Le compteur les relit pour
 * repartir du dernier numéro réellement attribué : sans eux, un changement de
 * préfixe ferait recommencer la numérotation à zéro le jour du déploiement, et
 * la commande suivante porterait un rang inférieur à celui de la veille.
 */
const LEGACY_ORDER_PREFIXES = ["HP"] as const;
/**
 * Rang de départ de la numérotation des commandes.
 *
 * Un numéro qui commence à 1 apprend au premier client qu'il est le premier, et
 * à tous les suivants combien peu l'ont précédé — sur un bon de commande, une
 * facture et chaque e-mail de suivi. La numérotation part donc d'un rang déjà
 * avancé, comme le fait n'importe quelle boutique qui ne veut pas publier son
 * volume d'affaires.
 *
 * Ce n'est pas une allégation commerciale : le numéro identifie une commande,
 * il n'affirme rien sur les ventes. Il ne se prête donc pas à la lecture qui
 * vaut aux faux avis d'être interdits.
 *
 * Ajustable par `ORDER_NUMBER_OFFSET`. Le changer ne réécrit aucune commande
 * déjà passée : le compteur ne fait que ne jamais descendre en dessous.
 */
const ORDER_NUMBER_OFFSET = Number.parseInt(process.env.ORDER_NUMBER_OFFSET ?? "16100", 10);

async function nextOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `${ORDER_PREFIX}-${year}-`;

  // Le rang le plus élevé de l'année, tous préfixes confondus : le compteur
  // suit les commandes, pas l'étiquette qu'elles portent.
  const rangs = await Promise.all(
    [ORDER_PREFIX, ...LEGACY_ORDER_PREFIXES].map(async (candidat) => {
      const debut = `${candidat}-${year}-`;
      const last = await prisma.order.findFirst({
        where: { orderNumber: { startsWith: debut } },
        orderBy: { orderNumber: "desc" },
        select: { orderNumber: true },
      });
      const rang = last ? Number.parseInt(last.orderNumber.slice(debut.length), 10) : 0;
      return Number.isFinite(rang) ? rang : 0;
    }),
  );

  const previous = Math.max(...rangs);
  const suivant = previous + 1;

  // Le plancher ne s'applique qu'aux premières commandes de l'année : une fois
  // le rang dépassé, c'est la suite naturelle qui reprend la main, sans trou.
  const plancher = Number.isFinite(ORDER_NUMBER_OFFSET) ? ORDER_NUMBER_OFFSET : 1;
  const next = Math.max(suivant, plancher);
  return `${prefix}${String(next).padStart(6, "0")}`;
}

// ---- Création ----

interface ReservedLine {
  productId: string;
  quantity: number;
}

/**
 * Rattachement d'une commande à la campagne qui l'a provoquée. Reconstitué par
 * l'appelant HTTP à partir du cookie d'attribution — jamais depuis la charge
 * utile du formulaire.
 */
export interface CampaignContext {
  campaignId: string;
  recipientId: string | null;
}

/**
 * Vérifie que la campagne et le destinataire cités par le cookie existent
 * réellement, et que le destinataire appartient bien à cette campagne.
 *
 * Sans ce contrôle, un cookie forgé ferait échouer l'écriture de la commande
 * sur la contrainte de clé étrangère : le client perdrait une commande valable
 * à cause d'une donnée purement statistique. Un rattachement introuvable est
 * donc simplement ignoré, la commande passe sans attribution.
 */
async function resolveCampaignAttribution(
  context: CampaignContext,
): Promise<CampaignContext | undefined> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: context.campaignId },
    select: { id: true },
  });
  if (!campaign) return undefined;

  if (!context.recipientId) return { campaignId: campaign.id, recipientId: null };

  const recipient = await prisma.campaignRecipient.findFirst({
    where: { id: context.recipientId, campaignId: campaign.id },
    select: { id: true },
  });

  return { campaignId: campaign.id, recipientId: recipient?.id ?? null };
}

/** Recrédite le stock déjà pris quand la commande échoue en cours de route. */
async function releaseReservations(reserved: ReservedLine[], reference: string): Promise<void> {
  for (const line of reserved) {
    try {
      await adjustStock(
        line.productId,
        line.quantity,
        "korrektur",
        `Rücknahme der Reservierung ${reference}`,
        "system",
      );
    } catch {
      // Une compensation qui échoue ne doit pas masquer l'erreur d'origine ;
      // l'écart reste visible dans l'historique des mouvements.
    }
  }
}

/**
 * Crée une commande à partir d'un panier vérifié en base.
 *
 * Déroulé : lecture des produits → recalcul complet des montants → réservation
 * du stock ligne par ligne (chaque appel à adjustStock est transactionnel et
 * journalisé) → écriture de la commande et de ses lignes en une seule opération.
 * Toute erreur après la réservation libère le stock déjà pris.
 *
 * `customerId` est un paramètre distinct de la charge utile, et non un champ de
 * `CheckoutInput` : il vient exclusivement du cookie de session côté serveur.
 * Le navigateur ne doit jamais pouvoir désigner le compte auquel une commande
 * est rattachée. Sans compte connecté, il reste vide — la commande en tant
 * qu'invité fonctionne exactement comme avant.
 *
 * `campaignContext` suit la même règle : il est reconstitué côté serveur depuis
 * le cookie d'attribution. Il ne fait qu'énoncer une prétention, que cette
 * fonction revalide entièrement — existence de la campagne, période, avantage
 * réellement accordé.
 */
export async function createOrder(
  input: CheckoutInput,
  customerId?: string,
  campaignContext?: CampaignContext,
): Promise<OrderRecord> {
  // 1. Produits réels, actifs uniquement.
  const products = await prisma.product.findMany({
    where: { id: { in: input.items.map((item) => item.productId) }, active: true },
    select: {
      id: true,
      brand: true,
      name: true,
      sku: true,
      slug: true,
      image: true,
      priceCents: true,
      stock: true,
      category: { select: { slug: true, image: true, group: { select: { slug: true } } } },
    },
  });

  const byId = new Map(products.map((product) => [product.id, product]));

  const lines: CartLine[] = [];
  for (const item of input.items) {
    const product = byId.get(item.productId);
    if (!product) throw new OrderError("product_unavailable");
    if (product.stock < item.quantity) {
      throw new OrderError("insufficient_stock", {
        name: `${product.brand} ${product.name}`,
        available: Math.max(0, product.stock),
      });
    }
    lines.push({
      productId: product.id,
      slug: product.slug,
      brand: product.brand,
      name: product.name,
      image: product.image || product.category.image,
      path: `/${product.category.group.slug}/${product.category.slug}/${product.slug}`,
      priceCents: product.priceCents,
      quantity: item.quantity,
      stock: product.stock,
    });
  }

  // 2. Prix réellement dus. Le prix catalogue relu ci-dessus repasse par le
  // moteur de promotions : un client qui trafique son localStorage n'y gagne
  // rien, et celui qui commande pendant une campagne paie bien le prix annoncé
  // sans avoir à saisir quoi que ce soit. Les appels partent ensemble, un
  // panier de quarante lignes ne doit pas coûter quarante allers-retours en
  // série.
  const priced = await Promise.all(
    lines.map((line) => priceForOrder(line.productId, line.priceCents)),
  );
  const billed: CartLine[] = lines.map((line, index) => ({
    ...line,
    priceCents: priced[index].priceCents,
  }));

  // 3. Moyen de paiement : seuls ceux réellement activés sont acceptés.
  const methods = await listEnabledPaymentMethods();
  const method = methods.find((entry) => entry.key === input.paymentMethodKey);
  if (!method) throw new OrderError("invalid_payment_method");

  // 4. Attribution marketing et avantage associé. La campagne est retenue dès
  // qu'elle existe — c'est ce qui rend le chiffre d'affaires attribué
  // exploitable —, mais la livraison offerte, elle, n'est accordée que si la
  // campagne l'accorde vraiment et court encore.
  const attribution = campaignContext
    ? await resolveCampaignAttribution(campaignContext)
    : undefined;
  const freeShipping = attribution ? await campaignGrantsFreeShipping(attribution.campaignId) : false;

  // 5. Montants recalculés à partir de la base, jamais depuis le client. Le
  // supplément express vient de la table des modes de livraison, pas de la
  // charge utile : le navigateur choisit un mode, il n'en fixe pas le prix.
  const shippingMethod = shippingMethodFor(input.shippingMethodKey);
  // 5 bis. Code de réduction.
  //
  // Vérifié ici et nulle part ailleurs : sur le sous-total réel, calculé à
  // partir des prix relus en base. Un panier annoncé plus gros par le
  // navigateur ne peut donc pas franchir le minimum d'un coupon.
  //
  // Un code refusé n'arrête pas la commande : il est simplement ignoré, et le
  // client paie le prix plein. Faire échouer une commande valable pour un code
  // périmé coûterait la vente.
  const sousTotalBrut = computeTotals(billed, {
    shippingMethodKey: shippingMethod.key,
    freeShipping,
  });
  const verdictCoupon = input.couponCode
    ? await checkCoupon(
        input.couponCode,
        {
          subtotalCents: sousTotalBrut.subtotalCents,
          shippingCents: sousTotalBrut.shippingCents,
        },
        input.email,
      )
    : null;
  // Le quota est pris ici, avant la commande. Vérifier puis décompter après
  // coup laisserait deux commandes simultanées obtenir la même dernière
  // utilisation d'un coupon limité. Si la réservation échoue, le code est
  // simplement ignoré et le client paie plein tarif.
  const couponVerifie = verdictCoupon?.ok ? verdictCoupon : null;
  const couponAccepte =
    couponVerifie && (await reserveCouponUse(couponVerifie.coupon, input.email))
      ? couponVerifie
      : null;

  const totals = computeTotals(billed, {
    shippingMethodKey: shippingMethod.key,
    freeShipping,
    discountCents: couponAccepte?.outcome.discountCents ?? 0,
    couponFreeShipping: couponAccepte?.outcome.freeShipping ?? false,
  });
  const now = new Date();

  // 6. Réservation du stock.
  const reserved: ReservedLine[] = [];
  let orderNumber = await nextOrderNumber();

  try {
    for (const line of billed) {
      const result = await adjustStock(
        line.productId,
        -line.quantity,
        "verkauf",
        `Bestellung ${orderNumber}`,
        "shop",
      );
      if (!result) throw new OrderError("product_unavailable");
      // adjustStock plafonne à 0 : si le stock était insuffisant, la réservation
      // n'est que partielle et la commande doit être refusée.
      if (result.previousStock < line.quantity) {
        reserved.push({ productId: line.productId, quantity: result.previousStock - result.stock });
        throw new OrderError("insufficient_stock", {
          name: `${line.brand} ${line.name}`,
          available: Math.max(0, result.previousStock),
        });
      }
      reserved.push({ productId: line.productId, quantity: line.quantity });
    }

    // 7. Écriture de la commande. La création imbriquée est atomique.
    const accessToken = randomUUID().replace(/-/g, "");

    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        const row = await prisma.order.create({
          data: {
            orderNumber,
            accessToken,
            customerId: customerId ?? null,
            locale: input.locale,
            email: input.email,
            phone: input.phone,
            billingSalutation: input.billing.salutation,
            billingFirstName: input.billing.firstName,
            billingLastName: input.billing.lastName,
            billingCompany: input.billing.company,
            billingStreet: input.billing.street,
            billingPostalCode: input.billing.postalCode,
            billingCity: input.billing.city,
            billingCountry: input.billing.country,
            shippingSameAsBilling: input.shippingSameAsBilling,
            shippingSalutation: input.shipping.salutation,
            shippingFirstName: input.shipping.firstName,
            shippingLastName: input.shipping.lastName,
            shippingCompany: input.shipping.company,
            shippingStreet: input.shipping.street,
            shippingPostalCode: input.shipping.postalCode,
            shippingCity: input.shipping.city,
            shippingCountry: input.shipping.country,
            paymentMethodKey: method.key,
            paymentMethodLabel: method.label,
            paymentMethodFee: method.feeLabel,
            shippingMethodKey: shippingMethod.key,
            shippingMethodLabel: shippingMethod.label,
            status: "eingegangen",
            paymentStatus: "offen",
            subtotalCents: totals.subtotalCents,
            shippingCents: totals.shippingCents,
            taxCents: totals.taxCents,
            totalCents: totals.totalCents,
            taxRatePercent: VAT_RATE_PERCENT,
            currency: "EUR",
            customerNote: input.customerNote,
            couponCode: couponAccepte?.coupon.code ?? "",
            discountCents: totals.discountCents,
            termsAcceptedAt: now,
            withdrawalAcknowledgedAt: now,
            campaignId: attribution?.campaignId ?? null,
            campaignRecipientId: attribution?.recipientId ?? null,
            // Tracé à part du port à zéro, qui peut aussi venir du franco
            // habituel : seule cette colonne dit que c'est la campagne qui a payé.
            campaignFreeShipping: freeShipping,
            trafficChannel: input.trafficChannel,
            trafficSource: input.trafficSource,
            items: {
              create: billed.map((line) => ({
                productId: line.productId,
                brand: line.brand,
                name: line.name,
                sku: byId.get(line.productId)?.sku ?? "",
                slug: line.slug,
                image: line.image,
                path: line.path,
                unitPriceCents: line.priceCents,
                quantity: line.quantity,
                lineTotalCents: line.priceCents * line.quantity,
              })),
            },
            events: {
              create: {
                kind: "status",
                toValue: "eingegangen",
                note: `Bestellung im Shop eingegangen (${method.label}, ${shippingMethod.label})`,
                createdBy: "shop",
              },
            },
          },
          include: orderInclude,
        });

        // Consommation du coupon, une fois la commande écrite et elle seule.
        //
        // Décompter avant l'écriture rendrait un coupon inutilisable dès qu'une
        // commande échoue sur un stock manquant. Après, le compteur ne bouge que
        // pour des commandes qui existent vraiment.
        //
        // L'échec est avalé volontairement : la commande est passée, le stock
        // réservé, le client débité le cas échéant. Perdre une décrémentation de
        // compteur est un incident mineur ; annuler la commande pour cette
        // raison n'aurait aucun sens.
        if (couponAccepte) {
          try {
            await recordCouponRedemption(
              couponAccepte.coupon.id,
              row.id,
              input.email,
              totals.discountCents,
            );
          } catch (erreur) {
            // Le quota est déjà pris : l'utilisation ne sera pas accordée deux
            // fois. Seul le rattachement à cette commande manque, ce qui rend la
            // limite par client inopérante pour cette adresse — un incident à
            // corriger à la main, pas une raison d'annuler une commande payée.
            console.error(
              `[commande ${row.orderNumber}] rachat du coupon ${couponAccepte.coupon.code} non enregistré :`,
              erreur,
            );
          }
        }

        // La commande est passée : la séquence de relance n'a plus lieu d'être.
        //
        // Hors transaction et sous try : un échec de mise à jour de la relance
        // ne doit jamais faire échouer une commande payante. Le répartiteur
        // revérifie de toute façon l'absence de commande avant chaque envoi, ce
        // qui rattrape le cas.
        try {
          await stopRecoveryForEmail(row.email, "converted");
        } catch (error) {
          console.error("[recovery] arrêt de la séquence impossible:", error);
        }

        return toRecord(row);
      } catch (error) {
        // Collision sur le numéro : on en reprend un et on réessaie.
        const code = (error as { code?: string }).code;
        if (code !== "P2002" || attempt === 4) throw error;
        orderNumber = await nextOrderNumber();
      }
    }

    throw new OrderError("order_failed");
  } catch (error) {
    await releaseReservations(reserved, orderNumber);
    // Le stock rendu, l'utilisation du coupon l'est aussi : une commande qui
    // n'a pas abouti ne doit pas consommer un quota. Sans cela, un coupon
    // limité s'épuiserait sur des paniers tombés en rupture.
    if (couponAccepte) {
      await releaseCouponUse(couponAccepte.coupon.id);
    }
    if (error instanceof OrderError) throw error;
    throw new OrderError("order_failed");
  }
}

// ---- Suivi ----

/**
 * Change le statut de la commande. L'annulation remet la marchandise en stock,
 * une seule fois, via un mouvement « retoure » tracé.
 */
export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  actor?: string,
  note?: string,
): Promise<OrderRecord | undefined> {
  const current = await prisma.order.findUnique({
    where: { id },
    select: { id: true, status: true, orderNumber: true, stockRestored: true },
  });
  if (!current) return undefined;
  if (current.status === status) return getOrder(id);

  let stockRestored = current.stockRestored;

  if (status === "storniert" && !current.stockRestored) {
    const items = await prisma.orderItem.findMany({
      where: { orderId: id, productId: { not: null } },
      select: { productId: true, quantity: true },
    });
    for (const item of items) {
      if (!item.productId) continue;
      try {
        await adjustStock(
          item.productId,
          item.quantity,
          "retoure",
          `Stornierung ${current.orderNumber}`,
          actor ?? "admin",
        );
      } catch {
        // Un produit supprimé entre-temps ne doit pas bloquer l'annulation.
      }
    }
    stockRestored = true;
  }

  await prisma.order.update({
    where: { id },
    data: {
      status,
      stockRestored,
      shippedAt: status === "versandt" ? new Date() : undefined,
      events: {
        create: {
          kind: "status",
          fromValue: current.status,
          toValue: status,
          note: note?.trim() ?? "",
          createdBy: actor ?? null,
        },
      },
    },
  });

  return getOrder(id);
}

export async function updatePaymentStatus(
  id: string,
  paymentStatus: PaymentStatus,
  actor?: string,
  note?: string,
): Promise<OrderRecord | undefined> {
  const current = await prisma.order.findUnique({
    where: { id },
    select: { id: true, paymentStatus: true },
  });
  if (!current) return undefined;
  if (current.paymentStatus === paymentStatus) return getOrder(id);

  await prisma.order.update({
    where: { id },
    data: {
      paymentStatus,
      paidAt: paymentStatus === "bezahlt" ? new Date() : undefined,
      events: {
        create: {
          kind: "payment",
          fromValue: current.paymentStatus,
          toValue: paymentStatus,
          note: note?.trim() ?? "",
          createdBy: actor ?? null,
        },
      },
    },
  });

  return getOrder(id);
}

/**
 * Consigne un événement sur une commande sans toucher à son état.
 *
 * Sert au webhook de paiement : quand le montant encaissé ne correspond pas au
 * total, la commande doit rester où elle est, mais l'anomalie doit se lire dans
 * le back-office. Un écart passé sous silence se solderait par une expédition.
 */
export async function recordOrderEvent(
  orderId: string,
  kind: string,
  note: string,
  actor?: string,
): Promise<void> {
  await prisma.orderEvent.create({
    data: { orderId, kind, note: note.trim(), createdBy: actor ?? null },
  });
}

/**
 * Rattache la commande à la transaction du prestataire.
 *
 * Écrit sans condition : le webhook peut arriver plusieurs fois pour la même
 * commande, et la dernière référence connue est la bonne. Aucun événement n'est
 * consigné — ce n'est pas un changement d'état, seulement un numéro de dossier.
 */
export async function setOrderGatewayReference(
  orderId: string,
  reference: string,
): Promise<void> {
  await prisma.order.update({
    where: { id: orderId },
    data: { stripePaymentIntentId: reference },
  });
}

export async function updateAdminNote(
  id: string,
  adminNote: string,
  actor?: string,
): Promise<OrderRecord | undefined> {
  const current = await prisma.order.findUnique({ where: { id }, select: { id: true } });
  if (!current) return undefined;

  await prisma.order.update({
    where: { id },
    data: {
      adminNote: adminNote.trim().slice(0, 2000),
      events: {
        create: { kind: "note", note: "Note interne mise à jour", createdBy: actor ?? null },
      },
    },
  });

  return getOrder(id);
}

/** Suppression réservée aux commandes de test du back-office. */
export async function deleteOrder(id: string): Promise<boolean> {
  const current = await prisma.order.findUnique({ where: { id }, select: { id: true } });
  if (!current) return false;
  await prisma.order.delete({ where: { id } });
  return true;
}

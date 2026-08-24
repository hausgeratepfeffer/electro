/**
 * Registre des prestataires de paiement et configuration du prestataire actif.
 *
 * Un seul prestataire encaisse à la fois. La configuration — lequel, et quels
 * moyens de paiement il prend en charge — tient dans une ligne de la table
 * générique `Setting` : pas de modèle dédié pour deux champs.
 *
 * Les clés API ne passent jamais par ici : elles vivent chiffrées dans la table
 * `Integration`, et seul l'adaptateur les relit au moment de s'en servir.
 *
 * Ajouter un prestataire tient en un fichier qui respecte le contrat de
 * `types.ts`, plus une ligne dans `GATEWAYS` et une dans `GATEWAY_IDS`. Ni le
 * tunnel de commande ni la route de webhook n'ont à le connaître.
 */

import { cache } from "react";
import { prisma } from "@/server/prisma";
import { mollieGateway } from "./mollie";
import { stripeGateway } from "./stripe";
import { GATEWAY_IDS, isGatewayId, type GatewayId, type PaymentGateway } from "./types";

export type {
  GatewayId,
  GatewayMeta,
  GatewayKeyField,
  GatewayConnectionCheck,
  PaymentGateway,
  GatewayOrderContext,
} from "./types";
export { GATEWAY_IDS, isGatewayId } from "./types";

const SETTING_KEY = "payment_gateway";

const GATEWAYS: Record<GatewayId, PaymentGateway> = {
  stripe: stripeGateway,
  mollie: mollieGateway,
};

export function getGateway(id: GatewayId): PaymentGateway {
  return GATEWAYS[id];
}

/** Tous les prestataires, dans l'ordre déclaré. */
export function allGateways(): PaymentGateway[] {
  return GATEWAY_IDS.map((id) => GATEWAYS[id]);
}

export interface GatewayConfig {
  /** Prestataire actif, ou null si le paiement en ligne est coupé. */
  provider: GatewayId | null;
  /** Clés des moyens de paiement (table PaymentMethod) encaissés en ligne. */
  methodKeys: string[];
}

const EMPTY_CONFIG: GatewayConfig = { provider: null, methodKeys: [] };

function coerce(value: unknown): GatewayConfig {
  if (!value || typeof value !== "object") return EMPTY_CONFIG;
  const raw = value as Record<string, unknown>;
  const provider = isGatewayId(raw.provider) ? raw.provider : null;
  const methodKeys = Array.isArray(raw.methodKeys)
    ? raw.methodKeys.filter((entry): entry is string => typeof entry === "string")
    : [];
  return { provider, methodKeys };
}

/** Configuration enregistrée, mémorisée pour la durée du rendu. */
export const getGatewayConfig = cache(async (): Promise<GatewayConfig> => {
  try {
    const row = await prisma.setting.findUnique({ where: { key: SETTING_KEY } });
    if (!row) return EMPTY_CONFIG;
    return coerce(JSON.parse(row.value));
  } catch {
    // Réglage illisible ou base absente : le paiement en ligne se coupe, la
    // boutique continue de prendre les commandes en virement et en facture.
    return EMPTY_CONFIG;
  }
});

export async function saveGatewayConfig(input: GatewayConfig): Promise<GatewayConfig> {
  const clean: GatewayConfig = {
    provider: input.provider && isGatewayId(input.provider) ? input.provider : null,
    methodKeys: Array.from(
      new Set(input.methodKeys.map((key) => key.trim()).filter((key) => key.length > 0)),
    ),
  };

  await prisma.setting.upsert({
    where: { key: SETTING_KEY },
    update: { value: JSON.stringify(clean) },
    create: { key: SETTING_KEY, value: JSON.stringify(clean) },
  });

  return clean;
}

/**
 * Prestataire à employer pour encaisser une commande réglée avec `methodKey`,
 * ou null si elle doit rester réglée hors ligne.
 *
 * Rend null dès qu'une condition manque — prestataire coupé, moyen de paiement
 * non rattaché, clés absentes. Une configuration incomplète fait ainsi retomber
 * la commande sur le règlement hors ligne, comme un virement, au lieu
 * d'échouer devant le client.
 */
export async function resolveGatewayForMethod(methodKey: string): Promise<PaymentGateway | null> {
  const config = await getGatewayConfig();
  if (!config.provider) return null;
  if (!config.methodKeys.includes(methodKey)) return null;
  const gateway = GATEWAYS[config.provider];
  if (!(await gateway.isConfigured())) return null;
  return gateway;
}

/**
 * S'assure que les lignes `Integration` de chaque prestataire existent, pour que
 * la saisie des clés en administration ne dépende pas d'un nouveau peuplement.
 * Idempotent.
 */
export async function ensureGatewayIntegrations(): Promise<void> {
  const fields = allGateways().flatMap((gateway) =>
    gateway.meta.keys.map((key) => ({
      key: key.integrationKey,
      label: `${gateway.meta.label} — ${key.label}`,
      description: key.hint,
    })),
  );

  await Promise.all(
    fields.map((field) =>
      prisma.integration.upsert({
        where: { key: field.key },
        update: {},
        create: {
          key: field.key,
          label: field.label,
          description: field.description,
          enabled: false,
        },
      }),
    ),
  );
}

/**
 * URL publique du point de notification d'un prestataire.
 *
 * Toutes les routes de webhook vivent sous /api/payments/webhook/<prestataire>.
 * Cette URL est à déclarer telle quelle chez le prestataire ; certains (Square)
 * la font même entrer dans le calcul de la signature, donc la moindre
 * différence — barre oblique finale, `www.` en trop — rejette toutes les
 * notifications. Les tests de connexion l'affichent pour qu'elle soit recopiée
 * plutôt que retapée.
 */

import { siteUrl } from "@/server/merchant";
import type { GatewayId } from "./types";

export function gatewayWebhookUrl(provider: GatewayId): string {
  // `siteUrl()` retombe sur "https://hausgeratepfeffer.de" si la variable
  // d'environnement manque — repli déjà en place pour le flux Merchant et le
  // schéma SEO. Cette fonction n'en avait pas : en son absence sur le serveur
  // de production, elle rendait une URL relative ("/api/payments/webhook/
  // mollie", sans domaine), que Mollie refusait purement et simplement à la
  // création de chaque session — aucune commande carte n'a jamais pu être
  // redirigée avant ce correctif, sans qu'aucune erreur ne remonte nulle
  // part avant l'ajout de la trace dans l'historique de commande.
  return `${siteUrl()}/api/payments/webhook/${provider}`;
}

/**
 * Vrai si l'URL est joignable depuis l'extérieur. Un `localhost` ou une adresse
 * privée ne recevra jamais de notification : le paiement aboutira chez le
 * prestataire sans que la commande ne passe en « payée ».
 */
export function isPubliclyReachable(url: string): boolean {
  try {
    const { protocol, hostname } = new URL(url);
    if (protocol !== "https:" && protocol !== "http:") return false;
    if (hostname === "localhost" || hostname.endsWith(".local")) return false;
    if (/^127\.|^10\.|^192\.168\.|^172\.(1[6-9]|2\d|3[01])\./.test(hostname)) return false;
    return true;
  } catch {
    return false;
  }
}

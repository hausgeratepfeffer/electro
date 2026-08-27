import { NextResponse } from "next/server";
import { captureRecovery } from "@/server/checkoutRecovery";
import { recoveryLimiter } from "@/server/recoveryRate";
import { getCurrentCustomer } from "@/server/customerSession";
import { TRAFFIC_CHANNEL_LABELS } from "@/lib/traffic";
import type { RecoveryStep } from "@/lib/checkoutRecovery";
import type { TrafficChannel } from "@/lib/traffic";

// Capture de la session de paiement.
//
// Deux appelants :
//   - le tunnel de commande, dès que l'adresse e-mail est validée à l'étape
//     « contact » — l'e-mail arrive alors dans le corps de la requête ;
//   - le panier, à chaque ajout d'article — sans e-mail dans le corps, mais
//     pour un client connecté. Son adresse ne vient jamais du navigateur dans
//     ce cas : elle est relue depuis sa session, la seule source qui fasse foi
//     pour une adresse qu'il n'a pas retapée dans ce panier.
//
// La route répond toujours 204, même quand rien n'est écrit : elle sert un
// appel « fire and forget » du navigateur, et le client n'a aucune décision à
// prendre d'après la réponse. Elle ne révèle donc pas non plus si une adresse
// est déjà connue ou désabonnée, ni si un visiteur est connecté.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const STEPS: RecoveryStep[] = ["contact", "payment", "review"];
const MAX_LINES = 40;

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "inconnu";
  if (!recoveryLimiter.check(ip)) {
    return new NextResponse(null, { status: 429 });
  }
  recoveryLimiter.register(ip);

  const payload = await request.json().catch(() => null);
  if (typeof payload !== "object" || payload === null) {
    return new NextResponse(null, { status: 204 });
  }

  const body = payload as Record<string, unknown>;
  const submitted = typeof body.email === "string" ? body.email.trim() : "";

  // L'e-mail saisi dans le tunnel fait autorité s'il est valide ; sinon, pour
  // un appel du panier, seule la session d'un compte connecté peut fournir une
  // adresse — jamais le corps de la requête, qu'un visiteur pourrait forger.
  const email = EMAIL_PATTERN.test(submitted)
    ? submitted
    : ((await getCurrentCustomer())?.email ?? "");
  if (!EMAIL_PATTERN.test(email)) {
    return new NextResponse(null, { status: 204 });
  }

  const step = STEPS.includes(body.step as RecoveryStep) ? (body.step as RecoveryStep) : "contact";
  const locale = body.locale === "en" ? "en" : "de";

  const rawLines = Array.isArray(body.lines) ? body.lines.slice(0, MAX_LINES) : [];
  const lines = rawLines
    .map((entry) => {
      if (typeof entry !== "object" || entry === null) return null;
      const line = entry as Record<string, unknown>;
      if (typeof line.productId !== "string" || typeof line.quantity !== "number") return null;
      return { productId: line.productId, quantity: line.quantity };
    })
    .filter((line): line is { productId: string; quantity: number } => line !== null);

  if (lines.length === 0) {
    return new NextResponse(null, { status: 204 });
  }

  const trafficChannelRaw = typeof body.trafficChannel === "string" ? body.trafficChannel : "";
  const trafficChannel: TrafficChannel | "" =
    trafficChannelRaw in TRAFFIC_CHANNEL_LABELS ? (trafficChannelRaw as TrafficChannel) : "";
  const trafficSource =
    trafficChannel && typeof body.trafficSource === "string" ? body.trafficSource.slice(0, 80) : "";

  try {
    await captureRecovery({ email, locale, step, lines, trafficChannel, trafficSource });
  } catch (error) {
    // Une panne de capture ne doit jamais remonter au tunnel : le client est en
    // train d'acheter, c'est la seule chose qui compte.
    console.error("[recovery] capture échouée:", error);
  }

  return new NextResponse(null, { status: 204 });
}

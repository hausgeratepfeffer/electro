"use client";

import { useEffect } from "react";
import { useConsentement } from "@/lib/consent";
import { classifyTraffic, TRAFFIC_STORAGE_KEY } from "@/lib/traffic";

/**
 * Mémorise, une seule fois par visite et seulement si le visiteur a accepté
 * le bandeau, comment il a trouvé la boutique (recherche organique, Google
 * Ads, Google Shopping, réseau social, e-mail, ou accès direct).
 *
 * Derrière le même consentement que le chat Smartsupp — voir ConsentBanner et
 * lib/consent.ts, qui documentent pourquoi : la mesure retient quelque chose
 * sur l'appareil du visiteur (localStorage), ce n'est donc pas un signal
 * anonyme comme PageViewTracker, qui lui ne pose rien.
 *
 * Premier contact, jamais réécrit tant que la fenêtre de trente jours n'est
 * pas expirée (voir readStoredTrafficAttribution) : une commande passée trois
 * semaines après une recherche Google reste attribuée à cette recherche, pas
 * à la dernière page visitée avant l'achat.
 */
export function TrafficAttributionTracker() {
  const { consentement } = useConsentement();

  useEffect(() => {
    if (consentement !== "accepte") return;
    if (typeof window === "undefined") return;

    try {
      if (window.localStorage.getItem(TRAFFIC_STORAGE_KEY)) return;
      const attribution = classifyTraffic(
        new URLSearchParams(window.location.search),
        document.referrer,
        window.location.hostname,
      );
      window.localStorage.setItem(
        TRAFFIC_STORAGE_KEY,
        JSON.stringify({ ...attribution, capturedAt: Date.now() }),
      );
    } catch {
      // Stockage indisponible (navigation privée verrouillée) : tant pis pour
      // la mesure, jamais pour la commande.
    }
    // Ne se redéclenche qu'au changement de consentement, jamais à la
    // navigation : le layout qui monte ce composant survit aux changements de
    // page côté client, et le garde-fou localStorage ci-dessus empêche de
    // toute façon une seconde écriture une fois une valeur mémorisée.
  }, [consentement]);

  return null;
}

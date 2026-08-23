"use client";

import { useEffect } from "react";
import { usePathname } from "@/i18n/navigation";

/**
 * Signale une page vue au serveur, à chaque navigation.
 *
 * Sans bandeau de consentement : la route ne reçoit qu'un chemin, l'adresse
 * IP n'est jamais conservée (voir src/server/pageViews.ts). Rien de personnel
 * n'est écrit, donc rien à faire accepter au visiteur pour ce signal-là —
 * contrairement au chat, qui pose une identification et reste derrière le
 * bandeau.
 *
 * `usePathname` de next-intl renvoie le chemin sans le préfixe de langue : les
 * versions allemande et anglaise d'une même page comptent donc ensemble, ce
 * qui est ce qu'on veut pour un « pages les plus vues ».
 */
export function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    void fetch("/api/analytics/pageview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  return null;
}

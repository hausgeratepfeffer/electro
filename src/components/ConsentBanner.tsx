"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { ouvrirReglagesConsentement, repondreConsentement, useConsentement } from "@/lib/consent";
import { CHAT_CONFIGURE } from "@/lib/smartsupp";

/**
 * Bandeau de consentement, en bas de l'écran.
 *
 * Deux finalités, chacune dite en toutes lettres, jamais fondues en un
 * générique « cookies » : le chat en direct (quand CHAT_CONFIGURE) et la
 * mesure d'origine du trafic (recherche organique, Google Ads, Google
 * Shopping, réseau social… — voir TrafficAttributionTracker), qui elle est
 * toujours proposée puisque non liée à un compte tiers configurable. Un
 * bandeau qui réclame « tous les cookies » alors que la boutique n'en pose pas
 * d'autres ne serait pas une information, seulement un réflexe — chaque
 * paragraphe du corps ne s'affiche donc que si la finalité qu'il décrit est
 * réellement active.
 *
 * DEUX BOUTONS DE MÊME POIDS. Refuser doit être aussi simple qu'accepter :
 * même hauteur, même largeur, même graisse, côte à côte. Un « Ablehnen » réduit
 * à un lien gris sous le pli est précisément ce que les tribunaux allemands
 * sanctionnent, et cela ferait perdre l'intérêt du bandeau en même temps que sa
 * validité.
 *
 * Pas de croix pour fermer sans répondre : le silence n'est pas un accord, et
 * une fermeture sans choix laisserait le visiteur croire qu'il a tranché. Le
 * bandeau attend une réponse, mais n'empêche pas de lire la page derrière lui.
 */
export function ConsentBanner() {
  const t = useTranslations("consent");
  const { consentement, banniereVisible } = useConsentement();
  const pathname = usePathname();
  const dernierChemin = useRef(pathname);

  // Un refus n'est jamais définitif : tant que le visiteur n'a pas accepté, on
  // le lui redemande à chaque nouvelle page. La comparaison au chemin
  // précédent évite de rouvrir le bandeau sur la page où il vient tout juste
  // de cliquer « Ablehnen » — seule une vraie navigation compte comme
  // « nouvelle page ».
  useEffect(() => {
    if (dernierChemin.current === pathname) return;
    dernierChemin.current = pathname;
    if (consentement === "refuse") ouvrirReglagesConsentement();
  }, [pathname, consentement]);

  // Rien avant la lecture du stockage : le bandeau ne doit pas paraître une
  // fraction de seconde chez ceux qui ont déjà répondu.
  if (!banniereVisible) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="consent-title"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background shadow-[0_-4px_24px_rgba(0,0,0,0.14)]"
    >
      <div className="mx-auto flex max-w-screen-xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:gap-6">
        <div className="text-sm">
          <p id="consent-title" className="mb-1 font-bold">
            {t("title")}
          </p>
          <p className="text-muted-foreground">
            {t("bodyIntro")} {CHAT_CONFIGURE && t("bodyChat")} {t("bodyTraffic")}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("note")}{" "}
            {/* href sans préfixe : Link ajoute lui-même la langue */}
            <Link href="/datenschutz" className="underline hover:no-underline">
              {t("privacyLink")}
            </Link>
          </p>
        </div>

        <div className="flex shrink-0 gap-3 sm:ml-auto">
          <button
            type="button"
            onClick={() => repondreConsentement("refuse")}
            className="h-11 flex-1 rounded-lg border-2 border-primary px-6 text-sm font-bold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:flex-none sm:w-40"
          >
            {t("decline")}
          </button>
          <button
            type="button"
            onClick={() => repondreConsentement("accepte")}
            className="h-11 flex-1 rounded-lg border-2 border-primary bg-primary px-6 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:flex-none sm:w-40"
          >
            {t("accept")}
          </button>
        </div>
      </div>
    </div>
  );
}

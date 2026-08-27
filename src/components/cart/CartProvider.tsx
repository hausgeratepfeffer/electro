"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import type { ReactNode } from "react";
import { useLocale } from "next-intl";
import {
  addToCart,
  clearCart,
  computeTotals,
  getCartServerSnapshot,
  getCartSnapshot,
  removeFromCart,
  setCartQuantity,
  subscribeCart,
} from "@/lib/cart";
import type { CartLine, CartTotals } from "@/lib/cart";
import { CAMPAIGN_COOKIE } from "@/lib/campaigns";
import { readStoredTrafficAttribution } from "@/lib/traffic";

/**
 * Signale un ajout au panier au serveur, pour la relance de panier abandonné.
 *
 * Sans e-mail : contrairement à l'appel du tunnel de commande, celui-ci ne
 * porte jamais d'adresse. Un visiteur anonyme reste anonyme — rien à capturer.
 * Un client connecté, lui, est déjà identifié par sa session ; c'est la route
 * qui relit son adresse côté serveur, jamais le navigateur qui la lui
 * fournirait. Volontairement sans await : un ajout au panier ne doit jamais
 * attendre une requête qui ne le concerne pas.
 */
function captureCartAddition(lines: readonly CartLine[], locale: string): void {
  const attribution = readStoredTrafficAttribution();
  void fetch("/api/checkout/recovery", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      step: "contact",
      locale,
      lines: lines.map((line) => ({ productId: line.productId, quantity: line.quantity })),
      trafficChannel: attribution?.channel ?? "",
      trafficSource: attribution?.source ?? "",
    }),
    keepalive: true,
  }).catch(() => {});
}

// Le panier vit dans localStorage, donc uniquement côté navigateur.
// useSyncExternalStore résout proprement le décalage d'hydratation : React rend
// d'abord l'instantané serveur (panier vide), puis relit le magasin réel une
// fois la page hydratée. Aucun setState dans un effet, aucun écart de balisage.

/** Avantage accordé par la campagne dont vient le visiteur, s'il y en a une. */
export interface CampaignBenefit {
  freeShipping: boolean;
  campaignName: string | null;
}

interface CartContextValue {
  lines: readonly CartLine[];
  totals: CartTotals;
  /** false tant que React n'a pas relu le magasin après hydratation. */
  ready: boolean;
  campaign: CampaignBenefit;
  add: (line: Omit<CartLine, "quantity">, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  /**
   * État du panier latéral.
   *
   * Il vit ici plutôt que dans le tiroir lui-même : c'est le bouton d'ajout qui
   * décide de l'ouvrir, et les deux composants sont à des endroits opposés de
   * l'arbre — le tiroir dans la mise en page, le bouton dans la fiche produit.
   */
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
}

const NO_BENEFIT: CampaignBenefit = { freeShipping: false, campaignName: null };

const CartContext = createContext<CartContextValue | null>(null);

/**
 * Avantage de campagne, confirmé par le serveur.
 *
 * Le cookie n'est lu ici que pour savoir s'il vaut la peine de poser la
 * question : sans lui, la grande majorité des visites n'émet aucune requête.
 * Sa présence ne décide de rien — c'est /api/campaign-context qui répond, en
 * relisant la campagne en base, et le tunnel de commande refait le contrôle.
 * Un cookie recopié d'un ami n'offre donc pas la livraison gratuite.
 */
function useCampaignBenefit(): CampaignBenefit {
  const [benefit, setBenefit] = useState<CampaignBenefit>(NO_BENEFIT);

  useEffect(() => {
    const hasCookie = document.cookie
      .split("; ")
      .some((entry) => entry.startsWith(`${CAMPAIGN_COOKIE}=`));
    if (!hasCookie) return;

    let cancelled = false;

    void (async () => {
      try {
        const response = await fetch("/api/campaign-context", { cache: "no-store" });
        if (!response.ok || cancelled) return;

        const data = (await response.json()) as {
          freeShipping?: boolean;
          campaignName?: string | null;
        };
        if (cancelled) return;

        setBenefit({
          freeShipping: Boolean(data.freeShipping),
          campaignName: data.campaignName ?? null,
        });
      } catch {
        // Hors ligne : le panier reste au tarif normal. Oublier une gratuité à
        // l'affichage se rattrape à la commande ; l'annoncer à tort ne se
        // rattrape pas.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return benefit;
}

/** Vrai une fois l'hydratation terminée : permet de neutraliser l'affichage serveur. */
function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribeCart,
    () => true,
    () => false,
  );
}

export function CartProvider({ children }: { children: ReactNode }) {
  const lines = useSyncExternalStore(subscribeCart, getCartSnapshot, getCartServerSnapshot);
  const ready = useHydrated();
  const campaign = useCampaignBenefit();
  const locale = useLocale();

  const add = useCallback(
    (line: Omit<CartLine, "quantity">, quantity = 1) => {
      addToCart(line, quantity);
      // Le magasin vient de committer : on relit l'instantané à jour plutôt
      // que de recomposer la ligne à la main, pour rester fidèle à ce que le
      // panier contient réellement (fusion de quantité sur une ligne
      // existante, plafond de quantité déjà appliqué…).
      captureCartAddition(getCartSnapshot(), locale);
    },
    [locale],
  );
  const setQuantity = useCallback(
    (productId: string, quantity: number) => setCartQuantity(productId, quantity),
    [],
  );
  const remove = useCallback((productId: string) => removeFromCart(productId), []);
  const clear = useCallback(() => clearCart(), []);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      totals: computeTotals(lines, { freeShipping: campaign.freeShipping }),
      ready,
      campaign,
      add,
      setQuantity,
      remove,
      clear,
      drawerOpen,
      openDrawer,
      closeDrawer,
    }),
    [lines, ready, campaign, add, setQuantity, remove, clear, drawerOpen, openDrawer, closeDrawer],
  );

  return <CartContext value={value}>{children}</CartContext>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart muss innerhalb von <CartProvider> verwendet werden.");
  }
  return context;
}

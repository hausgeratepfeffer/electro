import { getTranslations } from "next-intl/server";
import {
  Banknote,
  CreditCard,
  FileText,
  Gift,
  Landmark,
  ShieldCheck,
  Smartphone,
  Truck,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { brandMarksFor } from "@/components/PaymentIcons";

/**
 * Moyens de paiement affichés en vitrine — fiche produit, pied de page, panier.
 *
 * Cette liste est volontairement figée dans le code et ne dépend pas de ce qui
 * est activé en base. Un bandeau qui change de contenu selon l'état du
 * back-office donne une boutique tantôt riche, tantôt réduite à un seul logo,
 * là où le visiteur attend une rangée stable qui inspire confiance.
 *
 * Le tunnel de commande, lui, continue de ne proposer que les moyens réellement
 * activés (`listEnabledPaymentMethods`) : c'est là que l'écart compterait.
 */
interface DisplayMethod {
  id: string;
  key: string;
  label: string;
  description: string;
  icon: string;
  feeLabel: string;
}

const DISPLAY_METHODS: DisplayMethod[] = [
  {
    id: "vorkasse",
    key: "vorkasse",
    label: "Vorkasse per Überweisung",
    description: "Versand nach Zahlungseingang.",
    icon: "landmark",
    feeLabel: "kostenlos",
  },
  {
    id: "kreditkarte",
    key: "kreditkarte",
    label: "Kreditkarte",
    description: "Visa, Mastercard und American Express.",
    icon: "credit-card",
    feeLabel: "kostenlos",
  },
];

// Correspondance explicite entre les noms lucide stockés en base et les
// composants importés : pas d'import dynamique, tout est dans le bundle serveur.
// Ces pictogrammes ne servent plus que de repli pour un moyen de paiement créé
// à la main dont la clé n'est pas reconnue par `brandMarksFor`.
const ICONS: Record<string, LucideIcon> = {
  "credit-card": CreditCard,
  wallet: Wallet,
  "file-text": FileText,
  banknote: Banknote,
  zap: Zap,
  landmark: Landmark,
  smartphone: Smartphone,
  "shield-check": ShieldCheck,
  truck: Truck,
  gift: Gift,
};

/**
 * Les moyens de paiement viennent du back-office et n'ont pas de champ traduit.
 * Seule la mention de gratuité, saisie de façon standardisée, est transposée.
 */
function feeLabelFor(feeLabel: string, freeLabel: string): string {
  return feeLabel.trim().toLowerCase() === "kostenlos" ? freeLabel : feeLabel;
}

interface PaymentMethodsBarProps {
  /**
   * `section` — bandeau autonome avec titre, pour la fiche produit et le pied de page.
   * `inline` — rangée de logos seule, pour le panier, la caisse et le tiroir.
   */
  variant?: "section" | "inline";
  className?: string;
}

export async function PaymentMethodsBar({
  variant = "section",
  className,
}: PaymentMethodsBarProps = {}) {
  const t = await getTranslations("payment");
  const methods = DISPLAY_METHODS;

  const freeLabel = t("free");

  if (variant === "inline") {
    return (
      <div className={className}>
        <p className="mb-2 text-[11px] font-black tracking-widest text-muted-foreground uppercase">
          {t("acceptedTitle")}
        </p>
        <ul className="flex flex-wrap items-center gap-1.5">
          {methods.map((method) => {
            const marks = brandMarksFor(method.key, method.icon);
            const Icon = ICONS[method.icon] ?? CreditCard;

            if (!marks) {
              return (
                <li
                  key={method.id}
                  title={method.description || method.label}
                  className="flex h-8 items-center gap-1.5 rounded-sm border border-border bg-white px-2"
                >
                  <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <span className="text-[11px] font-bold text-foreground">{method.label}</span>
                </li>
              );
            }

            return marks.map((Mark, index) => (
              <li key={`${method.id}-${index}`} title={method.description || method.label}>
                <Mark />
              </li>
            ));
          })}
        </ul>
      </div>
    );
  }

  return (
    <section className={className ?? "border-t border-border bg-muted"}>
      <div className="mx-auto flex max-w-screen-xl flex-wrap items-center gap-x-4 gap-y-3 px-3 py-4">
        <span className="text-xs font-black tracking-wide text-foreground uppercase">
          {t("title")}
        </span>
        <ul className="flex flex-wrap items-center gap-2">
          {methods.map((method) => {
            const marks = brandMarksFor(method.key, method.icon);
            const Icon = ICONS[method.icon] ?? CreditCard;
            const fee = method.feeLabel ? feeLabelFor(method.feeLabel, freeLabel) : "";

            if (!marks) {
              return (
                <li
                  key={method.id}
                  title={method.description || method.label}
                  className="flex items-center gap-2 rounded-sm border border-border bg-white px-3 py-2"
                >
                  <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <span className="text-xs font-bold text-foreground">{method.label}</span>
                  {fee && <span className="text-[11px] text-muted-foreground">{fee}</span>}
                </li>
              );
            }

            return (
              <li
                key={method.id}
                title={method.description || method.label}
                className="flex items-center gap-2 rounded-sm border border-border bg-white py-1.5 pr-3 pl-1.5"
              >
                <span className="flex items-center gap-1">
                  {marks.map((Mark, index) => (
                    <Mark key={index} />
                  ))}
                </span>
                <span className="text-xs font-bold text-foreground">{method.label}</span>
                {fee && <span className="text-[11px] text-muted-foreground">{fee}</span>}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

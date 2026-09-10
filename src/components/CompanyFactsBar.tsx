import { getTranslations } from "next-intl/server";
import { CalendarCheck, MapPin, Store, Users } from "lucide-react";
import { Link } from "@/i18n/navigation";

// Réassurance « qui vend » : ancienneté, statut, ateliers d'exposition, taille
// d'équipe. Tous les faits proviennent de la page « Über uns » et de
// l'Impressum — rien n'est ajouté ici qui n'y figure déjà. Distinct de
// <TrustBar> (livraison / retour / service) : celle-ci parle de l'entreprise,
// pas de la commande. Le texte vient des messages ("company.*Title/Detail").
const facts = [
  { icon: CalendarCheck, key: "since" },
  { icon: Store, key: "owned" },
  { icon: MapPin, key: "showroom" },
  { icon: Users, key: "team" },
] as const;

export async function CompanyFactsBar() {
  const t = await getTranslations("company");

  return (
    <section className="border-y border-border bg-white">
      <div className="mx-auto max-w-screen-xl px-3 py-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {facts.map(({ icon: Icon, key }) => (
            <div key={key} className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-bold text-foreground sm:text-sm">
                  {t(`${key}Title`)}
                </span>
                <span className="block text-[11px] text-muted-foreground sm:text-xs">
                  {t(`${key}Detail`)}
                </span>
              </span>
            </div>
          ))}
        </div>
        {/* La page « Über uns » porte les mêmes faits en détail : le lien la
            rend vérifiable d'un clic plutôt que de laisser une affirmation
            seule. */}
        <p className="mt-3 text-[11px] sm:text-xs">
          <Link href="/ueber-uns" className="font-semibold text-primary hover:underline">
            {t("moreLink")}
          </Link>
        </p>
      </div>
    </section>
  );
}

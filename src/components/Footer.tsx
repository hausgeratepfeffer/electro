import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { CreditCard, Mail, Phone, ShieldCheck, Truck } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { PaymentMethodsBar } from "@/components/PaymentMethodsBar";
import { ConsentSettingsLink } from "@/components/ConsentSettingsLink";
import { CHAT_CONFIGURE } from "@/lib/smartsupp";
import { isLegalLocale } from "@/content/legal";
import { getLegalFooterGroups } from "@/server/legalPages";

export async function Footer() {
  const t = await getTranslations("footer");
  const tRatgeber = await getTranslations("ratgeber");
  const locale = await getLocale();
  // Les libellés sont les titres des pages : renommer une page depuis
  // l'administration renomme aussi son lien ici.
  const footerGroups = await getLegalFooterGroups(isLegalLocale(locale) ? locale : "de");

  return (
    <footer className="bg-footer text-footer-foreground">
      <div className="mx-auto max-w-screen-xl px-3 py-8">
        <div className="mb-8 grid grid-cols-1 gap-6 border-b border-white/10 pb-8 sm:grid-cols-3">
          <div className="flex items-center gap-3">
            <Truck className="h-6 w-6 text-primary" />
            <div>
              <p className="text-sm font-bold">{t("deliveryTitle")}</p>
              <p className="text-xs text-white/60">{t("deliveryDetail")}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <div>
              <p className="text-sm font-bold">{t("warrantyTitle")}</p>
              <p className="text-xs text-white/60">{t("warrantyDetail")}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CreditCard className="h-6 w-6 text-primary" />
            <div>
              <p className="text-sm font-bold">{t("paymentTitle")}</p>
              <p className="text-xs text-white/60">{t("paymentDetail")}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link
              href="/"
              aria-label={t("homeAriaLabel")}
              className="mb-4 inline-flex rounded-sm bg-white px-3 py-2"
            >
              <Image
                src="/images/logo-full.png"
                alt={t("logoAlt")}
                // Voir Header.tsx : dimensions réduites au même ratio, pour éviter
                // de générer un srcSet jusqu'à 3840px pour un logo affiché à 40px.
                width={440}
                height={144}
                className="h-10 w-auto"
              />
            </Link>
            <h3 className="mb-3 font-bold">{t("contact")}</h3>
            <p className="mb-2 flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <Link href="/kontakt" className="hover:underline">
                kontakt@hausgeratepfeffer.de
              </Link>
            </p>
            <p className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              {/* Lien téléphonique : hors routage multilingue */}
              <a href="tel:+4917614111374" className="hover:underline">
                +49 176 14111374
              </a>
            </p>
          </div>

          {/* Colonnes issues du contenu légal : libellés et pages restent
              toujours synchronisés, dans les deux langues. */}
          {footerGroups.map((group) => (
            <div key={group.id}>
              <h3 className="mb-3 font-bold">{group.title}</h3>
              <ul className="space-y-1">
                {group.links.map((link) => (
                  <li key={link.slug}>
                    {/* href sans préfixe : Link ajoute lui-même la langue */}
                    <Link href={`/${link.slug}`} className="hover:underline">
                      {link.label}
                    </Link>
                  </li>
                ))}
                {/* Ratgeber n'est pas une page légale (pas de LegalSlug), donc
                    absent de getLegalFooterGroups : ajouté à la main dans la
                    même colonne « Service ». */}
                {group.id === "service" && (
                  <li>
                    <Link href="/ratgeber" className="hover:underline">
                      {tRatgeber("footerLink")}
                    </Link>
                  </li>
                )}
              </ul>
            </div>
          ))}
        </div>

        {/* Liste pilotée depuis le back-office : /admin/payments */}
        <div className="mt-8 border-t border-white/10 pt-6">
          <PaymentMethodsBar />
        </div>

        <div className="mt-6 border-t border-white/10 pt-6 text-center text-xs text-white/60">
          {/* Le réglage du consentement se tient ici, atteignable depuis
              n'importe quelle page : un accord qu'on ne peut pas retirer aussi
              simplement qu'il a été donné n'en est pas un.
              Sans chat configuré, il n'y a rien à régler et le lien disparaît
              avec le bandeau — sinon il ouvrirait le vide. */}
          {CHAT_CONFIGURE ? (
            <p className="mb-2">
              <ConsentSettingsLink label={t("linkCookies")} />
            </p>
          ) : null}
          {/* Année passée en chaîne : sinon ICU l'afficherait comme « 2.026 » */}
          <p>{t("copyright", { year: String(new Date().getFullYear()) })}</p>
        </div>
      </div>
    </footer>
  );
}

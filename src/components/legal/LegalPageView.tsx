import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";
import { RichText } from "@/components/RichText";
import { findLegalPage } from "@/server/legalPages";
import { paragraphsOf, stripMarks } from "@/lib/richText";
import { hasLocale } from "next-intl";
import { alternatesFor, localizedUrl } from "@/lib/hreflang";
import { buildSocialMetadata } from "@/lib/opengraph";
import { truncateAtWord } from "@/lib/productText";
import { routing } from "@/i18n/routing";
import type { LegalPage, LegalSection, LegalSlug } from "@/content/legal/types";

/**
 * Plancher sous lequel une description est jugée trop courte pour un extrait
 * de recherche. Repéré sur /impressum : son chapeau (« Angaben gemäß § 5
 * DDG ») ne fait que 22 caractères une fois seul — en dessous, on complète
 * avec le contenu des sections plutôt que de laisser une description
 * quasi vide.
 */
const MIN_DESCRIPTION_LENGTH = 70;
const MAX_DESCRIPTION_LENGTH = 155;

/** Description d'une page légale, complétée par ses sections si le chapeau seul est trop court. */
function descriptionFor(page: LegalPage): string {
  const parts: string[] = [];
  if (page.intro) parts.push(stripMarks(page.intro).replace(/[.\s]+$/, ""));

  for (const section of page.sections) {
    if (parts.join(". ").length >= MIN_DESCRIPTION_LENGTH) break;
    const body = stripMarks(section.body).replace(/\s*\n+\s*/g, ", ").replace(/[.\s]+$/, "").trim();
    if (body) parts.push(body);
  }

  return truncateAtWord(parts.join(". ").trim(), MAX_DESCRIPTION_LENGTH);
}

function formatDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale === "en" ? "en-GB" : "de-DE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/** Métadonnées communes à toutes les pages légales, hreflang compris. */
export async function buildLegalMetadata(slug: LegalSlug, locale: string): Promise<Metadata> {
  const page = await findLegalPage(slug, locale);
  if (!page) return {};

  const title = `${page.title} | Hausgeräte Pfeffer`;
  const description = descriptionFor(page);
  const resolvedLocale = hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;

  return {
    title,
    description,
    // Même construction que l'accueil, les catégories et les fiches produit
    // (src/lib/hreflang.ts) : canonical + de/en + x-default. Un bloc écrit à
    // la main ici avait oublié x-default, seul cas du site à s'en passer.
    alternates: alternatesFor(`/${slug}`, resolvedLocale),
    // Sans ceci, ces onze pages retombaient sur l'Open Graph générique de
    // l'accueil (src/app/layout.tsx) : un lien vers /faq ou /kontakt partagé
    // sur WhatsApp affichait le titre et l'image de la page d'accueil, pas
    // ceux de la page réellement partagée.
    ...buildSocialMetadata({
      title,
      description,
      url: localizedUrl(`/${slug}`, resolvedLocale),
      locale: resolvedLocale,
    }),
  };
}

/** Puces d'une section : même rendu sur les pages légales et sur la FAQ. */
export function SectionList({ items }: { items: readonly string[] }) {
  return (
    <ul className="mt-2 space-y-1.5">
      {items.map((item, index) => (
        <li key={`${index}-${item.slice(0, 24)}`} className="flex gap-2 text-sm text-foreground/80">
          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" aria-hidden />
          <span>
            <RichText text={item} />
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Corps d'une section, découpé en paragraphes.
 * La clé porte l'index : deux paragraphes identiques dans une même page sont
 * rares mais parfaitement légitimes, et rien n'oblige un rédacteur à les éviter.
 */
export function SectionBody({ body }: { body: string }) {
  return (
    <>
      {paragraphsOf(body).map((paragraph, index) => (
        <p
          key={`${index}-${paragraph.slice(0, 24)}`}
          className="mb-3 text-sm leading-relaxed text-foreground/80 last:mb-0"
        >
          <RichText text={paragraph} />
        </p>
      ))}
    </>
  );
}

/**
 * Bloc de section.
 *
 * Aucun filet de séparation entre les sections : le texte doit se lire d'une
 * traite, comme un document suivi. C'est l'espacement qui marque la coupure,
 * et l'écart avant un titre reste nettement plus grand que celui qui le suit
 * pour que le titre appartienne visuellement au texte qu'il annonce.
 */
function SectionBlock({ section }: { section: LegalSection }) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-black text-foreground">{section.heading}</h2>
      <SectionBody body={section.body} />
      {section.list && section.list.length > 0 && <SectionList items={section.list} />}
    </section>
  );
}

/** Corps de page réutilisé par la boutique et par l'aperçu du back-office. */
export function LegalPageArticle({ page, locale }: { page: LegalPage; locale: string }) {
  return (
    <article className="mx-auto max-w-3xl px-3 py-8">
      <h1 className="mb-4 text-2xl font-black text-foreground sm:text-3xl">{page.title}</h1>

      {page.intro && (
        <div className="mb-8 rounded-sm border border-border bg-muted p-4">
          {paragraphsOf(page.intro).map((paragraph, index) => (
            <p
              key={`${index}-${paragraph.slice(0, 24)}`}
              className="mb-2 text-sm leading-relaxed text-foreground/80 last:mb-0"
            >
              <RichText text={paragraph} />
            </p>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-7">
        {page.sections.map((section, index) => (
          <SectionBlock key={`${index}-${section.heading}`} section={section} />
        ))}
      </div>

      <p className="mt-10 border-t border-border pt-4 text-xs text-muted-foreground">
        {locale === "en" ? "Last updated" : "Stand"}: {formatDate(page.updatedAt, locale)}
      </p>
    </article>
  );
}

export async function LegalPageView({ slug, locale }: { slug: LegalSlug; locale: string }) {
  const page = await findLegalPage(slug, locale);
  if (!page) notFound();

  const home = locale === "en" ? "Home" : "Start";

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="border-b border-border bg-white">
          <div className="mx-auto max-w-screen-xl px-3 py-3">
            <Breadcrumb items={[{ label: home, href: "/" }, { label: page.title }]} />
          </div>
        </div>

        <LegalPageArticle page={page} locale={locale} />
      </main>
      <Footer />
    </>
  );
}

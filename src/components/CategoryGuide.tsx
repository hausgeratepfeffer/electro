import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Reveal } from "@/components/Reveal";
import { EditorialAuthor } from "@/components/EditorialAuthor";
import type { CategoryGuide as CategoryGuideData } from "@/server/types";

// Le contenu du guide (intro, sections, conclusion) est déjà localisé en amont
// par le module de traduction du catalogue ; ici seuls les habillages le sont.
export async function CategoryGuide({
  label,
  guide,
  locale,
}: {
  label: string;
  guide: CategoryGuideData;
  locale: string;
}) {
  const t = await getTranslations("category");

  return (
    <section className="mx-auto max-w-screen-xl px-3 py-10">
      <Reveal>
        <h2 className="text-xl font-black text-foreground sm:text-2xl">{t("guideTitle", { label })}</h2>
        {/* Signature d'auteur pour l'E-E-A-T (GEO) : une personne réelle de
            l'entreprise (responsable éditoriale), avec bio visible sur « Über
            uns » et balisage Person sur ces contenus. */}
        <p className="mt-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          <EditorialAuthor locale={locale} variant="byline" />
        </p>
        <p className="mt-3 max-w-3xl text-sm text-muted-foreground sm:text-base">{guide.intro}</p>
      </Reveal>

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {guide.sections.map((section, index) => {
          // Sous-titre déjà formulé en question : on le marque pour le balisage
          // FAQPage + speakable posé par la page catégorie (même filtre « ? »
          // que <FaqPageJsonLd>). Les autres sections restent hors périmètre,
          // comme sur /faq — on ne balise que ce qui est vraiment une Q/R.
          const isQuestion = section.heading.trim().endsWith("?");
          return (
            <Reveal key={section.heading} delay={Math.min((index + 1) * 100, 300)}>
              <h3
                className={`mb-2 text-sm font-bold text-foreground${
                  isQuestion ? " category-faq-question" : ""
                }`}
              >
                {section.heading}
              </h3>
              <p
                className={`text-sm text-muted-foreground${isQuestion ? " category-faq-answer" : ""}`}
              >
                {section.body}
              </p>
            </Reveal>
          );
        })}
      </div>

      {/* Comparatif éventuel : une seule section sur trois en porte un, jamais
          forcé sur celles où deux ou trois variantes ne se comparent pas
          naturellement. Utile pour un lecteur pressé, et une forme que Google
          peut reprendre en extrait de tableau (AEO). */}
      {guide.sections.map((section) =>
        section.table ? (
          <Reveal key={`table-${section.heading}`} delay={200}>
            <div className="mt-8 overflow-x-auto rounded-sm border border-border bg-white">
              <table className="w-full text-left text-sm">
                <caption className="border-b border-border bg-muted px-4 py-2.5 text-left text-xs font-bold tracking-wide text-muted-foreground uppercase caption-top">
                  {section.table.caption}
                </caption>
                <thead>
                  <tr>
                    {section.table.columns.map((column) => (
                      <th key={column} className="border-b border-border px-4 py-2.5 font-bold text-foreground">
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {section.table.rows.map((row, rowIndex) => (
                    <tr key={row[0] ?? rowIndex} className="border-b border-border last:border-0">
                      {row.map((cell, cellIndex) => (
                        <td
                          key={cellIndex}
                          className={
                            cellIndex === 0
                              ? "px-4 py-2.5 font-semibold text-foreground"
                              : "px-4 py-2.5 text-muted-foreground"
                          }
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
        ) : null,
      )}

      <Reveal delay={150}>
        <div className="mt-8 flex flex-col items-start gap-4 rounded-sm bg-secondary px-6 py-6 text-secondary-foreground transition-shadow duration-300 hover:shadow-xl sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xl text-sm sm:text-base">{guide.closing}</p>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Link
              href="#produkte"
              className="rounded-sm bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition-all hover:-translate-y-0.5 hover:brightness-110"
            >
              {t("guideDiscover", { label })}
            </Link>
            <Link
              href="/kontakt"
              className="rounded-sm bg-white/10 px-5 py-2.5 text-sm font-bold transition-all hover:-translate-y-0.5 hover:bg-white/20"
            >
              {t("guideAdvice")}
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

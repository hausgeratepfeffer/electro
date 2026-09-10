import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  EDITORIAL_AUTHOR,
  editorialAuthorBio,
  editorialAuthorJobTitle,
} from "@/content/editorialAuthor";

/**
 * Signature / bio de la responsable éditoriale, rendue visiblement sur les
 * pages dont le balisage porte un `author` de type `Person` : sans présence
 * visible sur la page, Google ne retient pas le signal d'auteur.
 *
 *  - `variant="byline"` : « Von Monika Klaebe, Redaktionsleiterin », en lien
 *    vers le bloc bio de la page « Über uns ».
 *  - `variant="card"` : le bloc bio lui-même, ancré `#redaktion`.
 */
export async function EditorialAuthor({
  locale,
  variant,
}: {
  locale: string;
  variant: "byline" | "card";
}) {
  const t = await getTranslations("common");
  const role = editorialAuthorJobTitle(locale);

  if (variant === "byline") {
    return (
      <Link href={`/ueber-uns#${EDITORIAL_AUTHOR.anchor}`} className="hover:underline">
        {t("editorialByline", { name: EDITORIAL_AUTHOR.name, role })}
      </Link>
    );
  }

  return (
    <section
      id={EDITORIAL_AUTHOR.anchor}
      className="mt-10 scroll-mt-24 rounded-sm border border-border bg-muted/50 p-5"
    >
      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {t("editorialCardTitle")}
      </p>
      <p className="mt-2 text-sm font-bold text-foreground">
        {EDITORIAL_AUTHOR.name}
        <span className="font-medium text-muted-foreground"> · {role}</span>
      </p>
      <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{editorialAuthorBio(locale)}</p>
    </section>
  );
}

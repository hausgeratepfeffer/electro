import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";
import { RichText } from "@/components/RichText";
import { paragraphsOf } from "@/lib/richText";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { ArticleJsonLd } from "@/components/seo/ArticleJsonLd";
import { FaqPageJsonLd } from "@/components/seo/FaqPageJsonLd";
import { ratgeberFaqItems } from "@/lib/ratgeberFaq";
import { EditorialAuthor } from "@/components/EditorialAuthor";
import { EDITORIAL_AUTHOR, editorialAuthorJsonLd } from "@/content/editorialAuthor";
import { alternatesFor, localizedUrl } from "@/lib/hreflang";
import { buildSocialMetadata } from "@/lib/opengraph";
import { getPublishedRatgeberPostBySlug, plainExcerpt } from "@/server/ratgeber";
import { truncateAtWord } from "@/lib/productText";
import type { Locale } from "@/i18n/routing";

type PageParams = Promise<{ locale: Locale; slug: string }>;

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await getPublishedRatgeberPostBySlug(slug, locale);
  if (!post) return {};

  const description = plainExcerpt(post).slice(0, 160);
  // Le titre éditorial peut dépasser 60 caractères (mots-clés inclus à
  // dessein) ; Google tronque autour de là dans les résultats de recherche.
  // On garde le suffixe de marque quand le tout tient dans ~60 caractères,
  // sinon on sert le titre éditorial seul, coupé sur un mot entier et sans
  // « … » (Google ajoute le sien s'il tronque à l'affichage). Le H1 et
  // l'og:title, eux, gardent le titre complet.
  const BRAND_SUFFIX = " | Hausgeräte Pfeffer";
  const metaTitleText =
    post.title.length + BRAND_SUFFIX.length <= 60
      ? `${post.title}${BRAND_SUFFIX}`
      : truncateAtWord(post.title, 60, "");

  return {
    title: metaTitleText,
    description,
    alternates: alternatesFor(`/ratgeber/${slug}`, locale),
    ...buildSocialMetadata({
      title: post.title,
      description,
      url: localizedUrl(`/ratgeber/${slug}`, locale),
      locale,
      image: post.coverImage || undefined,
      imageAlt: post.coverImageAlt || post.title,
      article: {
        publishedTime: post.publishedAt,
        modifiedTime: post.updatedAt,
        authorName: EDITORIAL_AUTHOR.name,
      },
    }),
  };
}

export default async function RatgeberPostPage({ params }: { params: PageParams }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const post = await getPublishedRatgeberPostBySlug(slug, locale);
  if (!post) notFound();

  const t = await getTranslations("ratgeber");
  const common = await getTranslations("common");

  const dateFmt = (iso: string) =>
    new Date(iso).toLocaleDateString(locale === "en" ? "en-GB" : "de-DE", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  const publishedDate = dateFmt(post.publishedAt);
  // Signal de fraîcheur : on n'affiche « Aktualisiert am … » que si la révision
  // tombe un autre jour que la publication — sinon la mention ferait doublon.
  const updatedDate =
    dateFmt(post.updatedAt) !== publishedDate ? dateFmt(post.updatedAt) : null;

  // FAQPage dérivé des sous-titres en question de l'article : élargit la
  // capture d'extraits (« People also ask ») sans rien ajouter au contenu. Posé
  // seulement quand l'article est réellement structuré en questions.
  const faqItems = ratgeberFaqItems(post.body);

  const bodyParagraphs = paragraphsOf(post.body);
  // `speakable` de l'Article : Google lit à voix haute le titre et le chapô
  // (premier paragraphe qui n'est pas un sous-titre « ## »). On ne cible le
  // chapô que s'il existe vraiment — jamais un sélecteur qui ne pointe sur rien.
  const leadIndex = bodyParagraphs.findIndex((paragraph) => !paragraph.startsWith("## "));
  const speakableSelector =
    leadIndex >= 0 ? [".ratgeber-headline", ".ratgeber-lead"] : [".ratgeber-headline"];

  const breadcrumbItems = [
    { label: common("home"), href: "/" },
    { label: t("title"), href: "/ratgeber" },
    { label: post.title },
  ];

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="border-b border-border bg-white">
          <div className="mx-auto max-w-screen-xl px-3 py-3">
            <Breadcrumb items={breadcrumbItems} />
          </div>
        </div>

        <article className="mx-auto max-w-3xl px-3 py-8">
          <h1 className="ratgeber-headline mb-2 text-2xl font-black text-foreground sm:text-3xl">
            {post.title}
          </h1>
          <p className="mb-6 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {t("publishedOn", { date: publishedDate })}
            {updatedDate ? ` · ${t("updatedOn", { date: updatedDate })}` : ""}
            {" · "}
            <EditorialAuthor locale={locale} variant="byline" />
          </p>

          {post.coverImage && (
            <div className="relative mb-8 aspect-[16/9] w-full overflow-hidden rounded-sm bg-muted">
              <Image
                src={post.coverImage}
                alt={post.coverImageAlt || post.title}
                fill
                priority
                sizes="(min-width: 768px) 768px, 100vw"
                className="object-cover"
              />
            </div>
          )}

          <div className="space-y-4 text-sm leading-relaxed text-foreground/90 sm:text-base">
            {bodyParagraphs.map((paragraph, index) => {
              // Convention légère, propre aux articles Ratgeber : un paragraphe
              // qui commence par « ## » devient un sous-titre. Pas une nouvelle
              // syntaxe dans richText.ts (partagé avec les pages légales et la
              // FAQ, qui n'en ont pas besoin) — un simple test avant le rendu.
              const isHeading = paragraph.startsWith("## ");
              const key = `${index}-${paragraph.slice(0, 24)}`;
              if (isHeading) {
                return (
                  <h2 key={key} className="pt-2 text-lg font-black text-foreground sm:text-xl">
                    <RichText text={paragraph.slice(3)} />
                  </h2>
                );
              }
              // Chapô = premier paragraphe non-titre ; cible du balisage speakable.
              return (
                <p key={key} className={index === leadIndex ? "ratgeber-lead" : undefined}>
                  <RichText text={paragraph} />
                </p>
              );
            })}
          </div>

          <EditorialAuthor locale={locale} variant="card" />
        </article>
      </main>
      <Footer />

      <BreadcrumbJsonLd items={breadcrumbItems} />
      <ArticleJsonLd
        path={`/ratgeber/${slug}`}
        title={post.title}
        description={plainExcerpt(post)}
        image={post.coverImage || undefined}
        publishedAt={post.publishedAt}
        updatedAt={post.updatedAt}
        locale={locale}
        speakableSelector={speakableSelector}
      />
      {faqItems.length >= 2 && (
        <FaqPageJsonLd items={faqItems} author={editorialAuthorJsonLd(locale)} />
      )}
    </>
  );
}

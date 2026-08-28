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
import { alternatesFor, localizedUrl } from "@/lib/hreflang";
import { buildSocialMetadata } from "@/lib/opengraph";
import { getPublishedRatgeberPostBySlug, plainExcerpt } from "@/server/ratgeber";
import type { Locale } from "@/i18n/routing";

type PageParams = Promise<{ locale: Locale; slug: string }>;

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await getPublishedRatgeberPostBySlug(slug, locale);
  if (!post) return {};

  const description = plainExcerpt(post).slice(0, 160);

  return {
    title: `${post.title} | Hausgeräte Pfeffer`,
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
        authorName: "Hausgeräte Pfeffer",
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

  const publishedDate = new Date(post.publishedAt).toLocaleDateString(locale === "en" ? "en-GB" : "de-DE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

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
          <h1 className="mb-2 text-2xl font-black text-foreground sm:text-3xl">{post.title}</h1>
          <p className="mb-6 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {t("publishedOn", { date: publishedDate })} · Redaktion Hausgeräte Pfeffer
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
            {paragraphsOf(post.body).map((paragraph, index) => (
              <p key={`${index}-${paragraph.slice(0, 24)}`}>
                <RichText text={paragraph} />
              </p>
            ))}
          </div>
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
      />
    </>
  );
}

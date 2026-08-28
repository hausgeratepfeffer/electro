import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Link } from "@/i18n/navigation";
import { RichText } from "@/components/RichText";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { alternatesFor, localizedUrl } from "@/lib/hreflang";
import { buildSocialMetadata } from "@/lib/opengraph";
import { listPublishedRatgeberPosts } from "@/server/ratgeber";
import type { Locale } from "@/i18n/routing";

type PageParams = Promise<{ locale: Locale }>;

const dateFormatter = { de: "de-DE", en: "en-GB" } as const;

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ratgeber" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: alternatesFor("/ratgeber", locale),
    ...buildSocialMetadata({
      title: t("metaTitle"),
      description: t("metaDescription"),
      url: localizedUrl("/ratgeber", locale),
      locale,
    }),
  };
}

export default async function RatgeberIndexPage({ params }: { params: PageParams }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("ratgeber");
  const common = await getTranslations("common");
  const posts = await listPublishedRatgeberPosts(locale);

  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="border-b border-border bg-white">
          <div className="mx-auto max-w-screen-xl px-3 py-3">
            <Breadcrumb items={[{ label: common("home"), href: "/" }, { label: t("title") }]} />
          </div>
        </div>

        <div className="mx-auto max-w-screen-xl px-3 py-8">
          <h1 className="mb-2 text-2xl font-black text-foreground sm:text-3xl">{t("title")}</h1>
          <p className="mb-8 max-w-2xl text-sm leading-relaxed text-muted-foreground">{t("intro")}</p>

          {posts.length === 0 ? (
            <p className="rounded-sm border border-dashed border-border bg-white px-5 py-8 text-center text-sm text-muted-foreground">
              {t("empty")}
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/ratgeber/${post.slug}`}
                  className="group flex flex-col overflow-hidden rounded-sm border border-border bg-white transition-shadow hover:shadow-lg"
                >
                  {post.coverImage && (
                    <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
                      <Image
                        src={post.coverImage}
                        alt={post.coverImageAlt || post.title}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col p-5">
                    <time className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      {new Date(post.publishedAt).toLocaleDateString(dateFormatter[locale === "en" ? "en" : "de"], {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </time>
                    <h2 className="mb-2 text-base font-black text-foreground group-hover:text-primary">
                      {post.title}
                    </h2>
                    <p className="line-clamp-3 flex-1 text-sm text-muted-foreground">
                      <RichText text={post.excerpt} />
                    </p>
                    <span className="mt-4 text-sm font-bold text-primary">{t("readMore")} →</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />

      <BreadcrumbJsonLd items={[{ label: common("home"), href: "/" }, { label: t("title") }]} />
    </>
  );
}

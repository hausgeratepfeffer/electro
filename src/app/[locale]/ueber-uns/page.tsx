import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { LegalPageView, buildLegalMetadata } from "@/components/legal/LegalPageView";
import { EditorialAuthor } from "@/components/EditorialAuthor";

const SLUG = "ueber-uns" as const;

type PageParams = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { locale } = await params;
  return await buildLegalMetadata(SLUG, locale);
}

export default async function UeberUnsPage({ params }: { params: PageParams }) {
  const { locale } = await params;
  setRequestLocale(locale);
  // Bloc bio de la responsable éditoriale, ancré #redaktion : cible du champ
  // `url` du balisage Person posé sur les Ratgeber, la FAQ et les guides.
  return (
    <LegalPageView
      slug={SLUG}
      locale={locale}
      afterArticle={<EditorialAuthor locale={locale} variant="card" />}
    />
  );
}

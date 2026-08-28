import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { LegalPageView, buildLegalMetadata } from "@/components/legal/LegalPageView";
import { HowToJsonLd } from "@/components/seo/HowToJsonLd";
import { findLegalPage } from "@/server/legalPages";

const SLUG = "elektroaltgeraete" as const;

// Index de la section « So geben Sie Altgeräte bei uns zurück » (5ᵉ section,
// vérifié identique en DE et EN le 28/08/2026) : la première section à porter
// une liste sur cette page est « Unsere Rücknahme: 0:1 für kleine Altgeräte »,
// une condition d'éligibilité, pas une marche à suivre — HowToJsonLd choisirait
// la mauvaise liste sans cette précision.
const STEP_SECTION_INDEX = 4;

type PageParams = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { locale } = await params;
  return await buildLegalMetadata(SLUG, locale);
}

export default async function ElektroaltgeraetePage({ params }: { params: PageParams }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const path = locale === "en" ? "/en/elektroaltgeraete" : "/elektroaltgeraete";
  const page = await findLegalPage(SLUG, locale);

  return (
    <>
      <LegalPageView slug={SLUG} locale={locale} />
      {page && <HowToJsonLd page={page} path={path} stepSectionIndex={STEP_SECTION_INDEX} />}
    </>
  );
}

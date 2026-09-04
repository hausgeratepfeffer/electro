import { JsonLd, type JsonLdValue } from "@/components/seo/JsonLd";

/**
 * Balisage FAQPage générique, pour tout contenu qui présente déjà de vraies
 * questions/réponses visibles à l'écran — jamais posé sur un titre qui
 * n'est pas formulé comme une question, pour rester fidèle à ce que la page
 * montre. Voir /faq (src/app/[locale]/faq/page.tsx) pour le pendant construit
 * à la main sur les données spécifiques de cette page.
 */
export interface FaqPageJsonLdItem {
  question: string;
  answer: string;
}

export function FaqPageJsonLd({ items }: { items: FaqPageJsonLdItem[] }) {
  const questions = items.filter((item) => item.question.trim().endsWith("?"));
  if (questions.length === 0) return null;

  const data: Record<string, JsonLdValue | undefined> = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return <JsonLd data={data} />;
}

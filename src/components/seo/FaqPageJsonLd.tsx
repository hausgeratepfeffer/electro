import { JsonLd, type JsonLdValue } from "@/components/seo/JsonLd";

/**
 * Balisage FAQPage générique, pour tout contenu qui présente déjà de vraies
 * questions/réponses visibles à l'écran — jamais posé sur un titre qui
 * n'est pas formulé comme une question, pour rester fidèle à ce que la page
 * montre. Voir /faq (src/app/[locale]/faq/page.tsx) pour le pendant construit
 * à la main sur les données spécifiques de cette page.
 *
 * `speakableSelector` : sélecteurs CSS des questions/réponses lisibles à voix
 * haute (Google Assistant / actualités, bêta), même principe que /faq. À ne
 * fournir que si ces classes existent réellement dans le DOM de la page — sinon
 * on pointerait sur du vide. Le filtrage « ? » ci-dessous garantit qu'au moins
 * une question porte la classe dès que ce balisage est rendu.
 */
export interface FaqPageJsonLdItem {
  question: string;
  answer: string;
}

export function FaqPageJsonLd({
  items,
  speakableSelector,
  author,
}: {
  items: FaqPageJsonLdItem[];
  speakableSelector?: readonly string[];
  /** Nœud `author` (une Person réelle) — la responsable éditoriale du contenu. */
  author?: Record<string, JsonLdValue | undefined>;
}) {
  const questions = items.filter((item) => item.question.trim().endsWith("?"));
  if (questions.length === 0) return null;

  const data: Record<string, JsonLdValue | undefined> = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    author,
    speakable:
      speakableSelector && speakableSelector.length > 0
        ? { "@type": "SpeakableSpecification", cssSelector: [...speakableSelector] }
        : undefined,
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

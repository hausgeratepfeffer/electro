import type { FaqPageJsonLdItem } from "@/components/seo/FaqPageJsonLd";
import { paragraphsOf, stripMarks } from "@/lib/richText";

/**
 * Extrait les paires question / réponse d'un article Ratgeber pour en poser un
 * balisage FAQPage — sans rien ajouter au contenu.
 *
 * Le corps est déjà une suite de paragraphes où « ## … » marque un sous-titre
 * (même convention que le rendu de la page). Un sous-titre formulé en question
 * (« … ? ») devient une entrée ; les paragraphes qui le suivent, jusqu'au
 * sous-titre suivant, forment la réponse. Les sous-titres qui ne sont pas des
 * questions (« Fazit », « So beugen Sie … vor ») sont ignorés : le balisage
 * reste fidèle à ce que la page montre.
 *
 * Renvoie une liste vide si l'article n'est pas structuré en questions — c'est
 * à l'appelant de n'afficher le balisage qu'au-delà d'un seuil (deux entrées).
 */
export function ratgeberFaqItems(body: string): FaqPageJsonLdItem[] {
  const items: FaqPageJsonLdItem[] = [];
  let question: string | null = null;
  let answer: string[] = [];

  const commit = () => {
    if (question && answer.length > 0) {
      items.push({ question, answer: answer.join(" ").replace(/\s+/g, " ").trim() });
    }
    question = null;
    answer = [];
  };

  for (const paragraph of paragraphsOf(body)) {
    if (paragraph.startsWith("## ")) {
      commit();
      const heading = stripMarks(paragraph.slice(3)).trim();
      question = heading.endsWith("?") ? heading : null;
      continue;
    }
    if (question) answer.push(stripMarks(paragraph).trim());
  }
  commit();

  return items;
}

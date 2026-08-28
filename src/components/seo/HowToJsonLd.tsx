import { JsonLd, type JsonLdValue } from "@/components/seo/JsonLd";
import { absoluteUrl } from "@/server/merchant";
import type { LegalPage } from "@/content/legal/types";

/**
 * Balisage HowTo d'une page légale/informative.
 *
 * Les étapes viennent telles quelles de la section qui porte déjà une liste
 * à l'écran (`section.list`) : rien n'est reformulé ni ajouté. Si une
 * réécriture depuis l'administration retire cette liste, la section ciblée
 * devient introuvable et le composant ne rend rien plutôt que de publier un
 * balisage qui ne correspondrait plus à la page affichée.
 *
 * Par défaut, la première section qui porte une liste est retenue — c'est le
 * cas sur /retoure, où elle correspond bien à une suite d'étapes. Une page qui
 * porte plusieurs listes mais dont la première n'est pas une procédure (par
 * ex. une liste de conditions d'éligibilité avant les étapes de retour, sur
 * /elektroaltgeraete) doit préciser `stepSectionIndex` pour viser la bonne —
 * sans quoi le composant balaierait la mauvaise liste comme s'il s'agissait
 * d'étapes à suivre.
 */

interface HowToJsonLdProps {
  page: LegalPage;
  path: string;
  /** Index de la section à utiliser, quand ce n'est pas la première qui porte une liste. */
  stepSectionIndex?: number;
}

export function HowToJsonLd({ page, path, stepSectionIndex }: HowToJsonLdProps) {
  const stepSection =
    stepSectionIndex !== undefined
      ? page.sections[stepSectionIndex]
      : page.sections.find((section) => section.list && section.list.length > 0);
  if (!stepSection?.list || stepSection.list.length === 0) return null;

  const data: Record<string, JsonLdValue | undefined> = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: stepSection.heading,
    description: stepSection.body || page.title,
    url: absoluteUrl(path),
    step: stepSection.list.map((text) => ({
      "@type": "HowToStep",
      text,
    })),
  };

  return <JsonLd data={data} />;
}

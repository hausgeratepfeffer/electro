import { ExternalLink } from "lucide-react";
import { EU_ENERGY_LABEL_SLUGS } from "@/lib/googleTaxonomy";
import { EPREL_SEARCH_URL, officialSiteForBrand } from "@/lib/brandLinks";

/**
 * Liens sortants vérifiés depuis la fiche produit : site officiel du
 * fabricant et, pour les catégories soumises à l'étiquette énergie
 * européenne, la base EPREL. Rend `null` sans rien afficher tant qu'aucun des
 * deux ne s'applique — pas de bloc vide, pas de lien deviné.
 */
export function ProductSourceLinks({
  brand,
  categorySlug,
  locale,
}: {
  brand: string;
  categorySlug: string;
  locale: string;
}) {
  const officialSite = officialSiteForBrand(brand);
  const showEprel = EU_ENERGY_LABEL_SLUGS.has(categorySlug);

  if (!officialSite && !showEprel) return null;

  const heading = locale === "en" ? "Certification & sources" : "Zertifizierung & Quellen";
  const officialLabel =
    locale === "en" ? `Official ${brand} website` : `Offizielle ${brand}-Herstellerseite`;
  const eprelLabel =
    locale === "en"
      ? "Check the EU energy label (EPREL database)"
      : "EU-Energieeffizienzlabel auf EPREL prüfen";

  return (
    <div className="mt-4 border-t border-border pt-4">
      <p className="mb-2 text-xs font-bold tracking-wide text-muted-foreground uppercase">
        {heading}
      </p>
      <ul className="space-y-1.5 text-sm">
        {officialSite && (
          <li>
            <a
              href={officialSite}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-primary hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {officialLabel}
            </a>
          </li>
        )}
        {showEprel && (
          <li>
            <a
              href={EPREL_SEARCH_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-primary hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {eprelLabel}
            </a>
          </li>
        )}
      </ul>
    </div>
  );
}

/**
 * Balises Open Graph "product" (espace de noms Facebook/Pinterest),
 * rendues directement dans le JSX de la page produit.
 *
 * Pourquoi pas via `other` dans generateMetadata : Next.js documente
 * lui-même que `other` rend systématiquement `<meta name="…">`, jamais
 * `<meta property="…">` (node_modules/next/dist/docs/.../generate-metadata.md,
 * section "other"). Or le protocole Open Graph n'est reconnu par les
 * robots (Facebook, Pinterest, WhatsApp) que via l'attribut `property` —
 * un `name="og:type"` est silencieusement ignoré. Vérifié en local : un
 * <meta property="…"> posé n'importe où dans l'arbre React 19 est bien
 * hissé vers <head> avec l'attribut intact, ce qui n'est pas le cas via
 * l'API Metadata typée pour un champ qu'elle ne connaît pas nativement.
 *
 * `openGraph.type` reste absent du bloc généré par buildSocialMetadata()
 * pour une fiche produit (voir src/lib/opengraph.ts) : c'est ce composant,
 * et lui seul, qui pose og:type ici — jamais les deux à la fois.
 */
export function ProductOpenGraphMeta({
  priceAmount,
  priceCurrency,
  availability,
  brand,
}: {
  priceAmount: string;
  priceCurrency: string;
  availability: "instock" | "oos";
  brand?: string;
}) {
  return (
    <>
      <meta property="og:type" content="product" />
      <meta property="product:price:amount" content={priceAmount} />
      <meta property="product:price:currency" content={priceCurrency} />
      <meta property="product:availability" content={availability} />
      {brand && <meta property="product:brand" content={brand} />}
    </>
  );
}

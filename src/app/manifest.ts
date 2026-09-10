import type { MetadataRoute } from "next";

// Next génère automatiquement <link rel="manifest" href="/manifest.webmanifest">
// dès que ce fichier existe. On reste sur un manifeste « léger » : il renseigne
// nom, icônes et couleurs pour les audits et l'ajout à l'écran d'accueil, mais
// display:"browser" laisse le site s'ouvrir dans un onglet normal (pas de mode
// application plein écran, peu adapté à une boutique).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hausgeräte Pfeffer",
    short_name: "Hausgeräte Pfeffer",
    description:
      "Große Auswahl an Haushaltsgeräten, Küchengeräten, TV & Audio und Smart Home Produkten zu günstigen Preisen. Schnelle Lieferung, faire Garantie.",
    start_url: "/",
    display: "browser",
    lang: "de",
    theme_color: "#ffffff",
    background_color: "#ffffff",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

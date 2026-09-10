import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";

/**
 * Cartes Open Graph (1200×630) pour les pages sans visuel propre : l'accueil,
 * « Über uns » et l'index Ratgeber retombaient sinon sur le logo, mal cadré
 * dans un aperçu de lien large (WhatsApp, LinkedIn, Slack, X…).
 *
 * Rendu au build (generateStaticParams) : trois PNG servis en statique, aucun
 * coût à l'exécution. Les fiches produit, pages catégorie et articles gardent
 * leur propre image et ne passent pas par ici.
 */

export const contentType = "image/png";
export const size = { width: 1200, height: 630 } as const;

const BRAND_INK = "#001424";
const BRAND_RED = "#e3000e";
const BRAND_YELLOW = "#ffca2b";

type Card = { hero: string; kicker: string; title: string; subtitle: string };

const CARDS: Record<string, Card> = {
  home: {
    hero: "kitchen-hero.jpg",
    kicker: "hausgeratepfeffer.de",
    title: "Elektrogeräte & Multimedia",
    subtitle: "Haushalt und Multimedia · Standardversand kostenlos · Fachhandel aus Trier seit 2007",
  },
  "ueber-uns": {
    hero: "laundry-hero.jpg",
    kicker: "Über uns",
    title: "Hausgeräte Pfeffer OHG",
    subtitle: "Inhabergeführter Fachhandel mit Ausstellung in Trier · über 15 Mitarbeitende · seit 2007",
  },
  ratgeber: {
    hero: "coffee-hero.jpg",
    kicker: "Ratgeber",
    title: "Pflege & Kaufberatung",
    subtitle: "Praktische Antworten rund um Haushaltsgeräte und Multimedia",
  },
};

export function generateStaticParams() {
  return Object.keys(CARDS).map((slug) => ({ slug: `${slug}.png` }));
}

function dataUri(relPath: string, mime: string): string {
  const buf = readFileSync(join(process.cwd(), "public", relPath));
  return `data:${mime};base64,${buf.toString("base64")}`;
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const card = CARDS[slug.replace(/\.png$/, "")];
  if (!card) return new Response("Not found", { status: 404 });

  const hero = dataUri(`images/hero/${card.hero}`, "image/jpeg");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          backgroundColor: BRAND_INK,
          fontFamily: "sans-serif",
        }}
      >
        {/* Photo du site en filigrane, moitié droite. Le texte est posé sur le
            bleu de marque plein, jamais sur la photo. */}
        <img
          src={hero}
          width={560}
          height={630}
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            width: 560,
            height: 630,
            objectFit: "cover",
            opacity: 0.22,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            backgroundImage:
              "linear-gradient(90deg, rgba(0,20,36,1) 46%, rgba(0,20,36,0.55) 74%, rgba(0,20,36,0.9))",
          }}
        />

        {/* Contenu */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 28,
            padding: "76px 80px",
            maxWidth: 680,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 25,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: BRAND_YELLOW,
              fontWeight: 700,
            }}
          >
            {card.kicker}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 62,
              lineHeight: 1.08,
              fontWeight: 800,
              color: "#ffffff",
            }}
          >
            {card.title}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 27,
              lineHeight: 1.38,
              color: "rgba(255,255,255,0.76)",
            }}
          >
            {card.subtitle}
          </div>
          <div style={{ display: "flex", width: 96, height: 5, backgroundColor: BRAND_RED }} />
        </div>

        {/* Marque, discrète, en pied */}
        <div
          style={{
            position: "absolute",
            left: 80,
            bottom: 44,
            display: "flex",
            fontSize: 21,
            fontWeight: 700,
            letterSpacing: 0.5,
            color: "rgba(255,255,255,0.55)",
          }}
        >
          Hausgeräte Pfeffer
        </div>
      </div>
    ),
    { ...size },
  );
}

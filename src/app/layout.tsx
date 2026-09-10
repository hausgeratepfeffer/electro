import type { Metadata, Viewport } from "next";
import { Lato } from "next/font/google";
import { hasLocale } from "next-intl";
import { getLocale } from "next-intl/server";
import { HTML_LANG, routing } from "@/i18n/routing";
import "./globals.css";

const lato = Lato({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-lato",
});

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://hausgeratepfeffer.de").replace(
  /\/+$/,
  "",
);

const TITLE = "Hausgeräte Pfeffer | Elektrogeräte & Multimedia online kaufen";
const DESCRIPTION =
  "Große Auswahl an Haushaltsgeräten, Küchengeräten, TV & Audio und Smart Home Produkten zu günstigen Preisen. Schnelle Lieferung, faire Garantie.";

export const metadata: Metadata = {
  // Nécessaire pour que les images Open Graph données en chemin relatif
  // (ex. "/images/logo-full.png") se résolvent en URL absolue : Facebook,
  // WhatsApp et consorts n'acceptent que des URL complètes.
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  // Filet de sécurité si une page ne définit pas son propre bloc social ;
  // chaque page publique le fait déjà via generateMetadata.
  openGraph: {
    type: "website",
    siteName: "Hausgeräte Pfeffer",
    title: TITLE,
    description: DESCRIPTION,
    locale: "de_DE",
    images: [{ url: "/images/logo-full.png", alt: TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/images/logo-full.png"],
  },
};

// themeColor doit vivre dans l'export `viewport` (Next l'ignore dans `metadata`) :
// il colore la barre d'adresse mobile et la fenêtre du gestionnaire de tâches.
export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // La langue vient du routage pour la boutique ; le back-office, hors
  // middleware, retombe sur la langue par défaut (allemand).
  const locale = await getLocale();
  // <html lang> porte une étiquette BCP-47 régionalisée ("de-DE" / "en-GB")
  // plutôt que le code nu : le référencement cible l'Allemagne.
  const htmlLang = hasLocale(routing.locales, locale) ? HTML_LANG[locale] : HTML_LANG.de;

  // suppressHydrationWarning ne porte que sur <html> : les extensions de
  // navigateur y posent leurs propres attributs (data-qb-installed, thèmes
  // sombres, gestionnaires de mots de passe…) avant que React ne s'hydrate.
  // L'écart est alors inévitable et sans conséquence ; la vérification reste
  // entière pour tout le contenu de la page.
  return (
    <html
      lang={htmlLang}
      className={`${lato.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}

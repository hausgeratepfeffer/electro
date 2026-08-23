import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { CartProvider } from "@/components/cart/CartProvider";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { CodeSnippets } from "@/components/CodeSnippets";
import { PageViewTracker } from "@/components/PageViewTracker";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { SmartsuppChat } from "@/components/SmartsuppChat";
import { ConsentBanner } from "@/components/ConsentBanner";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { PaymentMethodsBar } from "@/components/PaymentMethodsBar";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Permet le rendu statique des pages qui utilisent les traductions
  setRequestLocale(locale);

  // Le panier vit dans localStorage : le fournisseur enveloppe toute la
  // boutique pour que le Header et les fiches produit y accèdent. Les pages
  // restent des composants serveur, seul le contexte est côté client.
  //
  // Le tiroir est monté ici pour être disponible sur toutes les pages. Les
  // moyens de paiement lui sont passés déjà rendus : la lecture en base reste
  // côté serveur, le tiroir n'embarque aucune requête.
  // Les fragments posés depuis le back-office sont injectés ici, donc jamais
  // dans /admin : celui-ci est hors du routage multilingue et ne traverse pas ce
  // layout. Un fragment fautif ne peut pas fermer derrière lui la seule porte
  // par laquelle on pourrait le désactiver.
  return (
    <NextIntlClientProvider>
      <CodeSnippets placement="head" />
      <CodeSnippets placement="bodyStart" />
      {/* Tout en haut, avant l'en-tête : une annonce placée plus bas
          passerait sous le logo et manquerait sa cible. */}
      <AnnouncementBar />
      <PageViewTracker />
      <CartProvider>
        {children}
        <CartDrawer paymentSlot={<PaymentMethodsBar variant="inline" />} />
        {/* Contacts flottants, dans des coins opposés : WhatsApp à gauche,
            Smartsupp à droite — ce dernier ne sait pas se déplacer. Le chat
            ne paraît que si sa clé d'environnement est renseignée. */}
        <WhatsAppButton />
        <SmartsuppChat />
        {/* En dernier et par-dessus tout le reste : c'est sa réponse qui décide
            si le chat se charge de lui-même. */}
        <ConsentBanner />
      </CartProvider>
      <CodeSnippets placement="bodyEnd" />
    </NextIntlClientProvider>
  );
}

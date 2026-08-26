"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

// Seules les données non traduisibles (visuel, destination) restent en dur ;
// les textes viennent du catalogue de messages, sous "hero.slides.<clé>".
interface HeroSlideSource {
  key: string;
  href: string;
  image: string;
}

const slides: HeroSlideSource[] = [
  { key: "summer", href: "/angebote", image: "/images/hero/kitchen-hero.jpg" },
  { key: "cinema", href: "/multimedia/fernseher", image: "/images/hero/tv-hero.jpg" },
  { key: "drones", href: "/multimedia/drohnen", image: "/images/hero/drone-hero.jpg" },
  { key: "laundry", href: "/haushalt/waschmaschinen", image: "/images/hero/laundry-hero.jpg" },
  { key: "coffee", href: "/haushalt/kaffeemaschinen", image: "/images/hero/coffee-hero.jpg" },
];

// Délai avant passage automatique au slide suivant
const AUTOPLAY_INTERVAL = 6000;

export function HeroBanner() {
  const t = useTranslations("hero");
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => {
      setActive((current) => (current + 1) % slides.length);
    }, AUTOPLAY_INTERVAL);
    return () => clearInterval(timer);
  }, [paused]);

  // Garde l'index dans les bornes, y compris pour -1
  function goTo(index: number) {
    setActive((index + slides.length) % slides.length);
  }

  const slide = slides[active];

  return (
    <section
      className="relative overflow-hidden bg-secondary"
      aria-roledescription="carousel"
      aria-label={t("ariaLabel")}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* Seul titre de niveau 1 de la page, et le seul élément de tout ce bloc qui
          ne change jamais avec le slide actif : Google en tire une description
          stable du site plutôt qu'un rabais du moment, qui peut avoir disparu à
          la prochaine visite d'exploration. Visible, pas seulement présent pour
          les robots — un H1 cousu au visuel plutôt que caché reste la pratique la
          plus sûre. */}
      <h1 className="relative z-10 mx-auto max-w-screen-xl px-6 pt-3 text-xs font-bold tracking-wide text-secondary-foreground/60 uppercase sm:px-10 lg:px-16">
        {t("tagline")}
      </h1>

      <div className="relative mx-auto h-[280px] max-w-screen-xl sm:h-[360px]">
        {slides.map((item, index) => (
          <Image
            key={item.image}
            src={item.image}
            alt={index === active ? t(`slides.${item.key}.alt`) : ""}
            fill
            priority={index === 0}
            sizes="100vw"
            className={cn(
              "object-cover opacity-0 transition-opacity duration-700",
              index === active && "opacity-70",
            )}
          />
        ))}

        <div className="absolute inset-0 bg-gradient-to-r from-secondary/90 via-secondary/40 to-transparent" />

        {/* La clé force le remontage, pour rejouer l'animation à chaque slide */}
        <div
          key={active}
          className="animate-in fade-in slide-in-from-left-8 relative z-10 flex h-full max-w-lg flex-col justify-center gap-4 px-6 duration-700 sm:px-10 lg:px-16"
          aria-live="polite"
        >
          <span className="inline-block w-fit rounded-sm bg-accent px-2 py-1 text-xs font-black text-accent-foreground">
            {t(`slides.${slide.key}.eyebrow`)}
          </span>
          <h2 className="text-2xl leading-tight font-black text-white sm:text-4xl">
            {t(`slides.${slide.key}.title`)}
          </h2>
          <p className="text-sm text-white/80 sm:text-base">{t(`slides.${slide.key}.subtitle`)}</p>
          <Link
            href={slide.href}
            className="w-fit rounded-sm bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition-all hover:-translate-y-0.5 hover:brightness-110"
          >
            {t(`slides.${slide.key}.cta`)}
          </Link>
        </div>

        <button
          type="button"
          onClick={() => goTo(active - 1)}
          aria-label={t("previous")}
          className="absolute top-1/2 left-3 z-20 hidden -translate-y-1/2 rounded-full bg-black/30 p-2 text-white transition-colors hover:bg-black/50 lg:block"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => goTo(active + 1)}
          aria-label={t("next")}
          className="absolute top-1/2 right-3 z-20 hidden -translate-y-1/2 rounded-full bg-black/30 p-2 text-white transition-colors hover:bg-black/50 lg:block"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {slides.map((item, index) => (
            <button
              key={item.image}
              type="button"
              onClick={() => goTo(index)}
              aria-label={t("slideLabel", {
                index: String(index + 1),
                title: t(`slides.${item.key}.title`),
              })}
              aria-current={index === active}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                index === active ? "w-6 bg-primary" : "w-2 bg-white/60 hover:bg-white",
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

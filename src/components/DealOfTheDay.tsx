"use client";

import Image from "next/image";
import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { Product } from "@/types/home";

interface Remaining {
  hours: string;
  minutes: string;
  seconds: string;
}

// Horloge à la seconde : le serveur ignore l'heure du visiteur et renvoie donc
// null — le vrai compte à rebours ne démarre qu'après l'hydratation.
let cachedSecond: number | null = null;

function subscribe(onStoreChange: () => void): () => void {
  const timer = setInterval(() => {
    cachedSecond = Math.floor(Date.now() / 1000);
    onStoreChange();
  }, 1000);
  return () => clearInterval(timer);
}

function getSnapshot(): number | null {
  if (cachedSecond === null) cachedSecond = Math.floor(Date.now() / 1000);
  return cachedSecond;
}

function getServerSnapshot(): number | null {
  return null;
}

function remainingUntilMidnight(second: number): Remaining {
  const midnight = new Date(second * 1000);
  midnight.setHours(24, 0, 0, 0);
  const totalSeconds = Math.max(0, Math.floor(midnight.getTime() / 1000) - second);

  return {
    hours: String(Math.floor(totalSeconds / 3600)).padStart(2, "0"),
    minutes: String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0"),
    seconds: String(totalSeconds % 60).padStart(2, "0"),
  };
}

export function DealOfTheDay({ product, saving }: { product: Product; saving: string }) {
  const t = useTranslations("home.deal");
  const second = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const remaining = second === null ? null : remainingUntilMidnight(second);

  const countdown = [
    { key: "hours", value: remaining?.hours ?? "--", label: t("hours") },
    { key: "minutes", value: remaining?.minutes ?? "--", label: t("minutes") },
    { key: "seconds", value: remaining?.seconds ?? "--", label: t("seconds") },
  ];

  return (
    <section className="mx-auto max-w-screen-xl px-3 py-6">
      <div className="grid overflow-hidden rounded-sm border border-border bg-secondary sm:grid-cols-2">
        <div className="relative aspect-[4/3] bg-white sm:aspect-auto sm:min-h-[340px]">
          <Image
            src={product.image}
            alt={product.alt}
            fill
            sizes="(min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
          <span className="absolute top-3 left-3 rounded-sm bg-accent px-2 py-1 text-xs font-black text-accent-foreground">
            {t("badge")}
          </span>
        </div>

        <div className="flex flex-col justify-center gap-4 p-6 sm:p-8">
          <div>
            <p className="text-xs font-bold tracking-wide text-white/60 uppercase">{product.brand}</p>
            <h2 className="text-xl leading-tight font-black text-white sm:text-2xl">{product.name}</h2>
          </div>

          <ul className="flex flex-col gap-1">
            {product.bullets.map((bullet) => (
              <li key={bullet} className="flex items-center gap-2 text-sm text-white/80">
                <Check className="h-4 w-4 shrink-0 text-accent" />
                {bullet}
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-baseline gap-3">
            {product.oldPrice && (
              <span className="text-sm text-white/50 line-through">{product.oldPrice}</span>
            )}
            <span className="text-3xl font-black text-white">{product.price}</span>
            <span className="rounded-sm bg-accent px-2 py-0.5 text-xs font-black text-accent-foreground">
              {t("saving", { amount: saving })}
            </span>
          </div>

          {/* Stock réel du produit choisi par pickDeal (page.tsx), jamais un
              chiffre inventé : ni fausse rareté, ni barre de progression
              calculée sur un total qui n'existe pas. */}
          {typeof product.stock === "number" && product.stock > 0 && (
            <p className="text-xs text-white/60">{t("stockLeft", { stock: product.stock })}</p>
          )}

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex gap-2">
              {countdown.map(({ key, value, label }) => (
                <div
                  key={key}
                  className="flex min-w-[52px] flex-col items-center rounded-sm bg-white/10 px-3 py-2"
                >
                  <span className="text-xl font-black tabular-nums text-white">{value}</span>
                  <span className="text-[10px] font-semibold tracking-wide text-white/60 uppercase">
                    {label}
                  </span>
                </div>
              ))}
            </div>
            <Link
              href={product.href}
              className="rounded-sm bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition-all hover:-translate-y-0.5 hover:brightness-110"
            >
              {t("cta")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

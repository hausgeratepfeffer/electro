"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatCents } from "@/lib/cart";
import { TRAFFIC_CHANNEL_LABELS } from "@/lib/traffic";
import type { RecoveryRow, RecoveryState } from "@/server/checkoutRecovery";
import type { TrafficChannel } from "@/lib/traffic";

function trafficLabel(channel: string): string {
  return channel in TRAFFIC_CHANNEL_LABELS
    ? TRAFFIC_CHANNEL_LABELS[channel as TrafficChannel].de
    : "—";
}

const STATE_LABELS: Record<RecoveryState, string> = {
  active: "Läuft",
  converted: "Bestellt",
  unsubscribed: "Abgemeldet",
  completed: "Abgeschlossen",
  failed: "Fehlgeschlagen",
};

const STATE_BADGES: Record<RecoveryState, string> = {
  active: "bg-accent text-accent-foreground",
  converted: "bg-[#16a34a]/10 text-[#16a34a]",
  unsubscribed: "bg-muted text-muted-foreground",
  completed: "bg-muted text-muted-foreground",
  failed: "bg-primary/10 text-primary",
};

const STEP_LABELS: Record<string, string> = {
  contact: "Kontakt",
  payment: "Zahlung",
  review: "Prüfung",
};

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const FILTERS: { value: RecoveryState | undefined; label: string }[] = [
  { value: undefined, label: "Toutes" },
  { value: "active", label: STATE_LABELS.active },
  { value: "converted", label: STATE_LABELS.converted },
  { value: "unsubscribed", label: STATE_LABELS.unsubscribed },
  { value: "completed", label: STATE_LABELS.completed },
  { value: "failed", label: STATE_LABELS.failed },
];

export function RecoveryTable({
  rows,
  enabled,
  activeState,
}: {
  rows: RecoveryRow[];
  enabled: boolean;
  activeState?: RecoveryState;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function send(body: Record<string, unknown>, pendingKey: string, fallback: string) {
    setPending(pendingKey);
    setError(null);
    const response = await fetch("/api/admin/recovery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setPending(null);

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? fallback);
      return;
    }
    router.refresh();
  }

  function toggle() {
    if (enabled && !window.confirm("Keine Warenkorb-Erinnerungen mehr senden?")) return;
    void send({ action: "toggle", enabled: !enabled }, "toggle", "Le statut n'a pas pu être modifié.");
  }

  function stop(id: string) {
    void send({ action: "stop", id }, id, "L'arrêt a échoué.");
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <nav className="flex flex-wrap gap-2">
          {FILTERS.map((filter) => (
            <Link
              key={filter.value ?? "all"}
              href={
                filter.value
                  ? `/admin/warenkorb-erinnerungen?state=${filter.value}`
                  : "/admin/warenkorb-erinnerungen"
              }
              aria-current={activeState === filter.value ? "page" : undefined}
              className={`rounded-sm border px-3 py-1.5 text-xs font-bold ${
                activeState === filter.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-white text-foreground hover:border-primary"
              }`}
            >
              {filter.label}
            </Link>
          ))}
        </nav>

        <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <input
            type="checkbox"
            checked={enabled}
            onChange={toggle}
            disabled={pending === "toggle"}
            className="h-4 w-4 accent-primary"
          />
          Erinnerungen aktiv
        </label>
      </div>

      {error && (
        <p className="mb-3 rounded-sm border border-destructive bg-white px-4 py-3 text-sm font-semibold text-destructive">
          {error}
        </p>
      )}

      <div className="overflow-x-auto rounded-sm border border-border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted text-xs font-bold tracking-wide text-muted-foreground uppercase">
            <tr>
              <th className="px-4 py-3">E-Mail</th>
              <th className="px-4 py-3">Warenkorb</th>
              <th className="px-4 py-3">Herkunft</th>
              <th className="px-4 py-3">Schritt</th>
              <th className="px-4 py-3">Nachrichten</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Erfasst am</th>
              <th className="px-4 py-3">Letzte Nachricht</th>
              <th className="px-4 py-3 text-right">Aktion</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                  Keine Warenkorb-Erinnerungen gefunden.
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-semibold text-foreground">{row.email}</td>
                <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                  {formatCents(row.totalCents)} · {row.itemCount} Artikel
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                  {trafficLabel(row.trafficChannel)}
                  {row.trafficSource && (
                    <span className="block text-xs text-muted-foreground/70">{row.trafficSource}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {STEP_LABELS[row.lastStep] ?? row.lastStep}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{row.sentCount} / 3</td>
                <td className="px-4 py-3">
                  <span className={`rounded-sm px-2 py-1 text-xs font-bold ${STATE_BADGES[row.state]}`}>
                    {STATE_LABELS[row.state]}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                  {dateFormatter.format(new Date(row.createdAt))}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                  {row.lastSentAt ? dateFormatter.format(new Date(row.lastSentAt)) : "—"}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  {row.state === "active" && (
                    <button
                      type="button"
                      onClick={() => stop(row.id)}
                      disabled={pending === row.id}
                      className="rounded-sm border border-border px-3 py-1.5 text-xs font-bold text-foreground hover:border-primary disabled:opacity-50"
                    >
                      Stoppen
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

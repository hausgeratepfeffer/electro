import { requireAdminSession } from "@/lib/dal";
import { trafficStats, PAGE_VIEW_RETENTION_DAYS } from "@/server/pageViews";

const CARD = "rounded-sm border border-border bg-white p-5";

const countryNames = new Intl.DisplayNames(["fr"], { type: "region" });

/** « DE » -> « Allemagne ». Code inconnu ou absent : affiché tel quel. */
function countryLabel(code: string): string {
  try {
    return countryNames.of(code) ?? code;
  } catch {
    return code;
  }
}

function StatCard({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <div className={CARD}>
      <p className="text-[11px] font-black tracking-widest text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-1 text-3xl font-black text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function RankedTable({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; count: number }[];
}) {
  const max = rows.reduce((best, row) => Math.max(best, row.count), 0) || 1;

  return (
    <div className={CARD}>
      <p className="mb-3 text-sm font-bold text-foreground">{title}</p>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucune donnée sur cette période.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li key={row.label} className="text-sm">
              <div className="mb-1 flex items-center justify-between gap-3">
                <span className="truncate text-foreground" title={row.label}>
                  {row.label}
                </span>
                <span className="shrink-0 font-bold text-foreground">{row.count}</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted">
                <div
                  className="h-1.5 rounded-full bg-primary"
                  style={{ width: `${Math.max(4, (row.count / max) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default async function TrafficPage() {
  await requireAdminSession();

  const stats = await trafficStats(30);
  const daysWithTraffic = stats.dailyCounts.length || 1;
  const averagePerDay = Math.round(stats.totalViews / daysWithTraffic);

  return (
    <div>
      <div className="mb-2">
        <h1 className="text-2xl font-black text-foreground">Trafic</h1>
        <p className="mt-1 text-sm text-muted-foreground">Derniers 30 jours</p>
      </div>

      <p className="mb-6 text-sm text-muted-foreground">
        Pages vues anonymes : aucun cookie, aucun identifiant de visiteur, aucune adresse IP
        conservée — seuls le chemin, le pays et la ville sont enregistrés. Conservées{" "}
        {PAGE_VIEW_RETENTION_DAYS} jours.
      </p>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="Pages vues" value={stats.totalViews} hint="sur 30 jours" />
        <StatCard label="Moyenne / jour" value={averagePerDay} hint="pages vues par jour" />
        <StatCard
          label="Pays distincts"
          value={stats.topCountries.length}
          hint="parmi les 10 premiers"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <RankedTable
          title="Pages les plus vues"
          rows={stats.topPaths.map((row) => ({ label: row.path, count: row.count }))}
        />
        <RankedTable
          title="Pays"
          rows={stats.topCountries.map((row) => ({
            label: countryLabel(row.country),
            count: row.count,
          }))}
        />
        <RankedTable
          title="Villes"
          rows={stats.topCities.map((row) => ({
            label: row.country ? `${row.city} (${countryLabel(row.country)})` : row.city,
            count: row.count,
          }))}
        />
      </div>
    </div>
  );
}

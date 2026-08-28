import type { GuideComparisonTable } from "@/server/types";

/**
 * Encodage/décodage du tableau comparatif d'une section de guide catégorie.
 *
 * Même principe que Product.bullets : une forme libre (nombre de colonnes
 * variable d'une section à l'autre) encodée en JSON dans une seule colonne,
 * plutôt qu'un schéma à colonnes fixes qui ne conviendrait à aucune section en
 * particulier.
 */

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

export function parseGuideTable(raw: string): GuideComparisonTable | undefined {
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return undefined;
    const { caption, columns, rows } = parsed as Record<string, unknown>;
    if (typeof caption !== "string" || !isStringArray(columns) || !Array.isArray(rows)) return undefined;
    const cleanRows = rows.filter(isStringArray).filter((row) => row.length === columns.length);
    if (cleanRows.length === 0) return undefined;
    return { caption, columns, rows: cleanRows };
  } catch {
    return undefined;
  }
}

export function encodeGuideTable(table: GuideComparisonTable | undefined): string {
  return table ? JSON.stringify(table) : "";
}

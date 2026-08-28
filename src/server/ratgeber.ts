/**
 * Articles Ratgeber (guides d'achat) : accès aux données, back-office et
 * boutique.
 *
 * Même séparation que le reste du site : ce module parle à Prisma, les pages
 * publiques et le back-office l'appellent, jamais l'inverse. Le texte suit la
 * même convention que les pages légales — voir src/lib/richText.ts.
 */

import { prisma } from "@/server/prisma";
import { slugify } from "@/lib/slugify";
import { stripMarks } from "@/lib/richText";

// ---- Types ----

export interface RatgeberPostRecord {
  id: string;
  slug: string;
  title: string;
  titleEn: string;
  excerpt: string;
  excerptEn: string;
  body: string;
  bodyEn: string;
  coverImage: string;
  coverImageAlt: string;
  coverImageAltEn: string;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Version déjà résolue pour une langue donnée — ce que lit la boutique. */
export interface RatgeberPostView {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  coverImage: string;
  coverImageAlt: string;
  publishedAt: string;
  updatedAt: string;
}

export type RatgeberPostInput = Omit<RatgeberPostRecord, "id" | "createdAt" | "updatedAt">;

// ---- Conversions ----

type Row = NonNullable<Awaited<ReturnType<typeof prisma.ratgeberPost.findUnique>>>;

function toRecord(row: Row): RatgeberPostRecord {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    titleEn: row.titleEn,
    excerpt: row.excerpt,
    excerptEn: row.excerptEn,
    body: row.body,
    bodyEn: row.bodyEn,
    coverImage: row.coverImage,
    coverImageAlt: row.coverImageAlt,
    coverImageAltEn: row.coverImageAltEn,
    published: row.published,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** Résout la langue demandée, repli sur l'allemand si le champ anglais est vide. */
function toView(row: Row, locale: string): RatgeberPostView {
  const en = locale === "en";
  return {
    slug: row.slug,
    title: (en && row.titleEn.trim()) || row.title,
    excerpt: (en && row.excerptEn.trim()) || row.excerpt,
    body: (en && row.bodyEn.trim()) || row.body,
    coverImage: row.coverImage,
    coverImageAlt: (en && row.coverImageAltEn.trim()) || row.coverImageAlt,
    // publishedAt ne peut pas être vide ici : seuls des articles publiés
    // atteignent toView (voir listPublished.../getPublished...).
    publishedAt: row.publishedAt?.toISOString() ?? row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// ---- Back-office : tous les articles, brouillons compris ----

export async function listRatgeberPostsAdmin(): Promise<RatgeberPostRecord[]> {
  const rows = await prisma.ratgeberPost.findMany({ orderBy: { createdAt: "desc" } });
  return rows.map(toRecord);
}

export async function getRatgeberPostAdmin(id: string): Promise<RatgeberPostRecord | undefined> {
  const row = await prisma.ratgeberPost.findUnique({ where: { id } });
  return row ? toRecord(row) : undefined;
}

export class RatgeberSlugConflictError extends Error {
  constructor(readonly slug: string) {
    super(`Ein Artikel mit dem Slug „${slug}" existiert bereits.`);
    this.name = "RatgeberSlugConflictError";
  }
}

async function assertSlugFree(slug: string, excludeId?: string): Promise<void> {
  const conflict = await prisma.ratgeberPost.findUnique({ where: { slug } });
  if (conflict && conflict.id !== excludeId) throw new RatgeberSlugConflictError(slug);
}

/**
 * Une date saisie à la main dans le formulaire fait toujours foi, publié ou
 * non — c'est justement ce que l'administration doit pouvoir corriger
 * (republier un article sous une autre date, préparer une date à l'avance…).
 * Sans date saisie, le premier passage en publié se fige sur l'instant
 * présent, comme avant ; les passages suivants gardent la date déjà posée.
 */
function resolvePublishedAt(
  requestedIso: string | null,
  published: boolean,
  previous: Date | null,
): Date | null {
  if (requestedIso) {
    const parsed = new Date(requestedIso);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  if (!published) return null;
  return previous ?? new Date();
}

export async function createRatgeberPost(input: RatgeberPostInput): Promise<RatgeberPostRecord> {
  const slug = slugify(input.slug || input.title);
  if (!slug) throw new Error("Impossible de construire un slug valide à partir de ce titre.");
  await assertSlugFree(slug);

  const row = await prisma.ratgeberPost.create({
    data: {
      ...input,
      slug,
      publishedAt: resolvePublishedAt(input.publishedAt, input.published, null),
    },
  });
  return toRecord(row);
}

export async function updateRatgeberPost(
  id: string,
  input: RatgeberPostInput,
): Promise<RatgeberPostRecord | undefined> {
  const current = await prisma.ratgeberPost.findUnique({ where: { id } });
  if (!current) return undefined;

  const slug = slugify(input.slug || input.title);
  if (!slug) throw new Error("Impossible de construire un slug valide à partir de ce titre.");
  await assertSlugFree(slug, id);

  const row = await prisma.ratgeberPost.update({
    where: { id },
    data: {
      ...input,
      slug,
      publishedAt: resolvePublishedAt(input.publishedAt, input.published, current.publishedAt),
    },
  });
  return toRecord(row);
}

export async function deleteRatgeberPost(id: string): Promise<boolean> {
  try {
    await prisma.ratgeberPost.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}

// ---- Boutique : articles publiés uniquement ----

/**
 * Recalculée à chaque appel — un `new Date()` figé dans une constante de
 * module se serait évalué une seule fois, au premier chargement du
 * processus, et aurait exclu tout article publié après ce moment-là.
 */
function publishedWhere() {
  return { published: true, publishedAt: { lte: new Date() } } as const;
}

export async function listPublishedRatgeberPosts(locale: string): Promise<RatgeberPostView[]> {
  const rows = await prisma.ratgeberPost.findMany({
    where: publishedWhere(),
    orderBy: { publishedAt: "desc" },
  });
  return rows.map((row) => toView(row, locale));
}

export async function getPublishedRatgeberPostBySlug(
  slug: string,
  locale: string,
): Promise<RatgeberPostView | undefined> {
  const row = await prisma.ratgeberPost.findFirst({ where: { slug, ...publishedWhere() } });
  return row ? toView(row, locale) : undefined;
}

/** Texte nu de l'extrait, pour une meta description ou un aperçu de liste sans mise en forme. */
export function plainExcerpt(view: Pick<RatgeberPostView, "excerpt">): string {
  return stripMarks(view.excerpt);
}

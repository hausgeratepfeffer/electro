import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/adminApi";
import {
  deleteRatgeberPost,
  getRatgeberPostAdmin,
  RatgeberSlugConflictError,
  updateRatgeberPost,
} from "@/server/ratgeber";
import type { RatgeberPostInput } from "@/server/ratgeber";

type Params = Promise<{ id: string }>;

function parseInput(body: unknown): { input?: RatgeberPostInput; error?: string } {
  const raw = (body ?? {}) as Record<string, unknown>;
  const title = typeof raw.title === "string" ? raw.title.trim() : "";
  const bodyText = typeof raw.body === "string" ? raw.body : "";

  if (!title) return { error: "Bitte einen Titel angeben." };
  if (!bodyText.trim()) return { error: "Bitte einen Artikeltext angeben." };

  return {
    input: {
      slug: typeof raw.slug === "string" ? raw.slug.trim() : "",
      title,
      titleEn: typeof raw.titleEn === "string" ? raw.titleEn : "",
      excerpt: typeof raw.excerpt === "string" ? raw.excerpt : "",
      excerptEn: typeof raw.excerptEn === "string" ? raw.excerptEn : "",
      body: bodyText,
      bodyEn: typeof raw.bodyEn === "string" ? raw.bodyEn : "",
      coverImage: typeof raw.coverImage === "string" ? raw.coverImage : "",
      coverImageAlt: typeof raw.coverImageAlt === "string" ? raw.coverImageAlt : "",
      coverImageAltEn: typeof raw.coverImageAltEn === "string" ? raw.coverImageAltEn : "",
      published: raw.published === true,
      publishedAt: typeof raw.publishedAt === "string" && raw.publishedAt.trim() ? raw.publishedAt.trim() : null,
    },
  };
}

export async function GET(_request: Request, { params }: { params: Params }) {
  const { unauthorized } = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const post = await getRatgeberPostAdmin(id);
  if (!post) return NextResponse.json({ error: "Introuvable." }, { status: 404 });
  return NextResponse.json(post);
}

export async function PUT(request: Request, { params }: { params: Params }) {
  const { unauthorized } = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const { input, error } = parseInput(body);
  if (!input) return NextResponse.json({ error }, { status: 400 });

  try {
    const post = await updateRatgeberPost(id, input);
    if (!post) return NextResponse.json({ error: "Introuvable." }, { status: 404 });
    return NextResponse.json(post);
  } catch (error) {
    const message =
      error instanceof RatgeberSlugConflictError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Échec de l'enregistrement.";
    const status = error instanceof RatgeberSlugConflictError ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_request: Request, { params }: { params: Params }) {
  const { unauthorized } = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const deleted = await deleteRatgeberPost(id);
  if (!deleted) return NextResponse.json({ error: "Introuvable." }, { status: 404 });
  return NextResponse.json({ success: true });
}

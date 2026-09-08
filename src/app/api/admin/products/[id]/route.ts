import { invaliderCatalogue } from "@/server/cacheCatalogue";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/adminApi";
import { localizedUrl } from "@/lib/hreflang";
import { pingIndexNow } from "@/lib/indexnow";
import { parseProductInput } from "@/server/productInput";
import { deleteProduct, getProductRecord, updateProduct } from "@/server/store";
import type { ProductRecord } from "@/server/types";

/** URL publiques DE + EN d'une fiche produit, pour la notification IndexNow. */
function productUrls(product: ProductRecord): string[] {
  if (!product.slug) return [];
  const path = `/${product.categoryId}/${product.slug}`;
  return [localizedUrl(path, "de"), localizedUrl(path, "en")];
}

type Params = Promise<{ id: string }>;

export async function GET(_request: Request, { params }: { params: Params }) {
  const { unauthorized } = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const product = await getProductRecord(id);
  if (!product) return NextResponse.json({ error: "Introuvable." }, { status: 404 });
  return NextResponse.json(product);
}

export async function PUT(request: Request, { params }: { params: Params }) {
  const { unauthorized } = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Requête invalide." }, { status: 400 });

  const { values, errors } = parseProductInput(body, "update");
  if (errors.length > 0) {
    return NextResponse.json({ error: errors[0], errors }, { status: 400 });
  }

  try {
    const updated = await updateProduct(id, values);
    if (!updated) return NextResponse.json({ error: "Introuvable." }, { status: 404 });
    invaliderCatalogue();
    void pingIndexNow(productUrls(updated));
    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Échec de l'enregistrement.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Params }) {
  const { unauthorized } = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const deleted = await deleteProduct(id);
  if (!deleted) return NextResponse.json({ error: "Introuvable." }, { status: 404 });
  invaliderCatalogue();
  return NextResponse.json({ success: true });
}

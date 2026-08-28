"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { RichTextField } from "@/components/admin/RichTextField";
import { slugify } from "@/lib/slugify";
import type { RatgeberPostRecord } from "@/server/ratgeber";

interface RatgeberPostFormProps {
  mode: "new" | "edit";
  initialData?: RatgeberPostRecord;
}

export function RatgeberPostForm({ mode, initialData }: RatgeberPostFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [titleEn, setTitleEn] = useState(initialData?.titleEn ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  // Le slug ne se recalcule automatiquement que tant que l'auteur ne l'a pas
  // touché lui-même — sinon corriger une coquille dans le titre écraserait
  // silencieusement une adresse déjà choisie à la main.
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [excerpt, setExcerpt] = useState(initialData?.excerpt ?? "");
  const [excerptEn, setExcerptEn] = useState(initialData?.excerptEn ?? "");
  const [body, setBody] = useState(initialData?.body ?? "");
  const [bodyEn, setBodyEn] = useState(initialData?.bodyEn ?? "");
  const [coverImage, setCoverImage] = useState(initialData?.coverImage ?? "");
  const [coverImageAlt, setCoverImageAlt] = useState(initialData?.coverImageAlt ?? "");
  const [coverImageAltEn, setCoverImageAltEn] = useState(initialData?.coverImageAltEn ?? "");
  const [published, setPublished] = useState(initialData?.published ?? false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const payload = {
      title,
      titleEn,
      slug,
      excerpt,
      excerptEn,
      body,
      bodyEn,
      coverImage,
      coverImageAlt,
      coverImageAltEn,
      published,
    };

    const url = mode === "new" ? "/api/admin/ratgeber" : `/api/admin/ratgeber/${initialData?.id}`;
    const method = mode === "new" ? "POST" : "PUT";

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setPending(false);
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setError(data?.error ?? "Échec de l'enregistrement.");
      return;
    }

    router.push("/admin/ratgeber");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        <section className="rounded-sm border border-border bg-white p-5">
          <h2 className="mb-4 text-sm font-black tracking-wide text-foreground uppercase">Allemand</h2>

          <div className="mb-4">
            <label className="mb-1 block text-sm font-semibold text-foreground" htmlFor="title">
              Titre <span className="text-destructive">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(event) => handleTitleChange(event.target.value)}
              required
              className="w-full rounded-sm border border-border px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>

          <RichTextField
            label="Résumé (extrait de liste et meta description)"
            value={excerpt}
            onChange={setExcerpt}
            rows={3}
            hint="155 caractères environ apparaissent dans les résultats de recherche."
          />

          <RichTextField
            label="Texte de l'article"
            value={body}
            onChange={setBody}
            rows={16}
            required
            hint='Un paragraphe qui commence par "## " devient un sous-titre (ex. "## Warum riecht meine Waschmaschine?").'
          />
        </section>

        <section className="rounded-sm border border-border bg-white p-5">
          <h2 className="mb-4 text-sm font-black tracking-wide text-foreground uppercase">
            Anglais <span className="font-normal text-muted-foreground normal-case">(facultatif)</span>
          </h2>
          <p className="mb-4 text-xs text-muted-foreground">
            Laissé vide, l&apos;article affiche le texte allemand sur la version anglaise du site.
          </p>

          <div className="mb-4">
            <label className="mb-1 block text-sm font-semibold text-foreground" htmlFor="titleEn">
              Titre
            </label>
            <input
              id="titleEn"
              type="text"
              value={titleEn}
              onChange={(event) => setTitleEn(event.target.value)}
              className="w-full rounded-sm border border-border px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>

          <RichTextField label="Résumé" value={excerptEn} onChange={setExcerptEn} rows={3} />
          <RichTextField
            label="Texte de l'article"
            value={bodyEn}
            onChange={setBodyEn}
            rows={16}
            hint='Même convention : "## " en début de paragraphe pour un sous-titre.'
          />
        </section>
      </div>

      <div className="space-y-6">
        <section className="rounded-sm border border-border bg-white p-5">
          <h2 className="mb-4 text-sm font-black tracking-wide text-foreground uppercase">Publication</h2>

          <div className="mb-4">
            <label className="mb-1 block text-sm font-semibold text-foreground" htmlFor="slug">
              Adresse (slug) <span className="text-destructive">*</span>
            </label>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>/ratgeber/</span>
              <input
                id="slug"
                type="text"
                value={slug}
                onChange={(event) => {
                  setSlugTouched(true);
                  setSlug(slugify(event.target.value));
                }}
                required
                className="flex-1 rounded-sm border border-border px-2 py-1.5 font-mono text-xs outline-none focus:border-primary"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <input
              type="checkbox"
              checked={published}
              onChange={(event) => setPublished(event.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            Veröffentlicht
          </label>
          <p className="mt-1 text-xs text-muted-foreground">
            {published
              ? "Visible dans /ratgeber et dans le sitemap."
              : "Brouillon : invisible sur la boutique et absent du sitemap."}
          </p>
        </section>

        <section className="rounded-sm border border-border bg-white p-5">
          <h2 className="mb-4 text-sm font-black tracking-wide text-foreground uppercase">
            Image de couverture
          </h2>
          <ImageUploadField
            value={coverImage}
            onChange={setCoverImage}
            label="Image"
            hint="Affichée en tête d'article et dans la liste /ratgeber."
          />
          <div className="mt-3">
            <label className="mb-1 block text-sm font-semibold text-foreground" htmlFor="coverImageAlt">
              Texte alternatif (DE)
            </label>
            <input
              id="coverImageAlt"
              type="text"
              value={coverImageAlt}
              onChange={(event) => setCoverImageAlt(event.target.value)}
              className="w-full rounded-sm border border-border px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <div className="mt-3">
            <label className="mb-1 block text-sm font-semibold text-foreground" htmlFor="coverImageAltEn">
              Texte alternatif (EN)
            </label>
            <input
              id="coverImageAltEn"
              type="text"
              value={coverImageAltEn}
              onChange={(event) => setCoverImageAltEn(event.target.value)}
              className="w-full rounded-sm border border-border px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
        </section>

        {error && (
          <p className="rounded-sm border border-destructive bg-white px-4 py-3 text-sm font-semibold text-destructive">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-sm bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:brightness-110 disabled:opacity-50"
        >
          {pending ? "Enregistrement…" : mode === "new" ? "Créer l'article" : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}

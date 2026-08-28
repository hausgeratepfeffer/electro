import Link from "next/link";
import { Pencil } from "lucide-react";
import { requireAdminSession } from "@/lib/dal";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { IconActionLink } from "@/components/admin/IconAction";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { paginate, parsePageParam } from "@/lib/pagination";
import { listRatgeberPostsAdmin } from "@/server/ratgeber";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

export default async function AdminRatgeberPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireAdminSession();

  const params = await searchParams;
  const posts = await listRatgeberPostsAdmin();
  const pageInfo = paginate(posts, parsePageParam(params.page));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-foreground">Ratgeber</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Articles de fond publiés sur /ratgeber, distincts des guides catégorie.
          </p>
        </div>
        <Link
          href="/admin/ratgeber/new"
          className="rounded-sm bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:brightness-110"
        >
          Nouvel article
        </Link>
      </div>

      {pageInfo.totalItems === 0 ? (
        <div className="rounded-sm border border-border bg-white p-5">
          <p className="text-sm text-muted-foreground">
            Aucun article pour le moment. La structure est prête — créez le premier article quand
            vous voulez.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-sm border border-border bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted text-xs font-bold tracking-wide text-muted-foreground uppercase">
                <tr>
                  <th className="px-4 py-3">Titre</th>
                  <th className="px-4 py-3">Adresse</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Publié le</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageInfo.items.map((post) => (
                  <tr key={post.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-semibold text-foreground">
                      <Link href={`/admin/ratgeber/${post.id}`} className="hover:text-primary">
                        {post.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      /ratgeber/{post.slug}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          post.published
                            ? "rounded-sm bg-[#16a34a]/10 px-2 py-1 text-xs font-bold text-[#16a34a]"
                            : "rounded-sm bg-muted px-2 py-1 text-xs font-bold text-muted-foreground"
                        }
                      >
                        {post.published ? "Veröffentlicht" : "Entwurf"}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {post.publishedAt ? dateFormatter.format(new Date(post.publishedAt)) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <IconActionLink href={`/admin/ratgeber/${post.id}`} label="Modifier" icon={Pencil} />
                        <DeleteButton
                          action={`/api/admin/ratgeber/${post.id}`}
                          confirmLabel={`Supprimer définitivement l'article « ${post.title} » ?`}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <AdminPagination {...pageInfo} basePath="/admin/ratgeber" params={params} label="articles" />
        </>
      )}
    </div>
  );
}

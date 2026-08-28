import { notFound } from "next/navigation";
import { requireAdminSession } from "@/lib/dal";
import { RatgeberPostForm } from "@/components/admin/RatgeberPostForm";
import { getRatgeberPostAdmin } from "@/server/ratgeber";

export default async function EditRatgeberPostPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminSession();

  const { id } = await params;
  const post = await getRatgeberPostAdmin(id);
  if (!post) notFound();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-black text-foreground">Artikel bearbeiten</h1>
      <RatgeberPostForm mode="edit" initialData={post} />
    </div>
  );
}

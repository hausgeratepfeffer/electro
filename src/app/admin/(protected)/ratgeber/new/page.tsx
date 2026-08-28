import { requireAdminSession } from "@/lib/dal";
import { RatgeberPostForm } from "@/components/admin/RatgeberPostForm";

export default async function NewRatgeberPostPage() {
  await requireAdminSession();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-black text-foreground">Nouvel article Ratgeber</h1>
      <RatgeberPostForm mode="new" />
    </div>
  );
}

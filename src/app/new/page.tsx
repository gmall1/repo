import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { Nav } from "@/components/nav";
import { NewRepoForm } from "./new-repo-form";

export default async function NewRepoPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return (
    <div>
      <Nav />
      <div className="mx-auto mt-8 max-w-2xl px-4">
        <h1 className="text-2xl font-semibold">Create a new repository</h1>
        <p className="mt-1 text-sm text-[var(--fg-muted)]">
          A repository contains all the files for your project.
        </p>
        <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--bg-elev)] p-6">
          <NewRepoForm username={user.username} />
        </div>
      </div>
    </div>
  );
}

import { notFound, redirect } from "next/navigation";
import { Nav } from "@/components/nav";
import { RepoHeader } from "@/components/repo-header";
import { getSessionUser } from "@/lib/auth";
import { canSeeRepo, getRepoByOwnerAndName, isOwner, isStarred } from "@/lib/repo-data";
import { RepoSettingsForm } from "./settings-form";

type Props = { params: Promise<{ owner: string; name: string }> };

export default async function RepoSettings({ params }: Props) {
  const { owner, name } = await params;
  const repo = await getRepoByOwnerAndName(owner, name);
  if (!repo) notFound();
  const user = await getSessionUser();
  if (!canSeeRepo(repo, user)) notFound();
  if (!isOwner(repo, user)) redirect(`/${owner}/${name}`);
  const starred = user ? await isStarred(user.id, repo.id) : false;

  return (
    <div>
      <Nav />
      <RepoHeader repo={repo} starred={starred} loggedIn={!!user} active="settings" />
      <div className="mx-auto max-w-3xl px-4 py-6">
        <RepoSettingsForm
          owner={owner}
          name={name}
          description={repo.description || ""}
          visibility={repo.visibility}
        />
      </div>
    </div>
  );
}

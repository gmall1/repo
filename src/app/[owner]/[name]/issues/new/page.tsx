import { notFound, redirect } from "next/navigation";
import { Nav } from "@/components/nav";
import { RepoHeader } from "@/components/repo-header";
import { getSessionUser } from "@/lib/auth";
import { canSeeRepo, getRepoByOwnerAndName, isStarred } from "@/lib/repo-data";
import { NewIssueForm } from "./new-issue-form";

type Props = { params: Promise<{ owner: string; name: string }> };

export default async function NewIssue({ params }: Props) {
  const { owner, name } = await params;
  const repo = await getRepoByOwnerAndName(owner, name);
  if (!repo) notFound();
  const user = await getSessionUser();
  if (!canSeeRepo(repo, user)) notFound();
  if (!user) redirect(`/login?next=/${owner}/${name}/issues/new`);
  const starred = user ? await isStarred(user.id, repo.id) : false;

  return (
    <div>
      <Nav />
      <RepoHeader repo={repo} starred={starred} loggedIn={!!user} active="issues" />
      <div className="mx-auto max-w-3xl px-4 py-6">
        <h2 className="mb-4 text-lg font-semibold">Open a new issue</h2>
        <NewIssueForm owner={owner} name={name} />
      </div>
    </div>
  );
}

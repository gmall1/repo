import { notFound, redirect } from "next/navigation";
import { Nav } from "@/components/nav";
import { RepoHeader } from "@/components/repo-header";
import { getSessionUser } from "@/lib/auth";
import { canSeeRepo, getRepoByOwnerAndName, isStarred } from "@/lib/repo-data";
import { repoFsPath, listBranches, commitsBetween, mergeBase, diff } from "@/lib/git";
import { NewPRForm } from "./new-pr-form";

type Props = {
  params: Promise<{ owner: string; name: string }>;
  searchParams: Promise<{ base?: string; head?: string }>;
};

export default async function NewPRPage({ params, searchParams }: Props) {
  const { owner, name } = await params;
  const { base: baseQ, head: headQ } = await searchParams;
  const repo = await getRepoByOwnerAndName(owner, name);
  if (!repo) notFound();
  const user = await getSessionUser();
  if (!canSeeRepo(repo, user)) notFound();
  if (!user) redirect(`/login?next=/${owner}/${name}/pulls/new`);

  const repoPath = repoFsPath(repo.ownerName, repo.name);
  const branches = await listBranches(repoPath);
  const baseBranch = baseQ && branches.includes(baseQ) ? baseQ : repo.defaultBranch;
  const headBranch =
    headQ && branches.includes(headQ) ? headQ : branches.find((b) => b !== baseBranch) ?? baseBranch;

  const starred = user ? await isStarred(user.id, repo.id) : false;
  const mb = baseBranch === headBranch ? null : await mergeBase(repoPath, baseBranch, headBranch);
  const commits = mb ? await commitsBetween(repoPath, baseBranch, headBranch, 50) : [];
  const files = mb ? await diff(repoPath, baseBranch, headBranch) : [];

  return (
    <div>
      <Nav />
      <RepoHeader repo={repo} starred={starred} loggedIn={!!user} active="pulls" />
      <div className="mx-auto max-w-5xl px-4 py-6">
        <h2 className="mb-4 text-lg font-semibold">Open a new pull request</h2>
        <NewPRForm
          owner={owner}
          name={name}
          branches={branches}
          baseBranch={baseBranch}
          headBranch={headBranch}
          commitCount={commits.length}
          fileCount={files.length}
          additions={files.reduce((a, f) => a + f.additions, 0)}
          deletions={files.reduce((a, f) => a + f.deletions, 0)}
          firstCommitTitle={commits[commits.length - 1]?.message?.split("\n")[0] ?? ""}
        />
      </div>
    </div>
  );
}

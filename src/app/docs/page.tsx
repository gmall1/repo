import { Nav } from "@/components/nav";

export default function DocsPage() {
  return (
    <div>
      <Nav />
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-semibold">Docs</h1>
        <div className="markdown mt-6">
          <h2>Quick start</h2>
          <ol>
            <li>
              <strong>Create an account</strong> at <code>/signup</code>.
            </li>
            <li>
              <strong>Create a repository</strong> from the <code>+ New</code> button.
            </li>
            <li>
              <strong>Push code:</strong>
              <pre>
                <code>{`git remote add origin https://your-host/me/my-repo.git\ngit push -u origin main`}</code>
              </pre>
            </li>
          </ol>

          <h2>Authentication for git</h2>
          <p>
            For HTTPS push/pull, use your username and either your account password or a personal
            access token. Generate tokens in{" "}
            <a href="/settings/tokens">Settings → Tokens</a>.
          </p>
          <pre>
            <code>{`git push https://username@your-host/me/my-repo.git\nPassword: <your-password-or-pat>`}</code>
          </pre>

          <h2>Self-hosting</h2>
          <p>
            Repo runs as a single Next.js server with a Postgres database and a volume for git
            repos. The fastest way to start is docker-compose:
          </p>
          <pre>
            <code>{`# clone
git clone https://github.com/gmall1/repo.git && cd repo
# configure
cp .env.example .env  # edit values
# run
docker compose up -d`}</code>
          </pre>
          <p>
            All features (issues, PRs, AI review, search) are included in self-host. No feature
            gates.
          </p>

          <h2>AI features</h2>
          <p>
            Set <code>OPENAI_API_KEY</code> in your env to enable PR summaries, AI code review,
            commit message generation, and issue auto-triage. AI features are entirely optional —
            disable them by leaving the env var unset.
          </p>

          <h2>API</h2>
          <p>HTTP API is documented at <code>/docs/api</code> (coming soon).</p>

          <h2>Support</h2>
          <p>
            Open an issue at <a href="/gmall1/repo/issues">gmall1/repo</a>.
          </p>
        </div>
      </div>
    </div>
  );
}

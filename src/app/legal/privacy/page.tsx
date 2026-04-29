import { Nav } from "@/components/nav";

export default function PrivacyPage() {
  return (
    <div>
      <Nav />
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-semibold">Privacy Policy</h1>
        <div className="markdown mt-6 text-sm">
          <p>Last updated: {new Date().toISOString().slice(0, 10)}</p>

          <h2>What we collect</h2>
          <ul>
            <li>Account info: username, email, hashed password.</li>
            <li>Content you upload: repositories, issues, comments, pull requests.</li>
            <li>Operational logs: IP, user agent, request paths (for security and debugging).</li>
          </ul>

          <h2>How we use it</h2>
          <ul>
            <li>To provide the Service and authenticate you.</li>
            <li>
              To send transactional email (verification, password reset, security notifications).
            </li>
            <li>To investigate abuse and improve reliability.</li>
          </ul>

          <h2>AI features</h2>
          <p>
            When AI features are enabled, diffs and issue text from your private repos may be sent
            to our LLM provider (currently OpenAI) for summarization and review. AI features can be
            disabled per-repo. AI is fully optional and never trains on your data.
          </p>

          <h2>What we don&rsquo;t do</h2>
          <ul>
            <li>We do not sell your data.</li>
            <li>We do not use your private code to train models.</li>
            <li>We do not run third-party tracking pixels.</li>
          </ul>

          <h2>Your rights</h2>
          <p>
            You can export or delete your data at any time. Contact{" "}
            <a href="mailto:privacy@repo.dev">privacy@repo.dev</a>.
          </p>
        </div>
      </div>
    </div>
  );
}

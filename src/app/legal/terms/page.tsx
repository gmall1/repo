import { Nav } from "@/components/nav";

export default function TermsPage() {
  return (
    <div>
      <Nav />
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-semibold">Terms of Service</h1>
        <div className="markdown mt-6 text-sm">
          <p>Last updated: {new Date().toISOString().slice(0, 10)}</p>

          <h2>Acceptance</h2>
          <p>
            By creating an account or using Repo (&ldquo;the Service&rdquo;), you agree to these
            Terms.
          </p>

          <h2>Account</h2>
          <p>
            You are responsible for maintaining the confidentiality of your password and for all
            activity under your account. Notify us promptly at any compromise.
          </p>

          <h2>Acceptable use</h2>
          <p>
            You may not use the Service to host or distribute malware, illegal content, or content
            that infringes others&rsquo; intellectual property rights. We may suspend or remove
            content or accounts that violate these terms.
          </p>

          <h2>Your content</h2>
          <p>
            You retain ownership of all content you upload. You grant us a limited license to host,
            display, and operate on your content as necessary to provide the Service.
          </p>

          <h2>Service availability</h2>
          <p>
            We aim for high reliability but do not guarantee uninterrupted service for free tiers.
            Pro and Team plans include uptime commitments documented separately.
          </p>

          <h2>Termination</h2>
          <p>
            You may close your account at any time. We may suspend accounts that violate these
            terms with reasonable notice except where the violation is severe.
          </p>

          <h2>Disclaimer</h2>
          <p>
            The Service is provided &ldquo;as is&rdquo; without warranties of any kind. We are not
            liable for indirect, incidental, or consequential damages.
          </p>

          <h2>Contact</h2>
          <p>
            Questions: <a href="mailto:hi@repo.dev">hi@repo.dev</a>.
          </p>
        </div>
      </div>
    </div>
  );
}

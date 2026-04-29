import Link from "next/link";
import { Nav } from "@/components/nav";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  Activity,
  Bot,
  GitBranch,
  GitPullRequest,
  Globe,
  Lock,
  Shield,
  Sparkles,
  Terminal,
  Users,
  Zap,
} from "lucide-react";

export default async function Home() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  return (
    <div className="min-h-screen">
      <Nav />
      <Hero />
      <Status />
      <Features />
      <Compare />
      <AI />
      <SelfHost />
      <Pricing />
      <FAQ />
      <Footer />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 [background:radial-gradient(60%_50%_at_50%_0%,rgba(110,231,255,0.15),transparent_70%),radial-gradient(40%_40%_at_80%_30%,rgba(167,139,250,0.12),transparent_70%)]"
      />
      <div className="mx-auto max-w-6xl px-4 pt-16 pb-20 text-center">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-elev)] px-3 py-1 text-xs text-[var(--fg-muted)]">
          <Sparkles size={12} className="text-[var(--accent)]" />
          AI-powered code review built in. No bots to install.
        </div>
        <h1 className="mx-auto max-w-3xl text-4xl font-semibold tracking-tight md:text-6xl">
          Git hosting that{" "}
          <span className="bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)] bg-clip-text text-transparent">
            doesn&apos;t go down
          </span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base text-[var(--fg-muted)] md:text-lg">
          Repo is a modern, reliable, self-hostable alternative to GitHub. Real Git, real
          uptime, real ownership. Fewer outages, more features, lower lock-in.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/signup"
            className="h-11 rounded-md bg-[var(--accent)] px-6 text-sm font-medium text-[var(--accent-fg)] hover:brightness-110 inline-flex items-center"
          >
            Create free account
          </Link>
          <Link
            href="#self-host"
            className="h-11 rounded-md border border-[var(--border-strong)] px-6 text-sm font-medium hover:bg-[var(--bg-elev)] inline-flex items-center"
          >
            Self-host
          </Link>
        </div>
        <p className="mt-4 text-xs text-[var(--fg-dim)]">
          Free for public repos forever. No credit card.
        </p>

        <CodeExample />
      </div>
    </section>
  );
}

function CodeExample() {
  return (
    <div className="mx-auto mt-16 max-w-3xl rounded-xl border border-[var(--border)] bg-[var(--bg-elev)] p-1 shadow-2xl shadow-black/30">
      <div className="flex items-center gap-1.5 border-b border-[var(--border)] px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-2 text-xs text-[var(--fg-dim)]">terminal</span>
      </div>
      <pre className="overflow-x-auto px-4 py-3 text-left font-mono text-xs leading-6">
        <span className="text-[var(--fg-dim)]">$</span> git remote set-url origin https://repo.dev/me/my-app.git
        {"\n"}
        <span className="text-[var(--fg-dim)]">$</span> git push
        {"\n"}
        <span className="text-[var(--success)]">Enumerating objects: 12, done.</span>
        {"\n"}
        <span className="text-[var(--fg-muted)]">remote: ✨ AI summary attached to PR #4</span>
        {"\n"}
        <span className="text-[var(--fg-muted)]">remote: 🔍 AI review found 0 high-severity issues</span>
        {"\n"}
        <span className="text-[var(--success)]">To https://repo.dev/me/my-app.git</span>
      </pre>
    </div>
  );
}

function Status() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-12">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { v: "99.99%", l: "uptime SLA on Pro" },
          { v: "<50ms", l: "avg API response" },
          { v: "Open", l: "source you can audit" },
          { v: "Yours", l: "to self-host on day 1" },
        ].map((s) => (
          <div
            key={s.l}
            className="rounded-lg border border-[var(--border)] bg-[var(--bg-elev)] p-4 text-center"
          >
            <div className="text-2xl font-semibold text-[var(--fg)]">{s.v}</div>
            <div className="mt-1 text-xs text-[var(--fg-muted)]">{s.l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Features() {
  const items = [
    {
      i: <GitBranch size={18} />,
      t: "Real Git over HTTPS",
      d: "Standard `git clone`, `push`, `pull`. No vendor SDK. Your existing tools just work.",
    },
    {
      i: <GitPullRequest size={18} />,
      t: "Pull Requests, done right",
      d: "Side-by-side diffs, line comments, merge commits or fast-forward. Fast.",
    },
    {
      i: <Bot size={18} />,
      t: "Built-in AI review",
      d: "Every PR gets an AI summary and review automatically. No setup. No extension.",
    },
    {
      i: <Zap size={18} />,
      t: "Stupid fast",
      d: "Server-rendered, edge-cached, virtualized file trees. Loads before you finish blinking.",
    },
    {
      i: <Shield size={18} />,
      t: "Reliability first",
      d: "Boring tech (Postgres + bare git on disk). No surprises during incidents.",
    },
    {
      i: <Lock size={18} />,
      t: "Your data, your call",
      d: "Self-host with one Docker command. Or use ours. Migrate freely either way.",
    },
    {
      i: <Activity size={18} />,
      t: "Issues that don't fight you",
      d: "Markdown, labels, assignees, smart filtering. AI auto-triage on creation.",
    },
    {
      i: <Users size={18} />,
      t: "Orgs & teams",
      d: "Multi-tenant from day one. Roles, members, private repos.",
    },
    {
      i: <Terminal size={18} />,
      t: "API tokens",
      d: "Per-token scopes. Rotate freely. Use them with `git` directly over HTTPS.",
    },
  ];
  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      <div className="text-center">
        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Everything you expect. Nothing you don&apos;t.
        </h2>
        <p className="mt-3 text-[var(--fg-muted)]">
          The features you actually use, modernized. No marketplace, no dashboards-of-dashboards.
        </p>
      </div>
      <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
        {items.map((it) => (
          <div
            key={it.t}
            className="rounded-xl border border-[var(--border)] bg-[var(--bg-elev)] p-5 hover:border-[var(--border-strong)] transition-colors"
          >
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent-2)]/20 text-[var(--accent)]">
              {it.i}
            </div>
            <h3 className="font-semibold">{it.t}</h3>
            <p className="mt-1 text-sm text-[var(--fg-muted)]">{it.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Compare() {
  const rows = [
    { f: "Real Git over HTTPS", repo: true, gh: true },
    { f: "Issues + PRs + reviews", repo: true, gh: true },
    { f: "AI code review (built-in)", repo: true, gh: "Add-on" },
    { f: "AI commit messages", repo: true, gh: false },
    { f: "AI issue triage", repo: true, gh: false },
    { f: "Self-host with one command", repo: true, gh: false },
    { f: "Open source server", repo: true, gh: false },
    { f: "Modern UI (built 2026)", repo: true, gh: false },
    { f: "Free private repos", repo: true, gh: true },
  ];
  return (
    <section className="mx-auto max-w-4xl px-4 py-12">
      <h2 className="text-center text-3xl font-semibold tracking-tight md:text-4xl">
        How Repo compares
      </h2>
      <p className="mt-3 text-center text-[var(--fg-muted)]">
        Honest comparison. We&apos;ll keep this updated as the big guys catch up.
      </p>
      <div className="mt-10 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-elev)]">
        <div className="grid grid-cols-3 border-b border-[var(--border)] bg-[var(--bg-elev-2)] text-sm font-medium">
          <div className="p-3">Feature</div>
          <div className="p-3 text-center">Repo</div>
          <div className="p-3 text-center text-[var(--fg-muted)]">GitHub</div>
        </div>
        {rows.map((r) => (
          <div
            key={r.f}
            className="grid grid-cols-3 border-b border-[var(--border)] text-sm last:border-b-0"
          >
            <div className="p-3">{r.f}</div>
            <div className="p-3 text-center">
              <Cell v={r.repo} accent />
            </div>
            <div className="p-3 text-center">
              <Cell v={r.gh} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Cell({ v, accent }: { v: boolean | string; accent?: boolean }) {
  if (v === true)
    return (
      <span
        className={
          accent
            ? "text-[var(--success)]"
            : "text-[var(--success)]"
        }
      >
        ✓
      </span>
    );
  if (v === false) return <span className="text-[var(--fg-dim)]">—</span>;
  return <span className="text-xs text-[var(--fg-muted)]">{v}</span>;
}

function AI() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20">
      <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2">
        <div>
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--bg-elev)] px-3 py-1 text-xs">
            <Bot size={12} className="text-[var(--accent-2)]" /> AI code review
          </div>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            A senior reviewer on every PR
          </h2>
          <p className="mt-4 text-[var(--fg-muted)]">
            Repo automatically summarizes every PR, surfaces risk, and reviews diffs the
            moment they&apos;re opened. No bot to install. No prompts to write. Bring your
            own OpenAI key or use ours.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-[var(--fg-muted)]">
            <li>• PR summary in plain English</li>
            <li>• Reviewers see issues ranked by severity</li>
            <li>• AI-suggested commit messages</li>
            <li>• Issue auto-triage and labeling</li>
          </ul>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elev)] p-1">
          <div className="rounded-lg bg-[var(--bg)] p-5 font-mono text-xs leading-6">
            <div className="text-[var(--accent-2)]">### AI review</div>
            <div className="mt-2">
              <span className="text-[var(--fg-muted)]">Overview</span>
            </div>
            <div className="text-[var(--fg)]">
              Adds rate limiting to /api/login. Implementation is sound.
            </div>
            <div className="mt-3">
              <span className="text-[var(--fg-muted)]">Issues</span>
            </div>
            <div className="text-[var(--danger)]">
              [high] src/auth.ts:42 — token compared with == (timing attack)
            </div>
            <div className="text-[var(--warning)]">
              [med] src/auth.ts:88 — silent catch swallows errors
            </div>
            <div className="mt-3">
              <span className="text-[var(--fg-muted)]">Suggestions</span>
            </div>
            <div className="text-[var(--fg-muted)]">
              Cache rate-limit state in Redis instead of memory.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SelfHost() {
  return (
    <section id="self-host" className="mx-auto max-w-6xl px-4 py-20">
      <div className="rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--bg-elev)] to-[var(--bg-elev-2)] p-8 md:p-12">
        <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2">
          <div>
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--bg)] px-3 py-1 text-xs">
              <Globe size={12} className="text-[var(--accent)]" /> Self-host
            </div>
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Run Repo on your own infrastructure
            </h2>
            <p className="mt-4 text-[var(--fg-muted)]">
              One container. Postgres + a volume for repos. That&apos;s it. Self-hosted Repo
              has the same features as the hosted version. We don&apos;t hold features
              hostage.
            </p>
          </div>
          <div className="rounded-lg bg-black/30 p-1">
            <div className="rounded-md p-4 font-mono text-xs leading-6">
              <span className="text-[var(--fg-dim)"># docker-compose.yml</span>
              <pre className="mt-1 whitespace-pre text-[var(--fg)]">{`services:
  repo:
    image: ghcr.io/gmall1/repo:latest
    ports: ["3000:3000"]
    environment:
      DATABASE_URL: postgres://...
      SESSION_SECRET: \${SESSION_SECRET}
      OPENAI_API_KEY: \${OPENAI_API_KEY}
    volumes:
      - ./data:/data
  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: postgres`}</pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const tiers = [
    {
      name: "Free",
      price: "$0",
      desc: "For solo devs and open source.",
      features: [
        "Unlimited public repos",
        "3 free private repos",
        "Issues & PRs",
        "AI summary on PRs (limited)",
        "Community support",
      ],
      cta: "Sign up free",
      href: "/signup",
    },
    {
      name: "Pro",
      price: "$8",
      sub: "/user/mo",
      desc: "For teams that ship.",
      features: [
        "Unlimited private repos",
        "Unlimited AI review",
        "Org accounts + roles",
        "99.99% uptime SLA",
        "Priority support",
      ],
      cta: "Start Pro",
      href: "/signup?plan=pro",
      featured: true,
    },
    {
      name: "Self-host",
      price: "Free",
      desc: "Run it yourself, forever.",
      features: [
        "All features included",
        "Open-source server",
        "Bring your own AI key",
        "No telemetry",
        "Community support",
      ],
      cta: "Read docs",
      href: "/docs",
    },
  ];
  return (
    <section id="pricing" className="mx-auto max-w-6xl px-4 py-20">
      <div className="text-center">
        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Pricing that respects you
        </h2>
        <p className="mt-3 text-[var(--fg-muted)]">No seat traps. Cancel any time.</p>
      </div>
      <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
        {tiers.map((t) => (
          <div
            key={t.name}
            className={
              "relative rounded-2xl border p-7 " +
              (t.featured
                ? "border-[var(--accent)] bg-gradient-to-br from-[var(--bg-elev)] to-[var(--bg-elev-2)]"
                : "border-[var(--border)] bg-[var(--bg-elev)]")
            }
          >
            {t.featured && (
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-[var(--accent)] px-2.5 py-0.5 text-xs font-medium text-[var(--accent-fg)]">
                Most popular
              </span>
            )}
            <div className="text-sm font-medium text-[var(--fg-muted)]">{t.name}</div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-4xl font-semibold">{t.price}</span>
              {t.sub && <span className="text-sm text-[var(--fg-muted)]">{t.sub}</span>}
            </div>
            <p className="mt-2 text-sm text-[var(--fg-muted)]">{t.desc}</p>
            <ul className="mt-5 space-y-2 text-sm">
              {t.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <span className="mt-0.5 text-[var(--success)]">✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link
              href={t.href}
              className={
                "mt-6 flex h-10 items-center justify-center rounded-md text-sm font-medium " +
                (t.featured
                  ? "bg-[var(--accent)] text-[var(--accent-fg)] hover:brightness-110"
                  : "border border-[var(--border-strong)] hover:bg-[var(--bg-elev-2)]")
              }
            >
              {t.cta}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

function FAQ() {
  const items = [
    {
      q: "Why another GitHub?",
      a: "GitHub outages have gotten worse and lock-in has gotten deeper. Repo is small, boring, and easy to host yourself. Your code is your code.",
    },
    {
      q: "Is this real Git or just a UI?",
      a: "Real git. Clone, push, pull over HTTPS. We just shell out to git-http-backend. No proprietary protocol.",
    },
    {
      q: "Can I migrate from GitHub?",
      a: "Yes — push your existing repo to a new Repo remote, or use our import tool (coming soon) to bring repos, issues, and PRs along.",
    },
    {
      q: "Is the AI optional?",
      a: "Yes. Disable it in settings or run self-hosted without an OpenAI key. AI never sees private code without your explicit opt-in.",
    },
    {
      q: "Can I trust this with production code?",
      a: "Self-host today. Use the hosted service when our SLA fits your needs. Either way, exporting back to git remotes is a one-liner.",
    },
  ];
  return (
    <section className="mx-auto max-w-3xl px-4 py-20">
      <h2 className="text-center text-3xl font-semibold tracking-tight md:text-4xl">
        Questions
      </h2>
      <div className="mt-10 divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] bg-[var(--bg-elev)]">
        {items.map((it, i) => (
          <details key={i} className="group p-5">
            <summary className="cursor-pointer list-none font-medium">
              <span className="mr-2 text-[var(--fg-dim)] group-open:rotate-90 inline-block transition-transform">
                ›
              </span>
              {it.q}
            </summary>
            <div className="mt-3 pl-5 text-sm text-[var(--fg-muted)]">{it.a}</div>
          </details>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="mt-10 border-t border-[var(--border)] py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 md:flex-row">
        <div className="text-sm text-[var(--fg-muted)]">
          © {new Date().getFullYear()} Repo. Made for developers who&apos;ve had enough.
        </div>
        <div className="flex gap-5 text-sm text-[var(--fg-muted)]">
          <Link href="/legal/terms" className="hover:text-[var(--fg)]">
            Terms
          </Link>
          <Link href="/legal/privacy" className="hover:text-[var(--fg)]">
            Privacy
          </Link>
          <Link href="/docs" className="hover:text-[var(--fg)]">
            Docs
          </Link>
          <Link href="/status" className="hover:text-[var(--fg)]">
            Status
          </Link>
          <Link href="/healthz" className="hover:text-[var(--fg)]">
            Health
          </Link>
        </div>
      </div>
    </footer>
  );
}

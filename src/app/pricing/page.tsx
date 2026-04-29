import { Nav } from "@/components/nav";
import Link from "next/link";

export default function PricingPage() {
  const tiers = [
    {
      name: "Free",
      price: "$0",
      desc: "Solo devs and open source.",
      features: ["Unlimited public repos", "3 free private repos", "Issues & PRs", "AI summary on PRs (limited)"],
      href: "/signup",
      cta: "Sign up free",
    },
    {
      name: "Pro",
      price: "$8",
      sub: "/user/mo",
      desc: "Teams that ship.",
      featured: true,
      features: ["Unlimited private repos", "Unlimited AI review", "Org accounts", "99.99% uptime SLA", "Priority support"],
      href: "/signup?plan=pro",
      cta: "Start Pro",
    },
    {
      name: "Self-host",
      price: "Free",
      desc: "Run it yourself.",
      features: ["All features", "Open source", "Bring your own AI key", "No telemetry"],
      href: "/docs",
      cta: "Read docs",
    },
  ];
  return (
    <div>
      <Nav />
      <div className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="text-center text-4xl font-semibold tracking-tight">Pricing</h1>
        <p className="mt-3 text-center text-[var(--fg-muted)]">
          Simple. Honest. No seat traps.
        </p>
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
                    ? "bg-[var(--accent)] text-[var(--accent-fg)]"
                    : "border border-[var(--border-strong)] hover:bg-[var(--bg-elev-2)]")
                }
              >
                {t.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

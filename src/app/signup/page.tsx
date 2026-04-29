import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { Nav } from "@/components/nav";
import { SignupForm } from "./signup-form";

export default async function SignupPage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");
  return (
    <div>
      <Nav />
      <div className="mx-auto mt-12 max-w-md px-4">
        <h1 className="text-center text-2xl font-semibold">Create your Repo account</h1>
        <p className="mt-2 text-center text-sm text-[var(--fg-muted)]">
          Free forever. No credit card.
        </p>
        <div className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--bg-elev)] p-6">
          <SignupForm />
        </div>
        <p className="mt-6 text-center text-sm text-[var(--fg-muted)]">
          Already have an account?{" "}
          <Link href="/login" className="text-[var(--accent)]">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

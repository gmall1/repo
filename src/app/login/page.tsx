import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { Nav } from "@/components/nav";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");
  return (
    <div>
      <Nav />
      <div className="mx-auto mt-12 max-w-md px-4">
        <h1 className="text-center text-2xl font-semibold">Sign in to Repo</h1>
        <p className="mt-2 text-center text-sm text-[var(--fg-muted)]">
          Welcome back. Let&apos;s get you to your code.
        </p>
        <div className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--bg-elev)] p-6">
          <LoginForm />
        </div>
        <p className="mt-6 text-center text-sm text-[var(--fg-muted)]">
          New here?{" "}
          <Link href="/signup" className="text-[var(--accent)]">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

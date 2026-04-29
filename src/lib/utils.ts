import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelative(date: Date | string | number) {
  const d = typeof date === "object" ? date : new Date(date);
  const diff = Date.now() - d.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  const mo = Math.floor(day / 30);
  if (mo < 12) return `${mo}mo ago`;
  const yr = Math.floor(mo / 12);
  return `${yr}y ago`;
}

export function formatNumber(n: number) {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}k`;
  return `${(n / 1_000_000).toFixed(1)}M`;
}

const RESERVED = new Set([
  "api",
  "auth",
  "login",
  "logout",
  "signup",
  "signin",
  "register",
  "settings",
  "dashboard",
  "new",
  "explore",
  "search",
  "trending",
  "pricing",
  "about",
  "legal",
  "terms",
  "privacy",
  "help",
  "docs",
  "blog",
  "static",
  "_next",
  "favicon.ico",
  "admin",
  "robots.txt",
  "sitemap.xml",
  "healthz",
  "status",
  "support",
  "contact",
  "notifications",
  "issues",
  "pulls",
  "marketplace",
]);

export function isReservedSlug(name: string): boolean {
  return RESERVED.has(name.toLowerCase());
}

const NAME_RE = /^[a-zA-Z0-9][a-zA-Z0-9-_]{0,38}$/;

export function isValidName(name: string): boolean {
  return NAME_RE.test(name) && !name.startsWith("-") && !name.endsWith("-");
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

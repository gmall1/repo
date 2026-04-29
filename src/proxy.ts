import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: ["/((?!_next/|favicon.ico|robots.txt|sitemap.xml).*)"],
};

export function proxy(req: NextRequest) {
  const url = req.nextUrl;
  const m = url.pathname.match(/^\/([^/]+)\/([^/]+)\.git(\/.*)?$/);
  if (m) {
    const owner = m[1];
    const name = m[2];
    const sub = m[3] ?? "";
    const rewritten = url.clone();
    rewritten.pathname = `/api/git/${owner}/${name}${sub}`;
    return NextResponse.rewrite(rewritten);
  }
  return NextResponse.next();
}

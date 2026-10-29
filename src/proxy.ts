import { NextResponse, type NextRequest } from "next/server";

const LANGS = ["pt", "en"];

// Picks the visitor's language from Accept-Language: Portuguese unless the
// browser prefers English over it.
function preferredLang(header: string | null): "pt" | "en" {
  if (!header) return "pt";
  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { tag: tag.toLowerCase(), q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  const first = ranked.find((r) => r.tag.startsWith("pt") || r.tag.startsWith("en"));
  return first?.tag.startsWith("en") ? "en" : "pt";
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (LANGS.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`))) return;

  request.nextUrl.pathname = `/${preferredLang(request.headers.get("accept-language"))}${pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};

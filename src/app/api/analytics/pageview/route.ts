import { NextResponse } from "next/server";
import { capturePageView } from "@/server/pageViews";
import { pageViewLimiter } from "@/server/pageViewRate";

// Capture anonyme d'une page vue.
//
// Appelée en « fire and forget » par PageViewTracker à chaque navigation.
// Toujours 204 : c'est un signal statistique, jamais une décision que le
// navigateur doit attendre.

const MAX_PATH_LENGTH = 300;

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "inconnu";
  if (!pageViewLimiter.check(ip)) {
    return new NextResponse(null, { status: 429 });
  }
  pageViewLimiter.register(ip);

  const payload = await request.json().catch(() => null);
  if (typeof payload !== "object" || payload === null) {
    return new NextResponse(null, { status: 204 });
  }

  const path = typeof (payload as Record<string, unknown>).path === "string"
    ? ((payload as Record<string, unknown>).path as string)
    : "";
  if (!path || path.length > MAX_PATH_LENGTH) {
    return new NextResponse(null, { status: 204 });
  }

  try {
    await capturePageView({ path, ip });
  } catch (error) {
    console.error("[pageview] capture échouée:", error);
  }

  return new NextResponse(null, { status: 204 });
}

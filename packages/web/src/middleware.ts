import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn     = !!req.auth;
  const pathname       = req.nextUrl.pathname;
  const isAuthRoute    = pathname.startsWith("/login");
  const isProfileRoute = pathname.startsWith("/profile");

  // Routes publiques — jamais interceptées
  if (isAuthRoute) {
    if (isLoggedIn) return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
    return NextResponse.next();
  }

  // Non connecté → login
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  // Forcer le changement de mot de passe
  if (!isProfileRoute) {
    const mustChange = (req.auth as any)?.mustChangePassword
      ?? (req.auth as any)?.user?.mustChangePassword;
    if (mustChange) {
      return NextResponse.redirect(new URL("/profile", req.nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  // Exclure : API, assets Next.js, favicon, fichiers statiques
  matcher: ["/((?!api|_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};

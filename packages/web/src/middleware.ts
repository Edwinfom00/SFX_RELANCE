import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn   = !!req.auth;
  const pathname     = req.nextUrl.pathname;
  const isAuthRoute  = pathname.startsWith("/login");
  const isProfileRoute = pathname.startsWith("/profile");

  if (!isLoggedIn && !isAuthRoute) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  if (isLoggedIn && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  // Forcer le changement de mot de passe
  if (isLoggedIn && !isAuthRoute && !isProfileRoute) {
    const mustChange = (req.auth as any)?.mustChangePassword ?? (req.auth as any)?.user?.mustChangePassword;
    if (mustChange) {
      return NextResponse.redirect(new URL("/profile", req.nextUrl));
    }
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

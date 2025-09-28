import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "./.auth";

export async function middleware(request: NextRequest) {
  const { nextUrl } = request;

  // Verificar sesión usando NextAuth
  const session = await auth();
  const isLoggedIn = !!session;

  // Rutas públicas que no requieren autenticación
  const publicRoutes = ["/login"];
  const isPublicRoute = publicRoutes.includes(nextUrl.pathname);

  // Si no está logueado y no está en una ruta pública, redirigir a login
  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  // Si está logueado y está en login, redirigir a la página principal
  if (isLoggedIn && nextUrl.pathname === "/login") {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};

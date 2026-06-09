import { auth } from "@/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;

  const pathname = req.nextUrl.pathname;

  const authRoutes = ["/login", "/register"];

  const protectedRoutes = [
    "/dashboard",
    "/clients",
    "/projects",
    "/invoices",
    "/payments",
  ];

  const isAuthRoute = authRoutes.includes(pathname);

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  );

  if (!isLoggedIn && isProtectedRoute) {
    return Response.redirect(new URL("/login", req.nextUrl));
  }

  if (isLoggedIn && isAuthRoute) {
    return Response.redirect(new URL("/dashboard", req.nextUrl));
  }
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/clients/:path*",
    "/projects/:path*",
    "/invoices/:path*",
    "/payments/:path*",
  ],
};

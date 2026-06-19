const authConfig = {
  pages: {
    signIn: "/login",
  },

  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth;

      const pathname = request.nextUrl.pathname;

      const protectedRoutes = [
        "/dashboard",
        "/clients",
        "/projects",
        "/invoices",
        "/payments",
      ];

      const isProtectedRoute = protectedRoutes.some((route) =>
        pathname.startsWith(route),
      );

      if (!isLoggedIn && isProtectedRoute) {
        return false;
      }

      return true;
    },
  },
  providers: [],
};

export default authConfig;

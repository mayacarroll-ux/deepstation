import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

import { DrizzleAdapter } from "@auth/drizzle-adapter";

import { database } from "@/db";
import { serverEnvironment } from "@/lib/config";
import { protectedHomePath } from "@/lib/constants";

const githubProvider =
  serverEnvironment.AUTH_GITHUB_ID && serverEnvironment.AUTH_GITHUB_SECRET
    ? [
        GitHub({
          clientId: serverEnvironment.AUTH_GITHUB_ID,
          clientSecret: serverEnvironment.AUTH_GITHUB_SECRET
        })
      ]
    : [];

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: database ? DrizzleAdapter(database) : undefined,
  providers: githubProvider,
  secret:
    serverEnvironment.AUTH_SECRET ??
    (process.env.NODE_ENV === "development"
      ? "development-only-deepstation-auth-secret"
      : undefined),
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/login"
  },
  trustHost: true,
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
      }

      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }

      return session;
    },
    authorized({ auth: session, request }) {
      const isAuthenticated = Boolean(session?.user);
      const isProtectedRoute =
        request.nextUrl.pathname.startsWith(protectedHomePath) ||
        request.nextUrl.pathname.startsWith("/time-entries") ||
        request.nextUrl.pathname.startsWith("/budget-key") ||
        request.nextUrl.pathname.startsWith("/weekly-summary");

      if (isProtectedRoute) {
        return isAuthenticated;
      }

      return true;
    }
  }
});

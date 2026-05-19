import crypto from "node:crypto";

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { serverEnvironment } from "@/lib/config";
import {
  protectedHomePath,
  singleUserEmail,
  singleUserId,
  singleUserName
} from "@/lib/constants";

function doPasswordsMatch(submittedPassword: string, configuredPassword: string) {
  const submittedPasswordBuffer = Buffer.from(submittedPassword);
  const configuredPasswordBuffer = Buffer.from(configuredPassword);

  if (submittedPasswordBuffer.length !== configuredPasswordBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(submittedPasswordBuffer, configuredPasswordBuffer);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        password: { label: "Password", type: "password" }
      },
      authorize(credentials) {
        const configuredPassword = serverEnvironment.APP_PASSWORD;
        const submittedPassword =
          typeof credentials?.password === "string" ? credentials.password : "";

        if (!configuredPassword) {
          return null;
        }

        if (!doPasswordsMatch(submittedPassword, configuredPassword)) {
          return null;
        }

        return {
          id: singleUserId,
          name: singleUserName,
          email: singleUserEmail
        };
      }
    })
  ],
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

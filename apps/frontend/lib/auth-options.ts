import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { type JWT } from "next-auth/jwt";
import { type DefaultSession, type Session } from "next-auth";

import prismaClient from "@repo/db";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
    } & DefaultSession["user"];
  }
}

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const nextAuthSecret = process.env.NEXTAUTH_SECRET;

if(!googleClientId) {
  throw new Error("Missing GOOGLE_CLIENT_ID environment variable");
}
if(!googleClientSecret) {
  throw new Error("Missing GOOGLE_CLIENT_SECRET environment variable");
}
if(!nextAuthSecret) {
  throw new Error("Missing NEXTAUTH_SECRET environment variable");
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    }),
  ],
  secret: nextAuthSecret,
  callbacks: {
    async signIn(params) {
      try {
        if (!params.user.email) return false;

        const user = await prismaClient.user.upsert({
          where: { email: params.user.email },
          update: {
            ...(params.user.name ? { name: params.user.name } : {}),
          },
          create: {
            email: params.user.email,
            name: params.user.name ?? "",
          },
        });

        params.user.id = user.id;
        return true;
      } catch (error) {
        console.error("Error during sign-in:", error);
        return false;
      }
    },
    jwt: ({ token }: { token: JWT }) => {
      return token;
    },
    session: ({ session, token }: { session: Session; token: JWT }) => {
      if (session && session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
};

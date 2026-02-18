import prismaClient from "@repo/db";
import NextAuth from "next-auth/next";
import GoogleProvider from "next-auth/providers/google";
import { type JWT } from "next-auth/jwt";
import { type DefaultSession, type Session } from "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id?: string;
        } & DefaultSession["user"];
    }
}


const handler = NextAuth({
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID ?? "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? ""
        })
    ],
    secret: process.env.NEXTAUTH_SECRET,
    callbacks: {
        async signIn(params) {
            try {
                if (!params.user.email) return false;

                const user = await prismaClient.user.upsert({
                    where: { email: params.user.email },
                    update: {
                        name: params.user.name ?? ""
                    }, // No updates needed since we just want to ensure the user exists
                    create: {
                        email: params.user.email,
                        name: params.user.name ?? ""
                    }
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
        }
    }
});

export { handler as GET, handler as POST }

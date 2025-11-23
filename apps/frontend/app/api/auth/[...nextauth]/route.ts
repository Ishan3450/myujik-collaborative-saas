import prismaClient from '@repo/db';
import NextAuth from "next-auth/next";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID ?? "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? ""
        })
    ],
    secret: process.env.NEXTAUTH_SECRET ?? "secret",
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
                console.log(error);
                return false;
            }
        },
        jwt: ({ token, user }: any) => {
            return token;
        },
        session: ({ session, token }: any) => {
            if (session && session.user) {
                session.user.id = token.sub;
            }
            return session;
        }
    }
});

export { handler as GET, handler as POST }
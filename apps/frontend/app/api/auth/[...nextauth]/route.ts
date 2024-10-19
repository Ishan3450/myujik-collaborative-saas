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

                await prismaClient.user.upsert({
                    where: { email: params.user.email },
                    update: {
                        name: params.user.name ?? ""
                    }, // No updates needed since we just want to ensure the user exists
                    create: {
                        email: params.user.email,
                        name: params.user.name ?? ""
                    }
                });

                return true;
            } catch (error) {
                console.log(error);
                return false;
            }
        },
    }
});

export { handler as GET, handler as POST }
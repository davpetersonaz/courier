// src/lib/auth.ts
import NextAuth from "next-auth";
import { PrismaAdapter } from '@auth/prisma-adapter';
import Credentials from "next-auth/providers/credentials";
import prisma from "@/lib/db";
import bcrypt from "bcrypt";

const authConfig = {
    adapter: PrismaAdapter(prisma),
    providers: [
        Credentials({
            name: "Credentials",
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.username || !credentials?.password){ return null }

                const user = await prisma.user.findUnique({
                    where: { username: credentials.username as string },
                    select: {
                        id: true,
                        firstName: true,
                        email: true,
                        username: true,
                        password: true,
                        role: true
                    },
                })

                if (!user){ return null }
                if (!bcrypt.compareSync(credentials.password as string, user.password)){ return null }

                return {
                    id: user.id.toString(),
                    username: user.username,
                    role: user.role,
                    firstName: user.firstName,
                    email: user.email,
                    name: user.firstName,
                }
            },
        }),
    ],
    pages: { signIn: "/" },
    session: {
        strategy: "jwt" as const,
        maxAge: 12 * 60 * 60, // 12 hours in seconds
    },
    jwt: {
        maxAge: 12 * 60 * 60, // must match
    },
    callbacks: {
        jwt(params: { token: import("next-auth/jwt").JWT; user?: import("next-auth").User | null }) {
            const { token, user } = params;
            if (user) {
                token.id = user.id;
                token.username = user.username;
                token.role = user.role;
                token.firstName = user.firstName;
                token.email = user.email;
                token.name = user.name;
            }
            return token;
        },
        session(params: { session: import("next-auth").Session; token: import("next-auth/jwt").JWT }) {
            const { session, token } = params;
            if (token?.id){ session.user.id = token.id as string; }
            if (token?.username){ session.user.username = token.username as string; }
            if (token?.role){ session.user.role = token.role; }
            if (token?.firstName) session.user.firstName = token.firstName as string;
            if (token?.email) session.user.email = token.email as string;
            if (token?.name) session.user.name = token.name as string;
            return session;
        },
    },
};

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);
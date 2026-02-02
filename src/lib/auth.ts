// src/lib/auth.ts
import NextAuth from "next-auth";
import { PrismaAdapter } from '@auth/prisma-adapter';
import Credentials from "next-auth/providers/credentials";
import prisma from "@/lib/db";
import bcrypt from "bcrypt";

// Import base types from next-auth (v5 re-exports them)
import type { DefaultSession, User as BaseUser, Session as BaseSession } from "next-auth";
import type { JWT as BaseJWT } from "next-auth/jwt";

// Extend User type to include custom fields (v5 style)
declare module "next-auth" {
    interface User {
        id: string;
        username: string;
        role: string;
    }

    interface Session {
        user: {
            id: string;
            username: string;
            role: string;
        } & DefaultSession["user"];
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        username: string;
        role: string;
    }
}

const authConfig = {
    adapter: PrismaAdapter(prisma),
    providers: [
        Credentials({
            name: "Credentials",
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials: any) {
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
                    name: user.firstName,
                    email: user.email,
                    username: user.username,
                    role: user.role
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
            }
            return token;
        },
        session(params: { session: import("next-auth").Session; token: import("next-auth/jwt").JWT }) {
            const { session, token } = params;
            if (token?.id){ session.user.id = token.id as string; }
            if (token?.username){ session.user.username = token.username as string; }
            if (token?.role){ session.user.role = token.role as string; }
            return session;
        },
    },
};

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);
// src/lib/auth.ts
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import prisma from "@/lib/db"
import bcrypt from "bcrypt"
import type { Session, User } from "next-auth";
import type { JWT } from "next-auth/jwt";

const authOptions  = {
    providers: [
        Credentials({
            name: "Credentials",
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials, ) {//'request', the 2nd param, is unused, so omitted here.
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
        jwt({ token, user }: { token: JWT; user?: User | null }) {
            if (user) {
                token.id = user.id;
                token.username = user.username;
                token.role = user.role;
            }
            return token;
        },
        session({ session, token }: { session: Session; token: JWT }) {
            if (token.id){ session.user.id = token.id; }
            if (token.username){ session.user.username = token.username; }
            if (token.role){ session.user.role = token.role; }
            return session;
        },
    },
};

const { handlers, auth, signIn, signOut } = NextAuth(authOptions);
export { handlers, auth, signIn, signOut, authOptions };
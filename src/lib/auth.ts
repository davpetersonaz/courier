// src/lib/auth.ts
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import prisma from "@/lib/db"
import bcrypt from "bcrypt"

export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [
        Credentials({
            name: "Credentials",
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.username || !credentials?.password){ return null }

                const user = await prisma.customer.findUnique({
                    where: { username: credentials.username as string },
                    select: {
                        id: true,
                        firstName: true,
                        email: true,
                        username: true,
                        password: true,
                    },
                })

                if (!user){ return null }
                if (!bcrypt.compareSync(credentials.password as string, user.password)){ return null }

                return {
                    id: user.id.toString(),
                    name: user.firstName,
                    email: user.email,
                    username: user.username,
                }
            },
        }),
    ],
    pages: { signIn: "/" },
    session: { strategy: "jwt" },
    callbacks: {
        jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.username = user.username;
            }
            return token;
        },
        session({ session, token }) {
            if (token.id){ session.user.id = token.id as string }
            if (token.username){ session.user.username = token.username as string }
            return session;
        },
    },
})
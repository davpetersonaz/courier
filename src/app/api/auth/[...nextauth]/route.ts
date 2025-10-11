// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import { AuthOptions } from "next-auth";
import CredentialsProvider from 'next-auth/providers/credentials';
import prisma from '@/lib/db';
import bcrypt from 'bcrypt';

export const authOptions: AuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                username: { label: 'Username', type: 'text' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.username || !credentials?.password) {
                    return null;
                }
                const user = await prisma.customer.findUnique({
                    where: { username: credentials.username },
                });
                if (user && bcrypt.compareSync(credentials.password, user.password)) {
                    return { id: user.id.toString(), name: user.firstName, email: user.email, username: user.username };
                }
                return null;
            },
        }),
    ],
    pages: {
        signIn: '/', // Use homepage for login
    },
    session: {
        strategy: 'jwt',
    },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
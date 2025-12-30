// src/types/next-auth.d.ts
import { DefaultSession } from "next-auth";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { JWT } from "next-auth/jwt";

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            username: string
            role: 'CUSTOMER' | 'COURIER';
        } & DefaultSession['user'];
    }

    interface User {
        id: string
        username: string
        role: "CUSTOMER" | "COURIER";
    }
}

declare module "next-auth/jwt" {
    // Extend the JWT token used in the jwt callback
    interface JWT {
        id: string;
        username: string;
        role: "CUSTOMER" | "COURIER";
    }
}
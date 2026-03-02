// src/lib/db.ts - redeploy
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Create connection pool (Supabase loves this)
const connectionString = process.env.DATABASE_URL!;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// Instantiate PrismaClient once with adapter
const prismaClient = new PrismaClient({
    log: ['query'], // optional – remove in production if too noisy
    adapter,        // ← this satisfies Prisma 7's validation requirement
});
console.log('Prisma 7 adapter loaded - build timestamp:', new Date().toISOString());

// In dev: attach to global for hot-reload survival
if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prismaClient;
}

// Export the singleton (global in dev, local in prod)
export const prisma = globalForPrisma.prisma ?? prismaClient;

export default prisma;
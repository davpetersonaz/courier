// src/app/history/page.tsx
import { redirect } from 'next/navigation';

import { OrderStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';

import { OrderHistoryTable } from '@/components/OrderHistoryTable';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { ExtendedOrder } from '@/types/order';

import ClientHistory from './ClientHistory';

export default async function History({ searchParams }: { searchParams: Promise<{ status?: string}> }) {
    const session = await auth();
    if(!session){ redirect('/'); }

    const userId = parseInt(session.user.id);
    const isAdmin = session.user.role === 'ADMIN';
    const isCourier = session.user.role === 'COURIER';
    //session exists, but user or role is missing → treat as regular customer
    if (isCourier) {
        // Couriers use the dedicated dashboard
        redirect('/courier/dashboard');
    }

    const params = await searchParams;
    const filterStatus = params.status || 'all';
    const whereClause: Prisma.OrderWhereInput = isAdmin ? {} : { customerId: userId };
    if (filterStatus !== 'all') {
        whereClause.status = filterStatus.toUpperCase().replace(' ', '_') as OrderStatus;
    }

    // Fetch orders based on role
    const orders: ExtendedOrder[] = await prisma.order.findMany({
        where: whereClause,
        include: {
            customer: {
                select: { firstName: true, lastName: true, phone: true },
            },
            courier: {
                select: { firstName: true, lastName: true },
            },
            history: {
                orderBy: { updatedAt: 'asc' },
                include: {
                    changedBy: {
                        select: { firstName: true, lastName: true },
                    },
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });

    // Page title changes based on role
    const pageTitle = isAdmin
        ? 'All Order History (Admin View)'
        : `Order History - ${session.user.name || 'Customer'}`;

    return (
        <ClientHistory>
            <div className="min-h-screen p-4 bg-gray-100">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-4xl font-bold text-center text-gray-800 mb-6">
                        {pageTitle}
                    </h1>
                    {isAdmin && (
                        <p className="text-center text-sm text-blue-600 mb-4">
                            Viewing ALL orders (Admin mode)
                        </p>
                    )}
                    <p className="text-center text-sm text-gray-500 mb-8">
                        Last updated: {new Date().toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                        })}
                    </p>

                    {orders.length === 0 ? (
                        <p className="p-8 text-center text-gray-500 bg-white rounded-lg shadow">
                            {isAdmin ? 'No orders in the system yet.' : 'No orders yet.'}
                        </p>
                    ) : (
                        <OrderHistoryTable orders={orders} isAdmin={isAdmin} currentStatus={filterStatus} />
                    )}
                </div>
            </div>
        </ClientHistory>
    );
}
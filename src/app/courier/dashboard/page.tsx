// src/app/courier/dashboard/page.tsx
import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { AvailablePickupsWithModal } from '@/components/AvailablePickupsWithModal';
import { CourierTableWithModal } from '@/components/CourierTableWithModal';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { OrderStatus } from '@/lib/order-status';
import { ExtendedOrder } from '@/types/order';

async function updateOrderStatus(orderId: number, newStatus: OrderStatus) {
    'use server';
    const session = await auth();
    if (!session || session.user.role !== 'COURIER'){ throw new Error('Unauthorized'); }

    const courierId = parseInt(session.user.id as string);

    // Your existing secure update logic
    if (newStatus === OrderStatus.EN_ROUTE_PICKUP) {
        const updated = await prisma.order.updateMany({
            where: { id: orderId, status: OrderStatus.PENDING, courierId: null },
            data: { status: OrderStatus.EN_ROUTE_PICKUP, courierId },
        });
        if (updated.count === 0){ throw new Error('Already claimed'); }
    } else {
        await prisma.order.update({
            where: { id: orderId, courierId },
            data: { status: newStatus },
        });
    }

    await prisma.orderHistory.create({
        data: {
            orderId,
            customerId: courierId,
            status: newStatus,
            changedById: courierId,
        },
    });

    revalidatePath('/courier/dashboard');
}

export default async function CourierDashboard({ searchParams }: { searchParams: Promise<{ tab?: string; page?: string }> }) {
    const session = await auth();
    if (!session || session.user.role !== 'COURIER') redirect('/');

    const resolvedParams = await searchParams;
    const tab = resolvedParams.tab || 'available';
    const page = parseInt(resolvedParams.page || '1');
    const courierId = parseInt(session.user.id as string);
    const courier = await prisma.user.findUnique({
        where: { id: courierId },
        select: { address: true, city: true, state: true, zip: true },
    });
    const courierAddress = courier
        ? `${courier.address}, ${courier.city}, ${courier.state} ${courier.zip}`
        : 'Phoenix, AZ'; // fallback

    // Fetch main data
    const [pendingOrders, inProgressOrders, deliveredCount] = await Promise.all([
        prisma.order.findMany({
            where: { status: OrderStatus.PENDING, courierId: null },
            include: { customer: { select: { firstName: true, lastName: true, phone: true } } },
            orderBy: { createdAt: 'asc' },
        }),
        prisma.order.findMany({
            where: { courierId, status: { in: [OrderStatus.EN_ROUTE_PICKUP, OrderStatus.PICKED_UP] } },
            include: {
                customer: { select: { firstName: true, lastName: true, phone: true } },
                courier: { select: { firstName: true, lastName: true } },
                history: {
                    orderBy: { updatedAt: 'asc' },
                    include: { changedBy: { select: { firstName: true, lastName: true } } }
                },
            },
            orderBy: { pickupDate: 'asc' }
        }),
        prisma.order.count({ where: { courierId, status: OrderStatus.DELIVERED } }),
    ]);

    // History with pagination and full relations
    let historyOrders: ExtendedOrder[] = [];
    let totalPages = 1;
    let currentPage = 1;

    if (tab === 'history') {
        const skip = (page - 1) * 25;
        const [orders, count] = await Promise.all([
            prisma.order.findMany({
                where: { courierId, status: OrderStatus.DELIVERED },
                include: {
                    customer: { select: { firstName: true, lastName: true, phone: true } },
                    courier: { select: { firstName: true, lastName: true } },
                    history: {
                        orderBy: { updatedAt: 'asc' },
                        include: { changedBy: { select: { firstName: true, lastName: true } } }
                    }
                },
                orderBy: { updatedAt: 'desc' },
                take: 25,
                skip
            }),
            prisma.order.count({ where: { courierId, status: OrderStatus.DELIVERED } })
        ]);
        historyOrders = orders;
        totalPages = Math.ceil(count / 25);
        currentPage = page;
    }

    return (
        <div className="min-h-screen bg-gray-100 p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-8">
                    Courier Dashboard — Welcome, {session.user.name}
                </h1>

                {/* Tabs - use Link for navigation */}
                <div className="flex border-b border-gray-300 mb-6 overflow-x-auto">
                    <Link href="/courier/dashboard?tab=available" scroll={true}
                        className={`px-4 py-3 font-medium text-sm md:text-base whitespace-nowrap border-b-2 transition ${
                            tab === 'available'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-600 hover:text-gray-800'
                        }`}
                    >
                        Available Pickups ({pendingOrders.length})
                    </Link>
                    <Link href="/courier/dashboard?tab=progress" scroll={true}
                        className={`px-4 py-3 font-medium text-sm md:text-base whitespace-nowrap border-b-2 transition ml-4 ${
                            tab === 'progress'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-600 hover:text-gray-800'
                        }`}
                    >
                        In Progress ({inProgressOrders.length})
                    </Link>
                    <Link href="/courier/dashboard?tab=history" scroll={true}
                        className={`px-4 py-3 font-medium text-sm md:text-base whitespace-nowrap border-b-2 transition ml-4 ${
                            tab === 'history'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-600 hover:text-gray-800'
                        }`}
                    >
                        Delivery History ({deliveredCount})
                    </Link>
                </div>

                {/* Available Pickups */}
                {tab === 'available' && (
                    <AvailablePickupsWithModal orders={pendingOrders} courierAddress={courierAddress} />
                )}

                {tab === 'progress' && (
                    <>
                        {inProgressOrders.length === 0 ? (
                            <div className="bg-white rounded-lg shadow overflow-hidden p-8 text-center text-gray-600">
                                No orders in progress right now.
                            </div>
                        ) : (
                            <CourierTableWithModal
                                orders={inProgressOrders}
                                title={`In Progress (${inProgressOrders.length})`}
                                tab="progress"
                                updateOrderStatus={updateOrderStatus}
                            />
                        )}
                    </>
                )}

                {/* Full Paginated Delivery History */}
                {tab === 'history' && (
                    <>
                        { historyOrders.length === 0 ? (
                            <div className="p-8 text-center text-gray-600">
                                No deliveries completed yet. Your first one is coming soon!
                            </div>
                        ) : (
                            <>
                                <CourierTableWithModal
                                    orders={historyOrders}
                                    title={`Delivery History (${deliveredCount} total)`}
                                    tab="history"
                                    updateOrderStatus={updateOrderStatus}
                                />
                                {/* Pagination */}
                                <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t">
                                    <p className="text-sm text-gray-700">
                                        Page {currentPage} of {totalPages} ({deliveredCount} total)
                                    </p>
                                    <div className="flex gap-2">
                                        {currentPage > 1 && (
                                            <Link href={`/courier/dashboard?tab=history&page=${currentPage - 1}`} scroll={true}
                                                className="px-4 py-2 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100"
                                            >
                                                Previous
                                            </Link>
                                        )}
                                        {currentPage < totalPages && (
                                            <Link href={`/courier/dashboard?tab=history&page=${currentPage + 1}`} scroll={true}
                                                className="px-4 py-2 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100"
                                            >
                                                Next
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
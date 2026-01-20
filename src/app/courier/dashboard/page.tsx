// src/app/courier/dashboard/page.tsx
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { OrderStatus } from '@/lib/order-status';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import AvailablePickups from '@/components/AvailablePickups';

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

    // Fetch main data
    const [pendingOrders, inProgressOrders, deliveredCount] = await Promise.all([
        prisma.order.findMany({
            where: { status: OrderStatus.PENDING, courierId: null },
            include: { customer: { select: { firstName: true, lastName: true, phone: true } } },
            orderBy: { createdAt: 'asc' },
        }),
        prisma.order.findMany({
            where: { courierId, status: { in: [OrderStatus.EN_ROUTE_PICKUP, OrderStatus.PICKED_UP] } },
            include: { customer: { select: { firstName: true, lastName: true, phone: true } } },
            orderBy: { pickupDate: 'asc' },
        }),
        prisma.order.count({ where: { courierId, status: OrderStatus.DELIVERED } }),
    ]);

    // Fetch history only when needed
    let historyOrders = [] as {
        id: number;
        pickupDate: Date;
        pickupTime: string;
        pickupAddress: string;
        dropoffAddress: string;
        updatedAt: Date;
        customer: {
            firstName: string;
            lastName: string | null;
            phone: string;
        };
    }[];
    let totalPages = 1;
    let currentPage = 1;

    if (tab === 'history') {
        const skip = (page - 1) * 25;
        const [orders, count] = await Promise.all([
            prisma.order.findMany({
                where: { courierId, status: OrderStatus.DELIVERED },
                include: { customer: { select: { firstName: true, lastName: true, phone: true } } },
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
                    <Link href="/courier/dashboard?tab=available"
                        className={`px-4 py-3 font-medium text-sm md:text-base whitespace-nowrap border-b-2 transition ${
                            tab === 'available'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-600 hover:text-gray-800'
                        }`}
                    >
                        Available Pickups ({pendingOrders.length})
                    </Link>
                    <Link href="/courier/dashboard?tab=progress"
                        className={`px-4 py-3 font-medium text-sm md:text-base whitespace-nowrap border-b-2 transition ml-4 ${
                            tab === 'progress'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-600 hover:text-gray-800'
                        }`}
                    >
                        In Progress ({inProgressOrders.length})
                    </Link>
                    <Link href="/courier/dashboard?tab=history"
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
                    <AvailablePickups orders={pendingOrders} />
                )}

                {tab === 'progress' && (
                    <>
                        {inProgressOrders.length === 0 ? (
                            <div className="bg-white rounded-lg shadow overflow-hidden p-8 text-center text-gray-600">
                                No orders in progress right now.
                            </div>
                        ) : (
                            <section className="bg-white rounded-lg shadow overflow-hidden">
                                <h2 className="px-6 py-4 text-xl font-semibold bg-gray-50 border-b">
                                    In Progress ({inProgressOrders.length})
                                </h2>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 border-b">
                                            <tr>
                                                <th className="px-4 py-3 text-left">Order ID</th>
                                                <th className="px-4 py-3 text-left">Status</th>
                                                <th className="px-4 py-3 text-left">Customer</th>
                                                <th className="px-4 py-3 text-left hidden md:table-cell">Pickup/Dropoff</th>
                                                <th className="px-4 py-3 text-left">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {inProgressOrders.map((order) => (
                                                <tr key={order.id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-4 font-medium">#{order.id}</td>
                                                    <td className="px-4 py-4">
                                                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                                                            order.status === OrderStatus.EN_ROUTE_PICKUP
                                                                ? 'bg-yellow-100 text-yellow-800'
                                                                : 'bg-blue-100 text-blue-800'
                                                        }`}>
                                                            {order.status.replace(/_/g, ' ')}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        {order.customer.firstName} {order.customer.lastName || ''}
                                                    </td>
                                                    <td className="px-4 py-4 text-xs hidden md:table-cell">
                                                        <div className="max-w-xs">
                                                            <p className="truncate"><strong>From:</strong> {order.pickupAddress}</p>
                                                            <p className="truncate"><strong>To:</strong> {order.dropoffAddress}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        {order.status === OrderStatus.EN_ROUTE_PICKUP && (
                                                            <form action={updateOrderStatus.bind(null, order.id, OrderStatus.PICKED_UP)}>
                                                                <button type="submit" className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">
                                                                    Mark Picked Up
                                                                </button>
                                                            </form>
                                                        )}
                                                        {order.status === OrderStatus.PICKED_UP && (
                                                            <form action={updateOrderStatus.bind(null, order.id, OrderStatus.DELIVERED)}>
                                                                <button type="submit" className="px-3 py-1.5 bg-green-600 text-white text-xs rounded hover:bg-green-700">
                                                                    Mark Delivered
                                                                </button>
                                                            </form>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        )}
                    </>
                )}

                {/* Full Paginated Delivery History */}
                {tab === 'history' && (
                    <section className="bg-white rounded-lg shadow overflow-hidden">
                        <h2 className="px-6 py-4 text-xl font-semibold bg-gray-50 border-b">
                            Delivery History ({deliveredCount} total)
                        </h2>

                        { historyOrders.length === 0 ? (
                            <div className="p-8 text-center text-gray-600">
                                No deliveries completed yet. Your first one is coming soon!
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 border-b">
                                            <tr>
                                                <th className="px-4 py-3 text-left">Order ID</th>
                                                <th className="px-4 py-3 text-left">Customer</th>
                                                <th className="px-4 py-3 text-left hidden sm:table-cell">Pickup</th>
                                                <th className="px-4 py-3 text-left hidden md:table-cell">Dropoff</th>
                                                <th className="px-4 py-3 text-left">Completed</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {historyOrders.map((order) => (
                                                <tr key={order.id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-4 font-medium">#{order.id}</td>
                                                    <td className="px-4 py-4">
                                                        {order.customer.firstName} {order.customer.lastName || ''}
                                                        <p className="text-xs text-gray-500">{order.customer.phone}</p>
                                                    </td>
                                                    <td className="px-4 py-4 text-xs hidden sm:table-cell">
                                                        {new Date(order.pickupDate).toLocaleDateString()} {order.pickupTime}
                                                    </td>
                                                    <td className="px-4 py-4 text-xs hidden md:table-cell truncate max-w-xs">
                                                        {order.dropoffAddress}
                                                    </td>
                                                    <td className="px-4 py-4 text-xs">
                                                        {new Date(order.updatedAt).toLocaleDateString()} <br />
                                                        <span className="text-gray-500">
                                                            {new Date(order.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t">
                                    <p className="text-sm text-gray-700">
                                        Page {currentPage} of {totalPages} ({deliveredCount} total)
                                    </p>
                                    <div className="flex gap-2">
                                        {currentPage > 1 && (
                                            <Link href={`/courier/dashboard?tab=history&page=${currentPage - 1}`}
                                                className="px-4 py-2 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100"
                                            >
                                                Previous
                                            </Link>
                                        )}
                                        {currentPage < totalPages && (
                                            <Link href={`/courier/dashboard?tab=history&page=${currentPage + 1}`}
                                                className="px-4 py-2 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100"
                                            >
                                                Next
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </section>
                )}
            </div>
        </div>
    );
}
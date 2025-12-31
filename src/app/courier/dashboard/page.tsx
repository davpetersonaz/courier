// src/app/courier/dashboard/page.tsx
import prisma from '@/lib/db';
import { auth } from '@/lib/auth';
import { OrderStatus } from '@/lib/order-status';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { ExtendedOrder } from '@/types/order';

async function updateOrderStatus(orderId: number, newStatus: OrderStatus, courierId: number) {
    'use server';
    try {
        if (newStatus === OrderStatus.EN_ROUTE_PICKUP) {
            // Atomic claim: only if still PENDING and unassigned
            const updated = await prisma.order.updateMany({
                where: {
                    id: orderId,
                    status: OrderStatus.PENDING,
                    courierId: null
                },
                data: {
                    status: OrderStatus.EN_ROUTE_PICKUP,
                    courierId: courierId
                },
            });

            if (updated.count === 0) {
                throw new Error('Order was already claimed by another courier');
            }
        } else {
            // For PICKED_UP or DELIVERED: must be owned by this courier
            await prisma.order.update({
                where: {
                    id: orderId,
                    courierId: courierId  // Security check
                },
                data: {
                    status: newStatus
                    // courierId stays the same
                },
            });
        }

        // Log history
        await prisma.orderHistory.create({
            data: {
                orderId,
                customerId: courierId, // note: field name is misleading, but matches schema
                status: newStatus,
                changedById: courierId
            },
        });

        revalidatePath('/courier/dashboard');
    } catch (error) {
        // Re-throw to let form show error (Next.js server actions propagate errors)
        throw error;
    }
}

export default async function CourierDashboard({ searchParams }: { searchParams: Promise<{ page?: string; tab?: string }> }) {
    const session = await auth();

    if (!session || session.user.role !== 'COURIER') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="bg-white p-8 rounded-lg shadow-md text-center">
                    <p className="text-xl text-red-600">Access denied. Couriers only.</p>
                    <Link href="/" className="mt-4 inline-block text-blue-600 hover:underline">
                        Go Home
                    </Link>
                </div>
            </div>
        );
    }

    const courierId = parseInt(session.user.id as string);

    // pending/unworked orders
    const pendingOrders: ExtendedOrder[] = await prisma.order.findMany({
        where: {
            status: OrderStatus.PENDING,
            courierId: null
        },
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
        orderBy: { createdAt: 'asc' },
    });

    // in-progress orders
    const inProgressOrders: ExtendedOrder[] = await prisma.order.findMany({
        where: {
            courierId,
            status: { in: [OrderStatus.EN_ROUTE_PICKUP, OrderStatus.PICKED_UP] }
        },
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
        orderBy: { pickupDate: 'asc' },
    });

    // delivered orders
    const resolvedSearchParams = await searchParams;
    const currentPage = parseInt(resolvedSearchParams.page || '1');
    const tabFromUrl = resolvedSearchParams.tab;
    const activeTab =
        tabFromUrl === 'progress' ? 'progress' :
            tabFromUrl === 'history' ? 'history' :
                'available'; // default to available
    const pageSize = 25;
    const skip = (currentPage - 1) * pageSize;
    const deliveredOrders: ExtendedOrder[] = await prisma.order.findMany({
        where: {
            courierId,
            status: OrderStatus.DELIVERED,
        },
        include: {
            customer: {
                select: { firstName: true, lastName: true, phone: true },
            },
            courier: {
                select: { firstName: true, lastName: true },
            },
        },
        orderBy: { updatedAt: 'desc' },
        take: pageSize,
        skip: skip,
    });
    const totalDelivered = await prisma.order.count({
        where: {
            courierId,
            status: OrderStatus.DELIVERED,
        },
    });
    const totalPages = Math.ceil(totalDelivered / pageSize);

    return (
        <div className="min-h-screen bg-gray-100 p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-8">
                    Courier Dashboard — Welcome, {session.user.username}
                </h1>

                {/* Tabs with URL-driven state */}
                <div className="flex border-b border-gray-300 mb-6 overflow-x-auto">
                    <Link
                        href="/courier/dashboard?tab=available"
                        className={`px-4 py-3 font-medium text-sm md:text-base whitespace-nowrap border-b-2 transition ${
                            activeTab === 'available'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-600 hover:text-gray-800'
                        }`}
                    >
                        Available Pickups ({pendingOrders.length})
                    </Link>
                    <Link
                        href="/courier/dashboard?tab=progress"
                        className={`px-4 py-3 font-medium text-sm md:text-base whitespace-nowrap border-b-2 transition ml-4 ${
                            activeTab === 'progress'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-600 hover:text-gray-800'
                        }`}
                    >
                        In Progress ({inProgressOrders.length})
                    </Link>
                    <Link
                        href="/courier/dashboard?tab=history"
                        className={`px-4 py-3 font-medium text-sm md:text-base whitespace-nowrap border-b-2 transition ml-4 ${
                            activeTab === 'history'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-600 hover:text-gray-800'
                        }`}
                    >
                        Delivery History ({totalDelivered})
                    </Link>
                </div>

                {/* Single Conditional Rendering for Tabs */}
                {activeTab === 'available' && (
                    <section className="bg-white rounded-lg shadow overflow-hidden">
                        {pendingOrders.length === 0 ? (
                            <div className="p-8 text-center text-gray-600">
                                No pending pickups right now. Check back soon!
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 border-b">
                                        <tr>
                                            <th className="px-4 py-3 font-medium text-gray-700">Order ID</th>
                                            <th className="px-4 py-3 font-medium text-gray-700">Customer</th>
                                            <th className="px-4 py-3 font-medium text-gray-700 hidden md:table-cell">Pickup Time</th>
                                            <th className="px-4 py-3 font-medium text-gray-700 hidden lg:table-cell">Pickup Address</th>
                                            <th className="px-4 py-3 font-medium text-gray-700 hidden lg:table-cell">Dropoff</th>
                                            <th className="px-4 py-3 font-medium text-gray-700">Details</th>
                                            <th className="px-4 py-3 font-medium text-gray-700 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {pendingOrders.map((order) => (
                                            <tr key={order.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-4 font-medium">#{order.id}</td>
                                                <td className="px-4 py-4">
                                                    <div>
                                                        <p>{order.customer.firstName} {order.customer.lastName || ''}</p>
                                                        <p className="text-xs text-gray-500">{order.customer.phone}</p>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 hidden md:table-cell">
                                                    {new Date(order.pickupDate).toLocaleDateString()} <br />
                                                    <span className="font-medium">{order.pickupTime}</span>
                                                </td>
                                                <td className="px-4 py-4 text-xs md:text-sm hidden lg:table-cell">
                                                    {order.pickupAddress}
                                                </td>
                                                <td className="px-4 py-4 text-xs md:text-sm hidden lg:table-cell">
                                                    {order.dropoffAddress}
                                                </td>
                                                <td className="px-4 py-4 text-xs">
                                                    {order.totalPieces} pcs • {order.orderWeight} lbs
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <form action={updateOrderStatus.bind(null, order.id, OrderStatus.EN_ROUTE_PICKUP, courierId)}>
                                                        <button
                                                            type="submit"
                                                            className="px-4 py-2 bg-green-600 text-white text-xs md:text-sm rounded hover:bg-green-700 transition font-medium"
                                                        >
                                                            Accept Job
                                                        </button>
                                                    </form>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                )}

                {activeTab === 'progress' && (
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
                                                            {order.status.replace('_', ' ')}
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
                                                            <form action={updateOrderStatus.bind(null, order.id, OrderStatus.PICKED_UP, courierId)}>
                                                                <button className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">
                                                                    Mark Picked Up
                                                                </button>
                                                            </form>
                                                        )}
                                                        {order.status === OrderStatus.PICKED_UP && (
                                                            <form action={updateOrderStatus.bind(null, order.id, OrderStatus.DELIVERED, courierId)}>
                                                                <button className="px-3 py-1.5 bg-green-600 text-white text-xs rounded hover:bg-green-700">
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

                {activeTab === 'history' && (
                    <section className="bg-white rounded-lg shadow overflow-hidden">
                        <h2 className="px-6 py-4 text-xl font-semibold bg-gray-50 border-b">
                            Delivery History ({totalDelivered} total)
                        </h2>

                        {deliveredOrders.length === 0 ? (
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
                                            {deliveredOrders.map((order) => (
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
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t">
                                        <p className="text-sm text-gray-700">
                                            Page {currentPage} of {totalPages} ({totalDelivered} total)
                                        </p>
                                        <div className="flex gap-2">
                                            {currentPage > 1 && (
                                                <Link
                                                    href={`/courier/dashboard?tab=history&page=${currentPage - 1}`}
                                                    className="px-4 py-2 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100"
                                                >
                                                    Previous
                                                </Link>
                                            )}
                                            {currentPage < totalPages && (
                                                <Link
                                                    href={`/courier/dashboard?tab=history&page=${currentPage + 1}`}
                                                    className="px-4 py-2 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100"
                                                >
                                                    Next
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </section>
                )}
            </div>
        </div>
    );
}
// src/app/courier/dashboard/page.tsx
import prisma from '@/lib/db';
import { auth } from '@/lib/auth';
import { OrderStatus } from '@/lib/order-status';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { ExtendedOrder } from '@/types/order';

async function updateOrderStatus(orderId: number, newStatus: OrderStatus, courierId: number) {
    'use server';
    await prisma.order.update({
        where: { id: orderId },
        data: {
            status: newStatus,
            courierId: newStatus !== OrderStatus.PENDING ? courierId : null
        }
    });
    await prisma.orderHistory.create({
        data: {
            orderId,
            customerId: courierId, // or session.user.id later
            status: newStatus,
            changedById: courierId
        },
    });
    revalidatePath('/courier/dashboard');
}

export default async function CourierDashboard() {
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

    const pendingOrders: ExtendedOrder[] = await prisma.order.findMany({
        where: { status: OrderStatus.PENDING },
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

    const inProgressOrders: ExtendedOrder[] = await prisma.order.findMany({
        where: { status: { in: [OrderStatus.EN_ROUTE_PICKUP, OrderStatus.PICKED_UP] } },
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

    const deliveredOrders: ExtendedOrder[] = await prisma.order.findMany({
        where: {
            status: OrderStatus.DELIVERED,
            updatedAt: { // Only today
                gte: new Date(new Date().setHours(0,0,0,0))
            },
        },
        include: {
            customer: {
                select: { firstName: true, lastName: true, phone: true },
            },
            courier: {
                select: { firstName: true, lastName: true },
            },
            history: {
                orderBy: { updatedAt: 'desc' },
                include: {
                    changedBy: {
                        select: { firstName: true, lastName: true },
                    },
                },
            },
        },
        orderBy: { updatedAt: 'desc' },
    });

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">
                    Courier Dashboard — Welcome, {session.user.username}
                </h1>

                {/* Available Pickups */}
                <section className="mb-12">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4">Available Pickups ({pendingOrders.length})</h2>
                    {pendingOrders.length === 0 ? (
                        <p className="text-gray-600">No pending pickups right now. Check back soon!</p>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {pendingOrders.map((order) => (
                                <div key={order.id} className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                                    <p className="font-medium">Order #{order.id}</p>
                                    <p className="text-sm text-gray-600">
                                        Customer: {order.customer.firstName} {order.customer.lastName || ''} | Phone: {order.customer.phone}
                                    </p>

                                    <div className="mt-3">
                                        <p className="font-medium">Pickup</p>
                                        <p className="text-sm">{order.pickupAddress}</p>
                                        <p className="text-sm">
                                            {new Date(order.pickupDate).toLocaleDateString()} at {order.pickupTime}
                                        </p>
                                    </div>

                                    <div className="mt-3">
                                        <p className="font-medium">Dropoff</p>
                                        <p className="text-sm">{order.dropoffAddress}</p>
                                    </div>

                                    <p className="mt-3 text-sm">
                                        Pieces: {order.totalPieces} | Weight: {order.orderWeight} lbs
                                    </p>

                                    {/* Status History */}
                                    {order.history.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <p className="font-medium text-sm mb-2">Status History</p>
                                            {order.history.map((entry) => (
                                                <p key={entry.id} className="text-xs text-gray-600">
                                                    {new Date(entry.updatedAt).toLocaleTimeString()} — {entry.status.replace(/_/g, ' ')}
                                                </p>
                                            ))}
                                        </div>
                                    )}

                                    {!order.courierId && (
                                        <form action={updateOrderStatus.bind(null, order.id, OrderStatus.EN_ROUTE_PICKUP, parseInt(session.user.id))} className="mt-4">
                                            <button type="submit" className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition">
                                                Accept Job – Heading to Pickup
                                            </button>
                                        </form>
                                    )}

                                    {order.courierId && order.courierId !== parseInt(session.user.id as string) && (
                                        <p className="text-sm text-orange-600 mt-2">Claimed by another courier</p>
                                    )}

                                    {order.courierId === parseInt(session.user.id as string) && (
                                        <p className="text-sm text-green-600 mt-2">You claimed this job</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* In Progress */}
                {inProgressOrders.length > 0 && (
                    <section>
                        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                            In Progress ({inProgressOrders.length})
                        </h2>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {inProgressOrders.map((order) => (
                                <div key={order.id} className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                                    <p className="font-medium text-lg">
                                        Order #{order.id} — {order.status.replace('_', ' ').toUpperCase()}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        Customer: {order.customer.firstName} {order.customer.lastName || ''} | Phone: {order.customer.phone}
                                    </p>

                                    <div className="mt-3 grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="font-medium">Pickup</p>
                                            <p className="text-sm">{order.pickupAddress}</p>
                                        </div>
                                        <div>
                                            <p className="font-medium">Dropoff</p>
                                            <p className="text-sm">{order.dropoffAddress}</p>
                                        </div>
                                    </div>

                                    {/* Status History */}
                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                        <p className="font-medium text-sm mb-2">Status History</p>
                                        {order.history.map((entry) => (
                                            <p key={entry.id} className="text-xs text-gray-600">
                                                {new Date(entry.updatedAt).toLocaleTimeString()} — {entry.status.replace(/_/g, ' ')}
                                            </p>
                                        ))}
                                    </div>

                                    {order.status === OrderStatus.EN_ROUTE_PICKUP && (
                                        <form action={updateOrderStatus.bind(null, order.id, OrderStatus.PICKED_UP, parseInt(session.user.id))} className="mt-4">
                                            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">
                                                Mark as Picked Up
                                            </button>
                                        </form>
                                    )}

                                    {order.status === OrderStatus.PICKED_UP && (
                                        <form action={updateOrderStatus.bind(null, order.id, OrderStatus.DELIVERED, parseInt(session.user.id))} className="mt-4">
                                            <button type="submit" className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition">
                                                Mark as Delivered
                                            </button>
                                        </form>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Completed Today */}
                <section className="mt-12">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                    Completed Today ({deliveredOrders.length})
                </h2>
                {deliveredOrders.length === 0 ? (
                    <p className="text-gray-600">No deliveries completed today yet. Great work ahead!</p>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {deliveredOrders.map((order) => (
                            <div key={order.id} className="bg-green-50 border border-green-200 p-6 rounded-lg shadow">
                                <p className="font-medium text-green-800">Order #{order.id} — DELIVERED</p>
                                <p className="text-sm text-gray-700 mt-2">
                                    Customer: {order.customer.firstName} {order.customer.lastName || ''} | Phone: {order.customer.phone}
                                </p>
                                <p className="mt-2 text-sm"><strong>Dropoff:</strong> {order.dropoffAddress}</p>
                                <p className="text-sm">Delivered on: {new Date(order.pickupDate).toLocaleDateString()}</p>
                            </div>
                        ))}
                    </div>
                )}
                </section>
            </div>
        </div>
    );
}
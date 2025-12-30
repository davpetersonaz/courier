// src/app/courier/dashboard/page.tsx
import prisma from '@/lib/db';
import { auth } from '@/lib/auth';
import { Order } from '@prisma/client';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';

type ExtendedOrder = Order & {
    customer: { firstName: string | null; lastName: string | null; phone: string };
};

async function updateOrderStatus(orderId: number, newStatus: string) {
    'use server';
    await prisma.order.update({
        where: { id: orderId },
        data: { status: newStatus },
    });
    await prisma.orderHistory.create({
        data: {
            orderId,
            customerId: 0, // system entry or use courier ID if you track it
            status: newStatus,
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
        where: { status: 'pending' },
        include: {
            customer: {
                select: { firstName: true, lastName: true, phone: true },
            },
        },
        orderBy: { createdAt: 'asc' },
    });

    const inProgressOrders: ExtendedOrder[] = await prisma.order.findMany({
        where: { status: { in: ['en_route_pickup', 'picked_up'] } },
        include: {
            customer: {
                select: { firstName: true, lastName: true, phone: true },
            },
        },
        orderBy: { pickupDate: 'asc' },
    });

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">
                    Courier Dashboard — Welcome, {session.user.username}
                </h1>

                <section className="mb-12">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4">Available Pickups ({pendingOrders.length})</h2>
                    {pendingOrders.length === 0 ? (
                        <p className="text-gray-600">No pending pickups right now. Check back soon!</p>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {pendingOrders.map((order) => (
                                <div key={order.id} className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                                    <p className="font-medium">Order #{order.id}</p>
                                    <p className="text-sm text-gray-600">Customer: {order.customer.firstName} {order.customer.lastName}</p>
                                    <p className="text-sm text-gray-600">Phone: {order.customer.phone}</p>
                                    <p className="mt-2"><strong>Pickup:</strong> {order.pickupAddress}</p>
                                    <p className="text-sm">Date: {new Date(order.pickupDate).toLocaleDateString()}</p>
                                    <p className="text-sm">Time: {order.pickupTime}</p>
                                    <p className="mt-2"><strong>Dropoff:</strong> {order.dropoffAddress}</p>
                                    <p className="text-sm">Pieces: {order.totalPieces} | Weight: {order.orderWeight} lbs</p>

                                    <form action={updateOrderStatus.bind(null, order.id, 'en_route_pickup')} className="mt-4">
                                        <button type="submit" className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">
                                            Accept Job – Heading to Pickup
                                        </button>
                                    </form>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {inProgressOrders.length > 0 && (
                    <section>
                        <h2 className="text-2xl font-semibold text-gray-800 mb-4">In Progress ({inProgressOrders.length})</h2>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {inProgressOrders.map((order) => (
                                <div key={order.id} className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                                <p className="font-medium">Order #{order.id} — {order.status.replace('_', ' ').toUpperCase()}</p>
                                <p className="text-sm text-gray-600">Customer: {order.customer.firstName} {order.customer.lastName}</p>
                                <p className="mt-2"><strong>Pickup:</strong> {order.pickupAddress}</p>
                                <p className="mt-2"><strong>Dropoff:</strong> {order.dropoffAddress}</p>

                                {order.status === 'en_route_pickup' && (
                                    <form action={updateOrderStatus.bind(null, order.id, 'picked_up')} className="mt-4">
                                        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                                            Mark as Picked Up
                                        </button>
                                    </form>
                                )}

                                {order.status === 'picked_up' && (
                                    <form action={updateOrderStatus.bind(null, order.id, 'delivered')} className="mt-4">
                                        <button type="submit" className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">
                                            Mark as Delivered
                                        </button>
                                    </form>
                                )}
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
// src/app/courier/dashboard/page.tsx
'use client';
export const dynamic = 'force-dynamic';

import useSWR from 'swr';
import { toast } from 'sonner';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { OrderStatus } from '@/lib/order-status';
import { DashboardData } from '@/types/dashboard';
import { HistoryResponse } from '@/types/history';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function CourierDashboard() {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();

    const tab = searchParams.get('tab') || 'available';
    const historyPage = parseInt(searchParams.get('page') || '1');

    // Main dashboard data (available + in-progress + count)
    const { data: mainData, error: mainError, mutate, isLoading: mainLoading } = useSWR<DashboardData>(
        '/api/courier/dashboard',
        fetcher,
        {
            refreshInterval: tab === 'available' || tab === 'progress' ? 15000 : 0, // Only auto-refresh on active tabs
            revalidateOnFocus: true
        }
    );

    // History data - only fetch when on history tab
    const { data: historyData, error: historyError, isLoading: historyLoading } = useSWR<HistoryResponse | null>(
        tab === 'history' ? `/api/courier/history?page=${historyPage}` : null,
        fetcher
    );

    const prevPendingCount = useRef<number>(0);

    // Notify when new pending orders appear
    useEffect(() => {
        if (mainData && prevPendingCount.current > 0 && mainData.pendingOrders.length > prevPendingCount.current) {
            const newCount = mainData.pendingOrders.length - prevPendingCount.current;
            toast.success(`${newCount} new pickup${newCount > 1 ? 's' : ''} available!`, {
                duration: 6000,
            });
        }
        prevPendingCount.current = mainData?.pendingOrders?.length || 0;
    }, [mainData]);

    const updateOrderStatus = async (orderId: number, newStatus: OrderStatus) => {
        const res = await fetch('/api/orders/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId, newStatus }),
        });

        if (res.ok) {
            const messages: Record<string, string> = {
                EN_ROUTE_PICKUP: 'Job accepted! Heading to pickup.',
                PICKED_UP: 'Marked as Picked Up',
                DELIVERED: 'Delivery completed! Great job!',
            };
            toast.success(messages[newStatus]);
            mutate(); // Refresh data immediately
        } else {
            const err = await res.json();
            toast.error(err.error.includes('claimed') ? 'Job already claimed by another courier' : err.error || 'Action failed');
            mutate(); // Still refresh to show updated state
        }
    };

    if (mainError) return <div className="p-8 text-center text-red-600">Failed to load dashboard</div>;
    if (mainLoading || !mainData) return <div className="p-8 text-center text-gray-600">Loading dashboard...</div>;

    const { pendingOrders, inProgressOrders, deliveredCount, username } = mainData;

    const setTab = (newTab: string) => {
        const params = new URLSearchParams(searchParams);
        params.set('tab', newTab);
        if (newTab !== 'history'){ params.delete('page'); }
        router.push(`${pathname}?${params.toString()}`);
    };

    const setHistoryPage = (page: number) => {
        const params = new URLSearchParams(searchParams);
        params.set('tab', 'history');
        params.set('page', page.toString());
        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="min-h-screen bg-gray-100 p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-8">
                    Courier Dashboard — Welcome, {username}
                </h1>

                {/* Tabs */}
                <div className="flex border-b border-gray-300 mb-6 overflow-x-auto">
                    <button
                        onClick={() => setTab('available')}
                        className={`px-4 py-3 font-medium text-sm md:text-base whitespace-nowrap border-b-2 transition ${
                            tab === 'available'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-600 hover:text-gray-800'
                        }`}
                    >
                        Available Pickups ({pendingOrders.length})
                    </button>
                    <button
                        onClick={() => setTab('progress')}
                        className={`px-4 py-3 font-medium text-sm md:text-base whitespace-nowrap border-b-2 transition ml-4 ${
                            tab === 'progress'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-600 hover:text-gray-800'
                        }`}
                    >
                        In Progress ({inProgressOrders.length})
                    </button>
                    <button
                        onClick={() => setTab('history')}
                        className={`px-4 py-3 font-medium text-sm md:text-base whitespace-nowrap border-b-2 transition ml-4 ${
                            tab === 'history'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-600 hover:text-gray-800'
                        }`}
                    >
                        Delivery History ({deliveredCount})
                    </button>
                </div>

                {/* Available Pickups */}
                {tab === 'available' && (
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
                                                    <button
                                                        onClick={() => updateOrderStatus(order.id, OrderStatus.EN_ROUTE_PICKUP)}
                                                        className="px-4 py-2 bg-green-600 text-white text-xs md:text-sm rounded hover:bg-green-700 transition font-medium"
                                                    >
                                                        Accept Job
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
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
                                                            <button
                                                                onClick = {() => updateOrderStatus(order.id, OrderStatus.PICKED_UP)}
                                                                className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                                                            >
                                                                Mark Picked Up
                                                            </button>
                                                        )}
                                                        {order.status === OrderStatus.PICKED_UP && (
                                                            <button
                                                                onClick = {() => updateOrderStatus(order.id, OrderStatus.DELIVERED)}
                                                                className="px-3 py-1.5 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                                                            >
                                                                Mark Delivered
                                                            </button>
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

                        {historyError && (
                            <div className="p-8 text-center text-red-600">Failed to load history</div>
                        )}
                        {historyLoading && (
                            <div className="p-8 text-center text-gray-600">Loading history...</div>
                        )}
                        {!historyLoading && !historyError && historyData?.orders.length === 0 && (
                            <div className="p-8 text-center text-gray-600">
                                No deliveries completed yet. Your first one is coming soon!
                            </div>
                        )}

                        {historyData && historyData.orders.length > 0 && (
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
                                            {historyData.orders.map((order) => (
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
                                        Page {historyData.page} of {historyData.totalPages} ({historyData.total} total)
                                    </p>
                                    <div className="flex gap-2">
                                        {historyData.hasPrev && (
                                            <button
                                                onClick={() => setHistoryPage(historyData.page - 1)}
                                                className="px-4 py-2 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100"
                                            >
                                                Previous
                                            </button>
                                        )}
                                        {historyData.hasNext && (
                                            <button
                                                onClick={() => setHistoryPage(historyData.page + 1)}
                                                className="px-4 py-2 text-sm bg-white border border-gray-300 rounded hover:bg-gray-100"
                                            >
                                                Next
                                            </button>
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
// src/app/courier/dashboard/page.tsx
import { Suspense } from 'react';
import DashboardContent from './DashboardContent';

export const dynamic = 'force-dynamic';

export default function CourierDashboard() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-gray-600">Loading dashboard...</div>}>
            <DashboardContent />
        </Suspense>
    );
}
// src/components/DateRangePicker.tsx
'use client';
import { useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { format } from 'date-fns';

interface DateRangePickerProps {
    defaultStart: string;
    defaultEnd: string;
}

export function DateRangePicker({ defaultStart, defaultEnd }: DateRangePickerProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const updateDates = (start: string, end: string) => {
        startTransition(() => {
            const params = new URLSearchParams(searchParams.toString());
            params.set('start', start);
            params.set('end', end);
            router.replace(`/admin/invoices?${params.toString()}`, { scroll: false });
        });
    };

    const today = new Date();

    const setLast30Days = () => {
        const start = new Date(today);
        start.setDate(today.getDate() - 30);
        updateDates(format(start, 'yyyy-MM-dd'), format(today, 'yyyy-MM-dd'));
    };

    const setThisMonth = () => {
        const start = new Date(today.getFullYear(), today.getMonth(), 1);
        updateDates(format(start, 'yyyy-MM-dd'), format(today, 'yyyy-MM-dd'));
    };

    const setLastMonth = () => {
        const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const end = new Date(today.getFullYear(), today.getMonth(), 0);
        updateDates(format(start, 'yyyy-MM-dd'), format(end, 'yyyy-MM-dd'));
    };

    const setYearToDate = () => {
        const start = new Date(today.getFullYear(), 0, 1); // Jan 1 of current year
        updateDates(format(start, 'yyyy-MM-dd'), format(today, 'yyyy-MM-dd'));
    };

    const setAllTime = () => {
        // Reset to very early date (or remove params to show all)
        const start = new Date(2000, 0, 1); // Arbitrary old date
        updateDates(format(start, 'yyyy-MM-dd'), format(today, 'yyyy-MM-dd'));
    };

    return (
        <div className="mb-6 flex flex-row gap-4 items-end">
            <div>
                <label className="block text-sm mb-1">Start Date</label>
                <input
                    type="date"
                    value={searchParams.get('start') || defaultStart}
                    className="border rounded px-3 py-2"
                    onChange={(e) => {
                        if (e.target.value) {
                            updateDates(e.target.value, searchParams.get('end') || defaultEnd);
                        }
                    }}
                />
            </div>
            <div>
                <label className="block text-sm mb-1">End Date</label>
                <input
                    type="date"
                    value={searchParams.get('end') || defaultEnd}
                    className="border rounded px-3 py-2"
                    onChange={(e) => {
                        if (e.target.value) {
                            updateDates(searchParams.get('start') || defaultStart, e.target.value);
                        }
                    }}
                />
            </div>

            {/* Quick buttons */}
            <div className="flex flex-wrap gap-2">
                <button onClick={setLast30Days} disabled={isPending}
                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm disabled:opacity-50"
                >
                    Last 30 Days
                </button>
                <button onClick={setThisMonth} disabled={isPending}
                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm disabled:opacity-50"
                >
                    This Month
                </button>
                <button onClick={setLastMonth} disabled={isPending}
                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm disabled:opacity-50"
                >
                    Last Month
                </button>
                <button onClick={setYearToDate} disabled={isPending}
                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm disabled:opacity-50"
                >
                    Year-to-Date
                </button>
                <button onClick={setAllTime} disabled={isPending}
                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm disabled:opacity-50"
                >
                    All-Time
                </button>
            </div>

            {isPending && <span className="text-sm text-gray-500 self-end">Updating...</span>}
        </div>
    );
}
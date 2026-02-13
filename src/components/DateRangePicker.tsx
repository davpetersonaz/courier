// src/components/DateRangePicker.tsx
'use client';

import { useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface DateRangePickerProps {
    defaultStart: string;
    defaultEnd: string;
}

export function DateRangePicker({ defaultStart, defaultEnd }: DateRangePickerProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const updateDates = (newStart: string, newEnd: string) => {
        startTransition(() => {
            const params = new URLSearchParams(searchParams.toString());
            params.set('start', newStart);
            params.set('end', newEnd);
            router.replace(`/admin/invoices?${params.toString()}`, { scroll: false });
        });
    };

    return (
        <div className="mb-8 flex flex-col sm:flex-row gap-4 items-end">
            <div>
                <label className="block text-sm mb-1">Start Date</label>
                <input
                    type="date"
                    defaultValue={defaultStart}
                    className="border rounded px-3 py-2 w-full sm:w-auto"
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
                    defaultValue={defaultEnd}
                    className="border rounded px-3 py-2 w-full sm:w-auto"
                    onChange={(e) => {
                        if (e.target.value) {
                            updateDates(searchParams.get('start') || defaultStart, e.target.value);
                        }
                    }}
                />
            </div>
            {isPending && <span className="text-sm text-gray-500">Updating...</span>}
        </div>
    );
}
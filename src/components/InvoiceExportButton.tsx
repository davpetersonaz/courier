// src/components/InvoiceExportButton.tsx
'use client';

import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import type { OrderWithCustomer } from '@/types/order';

interface InvoiceExportButtonProps {
    orders: OrderWithCustomer[];
    startDate: Date;
    endDate: Date;
    totalAmount: number;
}

function cleanAddress(address: string): string {
    return address
        .replace(/,\s*USA$/i, '')
        .replace(/[\u200B-\u200D\uFEFF]/g, '')          // Remove zero-width chars
        .replace(/[\u00A0\u202F\u205F]/g, ' ')          // Replace fancy spaces with regular space
        .replace(/\s+/g, ' ')                           // Collapse multiple spaces
        .trim();
}

const createInvoicePDF = (
    orders: InvoiceExportButtonProps['orders'],
    startDate: Date,
    endDate: Date,
    totalAmount: number
): jsPDF => {
    const doc = new jsPDF('landscape', 'mm', 'a4');

    // Header
    doc.setFont('helvetica');
    doc.setFontSize(20);
    doc.text('SpeedyCourier Invoice', doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
    // title line
    doc.setLineWidth(0.5);
    doc.setDrawColor(200);
    doc.line(14, 45, doc.internal.pageSize.getWidth() - 14, 45);
    // Sub-header
    doc.setFontSize(12);
    doc.text(`Period: ${format(startDate, 'MMM d, yyyy')} – ${format(endDate, 'MMM d, yyyy')}`, 14, 30);
    doc.text(`Generated: ${format(new Date(), 'MMM d, yyyy h:mm a')}`, 14, 38);

    // Table
    autoTable(doc, {
        startY: 50,
        head: [['Order', 'Date / Time', 'Pickup / Dropoff', 'Pieces / Weight', 'Charge']],
        body: orders.map(order => {
            const price = order.pickupDate.getHours() < 9 ? 15.99 : 12.99;
            const pickup = cleanAddress(order.pickupAddress);
            const dropoff = cleanAddress(order.dropoffAddress);
            return [
                `#${order.id}`,
                `${format(order.pickupDate, 'MMM d, yyyy')} at ${order.pickupTime}`,
                `P: ${pickup}\nD: ${dropoff}`,
                `${order.totalPieces} pcs / ${order.orderWeight} lbs`,
                `$${price.toFixed(2)}`,
            ];
        }),
        theme: 'grid',
        headStyles: {
            fillColor: [59, 130, 246], // blue-600
            fontStyle: 'bold',
            halign: 'center'
        },
        styles: {
            fontSize: 9,              // Slightly smaller to fit more text
            cellPadding: 4,
            overflow: 'linebreak',    // ← this wraps long addresses
            valign: 'middle',
            halign: 'left',
            lineWidth: 0.1
        },
        columnStyles: {
            0: { cellWidth: 20, halign: 'center' },  // Order #
            1: { cellWidth: 45, halign: 'center' },  // Date / Time
            2: { cellWidth: 135, halign: 'left' },  // Pickup → Dropoff (widest column for addresses)
            3: { cellWidth: 35, halign: 'center' },  // Pieces / Weight
            4: { cellWidth: 30, halign: 'center' },  // Charge
        },
        tableWidth: 'auto',
        margin: { top: 50, left: 14, right: 14, bottom: 30 },
        rowPageBreak: 'avoid',   // Try to keep rows together
    });

    // Total
    const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 50;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total: $${totalAmount.toFixed(2)}`, 14, finalY + 20);

    // Footer
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Thank you for your business!', 14, finalY + 40);
    return doc;
};

export function InvoiceExportButton({ orders, startDate, endDate, totalAmount }: InvoiceExportButtonProps) {
    const generatePDF = () => {
        const doc = createInvoicePDF(orders, startDate, endDate, totalAmount);
        doc.save(`SpeedyCourier_Invoice_${format(startDate, 'yyyy-MM-dd')}_to_${format(endDate, 'yyyy-MM-dd')}.pdf`);
    };

    const sendEmail = async () => {
        if (!confirm('Send invoice email?')) return;

        const doc = createInvoicePDF(orders, startDate, endDate, totalAmount);
        const pdfBlob = doc.output('blob');
        const formData = new FormData();
        formData.append('pdf', pdfBlob, 'invoice.pdf');
        formData.append('start', format(startDate, 'yyyy-MM-dd'));
        formData.append('end', format(endDate, 'yyyy-MM-dd'));
        formData.append('orderIds', JSON.stringify(orders.map(o => o.id)));

        try {
            const res = await fetch('/api/email-invoice', {
                method: 'POST',
                body: formData,
            });
            if (res.ok) {
                alert('Invoice sent!');
            } else {
                alert('Failed to send');
            }
        } catch (err) {
            console.warn('InvoiceExportButton ERROR', err);
            alert('Error sending invoice');
        }
    };

    return (
        <div className="flex justify-end mt-6 gap-4">
            <button onClick={generatePDF}
                className="bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700 transition"
            >
                Export PDF
            </button>
            <button onClick={sendEmail} className="bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700">
                Email Invoice
            </button>
        </div>
    );
}
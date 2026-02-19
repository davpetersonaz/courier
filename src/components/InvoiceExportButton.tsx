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

const createInvoicePDF = (
    orders: InvoiceExportButtonProps['orders'],
    startDate: Date,
    endDate: Date,
    totalAmount: number
): jsPDF => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(18);
    doc.text('SpeedyCourier Invoice', 14, 20);
    // title line
    doc.setLineWidth(0.5);
    doc.setDrawColor(200);
    doc.line(14, 45, 196, 45);
    // Sub-header
    doc.setFontSize(12);
    doc.text(`Period: ${format(startDate, 'MMM d, yyyy')} – ${format(endDate, 'MMM d, yyyy')}`, 14, 30);
    doc.text(`Generated: ${format(new Date(), 'MMM d, yyyy h:mm a')}`, 14, 38);

    // Table
    autoTable(doc, {
        startY: 50,
        head: [['Order #', 'Date / Time', 'Pickup → Dropoff', 'Pieces / Weight', 'Charge']],
        body: orders.map(order => {
            const price = order.pickupDate.getHours() < 9 ? 15.99 : 12.99;
            return [
                `#${order.id}`,
                `${format(order.pickupDate, 'MMM d, yyyy')} at ${order.pickupTime}`,
                `${order.pickupAddress} → ${order.dropoffAddress}`,
                `${order.totalPieces} pcs / ${order.orderWeight} lbs`,
                `$${price.toFixed(2)}`,
            ];
        }),
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] }, // blue-600
        styles: {
            fontSize: 9,              // Slightly smaller to fit more text
            cellPadding: 4,
            overflow: 'linebreak',    // ← this wraps long addresses
            valign: 'middle',
        },
        columnStyles: {
            0: { cellWidth: 20 },  // Order #
            1: { cellWidth: 40 },  // Date / Time
            2: { cellWidth: 80 },  // Pickup → Dropoff (widest column for addresses)
            3: { cellWidth: 35 },  // Pieces / Weight
            4: { cellWidth: 25 },  // Charge
        },
        margin: { top: 50, left: 14, right: 14 },
        rowPageBreak: 'avoid'   // Try to keep rows together
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
                Export PDF / Email Invoice
            </button>
            <button onClick={sendEmail} className="bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700">
                Email Invoice
            </button>
        </div>
    );
}
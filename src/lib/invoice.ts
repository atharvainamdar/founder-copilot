export type InvoiceLine = {
  description: string;
  quantity: number;
  unitPriceInr: number;
  hsnSac?: string;
};

export type Invoice = {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  business: {
    name: string;
    address: string;
    gstin?: string;
    pan?: string;
    email?: string;
    phone?: string;
  };
  client: {
    name: string;
    address: string;
    gstin?: string;
    email?: string;
    phone?: string;
  };
  lines: InvoiceLine[];
  gstRatePercent: number;
  isInterState: boolean;
  notes?: string;
};

export function inr(n: number): string {
  return `₹${n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function computeInvoice(invoice: Invoice) {
  const subtotal = invoice.lines.reduce(
    (s, l) => s + l.quantity * l.unitPriceInr,
    0,
  );
  const gst = (subtotal * invoice.gstRatePercent) / 100;
  const cgst = invoice.isInterState ? 0 : gst / 2;
  const sgst = invoice.isInterState ? 0 : gst / 2;
  const igst = invoice.isInterState ? gst : 0;
  const total = subtotal + gst;
  return { subtotal, gst, cgst, sgst, igst, total };
}

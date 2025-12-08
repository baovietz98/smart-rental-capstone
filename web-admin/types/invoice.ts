export enum InvoiceStatus {
    DRAFT = 'DRAFT',
    PUBLISHED = 'PUBLISHED',
    PAID = 'PAID',
    PARTIAL = 'PARTIAL',
    OVERDUE = 'OVERDUE',
    CANCELLED = 'CANCELLED',
}

export interface InvoiceLineItem {
    type: 'RENT' | 'ELECTRIC' | 'WATER' | 'FIXED' | 'DEBT' | 'EXTRA' | 'DISCOUNT';
    name: string;
    quantity: number;
    unit?: string;
    unitPrice: number;
    amount: number;
    note?: string;
    serviceId?: number;
    readingId?: number;
}

export interface PaymentRecord {
    date: string;
    amount: number;
    method: 'CASH' | 'BANK' | 'MOMO' | 'ZALOPAY' | 'OTHER';
    note?: string;
    receivedBy?: string;
}

export interface Invoice {
    id: number;
    contractId: number;
    month: string;
    roomCharge: number;
    serviceCharge: number;
    extraCharge: number;
    previousDebt: number;
    discount: number;
    totalAmount: number;
    paidAmount: number;
    debtAmount: number;
    status: InvoiceStatus;
    lineItems: InvoiceLineItem[];
    paymentHistory: PaymentRecord[];
    dueDate?: string;
    note?: string;
    createdAt: string;
    updatedAt: string;
    publishedAt?: string;
    contract?: {
        id: number;
        room: {
            name: string;
            price: number;
            building: {
                name: string;
            };
        };
        tenant: {
            name: string;
            phone: string;
        };
    };
    accessCode?: string;
}

export interface GenerateInvoiceDto {
    contractId: number;
    month: string;
    proratedRent?: boolean;
    startDay?: number;
}

export interface ExtraChargeDto {
    name: string;
    amount: number;
    note?: string;
}

export interface UpdateInvoiceDto {
    extraCharges?: ExtraChargeDto[];
    lineItems?: InvoiceLineItem[];
    discount?: number;
    dueDate?: string;
    note?: string;
}

export interface RecordPaymentDto {
    amount: number;
    method: 'CASH' | 'BANK' | 'MOMO' | 'ZALOPAY' | 'OTHER';
    note?: string;
    receivedBy?: string;
    paymentDate?: string;
}

export interface InvoiceFilters {
    status?: InvoiceStatus;
    month?: string;
    buildingId?: number;
}

import axiosClient from '../axios-client';
import {
    GenerateInvoiceDto,
    Invoice,
    InvoiceFilters,
    InvoiceLineItem,
    RecordPaymentDto,
    UpdateInvoiceDto,
} from '../../types/invoice';

export const invoicesApi = {
    getAll: async (filters?: InvoiceFilters) => {
        const params = new URLSearchParams();
        if (filters?.status) params.append('status', filters.status);
        if (filters?.month) params.append('month', filters.month);
        if (filters?.buildingId) params.append('buildingId', filters.buildingId.toString());

        const response = await axiosClient.get<Invoice[]>(`/invoices?${params.toString()}`);
        return response.data;
    },

    getOne: async (id: number) => {
        const response = await axiosClient.get<Invoice>(`/invoices/${id}`);
        return response.data;
    },

    generateDraft: async (data: GenerateInvoiceDto) => {
        const response = await axiosClient.post<Invoice>('/invoices/generate', data);
        return response.data;
    },

    preview: async (data: GenerateInvoiceDto) => {
        const response = await axiosClient.post<{ lineItems: InvoiceLineItem[], totalAmount: number }>('/invoices/preview', data);
        return response.data;
    },

    generateBulk: async (month: string) => {
        const response = await axiosClient.post('/invoices/generate-bulk', null, {
            params: { month },
        });
        return response.data;
    },

    updateDraft: async (id: number, data: UpdateInvoiceDto) => {
        const response = await axiosClient.patch<Invoice>(`/invoices/${id}`, data);
        return response.data;
    },

    publish: async (id: number) => {
        const response = await axiosClient.patch<Invoice>(`/invoices/${id}/publish`);
        return response.data;
    },

    unpublish: async (id: number) => {
        const response = await axiosClient.patch<Invoice>(`/invoices/${id}/unpublish`);
        return response.data;
    },

    recordPayment: async (id: number, data: RecordPaymentDto) => {
        const response = await axiosClient.post<Invoice>(`/invoices/${id}/payment`, data);
        return response.data;
    },

    cancel: async (id: number) => {
        const response = await axiosClient.patch<Invoice>(`/invoices/${id}/cancel`);
        return response.data;
    },

    delete: async (id: number) => {
        const response = await axiosClient.delete(`/invoices/${id}`);
        return response.data;
    },

    getMonthlyStats: async (month: string) => {
        const response = await axiosClient.get(`/invoices/stats/${month}`);
        return response.data;
    }
};

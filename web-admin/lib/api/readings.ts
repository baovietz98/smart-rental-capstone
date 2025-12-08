import axiosClient from '../axios-client';
import { CreateReadingDto, ReadingStats, ServiceReading, UpdateReadingDto } from '../../types/reading';

export const readingsApi = {
    prepare: async (contractId: number, serviceId: number, month: string) => {
        const response = await axiosClient.get<{
            oldIndex: number;
            servicePrice: number;
            serviceUnit: string;
            serviceName: string;
        }>('/readings/prepare', {
            params: { contractId, serviceId, month },
        });
        return response.data;
    },

    prepareBulk: async (params: { buildingId: number; month: string }) => {
        const response = await axiosClient.get('/readings/prepare-bulk', { params });
        return response.data;
    },

    create: async (data: CreateReadingDto) => {
        const response = await axiosClient.post<ServiceReading>('/readings', data);
        return response.data;
    },

    bulkCreate: async (month: string, readings: {
        contractId: number;
        serviceId: number;
        newIndex: number;
        oldIndex?: number;
        isMeterReset?: boolean;
    }[]) => {
        const response = await axiosClient.post('/readings/bulk', readings, {
            params: { month },
        });
        return response.data;
    },

    findByContract: async (contractId: number) => {
        const response = await axiosClient.get<ServiceReading[]>(`/readings/contract/${contractId}`);
        return response.data;
    },

    findByMonth: async (contractId: number, month: string) => {
        const response = await axiosClient.get<ServiceReading[]>(`/readings/contract/${contractId}/month/${month}`);
        return response.data;
    },

    getUnreadRooms: async (month: string, serviceId: number) => {
        const response = await axiosClient.get<any[]>('/readings/unread', {
            params: { month, serviceId },
        });
        return response.data;
    },

    getStats: async (month: string) => {
        const response = await axiosClient.get<ReadingStats>(`/readings/stats/${month}`);
        return response.data;
    },

    findAll: async (month?: string, serviceId?: number) => {
        const response = await axiosClient.get<ServiceReading[]>('/readings/list', {
            params: { month, serviceId },
        });
        return response.data;
    },

    update: async (id: number, data: UpdateReadingDto) => {
        const response = await axiosClient.patch<ServiceReading>(`/readings/${id}`, data);
        return response.data;
    },

    delete: async (id: number) => {
        const response = await axiosClient.delete(`/readings/${id}`);
        return response.data;
    },
};

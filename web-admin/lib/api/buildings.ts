import axiosClient from '../axios-client';

export interface Building {
    id: number;
    name: string;
    address?: string;
}

export interface Room {
    id: number;
    name: string;
    price: number;
    status: string;
    buildingId: number;
}

export const buildingsApi = {
    getAll: async () => {
        const response = await axiosClient.get<Building[]>('/buildings');
        return response.data;
    },

    getRooms: async (buildingId: number) => {
        const response = await axiosClient.get<Room[]>(`/rooms/by-building/${buildingId}`);
        return response.data;
    }
};

export interface ServiceReading {
    id: number;
    contractId: number;
    serviceId: number;
    month: string;
    oldIndex: number;
    newIndex: number;
    usage: number;
    unitPrice: number;
    totalCost: number;
    isBilled: boolean;
    invoiceId?: number;
    createdAt: string;
    updatedAt: string;
    service: {
        name: string;
        unit: string;
    };
    contract: {
        room: {
            name: string;
            building: {
                name: string;
            };
        };
    };
}

export interface CreateReadingDto {
    contractId: number;
    serviceId: number;
    month: string;
    oldIndex?: number;
    newIndex: number;
    isMeterReset?: boolean;
    maxMeterValue?: number;
}

export interface UpdateReadingDto {
    newIndex: number;
}

export interface ReadingStats {
    month: string;
    totalReadings: number;
    totalUsage: number;
    totalCost: number;
    byService: Record<string, {
        count: number;
        usage: number;
        cost: number;
    }>;
}

export interface BulkServiceItem {
    serviceId: number;
    serviceName: string;
    price: number;
    oldIndex: number;
    newIndex?: number | null;
    isMeterReset: boolean;
    isBilled: boolean;
}

export interface BulkRoomItem {
    roomId: number;
    roomName: string;
    contractId: number;
    services: BulkServiceItem[];
}

export interface BulkCreateResult {
    success: boolean;
    data?: ServiceReading;
    serviceId?: number;
    error?: string;
}

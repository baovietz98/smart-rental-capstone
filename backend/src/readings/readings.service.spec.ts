import { Test, TestingModule } from '@nestjs/testing';
import { ReadingsService } from './readings.service';
import { PrismaService } from '../prisma/prisma.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { CreateReadingDto } from './dto';

describe('ReadingsService', () => {
  let service: ReadingsService;
  let prisma: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    prisma = mockDeep<PrismaService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReadingsService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<ReadingsService>(ReadingsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const mockCreateDto: CreateReadingDto = {
      contractId: 1,
      serviceId: 2, // e.g. Điện
      month: '11-2023',
      newIndex: 150,
      oldIndex: 100, // Optional
      isMeterReset: false,
    };

    const mockContract = { id: 1 } as any;
    const mockService = { id: 2, name: 'Điện', price: 3500 } as any;

    it('should throw ConflictException if reading for this month already exists', async () => {
      // Vì hàm create gọi hàm prepareReading bên trong, ta sẽ mock các db query của prepareReading
      prisma.contract.findUnique.mockResolvedValue(mockContract);
      prisma.service.findUnique.mockResolvedValue(mockService);
      
      // Giả lập: Tồn tại bản ghi chốt số trong DB
      prisma.serviceReading.findUnique.mockResolvedValue({
         id: 99,
         oldIndex: 100,
         newIndex: 150,
         usage: 50,
         totalCost: 175000,
         isBilled: false,
      } as any);

      await expect(service.create(mockCreateDto)).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException if newIndex is less than oldIndex AND isMeterReset is false', async () => {
      // Arrange setup prepareReading to return no existing reading
      prisma.contract.findUnique.mockResolvedValue(mockContract);
      prisma.service.findUnique.mockResolvedValue(mockService);
      prisma.serviceReading.findUnique.mockResolvedValue(null);
      
      // Giả lập tìm số cũ (vd 100)
      prisma.serviceReading.findFirst.mockResolvedValue({ newIndex: 100 } as any);

      const invalidDto = { ...mockCreateDto, newIndex: 90 }; // new < old

      // Act & Assert
      await expect(service.create(invalidDto)).rejects.toThrow(BadRequestException);
    });

    it('should calculate usage normally if newIndex >= oldIndex', async () => {
       // Arrange setup prepareReading to return no existing reading
       prisma.contract.findUnique.mockResolvedValue(mockContract);
       prisma.service.findUnique.mockResolvedValue(mockService);
       prisma.serviceReading.findUnique.mockResolvedValue(null);
       
       // Sẽ có lúc prisma ko lấy dto.oldIndex mà lấy từ get prepare, ta set trùng cho gọn
       prisma.serviceReading.findFirst.mockResolvedValue({ newIndex: mockCreateDto.oldIndex } as any);

       const mockCreatedReading = { id: 1, totalCost: 50 * 3500, usage: 50 } as any;
       prisma.serviceReading.create.mockResolvedValue(mockCreatedReading);

       // Act
       const result = await service.create(mockCreateDto);

       // Assert
       expect(result).toEqual(mockCreatedReading);
       expect(prisma.serviceReading.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            oldIndex: 100,
            newIndex: 150,
            usage: 50, // 150 - 100
            totalCost: 175000, // 50 * 3500
          }),
          include: { service: true, contract: { include: { room: true, tenant: true } } }
       });
    });

    it('should accept newIndex < oldIndex if isMeterReset is true and calculate usage as newIndex', async () => {
       // Arrange
       prisma.contract.findUnique.mockResolvedValue(mockContract);
       prisma.service.findUnique.mockResolvedValue(mockService);
       prisma.serviceReading.findUnique.mockResolvedValue(null);
       prisma.serviceReading.findFirst.mockResolvedValue({ newIndex: 100 } as any); // Số cũ 100

       const resetDto = { ...mockCreateDto, newIndex: 10, isMeterReset: true }; 
       const mockCreatedReading = { id: 1, totalCost: 10 * 3500, usage: 10 } as any;
       prisma.serviceReading.create.mockResolvedValue(mockCreatedReading);

       // Act
       const result = await service.create(resetDto);

       // Assert
       expect(result).toEqual(mockCreatedReading);
       expect(prisma.serviceReading.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            oldIndex: 100,
            newIndex: 10,
            usage: 10, // KHI bị reset đồng hồ, tiêu thụ = số mới (coi như bắt đầu từ 0)
            totalCost: 35000, 
            isMeterReset: true,
            note: expect.stringContaining('Thay đồng hồ/Quay vòng'),
          }),
          include: { service: true, contract: { include: { room: true, tenant: true } } }
       });
    });
  });
});

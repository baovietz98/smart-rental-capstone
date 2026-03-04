import { Test, TestingModule } from '@nestjs/testing';
import { ContractsService } from './contracts.service';
import { PrismaService } from '../prisma/prisma.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { CreateContractDto } from './dto';
import { RoomStatus } from '@prisma/client';

describe('ContractsService', () => {
  let service: ContractsService;
  let prisma: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    // 1. Arrange: Khởi tạo Mock PrismaService
    prisma = mockDeep<PrismaService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContractsService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<ContractsService>(ContractsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const mockCreateDto: CreateContractDto = {
      roomId: 1,
      tenantId: 1,
      price: 3000000,
      deposit: 3000000,
      startDate: new Date('2023-11-01').toISOString(),
      endDate: new Date('2024-11-01').toISOString(),
      numTenants: 2,
      note: 'Test contract',
      cycle: 1,
      paidDeposit: 3000000,
      waterUsageIndex: 0,
      electricityUsageIndex: 0,
    };

    it('should throw NotFoundException if room does not exist', async () => {
      // Arrange: Khi gọi db tìm phòng, giả lập trả về null (không thấy phòng)
      prisma.room.findUnique.mockResolvedValue(null);

      // Act & Assert: Chạy logic tạo và kì vọng văng exception
      await expect(service.create(mockCreateDto)).rejects.toThrow(NotFoundException);
      expect(prisma.room.findUnique).toHaveBeenCalledWith({
        where: { id: mockCreateDto.roomId },
        include: { building: true },
      });
    });

    it('should throw ConflictException if room already has an active contract', async () => {
      // Arrange
      prisma.room.findUnique.mockResolvedValue({ id: 1, name: 'P101', status: RoomStatus.AVAILABLE } as any);
      // Cố tình giả lập db tìm thấy 1 hợp đồng đang active ở phòng này
      prisma.contract.findFirst.mockResolvedValue({ id: 99, isActive: true } as any);

      // Act & Assert
      await expect(service.create(mockCreateDto)).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if tenant does not exist', async () => {
      // Arrange
      prisma.room.findUnique.mockResolvedValue({ id: 1 } as any);
      prisma.contract.findFirst.mockResolvedValue(null);
      // Giả lập ko tìm thấy người thuê
      prisma.tenant.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.create(mockCreateDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if end date is before start date', async () => {
       // Arrange
       prisma.room.findUnique.mockResolvedValue({ id: 1 } as any);
       prisma.contract.findFirst.mockResolvedValue(null);
       prisma.tenant.findUnique.mockResolvedValue({ id: 1 } as any);
       
       const invalidDto = {
         ...mockCreateDto,
         startDate: new Date('2023-12-01').toISOString(),
         endDate: new Date('2023-11-01').toISOString(), // Ngày kết thúc Lớn hơn ngày bắt đầu
       };

       // Act & Assert
       await expect(service.create(invalidDto)).rejects.toThrow(BadRequestException);
    });

    it('should create contract successfully if all validations pass', async () => {
      // Arrange: Mọi thứ đều hợp lệ
      const mockRoom = { id: 1, name: 'Room 1', depositPrice: 3000000 } as any;
      const mockTenant = { id: 1, fullName: 'John Doe' } as any;
      const mockCreatedContract = { id: 1, ...mockCreateDto } as any;

      prisma.room.findUnique.mockResolvedValue(mockRoom);
      prisma.contract.findFirst.mockResolvedValue(null); // ko có HĐ active
      prisma.tenant.findUnique.mockResolvedValue(mockTenant);

      // Giả lập môi trường Database Transaction
      // Để mock tx function trong prisma.$transaction(async (tx) => ...)
      prisma.$transaction.mockImplementation(async (callback) => {
         return callback(prisma as any);
      });

      // Giả lập hàm create bên trong transaction
      prisma.contract.create.mockResolvedValue(mockCreatedContract);

      // Act
      const result = await service.create(mockCreateDto);

      // Assert
      expect(result).toEqual(mockCreatedContract);
      // Đảm bảo hàm tạo hợp đồng được gọi với dữ liệu đúng
      expect(prisma.contract.create).toHaveBeenCalled();
      // Đảm bảo có tạo transaction phiếu thu
      expect(prisma.transaction.create).toHaveBeenCalled();
      // Đảm bảo trạng thái phòng dc chuyển sang RENTED
      expect(prisma.room.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: 'RENTED' }
      });
    });
  });
});

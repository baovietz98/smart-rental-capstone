import { Test, TestingModule } from '@nestjs/testing';
import { RoomsService } from './rooms.service';
import { PrismaService } from '../prisma/prisma.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RoomStatus } from '@prisma/client';
import { CreateRoomDto } from './dto';

describe('RoomsService', () => {
  let service: RoomsService;
  let prisma: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    prisma = mockDeep<PrismaService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomsService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<RoomsService>(RoomsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const mockCreateDto: CreateRoomDto = {
      name: 'P101',
      buildingId: 1,
      price: 3000000,
      area: 25,
      depositPrice: 3000000,
    };

    it('should throw NotFoundException if building not found', async () => {
      // Arrange
      prisma.building.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.create(mockCreateDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if room name already exists in building', async () => {
      // Arrange
      prisma.building.findUnique.mockResolvedValue({ id: 1, name: 'Tòa A' } as any);
      prisma.room.findFirst.mockResolvedValue({ id: 99, name: 'P101' } as any);

      // Act & Assert
      await expect(service.create(mockCreateDto)).rejects.toThrow(BadRequestException);
    });

    it('should successfully create a room', async () => {
      // Arrange
      prisma.building.findUnique.mockResolvedValue({ id: 1, name: 'Tòa A' } as any);
      prisma.room.findFirst.mockResolvedValue(null); // No existing room

      const mockCreatedRoom = { id: 1, ...mockCreateDto } as any;
      prisma.room.create.mockResolvedValue(mockCreatedRoom);

      // Act
      const result = await service.create(mockCreateDto);

      // Assert
      expect(result).toEqual(mockCreatedRoom);
      expect(prisma.room.create).toHaveBeenCalledWith({
        data: mockCreateDto,
        include: { building: { select: { id: true, name: true } } }
      });
    });
  });

  describe('updateStatus', () => {
    it('should throw BadRequestException when manually changing status to RENTED', async () => {
       // Arrange
       const mockRoom = { id: 1, status: RoomStatus.AVAILABLE } as any;
       // We must mock findUnique for findOne() to work properly inside updateStatus
       prisma.room.findUnique.mockResolvedValue(mockRoom);

       // Act & Assert
       await expect(service.updateStatus(1, RoomStatus.RENTED)).rejects.toThrow(BadRequestException);
       expect(prisma.room.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when changing from RENTED to AVAILABLE with active contract', async () => {
        // Arrange
        const mockRoomWithContract = { 
          id: 1, 
          status: RoomStatus.RENTED,
          contracts: [{ isActive: true }] 
        } as any;
        prisma.room.findUnique.mockResolvedValue(mockRoomWithContract);
 
        // Act & Assert
        await expect(service.updateStatus(1, RoomStatus.AVAILABLE)).rejects.toThrow(BadRequestException);
    });

    it('should successfully change status when there are no rule violations (e.g. AVAILABLE to MAINTENANCE)', async () => {
        // Arrange
        const mockRoom = { id: 1, status: RoomStatus.AVAILABLE, contracts: [] } as any;
        prisma.room.findUnique.mockResolvedValue(mockRoom);

        const expectedUpdatedRoom = { ...mockRoom, status: RoomStatus.MAINTENANCE } as any;
        prisma.room.update.mockResolvedValue(expectedUpdatedRoom);
 
        // Act
        const result = await service.updateStatus(1, RoomStatus.MAINTENANCE);

        // Assert
        expect(result.status).toBe(RoomStatus.MAINTENANCE);
        expect(prisma.room.update).toHaveBeenCalledWith({
          where: { id: 1 },
          data: { status: RoomStatus.MAINTENANCE }
        });
    });
  });
});

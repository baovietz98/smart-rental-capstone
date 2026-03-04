import { Test, TestingModule } from '@nestjs/testing';
import { TenantsService } from './tenants.service';
import { PrismaService } from '../prisma/prisma.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { ConflictException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CreateTenantDto } from './dto';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('TenantsService', () => {
  let service: TenantsService;
  let prisma: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    prisma = mockDeep<PrismaService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantsService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<TenantsService>(TenantsService);

    // Mock bcrypt hash since we don't need real hashing during these tests
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const mockCreateDto: CreateTenantDto = {
       fullName: 'Nguyen Van A',
       phone: '0901234567',
       cccd: '001099000123',
       address: 'Hanoi',
    };

    it('should throw ConflictException if phone already exists in Tenant table', async () => {
      // Arrange (Giả lập đã có khách thuê dùng sđt này)
      prisma.tenant.findUnique.mockResolvedValue({ id: 1, phone: '0901234567' } as any);

      // Act & Assert
      await expect(service.create(mockCreateDto)).rejects.toThrow(ConflictException);
    });

    it('should link to existing user if phone already exists in User table', async () => {
      // Arrange
      prisma.tenant.findUnique.mockResolvedValue(null);
      // Giả lập đã có User dùng sđt này -> Link nó thay vì tạo mới User
      const mockExistingUser = { id: 99, phoneNumber: '0901234567' } as any;
      prisma.user.findUnique.mockResolvedValue(mockExistingUser);

      const mockCreatedTenant = { id: 1, ...mockCreateDto, userId: 99 } as any;
      prisma.tenant.create.mockResolvedValue(mockCreatedTenant);

      // Act
      const result = await service.create(mockCreateDto);

      // Assert
      expect(result).toEqual(mockCreatedTenant);
      // Should NOT call user create
      expect(prisma.user.create).not.toHaveBeenCalled();
      // Should create tenant with existing user id
      expect(prisma.tenant.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ userId: 99, phone: '0901234567' }),
        include: { vehicles: true }
      });
    });

    it('should create a new user and tenant if neither exist', async () => {
      // Arrange
      prisma.tenant.findUnique.mockResolvedValue(null);
      prisma.user.findUnique.mockResolvedValue(null);

      const mockNewUser = { id: 55, phoneNumber: '0901234567' } as any;
      prisma.user.create.mockResolvedValue(mockNewUser);

      const mockCreatedTenant = { id: 1, ...mockCreateDto, userId: 55 } as any;
      prisma.tenant.create.mockResolvedValue(mockCreatedTenant);

      // Act
      const result = await service.create(mockCreateDto);

      // Assert
      expect(result).toEqual(mockCreatedTenant);
      expect(bcrypt.hash).toHaveBeenCalledWith('123456', 10);
      expect(prisma.user.create).toHaveBeenCalledWith({
         data: expect.objectContaining({
            phoneNumber: '0901234567',
            password: 'hashed_password',
            role: UserRole.TENANT
         })
      });
      expect(prisma.tenant.create).toHaveBeenCalledWith({
         data: expect.objectContaining({ userId: 55 }),
         include: { vehicles: true }
      });
    });
  });
});

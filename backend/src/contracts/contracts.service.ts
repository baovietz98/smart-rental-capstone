import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContractDto, UpdateContractDto, MoveContractDto } from './dto';
import { RoomStatus, Prisma } from '@prisma/client';

@Injectable()
export class ContractsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tạo hợp đồng mới
   * - Kiểm tra Room và Tenant tồn tại
   * - Kiểm tra Room chưa có hợp đồng active
   * - Tự động chuyển Room sang trạng thái RENTED
   */
  async create(createContractDto: CreateContractDto) {
    const { roomId, tenantId, startDate, endDate, ...rest } = createContractDto;

    // 1. Kiểm tra Room tồn tại
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: { building: true },
    });

    if (!room) {
      throw new NotFoundException(`Không tìm thấy phòng với ID: ${roomId}`);
    }

    // 2. Kiểm tra Room đã có hợp đồng active chưa
    const activeContract = await this.prisma.contract.findFirst({
      where: { roomId, isActive: true },
    });

    if (activeContract) {
      throw new ConflictException(
        `Phòng ${room.name} đang có hợp đồng thuê. Vui lòng kết thúc hợp đồng cũ trước.`,
      );
    }

    // 3. Kiểm tra Tenant tồn tại
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException(
        `Không tìm thấy khách thuê với ID: ${tenantId}`,
      );
    }

    // 4. Validate ngày
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;

    if (end && end <= start) {
      throw new BadRequestException('Ngày kết thúc phải sau ngày bắt đầu');
    }

    // 5. Tạo hợp đồng và cập nhật trạng thái phòng (Transaction)
    const contract = await this.prisma.$transaction(async (tx) => {
      // Tạo hợp đồng
      const newContract = await tx.contract.create({
        data: {
          ...rest,
          startDate: start,
          endDate: end,
          roomId,
          tenantId,
          isActive: true,
          paidDeposit: rest.paidDeposit || 0,
        },
        include: {
          room: {
            include: { building: { select: { id: true, name: true } } },
          },
          tenant: true,
        },
      });

      // 5b. Tạo Transaction nếu có đóng cọc
      if (rest.paidDeposit && rest.paidDeposit > 0) {
        await tx.transaction.create({
          data: {
            code: `PT-${Date.now()}`, // Simple code generation
            amount: rest.paidDeposit,
            type: 'DEPOSIT',
            contractId: newContract.id,
            note: 'Thu tiền cọc lúc ký hợp đồng',
          },
        });
      }

      // Cập nhật trạng thái phòng sang RENTED
      await tx.room.update({
        where: { id: roomId },
        data: { status: 'RENTED' },
      });

      // 6. Kiểm tra tiền cọc và tạo hóa đơn nợ nếu thiếu
      if (room.depositPrice && rest.deposit < room.depositPrice) {
        const missingAmount = room.depositPrice - rest.deposit;
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

        await tx.invoice.create({
          data: {
            contractId: newContract.id,
            month: currentMonth,
            roomCharge: 0,
            serviceCharge: 0,
            totalAmount: missingAmount,
            debtAmount: missingAmount,
            lineItems: [
              {
                name: 'Tiền cọc còn thiếu',
                amount: missingAmount,
                quantity: 1,
                unit: 'lần',
              },
            ],
            note: 'Tự động tạo: Thiếu tiền cọc',
            status: 'PARTIAL', // Hoặc DRAFT tùy logic
          },
        });
      }

      return newContract;
    });

    return contract;
  }

  /**
   * Lấy danh sách tất cả hợp đồng
   */
  async findAll(filters: {
    isActive?: boolean;
    roomId?: number;
    buildingId?: number;
  }) {
    const where: Prisma.ContractWhereInput = {};

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.roomId) {
      where.roomId = filters.roomId;
    }

    if (filters.buildingId) {
      where.room = { buildingId: filters.buildingId };
    }

    return this.prisma.contract.findMany({
      where,
      include: {
        room: {
          include: { building: { select: { id: true, name: true } } },
        },
        tenant: { select: { id: true, fullName: true, phone: true } },
        _count: { select: { invoices: true } },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  /**
   * Lấy hợp đồng theo phòng
   */
  async findByRoom(roomId: number) {
    return this.prisma.contract.findMany({
      where: { roomId },
      include: {
        tenant: { select: { id: true, fullName: true, phone: true } },
        _count: { select: { invoices: true } },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  /**
   * Lấy hợp đồng theo khách thuê
   */
  async findByTenant(tenantId: number, user?: any) {
    // Validate access for TENANT
    if (user && user.role === 'TENANT') {
      // Tenants can only view their own contracts
      // First find the tenant record for this user
      const tenant = await this.prisma.tenant.findUnique({
        where: { userId: user.id },
      });

      if (!tenant || tenant.id !== tenantId) {
        throw new ForbiddenException(
          'Bạn không có quyền xem hợp đồng của khách thuê khác',
        );
      }
    }

    return this.prisma.contract.findMany({
      where: { tenantId },
      include: {
        room: {
          include: { building: { select: { id: true, name: true } } },
        },
        _count: { select: { invoices: true } },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  /**
   * Lấy chi tiết hợp đồng
   */
  async findOne(id: number, user?: any) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: {
        room: {
          include: { building: true },
        },
        tenant: true,
        invoices: {
          orderBy: { month: 'desc' },
          take: 12, // 12 hóa đơn gần nhất
        },
      },
    });

    if (!contract) {
      throw new NotFoundException(`Không tìm thấy hợp đồng với ID: ${id}`);
    }

    // Validate access for TENANT
    if (user && user.role === 'TENANT') {
      const tenant = await this.prisma.tenant.findUnique({
        where: { userId: user.id },
      });

      if (!tenant || contract.tenantId !== tenant.id) {
        throw new ForbiddenException(
          `Bạn không có quyền xem chi tiết hợp đồng này. Contract Tenant: ${contract.tenantId}, Your Tenant: ${tenant?.id}`,
        );
      }
    }

    return contract;
  }

  /**
   * Cập nhật hợp đồng
   */
  async update(id: number, updateContractDto: UpdateContractDto) {
    await this.findOne(id);

    const { startDate, endDate, ...rest } = updateContractDto;

    const data: {
      startDate?: Date;
      endDate?: Date | null;
      deposit?: number;
      price?: number;
      isActive?: boolean;
    } = { ...rest };

    if (startDate) {
      data.startDate = new Date(startDate);
    }

    if (endDate !== undefined) {
      data.endDate = endDate ? new Date(endDate) : null;
    }

    return this.prisma.contract.update({
      where: { id },
      data,
      include: {
        room: { include: { building: { select: { id: true, name: true } } } },
        tenant: { select: { id: true, fullName: true, phone: true } },
      },
    });
  }

  /**
   * Kết thúc hợp đồng
   * - Đặt isActive = false
   * - Chuyển Room về trạng thái AVAILABLE
   */
  async terminate(id: number) {
    const contract = await this.findOne(id);

    if (!contract.isActive) {
      throw new BadRequestException('Hợp đồng đã kết thúc trước đó');
    }

    // Transaction: kết thúc hợp đồng + cập nhật trạng thái phòng
    const updatedContract = await this.prisma.$transaction(async (tx) => {
      const terminated = await tx.contract.update({
        where: { id },
        data: {
          isActive: false,
          endDate: new Date(), // Đặt ngày kết thúc là hôm nay
        },
        include: {
          room: { include: { building: { select: { id: true, name: true } } } },
          tenant: { select: { id: true, fullName: true, phone: true } },
        },
      });

      // Chuyển phòng về AVAILABLE
      await tx.room.update({
        where: { id: contract.roomId },
        data: { status: 'AVAILABLE' },
      });

      return terminated;
    });

    return updatedContract;
  }

  /**
   * Xóa hợp đồng (chỉ xóa khi chưa có hóa đơn)
   */
  async remove(id: number) {
    const contract = await this.findOne(id);

    if (contract.invoices.length > 0) {
      throw new ConflictException(
        `Không thể xóa hợp đồng đã có ${contract.invoices.length} hóa đơn`,
      );
    }

    // Transaction: xóa hợp đồng + cập nhật trạng thái phòng nếu đang active
    await this.prisma.$transaction(async (tx) => {
      if (contract.isActive) {
        await tx.room.update({
          where: { id: contract.roomId },
          data: { status: 'AVAILABLE' },
        });
      }

      await tx.contract.delete({ where: { id } });
    });

    return { message: 'Xóa hợp đồng thành công' };
  }

  /**
   * Thống kê hợp đồng
   */
  async getStats(buildingId?: number) {
    const now = new Date();
    const next30Days = new Date();
    next30Days.setDate(now.getDate() + 30);

    const where: Prisma.ContractWhereInput = {};
    if (buildingId) {
      where.room = { buildingId };
    }

    const [total, active, expired, expiring, totalRooms] = await Promise.all([
      this.prisma.contract.count({ where }),
      this.prisma.contract.count({ where: { ...where, isActive: true } }),
      this.prisma.contract.count({ where: { ...where, isActive: false } }),
      this.prisma.contract.count({
        where: {
          ...where,
          isActive: true,
          endDate: {
            lte: next30Days,
            gte: now,
          },
        },
      }),
      this.prisma.room.count({
        where: buildingId ? { buildingId } : {},
      }),
    ]);

    const vacant = totalRooms - active;

    return { total, active, expired, expiring, vacant, totalRooms };
  }

  /**
   * Chuyển phòng (Move Room) - PROFESSIONAL VERSION
   *
   * 1. Validate: Contract active, new room available
   * 2. Calculate Pro-rata rent for old room
   * 3. Calculate Utility Settlement (electric/water usage)
   * 4. Handle Deposit Adjustment
   * 5. Create Settlement Invoice or defer
   * 6. Update Contract with new room, price, deposit
   * 7. Create opening readings for new room
   * 8. Update room statuses
   */
  async moveContract(dto: MoveContractDto) {
    const {
      contractId,
      newRoomId,
      moveDate,
      oldRoomStatus,
      newRentPrice,
      newDepositAmount,
      oldRoomReadings,
      newRoomReadings,
      settlementOption,
      note,
    } = dto;

    const moveDateObj = new Date(moveDate);

    // 1. Kiểm tra hợp đồng
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: { room: true, tenant: true },
    });

    if (!contract) {
      throw new NotFoundException(`Không tìm thấy hợp đồng ${contractId}`);
    }

    if (!contract.isActive) {
      throw new BadRequestException(
        'Hợp đồng này đã kết thúc, không thể chuyển phòng.',
      );
    }

    if (contract.roomId === newRoomId) {
      throw new BadRequestException('Phòng mới trùng với phòng hiện tại.');
    }

    // 2. Kiểm tra phòng mới
    const newRoom = await this.prisma.room.findUnique({
      where: { id: newRoomId },
    });

    if (!newRoom) {
      throw new NotFoundException(`Không tìm thấy phòng mới ${newRoomId}`);
    }

    if (newRoom.status !== RoomStatus.AVAILABLE) {
      throw new BadRequestException(
        `Phòng mới ${newRoom.name} không ở trạng thái Trống (AVAILABLE).`,
      );
    }

    // 3. Calculate Pro-rata Rent for old room (days this month at old price)
    const daysInMonth = new Date(
      moveDateObj.getFullYear(),
      moveDateObj.getMonth() + 1,
      0,
    ).getDate();
    const daysAtOldRoom = Math.max(0, moveDateObj.getDate() - 1); // Days before move date
    const oldRoomProRata = (daysAtOldRoom / daysInMonth) * contract.price;

    // 4. Calculate Utility Settlement (if readings provided)
    const utilitySettlement: {
      serviceId: number;
      serviceName: string;
      usage: number;
      unitPrice: number;
      cost: number;
    }[] = [];

    if (oldRoomReadings && oldRoomReadings.length > 0) {
      for (const reading of oldRoomReadings) {
        // Get the last reading for this service
        const lastReading = await this.prisma.serviceReading.findFirst({
          where: { contractId, serviceId: reading.serviceId },
          orderBy: { readingDate: 'desc' },
          include: { service: true },
        });

        const lastIndex = lastReading?.newIndex || 0;
        const usage = Math.max(0, reading.indexValue - lastIndex);
        const unitPrice =
          lastReading?.unitPrice || lastReading?.service?.price || 0;
        const cost = usage * unitPrice;

        utilitySettlement.push({
          serviceId: reading.serviceId,
          serviceName:
            lastReading?.service?.name || `Service ${reading.serviceId}`,
          usage,
          unitPrice,
          cost,
        });
      }
    }

    const totalUtilityCost = utilitySettlement.reduce(
      (sum, u) => sum + u.cost,
      0,
    );

    // 5. Calculate Deposit Adjustment
    const depositDifference =
      (newDepositAmount || newRoom.depositPrice || 0) - contract.deposit;

    // 6. Thực hiện chuyển đổi trong Transaction
    return this.prisma.$transaction(async (tx) => {
      // a. Create closing readings for OLD room
      if (oldRoomReadings && oldRoomReadings.length > 0) {
        const currentMonth = `${moveDateObj.getFullYear()}-${String(moveDateObj.getMonth() + 1).padStart(2, '0')}`;

        for (const reading of oldRoomReadings) {
          const lastReading = await tx.serviceReading.findFirst({
            where: { contractId, serviceId: reading.serviceId },
            orderBy: { readingDate: 'desc' },
            include: { service: true },
          });

          const lastIndex = lastReading?.newIndex || 0;
          const usage = Math.max(0, reading.indexValue - lastIndex);
          const unitPrice =
            lastReading?.unitPrice || lastReading?.service?.price || 0;
          const totalCost = usage * unitPrice;

          // Create final reading entry for old room
          await tx.serviceReading.create({
            data: {
              month: currentMonth,
              contractId,
              serviceId: reading.serviceId,
              oldIndex: lastIndex,
              newIndex: reading.indexValue,
              usage,
              unitPrice,
              totalCost,
              readingDate: moveDateObj,
              isBilled: settlementOption === 'IMMEDIATE',
              note: `Chỉ số chốt khi chuyển phòng sang ${newRoom.name}`,
            },
          });
        }
      }

      // b. Create settlement invoice if IMMEDIATE
      if (
        settlementOption === 'IMMEDIATE' &&
        (oldRoomProRata > 0 || totalUtilityCost > 0)
      ) {
        const currentMonth = `${moveDateObj.getFullYear()}-${String(moveDateObj.getMonth() + 1).padStart(2, '0')}`;

        const lineItems: { name: string; amount: number }[] = [];

        if (oldRoomProRata > 0) {
          lineItems.push({
            name: `Tiền phòng ${contract.room.name} (${daysAtOldRoom} ngày)`,
            amount: Math.round(oldRoomProRata),
          });
        }

        utilitySettlement.forEach((u) => {
          if (u.cost > 0) {
            lineItems.push({
              name: `${u.serviceName} (${u.usage} đơn vị)`,
              amount: Math.round(u.cost),
            });
          }
        });

        const totalAmount =
          Math.round(oldRoomProRata) + Math.round(totalUtilityCost);

        await tx.invoice.create({
          data: {
            month: `${currentMonth}-MOVE`,
            contractId,
            roomCharge: Math.round(oldRoomProRata),
            serviceCharge: Math.round(totalUtilityCost),
            totalAmount,
            lineItems: lineItems,
            status: 'PUBLISHED',
            publishedAt: new Date(),
            note: `Hóa đơn thanh toán khi chuyển phòng từ ${contract.room.name} sang ${newRoom.name}`,
            dueDate: new Date(moveDateObj.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from move
          },
        });
      }

      // c. Create Transaction for deposit adjustment if needed
      if (depositDifference !== 0) {
        await tx.transaction.create({
          data: {
            code: `DEP-ADJ-${Date.now()}`,
            amount: Math.abs(depositDifference),
            type: depositDifference > 0 ? 'DEPOSIT' : 'OTHER',
            contractId,
            note:
              depositDifference > 0
                ? `Thu thêm tiền cọc khi chuyển sang ${newRoom.name}`
                : `Hoàn tiền cọc chênh lệch khi chuyển sang ${newRoom.name}`,
          },
        });
      }

      // d. Update Contract -> New room, new price, new deposit
      const updatedContract = await tx.contract.update({
        where: { id: contractId },
        data: {
          roomId: newRoomId,
          price: newRentPrice,
          deposit:
            newDepositAmount !== undefined
              ? newDepositAmount
              : contract.deposit + depositDifference,
        },
        include: {
          room: { include: { building: true } },
          tenant: true,
        },
      });

      // e. Create opening readings for NEW room
      if (newRoomReadings && newRoomReadings.length > 0) {
        const currentMonth = `${moveDateObj.getFullYear()}-${String(moveDateObj.getMonth() + 1).padStart(2, '0')}`;

        for (const reading of newRoomReadings) {
          const service = await tx.service.findUnique({
            where: { id: reading.serviceId },
          });

          await tx.serviceReading.create({
            data: {
              month: currentMonth,
              contractId,
              serviceId: reading.serviceId,
              oldIndex: reading.indexValue, // Opening = both old and new for first entry
              newIndex: reading.indexValue,
              usage: 0,
              unitPrice: service?.price || 0,
              totalCost: 0,
              readingDate: moveDateObj,
              isBilled: false,
              note: `Chỉ số đầu phòng mới ${newRoom.name}`,
            },
          });
        }
      }

      // f. Update OLD room status
      await tx.room.update({
        where: { id: contract.roomId },
        data: { status: oldRoomStatus || RoomStatus.MAINTENANCE },
      });

      // g. Update NEW room status -> RENTED
      await tx.room.update({
        where: { id: newRoomId },
        data: { status: RoomStatus.RENTED },
      });

      return {
        contract: updatedContract,
        settlement: {
          proRataRent: Math.round(oldRoomProRata),
          utilitySettlement,
          totalUtilityCost: Math.round(totalUtilityCost),
          depositDifference,
          settlementOption,
          invoiceCreated: settlementOption === 'IMMEDIATE',
        },
      };
    });
  }
}

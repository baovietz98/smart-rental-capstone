import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContractDto, UpdateContractDto } from './dto';

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
  async findAll(isActive?: boolean) {
    const where = isActive !== undefined ? { isActive } : {};

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
  async findByTenant(tenantId: number) {
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
  async findOne(id: number) {
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
  async getStats() {
    const [total, active, expired] = await Promise.all([
      this.prisma.contract.count(),
      this.prisma.contract.count({ where: { isActive: true } }),
      this.prisma.contract.count({ where: { isActive: false } }),
    ]);

    return { total, active, expired };
  }
}

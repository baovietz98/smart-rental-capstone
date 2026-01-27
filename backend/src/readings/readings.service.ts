import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReadingDto, UpdateReadingDto } from './dto';

// Interface cho response của API prepare
export interface PrepareReadingResponse {
  contractId: number;
  serviceId: number;
  serviceName: string;
  serviceUnit: string;
  servicePrice: number;
  month: string;
  oldIndex: number;
  isFirstReading: boolean; // Lần đầu chốt (lấy từ bàn giao)
  existingReading?: {
    // Nếu tháng này đã chốt rồi
    id: number;
    newIndex: number;
    usage: number;
    totalCost: number;
  };
}

@Injectable()
export class ReadingsService {
  constructor(private prisma: PrismaService) {}

  /**
   * API QUAN TRỌNG: Chuẩn bị dữ liệu cho form chốt số
   * Logic: Tự động lấy chỉ số cũ từ tháng trước hoặc bàn giao
   */
  async prepareReading(
    contractId: number,
    serviceId: number,
    month: string,
  ): Promise<PrepareReadingResponse> {
    console.log(`Preparing reading for Contract ${contractId}, Service ${serviceId}, Month ${month}`);

    // 1. Validate format tháng (MM-YYYY)
    if (!/^\d{2}-\d{4}$/.test(month)) {
      throw new BadRequestException(
        'Format tháng không hợp lệ. Phải là MM-YYYY (VD: 11-2025)',
      );
    }

    // 2. Kiểm tra hợp đồng tồn tại và đang active
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: { room: true },
    });

    if (!contract) {
      throw new NotFoundException(`Không tìm thấy hợp đồng ID: ${contractId}`);
    }

    if (!contract.isActive) {
      throw new BadRequestException('Hợp đồng đã kết thúc, không thể chốt số');
    }

    // 3. Kiểm tra dịch vụ tồn tại
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      throw new NotFoundException(`Không tìm thấy dịch vụ ID: ${serviceId}`);
    }

    if (service.type !== 'INDEX') {
      throw new BadRequestException(
        `Dịch vụ "${service.name}" là loại cố định, không cần chốt chỉ số`,
      );
    }

    // 4. Kiểm tra xem tháng này đã chốt chưa
    const existingReading = await this.prisma.serviceReading.findUnique({
      where: {
        contractId_serviceId_month: {
          contractId,
          serviceId,
          month,
        },
      },
    });

    if (existingReading) {
      // Đã chốt rồi -> Trả về data đã chốt để FE hiển thị
      return {
        contractId,
        serviceId,
        serviceName: service.name,
        serviceUnit: service.unit,
        servicePrice: service.price,
        month,
        oldIndex: existingReading.oldIndex,
        isFirstReading: false,
        existingReading: {
          id: existingReading.id,
          newIndex: existingReading.newIndex,
          usage: existingReading.usage,
          totalCost: existingReading.totalCost,
        },
      };
    }

    // 5. Chưa chốt -> Đi tìm chỉ số cũ (AUTO-ROLLOVER)
    let oldIndex = 0;
    let isFirstReading = false;

    // 5a. Tìm lần chốt gần nhất của dịch vụ này trong hợp đồng
    const lastReading = await this.prisma.serviceReading.findFirst({
      where: {
        contractId,
        serviceId,
      },
      orderBy: { readingDate: 'desc' },
    });

    if (lastReading) {
      // Có lần chốt trước -> Lấy newIndex của lần đó làm oldIndex
      oldIndex = lastReading.newIndex;
    } else {
      // Lần đầu tiên chốt -> Lấy từ initialIndexes trong Contract
      isFirstReading = true;
      const initialIndexes = contract.initialIndexes as Record<
        string,
        number
      > | null;

      if (initialIndexes && initialIndexes[serviceId.toString()]) {
        oldIndex = initialIndexes[serviceId.toString()];
      } else {
        // Không có chỉ số bàn giao -> Mặc định = 0
        oldIndex = 0;
      }
    }

    return {
      contractId,
      serviceId,
      serviceName: service.name,
      serviceUnit: service.unit,
      servicePrice: service.price,
      month,
      oldIndex,
      isFirstReading,
    };
  }

  /**
   * API QUAN TRỌNG: Chuẩn bị dữ liệu chốt số hàng loạt (Spreadsheet)
   * Logic:
   * 1. Lấy tất cả phòng đang thuê (RENTED) trong tòa nhà
   * 2. Với mỗi phòng, lấy các dịch vụ loại INDEX (Điện, Nước)
   * 3. Tính chỉ số cũ (Old Index) dựa trên tháng trước hoặc HĐ
   */
  async prepareBulk(buildingId: number, month: string) {
    // 1. Validate format tháng
    if (!/^\d{2}-\d{4}$/.test(month)) {
      throw new BadRequestException('Format tháng không hợp lệ (MM-YYYY)');
    }

    // 2. Lấy danh sách phòng đang thuê trong tòa nhà
    const rooms = await this.prisma.room.findMany({
      where: {
        buildingId,
        status: 'RENTED', // Chỉ lấy phòng đang thuê
      },
      include: {
        contracts: {
          where: { isActive: true }, // Lấy HĐ đang active
          take: 1,
        },
      },
      orderBy: { name: 'asc' },
    });

    // 3. Lấy danh sách dịch vụ loại INDEX của tòa nhà (thường là Điện, Nước)
    // Lưu ý: Service không gắn trực tiếp với Building trong schema hiện tại,
    // nhưng thường là chung. Ở đây ta lấy tất cả service loại INDEX.
    // Nếu service có buildingId thì filter thêm. Schema hiện tại Service ko có buildingId?
    // Check schema: Service model không có buildingId?
    // Wait, schema provided earlier showed:
    // model Service { ... } - No buildingId shown in the snippet provided in context?
    // Let's check schema again.
    // Ah, user prompt said: "model Service { ... buildingId Int }"
    // But let's check the actual schema file content I read earlier.
    // File `prisma/schema.prisma` lines 63-72:
    // model Service { id, name, price, unit, type, isActive, calculationType, readings }
    // NO buildingId in the actual schema file I read!
    // So services are global? Or I missed something?
    // Let's assume services are global for now or I should check if there is a relation.
    // Actually, usually services are per building or global.
    // If global, I just take all active INDEX services.

    const indexServices = await this.prisma.service.findMany({
      where: {
        type: 'INDEX',
        isActive: true,
      },
    });

    const result: {
      roomId: number;
      roomName: string;
      contractId: number;
      services: {
        serviceId: number;
        serviceName: string;
        price: number;
        oldIndex: number;
        newIndex: number | null;
        isBilled: boolean;
      }[];
    }[] = [];

    // 4. Loop từng phòng để tính toán
    for (const room of rooms) {
      if (room.contracts.length === 0) continue; // Should not happen if status is RENTED but safety check
      const contract = room.contracts[0];

      const roomData = {
        roomId: room.id,
        roomName: room.name,
        contractId: contract.id,
        services: [] as any[],
      };

      for (const service of indexServices) {
        // Tính toán chỉ số cũ cho service này
        // Logic tương tự prepareReading nhưng tối ưu hơn cho loop

        // Check xem tháng này đã chốt chưa?
        const existingReading = await this.prisma.serviceReading.findUnique({
          where: {
            contractId_serviceId_month: {
              contractId: contract.id,
              serviceId: service.id,
              month,
            },
          },
        });

        let oldIndex = 0;
        let newIndex: number | null = null; // Để null cho FE nhập
        let isBilled = false;

        if (existingReading) {
          oldIndex = existingReading.oldIndex;
          newIndex = existingReading.newIndex;
          isBilled = existingReading.isBilled;
        } else {
          // Chưa chốt -> Tìm số cũ (Auto-fill)
          // Tìm tháng trước: Logic giảm tháng
          const [m, y] = month.split('-').map(Number);
          let prevMonth = m - 1;
          let prevYear = y;
          if (prevMonth === 0) {
            prevMonth = 12;
            prevYear = y - 1;
          }
          const prevMonthStr = `${prevMonth.toString().padStart(2, '0')}-${prevYear}`;

          // Tìm reading tháng trước
          const prevReading = await this.prisma.serviceReading.findUnique({
            where: {
              contractId_serviceId_month: {
                contractId: contract.id,
                serviceId: service.id,
                month: prevMonthStr,
              },
            },
          });

          if (prevReading) {
            oldIndex = prevReading.newIndex;
          } else {
            // Không có tháng trước -> Lấy từ HĐ (Initial Index)
            const initialIndexes = contract.initialIndexes as Record<
              string,
              number
            > | null;
            if (initialIndexes && initialIndexes[service.id.toString()]) {
              oldIndex = initialIndexes[service.id.toString()];
            } else {
              oldIndex = 0; // Fallback
            }
          }
        }

        roomData.services.push({
          serviceId: service.id,
          serviceName: service.name,
          price: service.price,
          oldIndex,
          newIndex,
          isBilled,
        });
      }
      result.push(roomData);
    }

    return result;
  }

  /**
   * Tạo bản ghi chốt số mới
   * Hỗ trợ: Thay đồng hồ mới (isMeterReset)
   */
  async create(dto: CreateReadingDto) {
    // 1. Lấy thông tin chuẩn bị (bao gồm oldIndex auto-fill)
    const prepared = await this.prepareReading(
      dto.contractId,
      dto.serviceId,
      dto.month,
    );

    // 2. Kiểm tra đã chốt chưa
    if (prepared.existingReading) {
      throw new ConflictException(
        `Tháng ${dto.month} đã được chốt. Vui lòng dùng API update để sửa.`,
      );
    }

    // 3. Lấy oldIndex từ prepare (hoặc từ FE nếu có gửi)
    const oldIndex = dto.oldIndex ?? prepared.oldIndex;

    // 4. Xử lý trường hợp THAY ĐỒNG HỒ MỚI (Meter Reset)
    let usage: number;
    let note: string | null = null;

    if (dto.isMeterReset) {
      // Đồng hồ được thay mới hoặc quay vòng, tính theo yêu cầu: Tiêu thụ = Số mới (coi như bắt đầu từ 0)
      usage = dto.newIndex;
      note = `Thay đồng hồ/Quay vòng. Đồng hồ cũ: ${oldIndex}, đồng hồ mới: ${dto.newIndex}`;
    } else {
      // Trường hợp bình thường
      if (dto.newIndex < oldIndex) {
        throw new BadRequestException(
          `Chỉ số mới (${dto.newIndex}) phải >= chỉ số cũ (${oldIndex}). ` +
            `Nếu đã thay đồng hồ mới, vui lòng đánh dấu isMeterReset=true`,
        );
      }
      usage = dto.newIndex - oldIndex;
    }

    // 5. Tính tiền
    const totalCost = usage * prepared.servicePrice;

    // 6. Lưu vào DB
    return this.prisma.serviceReading.create({
      data: {
        contractId: dto.contractId,
        serviceId: dto.serviceId,
        month: dto.month,
        oldIndex,
        newIndex: dto.newIndex,
        usage,
        unitPrice: prepared.servicePrice,
        totalCost,
        isMeterReset: dto.isMeterReset ?? false,
        note,
        imageUrls: dto.imageUrls ? dto.imageUrls : undefined,
        isConfirmed: dto.isConfirmed ?? true,
        type: dto.isConfirmed === false ? 'TENANT' : 'ADMIN',
      },
      include: {
        service: true,
        contract: {
          include: { room: true, tenant: true },
        },
      },
    });
  }

  /**
   * Lấy tất cả bản ghi chốt số của 1 hợp đồng
   */
  async findByContract(contractId: number) {
    return this.prisma.serviceReading.findMany({
      where: { contractId },
      include: { service: true },
      orderBy: [{ month: 'desc' }, { serviceId: 'asc' }],
    });
  }

  /**
   * Lấy bản ghi chốt số theo tháng
   */
  async findByMonth(contractId: number, month: string) {
    return this.prisma.serviceReading.findMany({
      where: { contractId, month },
      include: { service: true },
      orderBy: { serviceId: 'asc' },
    });
  }

  /**
   * Lấy chi tiết 1 bản ghi
   */
  async findOne(id: number) {
    const reading = await this.prisma.serviceReading.findUnique({
      where: { id },
      include: {
        service: true,
        contract: {
          include: { room: true, tenant: true },
        },
      },
    });

    if (!reading) {
      throw new NotFoundException(`Không tìm thấy bản ghi chốt số ID: ${id}`);
    }

    return reading;
  }

  /**
   * Helper: So sánh tháng (MM-YYYY format)
   * Return: -1 nếu a < b, 0 nếu bằng, 1 nếu a > b
   */
  private compareMonths(a: string, b: string): number {
    const [monthA, yearA] = a.split('-').map(Number);
    const [monthB, yearB] = b.split('-').map(Number);

    if (yearA !== yearB) return yearA - yearB;
    return monthA - monthB;
  }

  /**
   * Cập nhật chỉ số (khi nhập sai)
   * EDGE CASE 2: Chặn sửa nếu đã có tháng sau chốt số
   */
  async update(id: number, dto: UpdateReadingDto) {
    const existing = await this.findOne(id);

    if (existing.isBilled) {
      throw new BadRequestException(
        'Không thể sửa bản ghi đã lên hóa đơn. Vui lòng hủy hóa đơn trước.',
      );
    }

    // EDGE CASE 2: Kiểm tra xem có bản ghi tháng SAU không
    const laterReadings = await this.prisma.serviceReading.findMany({
      where: {
        contractId: existing.contractId,
        serviceId: existing.serviceId,
        id: { not: id },
      },
    });

    // Tìm các tháng sau tháng hiện tại
    const hasLaterMonth = laterReadings.some(
      (r) => this.compareMonths(r.month, existing.month) > 0,
    );

    if (hasLaterMonth) {
      throw new BadRequestException(
        `Không thể sửa tháng ${existing.month} vì đã có tháng sau được chốt. ` +
          `Vui lòng xóa các tháng sau trước khi sửa tháng này.`,
      );
    }

    // Tính toán lại nếu newIndex thay đổi
    const newIndex = dto.newIndex ?? existing.newIndex;
    const oldIndex = dto.oldIndex ?? existing.oldIndex;

    if (newIndex < oldIndex) {
      throw new BadRequestException(
        `Chỉ số mới (${newIndex}) phải >= chỉ số cũ (${oldIndex})`,
      );
    }

    const usage = newIndex - oldIndex;
    const totalCost = usage * existing.unitPrice;

    return this.prisma.serviceReading.update({
      where: { id },
      data: {
        oldIndex,
        newIndex,
        usage,
        totalCost,
      },
      include: { service: true },
    });
  }

  /**
   * Xóa bản ghi chốt số
   * EDGE CASE 2: Chặn xóa nếu đã có tháng sau chốt số
   */
  async remove(id: number) {
    const existing = await this.findOne(id);

    if (existing.isBilled) {
      throw new BadRequestException(
        'Không thể xóa bản ghi đã lên hóa đơn. Vui lòng hủy hóa đơn trước.',
      );
    }

    // EDGE CASE 2: Kiểm tra xem có bản ghi tháng SAU không
    const laterReadings = await this.prisma.serviceReading.findMany({
      where: {
        contractId: existing.contractId,
        serviceId: existing.serviceId,
        id: { not: id },
      },
    });

    const hasLaterMonth = laterReadings.some(
      (r) => this.compareMonths(r.month, existing.month) > 0,
    );

    if (hasLaterMonth) {
      throw new BadRequestException(
        `Không thể xóa tháng ${existing.month} vì đã có tháng sau được chốt. ` +
          `Vui lòng xóa các tháng sau trước.`,
      );
    }

    return this.prisma.serviceReading.delete({
      where: { id },
    });
  }

  /**
   * Chốt số hàng loạt cho 1 hợp đồng trong 1 tháng
   * VD: Chốt cả Điện + Nước cùng lúc
   */
  async bulkCreate(
    readings: {
      contractId: number;
      serviceId: number;
      newIndex: number;
      oldIndex?: number;
      isMeterReset?: boolean;
    }[],
    month: string,
  ): Promise<
    Array<
      | { success: true; data: Awaited<ReturnType<typeof this.create>> }
      | { success: false; serviceId: number; error: string }
    >
  > {
    const results: Array<
      | { success: true; data: Awaited<ReturnType<typeof this.create>> }
      | { success: false; serviceId: number; error: string }
    > = [];

    for (const reading of readings) {
      try {
        const result = await this.create({
          contractId: reading.contractId,
          serviceId: reading.serviceId,
          month,
          newIndex: reading.newIndex,
          oldIndex: reading.oldIndex,
          isMeterReset: reading.isMeterReset,
        });
        results.push({ success: true, data: result });
      } catch (error) {
        results.push({
          success: false,
          serviceId: reading.serviceId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  /**
   * Lấy danh sách các phòng chưa chốt số tháng này
   */
  async getUnreadRooms(month: string, serviceId: number) {
    // Lấy tất cả hợp đồng đang active
    const activeContracts = await this.prisma.contract.findMany({
      where: { isActive: true },
      include: { room: { include: { building: true } }, tenant: true },
    });

    // Lấy các bản ghi đã chốt tháng này
    const existingReadings = await this.prisma.serviceReading.findMany({
      where: { month, serviceId },
      select: { contractId: true },
    });

    const readContractIds = new Set(existingReadings.map((r) => r.contractId));

    // Lọc ra các hợp đồng chưa chốt
    const unreadContracts = activeContracts.filter(
      (c) => !readContractIds.has(c.id),
    );

    return unreadContracts.map((c) => ({
      contractId: c.id,
      roomId: c.room.id,
      roomName: c.room.name,
      buildingName: c.room.building.name,
      tenantName: c.tenant.fullName,
    }));
  }

  /**
   * Thống kê chốt số theo tháng
   */

  async getMonthlyStats(month: string) {
    const readings = await this.prisma.serviceReading.findMany({
      where: { month },
      include: { service: true },
    });

    // Group by service
    const statsByService: Record<
      string,
      {
        serviceName: string;
        totalUsage: number;
        totalCost: number;
        count: number;
      }
    > = {};

    for (const reading of readings) {
      const key = reading.service.name;
      if (!statsByService[key]) {
        statsByService[key] = {
          serviceName: key,
          totalUsage: 0,
          totalCost: 0,
          count: 0,
        };
      }
      statsByService[key].totalUsage += reading.usage;
      statsByService[key].totalCost += reading.totalCost;
      statsByService[key].count += 1;
    }

    const uniqueContracts = new Set(readings.map((r) => r.contractId));

    return {
      month,
      totalRecords: readings.length,
      roomsCount: uniqueContracts.size, // Number of rooms/contracts that have readings
      totalAmount: readings.reduce((sum, r) => sum + r.totalCost, 0),
      byService: Object.values(statsByService),
    };
  }

  /**
   * Lấy danh sách chốt số (có filter)
   */
  async findAll(month?: string, serviceId?: number) {
    return this.prisma.serviceReading.findMany({
      where: {
        month: month || undefined,
        serviceId: serviceId ? parseInt(serviceId.toString(), 10) : undefined,
      },
      include: {
        service: true,
        contract: {
          include: { room: { include: { building: true } }, tenant: true },
        },
      },
      orderBy: [{ month: 'desc' }, { serviceId: 'asc' }],
    });
  }
}

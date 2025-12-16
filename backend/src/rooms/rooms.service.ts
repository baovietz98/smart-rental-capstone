import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { RoomStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoomDto, UpdateRoomDto, BulkUpdatePriceDto, BulkCreateIssueDto, BulkNotifyDto, PriceUpdateType } from './dto';

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * Tạo phòng mới
   * Kiểm tra buildingId có tồn tại không trước khi tạo
   */
  async create(createRoomDto: CreateRoomDto) {
    // Kiểm tra Building có tồn tại không
    const building = await this.prisma.building.findUnique({
      where: { id: createRoomDto.buildingId },
    });

    if (!building) {
      throw new NotFoundException(
        `Không tìm thấy tòa nhà với ID: ${createRoomDto.buildingId}`,
      );
    }

    // Kiểm tra tên phòng có trùng trong cùng tòa nhà không
    const existingRoom = await this.prisma.room.findFirst({
      where: {
        name: createRoomDto.name,
        buildingId: createRoomDto.buildingId,
      },
    });

    if (existingRoom) {
      throw new BadRequestException(
        `Phòng "${createRoomDto.name}" đã tồn tại trong tòa nhà "${building.name}"`,
      );
    }

    return this.prisma.room.create({
      data: createRoomDto,
      include: {
        building: {
          select: { id: true, name: true },
        },
      },
    });
  }

  /**
   * Lấy danh sách tất cả phòng
   */
  async findAll() {
    return this.prisma.room.findMany({
      include: {
        building: {
          select: { id: true, name: true },
        },
        issues: {
          select: { id: true, title: true, status: true },
        },
        _count: {
          select: { contracts: true },
        },
      },
      orderBy: [{ buildingId: 'asc' }, { name: 'asc' }],
    });
  }

  /**
   * Lấy danh sách phòng theo ID tòa nhà
   */
  async findByBuilding(buildingId: number) {
    // Kiểm tra Building có tồn tại không
    const building = await this.prisma.building.findUnique({
      where: { id: buildingId },
    });

    if (!building) {
      throw new NotFoundException(
        `Không tìm thấy tòa nhà với ID: ${buildingId}`,
      );
    }

    return this.prisma.room.findMany({
      where: { buildingId },
      include: {
        contracts: {
          where: { isActive: true },
          include: {
            tenant: true,
            invoices: {
              where: {
                status: { in: ['PARTIAL', 'OVERDUE', 'PUBLISHED'] }, // Only unpaid/partial invoices
              },
            },
          },
        },
        _count: {
          select: { contracts: true },
        },
        issues: {
          select: { id: true, title: true, status: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Lấy chi tiết phòng theo ID
   */
  async findOne(id: number) {
    const room = await this.prisma.room.findUnique({
      where: { id },
      include: {
        building: true,
        contracts: {
          where: { isActive: true },
          include: {
            tenant: {
              select: { id: true, fullName: true, phone: true },
            },
          },
        },
        _count: {
          select: { contracts: true, issues: true },
        },
      },
    });

    if (!room) {
      throw new NotFoundException(`Không tìm thấy phòng với ID: ${id}`);
    }

    return room;
  }

  /**
   * Cập nhật thông tin phòng
   */
  async update(id: number, updateRoomDto: UpdateRoomDto) {
    // Kiểm tra phòng có tồn tại không
    await this.findOne(id);

    return this.prisma.room.update({
      where: { id },
      data: updateRoomDto,
      include: {
        building: {
          select: { id: true, name: true },
        },
      },
    });
  }

  /**
   * Cập nhật trạng thái phòng
   */
  async updateStatus(id: number, status: RoomStatus) {
    const room = await this.findOne(id);
    
    // Strict Validation Logic (Lozido Style)
    // 1. Prevent manual switch to RENTED (Must create contract)
    if (status === RoomStatus.RENTED && room.status !== RoomStatus.RENTED) {
       throw new BadRequestException('Không thể chuyển thủ công sang ĐANG Ở. Vui lòng tạo Hợp Đồng mới.');
    }

    // 2. Prevent switch to AVAILABLE if Active Contract exists
    if (status === RoomStatus.AVAILABLE && room.status === RoomStatus.RENTED) {
       const activeContracts = room.contracts.filter(c => c.isActive);
       if (activeContracts.length > 0) {
          throw new BadRequestException('Phòng đang có hợp đồng hiệu lực. Vui lòng thanh lý hợp đồng trước khi chuyển sang TRỐNG.');
       }
    }

    // 3. Warning for MAINTENANCE (Allowed but careful) - Frontend handles warning, Backend allows.
    
    return this.prisma.room.update({
      where: { id },
      data: { status },
    });
  }

  /**
   * Xóa phòng
   * Chỉ xóa được khi không có hợp đồng active
   */
  async remove(id: number) {
    const room = await this.findOne(id);

    // Kiểm tra có hợp đồng active không
    const activeContracts = room.contracts.filter((c) => c.isActive);
    if (activeContracts.length > 0) {
      throw new BadRequestException(
        `Không thể xóa phòng đang có hợp đồng thuê. Vui lòng kết thúc hợp đồng trước.`,
      );
    }

    return this.prisma.room.delete({
      where: { id },
    });
  }

  /**
   * Lấy thống kê phòng theo trạng thái
   */
  async getStatsByBuilding(buildingId: number) {
    const stats = await this.prisma.room.groupBy({
      by: ['status'],
      where: { buildingId },
      _count: { status: true },
    });

    return stats.reduce(
      (acc, item) => {
        acc[item.status] = item._count.status;
        return acc;
      },
      { AVAILABLE: 0, RENTED: 0, MAINTENANCE: 0 },
    );
  }
  /**
   * Cập nhật giá đồng loạt
   */
  async bulkUpdatePrice(dto: BulkUpdatePriceDto) {
    const { roomIds, type, value } = dto;
    
    // Validate rooms exist
    const rooms = await this.prisma.room.findMany({
      where: { id: { in: roomIds } },
    });

    if (rooms.length !== roomIds.length) {
       throw new BadRequestException('Một số phòng không tồn tại');
    }

    const updates = rooms.map((room) => {
      let newPrice = room.price;
      if (type === PriceUpdateType.PERCENTAGE) {
        newPrice = Math.round(room.price * (1 + value / 100));
      } else if (type === PriceUpdateType.FIXED_ADD) {
        newPrice = room.price + value;
      } else if (type === PriceUpdateType.FIXED_SET) {
        newPrice = value;
      }
      
      return this.prisma.room.update({
        where: { id: room.id },
        data: { price: newPrice },
      });
    });

    return await this.prisma.$transaction(updates);
  }

  /**
   * Tạo sự cố đồng loạt
   */
  async bulkCreateIssues(dto: BulkCreateIssueDto) {
      const { roomIds, title, description } = dto;

      const creations = roomIds.map(roomId => 
          this.prisma.issue.create({
              data: {
                  title,
                  description: description || 'Báo cáo hàng loạt',
                  status: 'OPEN',
                  roomId
              }
          })
      );

      return await this.prisma.$transaction(creations);
  }

  /**
   * Gửi thông báo đồng loạt (Mô phỏng)
   */
  async bulkNotify(dto: BulkNotifyDto) {
    const { roomIds, message } = dto;
    
    // Simulate finding tenants involved
    const contracts = await this.prisma.contract.findMany({
        where: { 
            roomId: { in: roomIds },
            isActive: true
        },
        include: { tenant: true }
    });
    
    // Log to console to simulate sending
    console.log(`[ZALO MOCK] Sending message to ${contracts.length} tenants: "${message}"`);
    contracts.forEach(c => {
        console.log(` -> To: ${c.tenant.fullName} (${c.tenant.phone})`);
    });

    return { 
        success: true, 
        sentCount: contracts.length, 
        message: 'Đã gửi thông báo thành công (Mô phỏng)' 
    };
  }
}

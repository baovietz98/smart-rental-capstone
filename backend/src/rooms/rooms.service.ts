import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { RoomStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoomDto, UpdateRoomDto } from './dto';

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

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
        _count: {
          select: { contracts: true },
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
    await this.findOne(id);

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
}

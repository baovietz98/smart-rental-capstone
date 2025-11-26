import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBuildingDto, UpdateBuildingDto } from './dto';

@Injectable()
export class BuildingsService {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * Tạo mới một tòa nhà
   */
  async create(createBuildingDto: CreateBuildingDto) {
    return this.prisma.building.create({
      data: createBuildingDto,
    });
  }

  /**
   * Lấy danh sách tất cả tòa nhà
   * Include số lượng phòng của mỗi tòa
   */
  async findAll() {
    const buildings = await this.prisma.building.findMany({
      include: {
        rooms: {
          select: { status: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return buildings.map((b) => ({
      ...b,
      totalRooms: b.rooms.length,
      availableRooms: b.rooms.filter((r) => r.status === 'AVAILABLE').length,
      rentedRooms: b.rooms.filter((r) => r.status === 'RENTED').length,
      maintenanceRooms: b.rooms.filter((r) => r.status === 'MAINTENANCE').length,
      rooms: undefined, // Hide detailed list to keep response light
    }));
  }

  /**
   * Lấy chi tiết một tòa nhà theo ID
   * Include danh sách phòng
   */
  async findOne(id: number) {
    const building = await this.prisma.building.findUnique({
      where: { id },
      include: {
        rooms: {
          orderBy: { name: 'asc' },
        },
        _count: {
          select: { rooms: true },
        },
      },
    });

    if (!building) {
      throw new NotFoundException(`Không tìm thấy tòa nhà với ID: ${id}`);
    }

    return building;
  }

  /**
   * Cập nhật thông tin tòa nhà
   */
  async update(id: number, updateBuildingDto: UpdateBuildingDto) {
    // Kiểm tra tòa nhà có tồn tại không
    await this.findOne(id);

    return this.prisma.building.update({
      where: { id },
      data: updateBuildingDto,
    });
  }

  /**
   * Xóa tòa nhà
   * Lưu ý: Chỉ xóa được khi không còn phòng nào
   */
  async remove(id: number) {
    // Kiểm tra tòa nhà có tồn tại không
    const building = await this.findOne(id);

    // Kiểm tra xem có phòng nào không
    if (building._count.rooms > 0) {
      throw new NotFoundException(
        `Không thể xóa tòa nhà đang có ${building._count.rooms} phòng. Vui lòng xóa hết phòng trước.`,
      );
    }

    return this.prisma.building.delete({
      where: { id },
    });
  }
}

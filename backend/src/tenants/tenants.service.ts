import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantDto, UpdateTenantDto } from './dto';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tạo khách thuê mới
   */
  async create(createTenantDto: CreateTenantDto) {
    // 1. Kiểm tra số điện thoại đã tồn tại trong bảng Tenant chưa
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { phone: createTenantDto.phone },
    });

    if (existingTenant) {
      throw new ConflictException(
        `Số điện thoại ${createTenantDto.phone} đã được đăng ký cho khách thuê khác`,
      );
    }

    // 2. Tự động tạo hoặc liên kết tài khoản User
    let userId: number | null = null;

    // Kiểm tra xem đã có User với SĐT này chưa
    const existingUser = await this.prisma.user.findUnique({
      where: { phoneNumber: createTenantDto.phone },
    });

    if (existingUser) {
      // Nếu đã có User, liên kết luôn
      userId = existingUser.id;
    } else {
      // Nếu chưa có, tạo User mới
      // Mật khẩu mặc định: 123456
      const hashedPassword = await bcrypt.hash('123456', 10);

      const newUser = await this.prisma.user.create({
        data: {
          email: `${createTenantDto.phone}@domain.com`, // Email giả lập từ SĐT (hoặc để trống nếu schema cho phép, nhưng User.email thường là unique required)
          // Để tránh trùng email dummy, ta có thể dùng SĐT làm unique identifier chính.
          // Tuy nhiên User model required email. Ta sẽ dùng format: [phone]@system.local
          phoneNumber: createTenantDto.phone,
          password: hashedPassword,
          name: createTenantDto.fullName,
          role: UserRole.TENANT,
        },
      });
      userId = newUser.id;
    }

    // 3. Tạo Tenant với userId đã có
    return this.prisma.tenant.create({
      data: {
        ...createTenantDto,
        userId: userId,
      },
    });
  }

  /**
   * Lấy danh sách tất cả khách thuê
   */
  async findAll() {
    return this.prisma.tenant.findMany({
      include: {
        contracts: {
          where: { isActive: true },
          include: {
            room: {
              include: {
                building: true,
              },
            },
          },
        },
        _count: {
          select: { contracts: true },
        },
      },
      orderBy: { fullName: 'asc' },
    });
  }

  /**
   * Tìm kiếm khách thuê theo tên hoặc số điện thoại
   */
  async search(query: string) {
    return this.prisma.tenant.findMany({
      where: {
        OR: [
          { fullName: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query } },
          { cccd: { contains: query } },
        ],
      },
      include: {
        contracts: {
          where: { isActive: true },
          include: {
            room: {
              include: {
                building: true,
              },
            },
          },
        },
        _count: {
          select: { contracts: true },
        },
      },
    });
  }

  /**
   * Lấy chi tiết khách thuê theo ID
   */
  async findOne(id: number) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        user: true, // Include User to get email
        contracts: {
          include: {
            room: {
              include: {
                building: { select: { id: true, name: true } },
              },
            },
          },
          orderBy: { startDate: 'desc' },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Không tìm thấy khách thuê với ID: ${id}`);
    }

    return tenant;
  }

  /**
   * Tìm khách thuê theo số điện thoại
   */
  async findByPhone(phone: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { phone },
      include: {
        contracts: {
          where: { isActive: true },
          include: {
            room: {
              include: { building: true },
            },
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException(
        `Không tìm thấy khách thuê với SĐT: ${phone}`,
      );
    }

    return tenant;
  }

  /**
   * Cập nhật thông tin khách thuê
   */
  async update(id: number, updateTenantDto: UpdateTenantDto) {
    await this.findOne(id);

    // Nếu cập nhật số điện thoại, kiểm tra trùng
    if (updateTenantDto.phone) {
      const existingTenant = await this.prisma.tenant.findFirst({
        where: {
          phone: updateTenantDto.phone,
          id: { not: id },
        },
      });

      if (existingTenant) {
        throw new ConflictException(
          `Số điện thoại ${updateTenantDto.phone} đã được đăng ký`,
        );
      }
    }

    return this.prisma.tenant.update({
      where: { id },
      data: updateTenantDto,
    });
  }

  /**
   * Xóa khách thuê
   * Chỉ xóa được khi không có hợp đồng nào
   */
  async remove(id: number) {
    const tenant = await this.findOne(id);

    if (tenant.contracts.length > 0) {
      throw new ConflictException(
        `Không thể xóa khách thuê đang có ${tenant.contracts.length} hợp đồng`,
      );
    }

    // Xóa các dữ liệu phụ liên quan trước
    await this.prisma.vehicle.deleteMany({ where: { tenantId: id } });
    await this.prisma.guestRequest.deleteMany({ where: { tenantId: id } });
    await this.prisma.notification.deleteMany({ where: { tenantId: id } });

    // Cuối cùng xóa tenant
    return this.prisma.tenant.delete({
      where: { id },
    });
  }
}

import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIssueDto, UpdateIssueDto, IssueStatus } from './dto';

@Injectable()
export class IssuesService {
    constructor(private prisma: PrismaService) { }

    async create(dto: CreateIssueDto, user?: any) {
        // Verify room exists
        const room = await this.prisma.room.findUnique({
            where: { id: dto.roomId },
            include: {
                contracts: {
                    where: { isActive: true },
                    include: { tenant: true },
                }
            }
        });

        if (!room) {
            throw new NotFoundException(`Không tìm thấy phòng với ID ${dto.roomId}`);
        }

        // Validate Tenant Access
        if (user && user.role === 'TENANT') {
            // Find tenant associated with this user
            const tenant = await this.prisma.tenant.findUnique({
                where: { userId: user.id }
            });

            if (!tenant) {
                 throw new ForbiddenException('Tài khoản không liên kết với thông tin khách thuê');
            }

            // Check if tenant has active contract for this room
            const hasContract = room.contracts.some(c => c.tenantId === tenant.id);
            if (!hasContract) {
                throw new ForbiddenException('Bạn không có quyền báo sự cố cho phòng này');
            }
        }

        return this.prisma.issue.create({
            data: {
                title: dto.title,
                description: dto.description,
                roomId: dto.roomId,
                status: IssueStatus.OPEN,
                priority: dto.priority || 'NORMAL',
                images: dto.images ? (dto.images as any) : undefined,
            },
            include: {
                room: {
                    include: {
                        building: true,
                    },
                },
            },
        });
    }

    async findAll(filters?: { status?: IssueStatus; roomId?: number; buildingId?: number }) {
        const where: any = {};

        if (filters?.status) {
            where.status = filters.status;
        }

        if (filters?.roomId) {
            where.roomId = filters.roomId;
        }

        if (filters?.buildingId) {
            where.room = {
                buildingId: filters.buildingId,
            };
        }

        return this.prisma.issue.findMany({
            where,
            include: {
                room: {
                    include: {
                        building: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    async findOne(id: number, user?: any) {
        const issue = await this.prisma.issue.findUnique({
            where: { id },
            include: {
                room: {
                    include: {
                        building: true,
                        contracts: {
                            where: { isActive: true },
                            include: {
                                tenant: true,
                            },
                        },
                    },
                },
            },
        });

        if (!issue) {
            throw new NotFoundException(`Không tìm thấy sự cố với ID ${id}`);
        }

        // Validate Tenant Access
        if (user && user.role === 'TENANT') {
             const tenant = await this.prisma.tenant.findUnique({
                where: { userId: user.id }
            });
             
             if (!tenant) throw new ForbiddenException('Access Denied');

             // Check if tenant is associated with the room of this issue
             const hasAccess = issue.room.contracts.some(c => c.tenantId === tenant.id);
             if (!hasAccess) {
                 throw new ForbiddenException('Bạn không có quyền xem sự cố này');
             }
        }

        return issue;
    }

    async update(id: number, dto: UpdateIssueDto) {
        await this.findOne(id); // Verify exists (Admin only usually updates, or add checks if needed)

        return this.prisma.issue.update({
            where: { id },
            data: dto,
            include: {
                room: {
                    include: {
                        building: true,
                    },
                },
            },
        });
    }

    async updateStatus(id: number, status: IssueStatus) {
        const issue = await this.findOne(id);

        // Validate status transition
        const validTransitions: Record<string, string[]> = {
            OPEN: ['PROCESSING', 'DONE'],
            PROCESSING: ['DONE', 'OPEN'],
            DONE: ['OPEN'], // Can reopen if needed
        };

        if (!validTransitions[issue.status]?.includes(status)) {
            throw new BadRequestException(
                `Không thể chuyển trạng thái từ ${issue.status} sang ${status}`,
            );
        }

        return this.prisma.issue.update({
            where: { id },
            data: { status },
            include: {
                room: {
                    include: {
                        building: true,
                    },
                },
            },
        });
    }

    async remove(id: number) {
        await this.findOne(id); // Verify exists

        return this.prisma.issue.delete({
            where: { id },
        });
    }

    async getStats(buildingId?: number) {
        const where: any = buildingId ? { room: { buildingId } } : {};
        const [total, open, processing, done] = await Promise.all([
            this.prisma.issue.count({ where }),
            this.prisma.issue.count({ where: { ...where, status: 'OPEN' } }),
            this.prisma.issue.count({ where: { ...where, status: 'PROCESSING' } }),
            this.prisma.issue.count({ where: { ...where, status: 'DONE' } }),
        ]);

        const stats: any = { total, OPEN: open, PROCESSING: processing, DONE: done };
        return stats;
    }

    async findByRoom(roomId: number, user?: any) {
        if (user && user.role === 'TENANT') {
             const tenant = await this.prisma.tenant.findUnique({
                where: { userId: user.id }
            });
             if (!tenant) throw new ForbiddenException('Access Denied');

             // Verify contract for this room
             const contract = await this.prisma.contract.findFirst({
                 where: {
                     roomId: roomId,
                     tenantId: tenant.id,
                     isActive: true
                 }
             });

             if (!contract) {
                 throw new ForbiddenException('Bạn không có quyền xem sự cố của phòng này');
             }
        }

        return this.prisma.issue.findMany({
            where: { roomId },
            orderBy: { createdAt: 'desc' },
        });
    }
}

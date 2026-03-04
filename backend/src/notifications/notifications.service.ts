import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createNotificationDto: CreateNotificationDto) {
    return this.prisma.notification.create({
      data: createNotificationDto,
    });
  }

  async findAll(tenantId?: number) {
    // If tenantId provided, fetch GENERAL notifications OR specific tenant notifications
    // If not provided (Admin), fetch all? Or maybe separate endpoint.
    // For now, simple logic:
    const where: any = {};

    if (tenantId) {
      where.OR = [
        { tenantId: null }, // Public/General
        { tenantId: tenantId }, // Private
      ];
    }

    return this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findLatest() {
    return this.prisma.notification.findFirst({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });
    if (!notification) {
      throw new Error(`Notification with ID ${id} not found`);
    }
    return notification;
  }

  async markAsRead(id: number) {
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async remove(id: number) {
    return this.prisma.notification.delete({
      where: { id },
    });
  }
}

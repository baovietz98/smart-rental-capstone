import { Controller, Get, Post, Body, Query, Patch, Delete, Param, ParseIntPipe } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Notifications')
@Controller('notifications')
// @UseGuards(JwtAuthGuard) // Uncomment when Auth is ready, currently Public for easy testing or handled globally
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo thông báo mới (Admin)' })
  create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationsService.create(createNotificationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách thông báo' })
  findAll(@Query('tenantId') tenantId?: string) {
    return this.notificationsService.findAll(tenantId ? +tenantId : undefined);
  }

  @Get('latest')
  @ApiOperation({ summary: 'Lấy thông báo mới nhất' })
  findLatest() {
    return this.notificationsService.findLatest();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết thông báo' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.notificationsService.findOne(id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Đánh dấu đã đọc' })
  markAsRead(@Param('id', ParseIntPipe) id: number) {
    return this.notificationsService.markAsRead(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa thông báo' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.notificationsService.remove(id);
  }
}

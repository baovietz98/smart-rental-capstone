import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { ReadingsService } from './readings.service';
import { CreateReadingDto, UpdateReadingDto } from './dto';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Readings - Chốt số điện nước')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('readings')
export class ReadingsController {
  constructor(private readonly readingsService: ReadingsService) { }

  @Get('list')
  @ApiOperation({ summary: 'Lấy danh sách chốt số (có filter)' })
  @ApiQuery({ name: 'month', required: false })
  @ApiQuery({ name: 'serviceId', required: false })
  findAll(
    @Query('month') month?: string,
    @Query('serviceId') serviceId?: string,
  ) {
    return this.readingsService.findAll(
      month,
      serviceId ? parseInt(serviceId, 10) : undefined,
    );
  }

  @Get('prepare-bulk')
  @ApiOperation({
    summary:
      'Chuẩn bị dữ liệu chốt số hàng loạt cho cả tòa nhà (Spreadsheet UI)',
  })
  @ApiQuery({ name: 'buildingId', type: Number, description: 'ID tòa nhà' })
  @ApiQuery({
    name: 'month',
    type: String,
    description: 'Tháng chốt (MM-YYYY)',
    example: '11-2025',
  })
  prepareBulk(
    @Query('buildingId', ParseIntPipe) buildingId: number,
    @Query('month') month: string,
  ) {
    return this.readingsService.prepareBulk(buildingId, month);
  }

  /**
   * API QUAN TRỌNG: Chuẩn bị dữ liệu cho form chốt số
   * Frontend gọi API này để lấy oldIndex (auto-fill)
   */
  @Get('prepare')
  @ApiOperation({
    summary: 'Chuẩn bị dữ liệu cho form chốt số (lấy chỉ số cũ tự động)',
  })
  @ApiQuery({ name: 'contractId', type: Number, description: 'ID hợp đồng' })
  @ApiQuery({ name: 'serviceId', type: Number, description: 'ID dịch vụ' })
  @ApiQuery({
    name: 'month',
    type: String,
    description: 'Tháng chốt (MM-YYYY)',
    example: '11-2025',
  })
  prepareReading(
    @Query('contractId', ParseIntPipe) contractId: number,
    @Query('serviceId', ParseIntPipe) serviceId: number,
    @Query('month') month: string,
  ) {
    return this.readingsService.prepareReading(contractId, serviceId, month);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo bản ghi chốt số mới' })
  create(@Body() dto: CreateReadingDto) {
    return this.readingsService.create(dto);
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Chốt số hàng loạt (Điện + Nước cùng lúc)' })
  @ApiQuery({
    name: 'month',
    type: String,
    description: 'Tháng chốt',
    example: '11-2025',
  })
  bulkCreate(
    @Query('month') month: string,
    @Body()
    readings: {
      contractId: number;
      serviceId: number;
      newIndex: number;
      oldIndex?: number;
      isMeterReset?: boolean;
    }[],
  ) {
    return this.readingsService.bulkCreate(readings, month);
  }

  @Get('contract/:contractId')
  @ApiOperation({ summary: 'Lấy tất cả bản ghi chốt số của 1 hợp đồng' })
  findByContract(@Param('contractId', ParseIntPipe) contractId: number) {
    return this.readingsService.findByContract(contractId);
  }

  @Get('contract/:contractId/month/:month')
  @ApiOperation({ summary: 'Lấy bản ghi chốt số theo hợp đồng và tháng' })
  @ApiParam({ name: 'month', example: '11-2025' })
  findByMonth(
    @Param('contractId', ParseIntPipe) contractId: number,
    @Param('month') month: string,
  ) {
    return this.readingsService.findByMonth(contractId, month);
  }

  @Get('unread')
  @ApiOperation({ summary: 'Lấy danh sách phòng chưa chốt số tháng này' })
  @ApiQuery({ name: 'month', example: '11-2025' })
  @ApiQuery({ name: 'serviceId', type: Number, description: 'ID dịch vụ' })
  getUnreadRooms(
    @Query('month') month: string,
    @Query('serviceId', ParseIntPipe) serviceId: number,
  ) {
    return this.readingsService.getUnreadRooms(month, serviceId);
  }

  @Get('stats/:month')
  @ApiOperation({ summary: 'Thống kê chốt số theo tháng' })
  @ApiParam({ name: 'month', example: '11-2025' })
  getMonthlyStats(@Param('month') month: string) {
    return this.readingsService.getMonthlyStats(month);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết 1 bản ghi chốt số' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.readingsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật chỉ số (khi nhập sai)' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateReadingDto) {
    return this.readingsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa bản ghi chốt số' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.readingsService.remove(id);
  }
}

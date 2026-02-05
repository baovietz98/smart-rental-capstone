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
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { InvoiceStatus } from '@prisma/client';
import { InvoicesService } from './invoices.service';
import { GenerateInvoiceDto, UpdateInvoiceDto, RecordPaymentDto } from './dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Invoices - Hóa đơn')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  /**
   * BƯỚC 1: Xem trước hóa đơn (Preview)
   * Tính toán nhưng KHÔNG lưu vào DB
   */
  @Post('preview')
  @ApiOperation({
    summary: 'Xem trước hóa đơn (Tính toán & Kiểm tra chốt điện nước)',
  })
  preview(@Body() dto: GenerateInvoiceDto) {
    return this.invoicesService.preview(dto);
  }

  /**
   * BƯỚC 2: Tạo hóa đơn nháp (Generate Draft)
   * Lưu snapshot từ bước Preview vào DB
   */
  @Post('generate')
  @ApiOperation({
    summary: 'Tạo hóa đơn nháp (Lưu snapshot)',
  })
  generateDraft(@Body() dto: GenerateInvoiceDto) {
    return this.invoicesService.generateDraft(dto);
  }

  /**
   * Tạo hóa đơn hàng loạt cho tất cả hợp đồng
   */
  @Post('generate-bulk')
  @ApiOperation({
    summary: 'Tạo hóa đơn hàng loạt cho tất cả hợp đồng active',
  })
  @ApiQuery({ name: 'month', example: '11-2025', description: 'Tháng hóa đơn' })
  generateBulkDrafts(@Query('month') month: string) {
    return this.invoicesService.generateBulkDrafts(month);
  }

  /**
   * BƯỚC 2: Cập nhật hóa đơn nháp (thêm phát sinh, giảm giá)
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Cập nhật hóa đơn nháp (thêm phát sinh, giảm giá...)',
  })
  updateDraft(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateInvoiceDto,
  ) {
    return this.invoicesService.updateDraft(id, dto);
  }

  /**
   * BƯỚC 3: Phát hành hóa đơn
   */
  @Patch(':id/publish')
  @ApiOperation({
    summary: 'Phát hành hóa đơn (DRAFT -> PUBLISHED)',
  })
  publish(@Param('id', ParseIntPipe) id: number) {
    return this.invoicesService.publish(id);
  }

  /**
   * Hủy phát hành (về DRAFT)
   */
  @Patch(':id/unpublish')
  @ApiOperation({
    summary: 'Hủy phát hành hóa đơn (PUBLISHED -> DRAFT)',
  })
  unpublish(@Param('id', ParseIntPipe) id: number) {
    return this.invoicesService.unpublish(id);
  }

  /**
   * BƯỚC 5: Ghi nhận thanh toán
   */
  @Post(':id/payment')
  @ApiOperation({
    summary: 'Ghi nhận thanh toán (có thể trả nhiều lần)',
  })
  recordPayment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RecordPaymentDto,
  ) {
    return this.invoicesService.recordPayment(id, dto);
  }

  /**
   * Hủy hóa đơn
   */
  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Hủy hóa đơn' })
  cancel(@Param('id', ParseIntPipe) id: number) {
    return this.invoicesService.cancel(id);
  }

  /**
   * Lấy danh sách hóa đơn
   */
  @Get()
  @ApiOperation({ summary: 'Lấy danh sách hóa đơn (có filter)' })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Lọc theo trạng thái',
  })
  @ApiQuery({
    name: 'month',
    required: false,
    description: 'Lọc theo tháng (MM-YYYY)',
  })
  @ApiQuery({
    name: 'buildingId',
    required: false,
    description: 'Lọc theo tòa nhà',
  })
  findAll(
    @Query('status') status?: InvoiceStatus,
    @Query('month') month?: string,
    @Query('buildingId') buildingId?: string,
  ) {
    return this.invoicesService.findAll({
      status,
      month,
      buildingId: buildingId ? parseInt(buildingId, 10) : undefined,
    });
  }

  /**
   * Lấy hóa đơn theo hợp đồng
   */
  @Get('contract/:contractId')
  @ApiOperation({ summary: 'Lấy tất cả hóa đơn của 1 hợp đồng' })
  findByContract(@Param('contractId', ParseIntPipe) contractId: number) {
    return this.invoicesService.findByContract(contractId);
  }

  /**
   * Lấy hóa đơn theo tháng
   */
  @Get('month/:month')
  @ApiOperation({ summary: 'Lấy tất cả hóa đơn của 1 tháng' })
  @ApiParam({ name: 'month', example: '11-2025' })
  findByMonth(@Param('month') month: string) {
    return this.invoicesService.findByMonth(month);
  }

  /**
   * Thống kê hóa đơn theo tháng
   */
  @Get('stats/:month')
  @ApiOperation({ summary: 'Thống kê hóa đơn theo tháng (có lọc building)' })
  @ApiParam({ name: 'month', example: '11-2025' })
  @ApiQuery({ name: 'buildingId', required: false, type: Number })
  getMonthlyStats(
    @Param('month') month: string,
    @Query('buildingId') buildingId?: string,
  ) {
    return this.invoicesService.getMonthlyStats(
      month,
      buildingId ? parseInt(buildingId, 10) : undefined,
    );
  }

  /**
   * Lấy chi tiết hóa đơn (Public - Tenant xem không cần đăng nhập)
   * CRITICAL: Must be BEFORE :id route to avoid route conflict
   */
  @Public()
  @Get('public/:code')
  @ApiOperation({
    summary: 'Lấy chi tiết hóa đơn (Public - Không cần đăng nhập)',
  })
  @ApiParam({
    name: 'code',
    example: 'uuid-code',
    description: 'Mã truy cập hóa đơn (accessCode)',
  })
  findByAccessCode(@Param('code') code: string) {
    return this.invoicesService.findByAccessCode(code);
  }

  /**
   * Chi tiết hóa đơn
   */
  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết hóa đơn' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.invoicesService.findOne(id);
  }

  /**
   * Xóa hóa đơn
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Xóa hóa đơn (chỉ DRAFT hoặc CANCELLED)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.invoicesService.remove(id);
  }
}

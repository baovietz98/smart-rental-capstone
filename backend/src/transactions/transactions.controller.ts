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
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiParam,
    ApiQuery,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto, UpdateTransactionDto, TransactionType } from './dto';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Transactions - Giao dịch tài chính')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('transactions')
export class TransactionsController {
    constructor(private readonly transactionsService: TransactionsService) { }

    @Post()
    @ApiOperation({
        summary: 'Tạo giao dịch mới',
        description: 'Tạo giao dịch (tiền cọc, thanh toán hóa đơn, khác)',
    })
    @ApiResponse({ status: 201, description: 'Tạo thành công' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy hợp đồng/hóa đơn' })
    create(@Body() dto: CreateTransactionDto) {
        return this.transactionsService.create(dto);
    }

    @Get()
    @ApiOperation({
        summary: 'Lấy danh sách giao dịch',
        description: 'Lấy tất cả giao dịch với các filter tùy chọn',
    })
    @ApiQuery({
        name: 'type',
        required: false,
        enum: TransactionType,
        description: 'Lọc theo loại giao dịch',
    })
    @ApiQuery({
        name: 'contractId',
        required: false,
        type: Number,
        description: 'Lọc theo hợp đồng',
    })
    @ApiQuery({
        name: 'invoiceId',
        required: false,
        type: Number,
        description: 'Lọc theo hóa đơn',
    })
    @ApiQuery({
        name: 'fromDate',
        required: false,
        type: String,
        description: 'Từ ngày (ISO date)',
    })
    @ApiQuery({
        name: 'toDate',
        required: false,
        type: String,
        description: 'Đến ngày (ISO date)',
    })
    findAll(
        @Query('type') type?: TransactionType,
        @Query('contractId') contractId?: string,
        @Query('invoiceId') invoiceId?: string,
        @Query('fromDate') fromDate?: string,
        @Query('toDate') toDate?: string,
    ) {
        return this.transactionsService.findAll({
            type,
            contractId: contractId ? parseInt(contractId, 10) : undefined,
            invoiceId: invoiceId ? parseInt(invoiceId, 10) : undefined,
            fromDate,
            toDate,
        });
    }

    @Get('stats')
    @ApiOperation({
        summary: 'Thống kê giao dịch',
        description: 'Tổng hợp số tiền theo loại giao dịch',
    })
    @ApiQuery({
        name: 'fromDate',
        required: false,
        type: String,
        description: 'Từ ngày (ISO date)',
    })
    @ApiQuery({
        name: 'toDate',
        required: false,
        type: String,
        description: 'Đến ngày (ISO date)',
    })
    getStats(
        @Query('fromDate') fromDate?: string,
        @Query('toDate') toDate?: string,
    ) {
        return this.transactionsService.getStats(fromDate, toDate);
    }

    @Get('contract/:contractId')
    @ApiOperation({
        summary: 'Lấy giao dịch theo hợp đồng',
        description: 'Lấy lịch sử giao dịch của một hợp đồng',
    })
    @ApiParam({ name: 'contractId', type: Number })
    findByContract(@Param('contractId', ParseIntPipe) contractId: number) {
        return this.transactionsService.findByContract(contractId);
    }

    @Get('code/:code')
    @ApiOperation({
        summary: 'Tìm giao dịch theo mã',
        description: 'Tìm giao dịch theo mã giao dịch (VD: PT-0001)',
    })
    @ApiParam({ name: 'code', example: 'PT-0001' })
    findByCode(@Param('code') code: string) {
        return this.transactionsService.findByCode(code);
    }

    @Get(':id')
    @ApiOperation({
        summary: 'Lấy chi tiết giao dịch',
        description: 'Trả về thông tin chi tiết của giao dịch',
    })
    @ApiParam({ name: 'id', type: Number })
    @ApiResponse({ status: 200, description: 'Thành công' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy giao dịch' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.transactionsService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({
        summary: 'Cập nhật giao dịch',
        description: 'Cập nhật thông tin giao dịch (số tiền, ghi chú, ngày)',
    })
    @ApiParam({ name: 'id', type: Number })
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateTransactionDto,
    ) {
        return this.transactionsService.update(id, dto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({
        summary: 'Xóa giao dịch',
        description: 'Xóa giao dịch (tự động hoàn tác cập nhật hóa đơn/cọc)',
    })
    @ApiParam({ name: 'id', type: Number })
    @ApiResponse({ status: 204, description: 'Xóa thành công' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy giao dịch' })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.transactionsService.remove(id);
    }
}

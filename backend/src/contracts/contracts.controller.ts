import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ContractsService } from './contracts.service';
import { CreateContractDto, UpdateContractDto, MoveContractDto } from './dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';

@ApiTags('Contracts')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) { }

  @Post()
  @ApiOperation({
    summary: 'Tạo hợp đồng mới',
    description:
      'Tạo hợp đồng thuê phòng. Tự động chuyển phòng sang trạng thái RENTED.',
  })
  @ApiBody({ type: CreateContractDto })
  @ApiResponse({ status: 201, description: 'Tạo thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy phòng/khách thuê' })
  @ApiResponse({ status: 409, description: 'Phòng đang có hợp đồng active' })
  create(@Body() createContractDto: CreateContractDto) {
    return this.contractsService.create(createContractDto);
  }

  @Post('move')
  @ApiOperation({ summary: 'Chuyển phòng cho hợp đồng' })
  @ApiResponse({ status: 200, description: 'Chuyển phòng thành công' })
  @ApiResponse({ status: 400, description: 'Lỗi validation (Phòng mới không trống, Hợp đồng đã kết thúc...)' })
  move(@Body() moveContractDto: MoveContractDto) {
    return this.contractsService.moveContract(moveContractDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách hợp đồng',
    description: 'Lấy tất cả hợp đồng, có thể lọc theo trạng thái',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Lọc theo trạng thái (true/false)',
  })
  findAll(@Query('isActive') isActive?: string) {
    const active =
      isActive === 'true' ? true : isActive === 'false' ? false : undefined;
    return this.contractsService.findAll(active);
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Thống kê hợp đồng (có lọc building)',
    description: 'Trả về tổng số, đang hoạt động, sắp hết hạn',
  })
  @ApiQuery({ name: 'buildingId', required: false, type: Number })
  getStats(@Query('buildingId') buildingId?: string) {
    return this.contractsService.getStats(
      buildingId ? parseInt(buildingId, 10) : undefined,
    );
  }

  @Get('room/:roomId')
  @ApiOperation({
    summary: 'Lấy hợp đồng theo phòng',
    description: 'Lấy lịch sử hợp đồng của một phòng',
  })
  @ApiParam({ name: 'roomId', type: Number })
  findByRoom(@Param('roomId', ParseIntPipe) roomId: number) {
    return this.contractsService.findByRoom(roomId);
  }

  @Get('tenant/:tenantId')
  @ApiOperation({
    summary: 'Lấy hợp đồng theo khách thuê',
    description: 'Lấy lịch sử hợp đồng của một khách thuê',
  })
  @ApiParam({ name: 'tenantId', type: Number })
  findByTenant(@Param('tenantId', ParseIntPipe) tenantId: number) {
    return this.contractsService.findByTenant(tenantId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Lấy chi tiết hợp đồng',
    description: 'Trả về thông tin hợp đồng, phòng, khách thuê và hóa đơn',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.contractsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Cập nhật hợp đồng',
    description: 'Cập nhật thông tin hợp đồng (không đổi phòng/khách)',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateContractDto })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateContractDto: UpdateContractDto,
  ) {
    return this.contractsService.update(id, updateContractDto);
  }

  @Patch(':id/terminate')
  @ApiOperation({
    summary: 'Kết thúc hợp đồng',
    description: 'Kết thúc hợp đồng và chuyển phòng về AVAILABLE',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Kết thúc thành công' })
  @ApiResponse({ status: 400, description: 'Hợp đồng đã kết thúc' })
  terminate(@Param('id', ParseIntPipe) id: number) {
    return this.contractsService.terminate(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Xóa hợp đồng',
    description: 'Xóa hợp đồng. Chỉ xóa được khi chưa có hóa đơn.',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 204, description: 'Xóa thành công' })
  @ApiResponse({ status: 409, description: 'Không thể xóa vì có hóa đơn' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.contractsService.remove(id);
  }
}

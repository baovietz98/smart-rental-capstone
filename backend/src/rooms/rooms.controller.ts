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
import { RoomsService } from './rooms.service';
import { CreateRoomDto, UpdateRoomDto, RoomStatus, BulkUpdatePriceDto, BulkCreateIssueDto, BulkNotifyDto } from './dto';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Rooms')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) { }

  @Post()
  @ApiOperation({
    summary: 'Tạo phòng mới',
    description: 'Tạo một phòng mới trong tòa nhà. Yêu cầu buildingId hợp lệ.',
  })
  @ApiBody({ type: CreateRoomDto })
  @ApiResponse({
    status: 201,
    description: 'Tạo phòng thành công',
  })
  @ApiResponse({
    status: 400,
    description: 'Dữ liệu không hợp lệ hoặc tên phòng trùng',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy tòa nhà',
  })
  create(@Body() createRoomDto: CreateRoomDto) {
    return this.roomsService.create(createRoomDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách tất cả phòng',
    description: 'Trả về danh sách tất cả phòng trong hệ thống',
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách thành công',
  })
  findAll() {
    return this.roomsService.findAll();
  }

  @Get('by-building/:buildingId')
  @ApiOperation({
    summary: 'Lấy danh sách phòng theo tòa nhà',
    description: 'Trả về danh sách phòng của một tòa nhà cụ thể',
  })
  @ApiParam({
    name: 'buildingId',
    description: 'ID của tòa nhà',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách thành công',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy tòa nhà',
  })
  findByBuilding(@Param('buildingId', ParseIntPipe) buildingId: number) {
    return this.roomsService.findByBuilding(buildingId);
  }

  @Get('stats/:buildingId')
  @ApiOperation({
    summary: 'Thống kê phòng theo tòa nhà',
    description: 'Trả về số lượng phòng theo từng trạng thái',
  })
  @ApiParam({
    name: 'buildingId',
    description: 'ID của tòa nhà',
    type: Number,
    example: 1,
  })
  getStats(@Param('buildingId', ParseIntPipe) buildingId: number) {
    return this.roomsService.getStatsByBuilding(buildingId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Lấy chi tiết phòng',
    description:
      'Trả về thông tin chi tiết của phòng, bao gồm tòa nhà và hợp đồng active',
  })
  @ApiParam({
    name: 'id',
    description: 'ID của phòng',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy thông tin thành công',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy phòng',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.roomsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Cập nhật thông tin phòng',
    description: 'Cập nhật tên, giá, diện tích, số người tối đa, tài sản',
  })
  @ApiParam({
    name: 'id',
    description: 'ID của phòng cần cập nhật',
    type: Number,
    example: 1,
  })
  @ApiBody({ type: UpdateRoomDto })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật thành công',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy phòng',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoomDto: UpdateRoomDto,
  ) {
    return this.roomsService.update(id, updateRoomDto);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Cập nhật trạng thái phòng',
    description: 'Đổi trạng thái: AVAILABLE, RENTED, MAINTENANCE',
  })
  @ApiParam({
    name: 'id',
    description: 'ID của phòng',
    type: Number,
  })
  @ApiQuery({
    name: 'status',
    description: 'Trạng thái mới',
    enum: RoomStatus,
  })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Query('status') status: RoomStatus,
  ) {
    return this.roomsService.updateStatus(id, status);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Xóa phòng',
    description: 'Xóa phòng. Chỉ xóa được khi không có hợp đồng active.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID của phòng cần xóa',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 204,
    description: 'Xóa thành công',
  })
  @ApiResponse({
    status: 400,
    description: 'Phòng đang có hợp đồng active',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy phòng',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.roomsService.remove(id);
  }
  @Post('bulk/price')
  @ApiOperation({ summary: 'Cập nhật giá đồng loạt' })
  @ApiBody({ type: BulkUpdatePriceDto })
  bulkUpdatePrice(@Body() dto: BulkUpdatePriceDto) {
      return this.roomsService.bulkUpdatePrice(dto);
  }

  @Post('bulk/issues')
  @ApiOperation({ summary: 'Tạo sự cố đồng loạt' })
  @ApiBody({ type: BulkCreateIssueDto })
  bulkCreateIssues(@Body() dto: BulkCreateIssueDto) {
      return this.roomsService.bulkCreateIssues(dto);
  }

  @Post('bulk/notify')
  @ApiOperation({ summary: 'Gửi thông báo đồng loạt (Zalo)' })
  @ApiBody({ type: BulkNotifyDto })
  bulkNotify(@Body() dto: BulkNotifyDto) {
      return this.roomsService.bulkNotify(dto);
  }
}

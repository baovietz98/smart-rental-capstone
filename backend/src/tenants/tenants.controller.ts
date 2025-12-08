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
import { TenantsService } from './tenants.service';
import { CreateTenantDto, UpdateTenantDto } from './dto';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Tenants')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) { }

  @Post()
  @ApiOperation({
    summary: 'Tạo khách thuê mới',
    description:
      'Đăng ký thông tin khách thuê mới. Số điện thoại phải duy nhất.',
  })
  @ApiBody({ type: CreateTenantDto })
  @ApiResponse({ status: 201, description: 'Tạo thành công' })
  @ApiResponse({ status: 409, description: 'Số điện thoại đã tồn tại' })
  create(@Body() createTenantDto: CreateTenantDto) {
    return this.tenantsService.create(createTenantDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách khách thuê',
    description: 'Trả về danh sách tất cả khách thuê',
  })
  findAll() {
    return this.tenantsService.findAll();
  }

  @Get('search')
  @ApiOperation({
    summary: 'Tìm kiếm khách thuê',
    description: 'Tìm theo tên, số điện thoại hoặc CCCD',
  })
  @ApiQuery({ name: 'q', description: 'Từ khóa tìm kiếm', example: 'Nguyễn' })
  search(@Query('q') query: string) {
    return this.tenantsService.search(query || '');
  }

  @Get('phone/:phone')
  @ApiOperation({
    summary: 'Tìm khách thuê theo SĐT',
    description: 'Tìm khách thuê theo số điện thoại',
  })
  @ApiParam({ name: 'phone', example: '0901234567' })
  findByPhone(@Param('phone') phone: string) {
    return this.tenantsService.findByPhone(phone);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Lấy chi tiết khách thuê',
    description: 'Trả về thông tin chi tiết khách thuê và lịch sử hợp đồng',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tenantsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Cập nhật khách thuê',
    description: 'Cập nhật thông tin khách thuê',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateTenantDto })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTenantDto: UpdateTenantDto,
  ) {
    return this.tenantsService.update(id, updateTenantDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Xóa khách thuê',
    description: 'Xóa khách thuê. Chỉ xóa được khi không có hợp đồng.',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 204, description: 'Xóa thành công' })
  @ApiResponse({ status: 409, description: 'Không thể xóa vì có hợp đồng' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tenantsService.remove(id);
  }
}

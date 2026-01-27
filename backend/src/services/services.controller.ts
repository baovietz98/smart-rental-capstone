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
import { ServicesService } from './services.service';
import { CreateServiceDto, UpdateServiceDto } from './dto';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Services - Dịch vụ')
@ApiBearerAuth()
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) { }

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Tạo dịch vụ mới' })
  create(@Body() dto: CreateServiceDto) {
    return this.servicesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách dịch vụ' })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description: 'Bao gồm cả dịch vụ không còn sử dụng',
  })
  findAll(@Query('includeInactive') includeInactive?: string) {
    return this.servicesService.findAll(includeInactive === 'true');
  }

  @Get('type/:type')
  @ApiOperation({ summary: 'Lấy dịch vụ theo loại (INDEX hoặc FIXED)' })
  @ApiParam({ name: 'type', enum: ['INDEX', 'FIXED'] })
  findByType(@Param('type') type: 'INDEX' | 'FIXED') {
    return this.servicesService.findByType(type);
  }

  @Get('seed')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Khởi tạo dữ liệu dịch vụ mẫu (Điện, Nước, Wifi...)',
  })
  seedDefaultServices() {
    return this.servicesService.seedDefaultServices();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết dịch vụ' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.servicesService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Cập nhật dịch vụ' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateServiceDto) {
    return this.servicesService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Xóa mềm dịch vụ (set isActive = false)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.servicesService.remove(id);
  }
}

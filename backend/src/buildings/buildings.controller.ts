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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { BuildingsService } from './buildings.service';
import { CreateBuildingDto, UpdateBuildingDto } from './dto';

@ApiTags('Buildings')
@Controller('buildings')
export class BuildingsController {
  constructor(private readonly buildingsService: BuildingsService) {}

  @Post()
  @ApiOperation({
    summary: 'Tạo tòa nhà mới',
    description: 'Tạo một tòa nhà/nhà trọ mới trong hệ thống',
  })
  @ApiBody({ type: CreateBuildingDto })
  @ApiResponse({
    status: 201,
    description: 'Tạo tòa nhà thành công',
  })
  @ApiResponse({
    status: 400,
    description: 'Dữ liệu không hợp lệ',
  })
  create(@Body() createBuildingDto: CreateBuildingDto) {
    return this.buildingsService.create(createBuildingDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách tòa nhà',
    description: 'Trả về danh sách tất cả tòa nhà cùng số lượng phòng',
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách thành công',
  })
  findAll() {
    return this.buildingsService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Lấy chi tiết tòa nhà',
    description:
      'Trả về thông tin chi tiết của một tòa nhà, bao gồm danh sách phòng',
  })
  @ApiParam({
    name: 'id',
    description: 'ID của tòa nhà',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy thông tin thành công',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy tòa nhà',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.buildingsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Cập nhật tòa nhà',
    description: 'Cập nhật thông tin của một tòa nhà (tên, địa chỉ)',
  })
  @ApiParam({
    name: 'id',
    description: 'ID của tòa nhà cần cập nhật',
    type: Number,
    example: 1,
  })
  @ApiBody({ type: UpdateBuildingDto })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật thành công',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy tòa nhà',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBuildingDto: UpdateBuildingDto,
  ) {
    return this.buildingsService.update(id, updateBuildingDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Xóa tòa nhà',
    description:
      'Xóa một tòa nhà. Chỉ xóa được khi tòa nhà không còn phòng nào.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID của tòa nhà cần xóa',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 204,
    description: 'Xóa thành công',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy tòa nhà hoặc tòa nhà còn phòng',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.buildingsService.remove(id);
  }
}

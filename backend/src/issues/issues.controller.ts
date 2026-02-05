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
import { IssuesService } from './issues.service';
import { CreateIssueDto, UpdateIssueDto, IssueStatus } from './dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';

@ApiTags('Issues - Quản lý sự cố')
@ApiBearerAuth()
@Controller('issues')
export class IssuesController {
  constructor(private readonly issuesService: IssuesService) {}

  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách sự cố',
    description:
      'Lấy tất cả sự cố (Admin) hoặc sự cố của phòng đang thuê (Tenant)',
  })
  @Roles('ADMIN', 'TENANT')
  @ApiQuery({ name: 'status', enum: IssueStatus, required: false })
  findAll(@GetUser() user: any, @Query('status') status?: IssueStatus) {
    return this.issuesService.findAllForUser(user, { status });
  }

  @Post()
  @Roles('ADMIN', 'TENANT')
  @ApiOperation({
    summary: 'Tạo sự cố mới',
    description:
      'Tạo ticket báo sự cố cho một phòng. Admin hoặc Tenant đều có thể tạo.',
  })
  @ApiResponse({ status: 201, description: 'Tạo thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy phòng' })
  create(@Body() dto: CreateIssueDto, @GetUser() user: any) {
    return this.issuesService.create(dto, user);
  }

  @Get('room/:roomId')
  @ApiOperation({
    summary: 'Lấy sự cố theo phòng',
    description: 'Lấy tất cả sự cố của một phòng',
  })
  @Roles('ADMIN', 'TENANT')
  @ApiParam({ name: 'roomId', type: Number })
  findByRoom(
    @Param('roomId', ParseIntPipe) roomId: number,
    @GetUser() user: any,
  ) {
    return this.issuesService.findByRoom(roomId, user);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Lấy chi tiết sự cố',
    description: 'Trả về thông tin chi tiết của sự cố',
  })
  @ApiParam({ name: 'id', type: Number })
  @Roles('ADMIN', 'TENANT')
  @ApiResponse({ status: 200, description: 'Thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy sự cố' })
  findOne(@Param('id', ParseIntPipe) id: number, @GetUser() user: any) {
    return this.issuesService.findOne(id, user);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Cập nhật sự cố',
    description: 'Cập nhật thông tin sự cố (tiêu đề, mô tả, trạng thái)',
  })
  @ApiParam({ name: 'id', type: Number })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateIssueDto) {
    return this.issuesService.update(id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Cập nhật trạng thái sự cố',
    description: 'Chuyển trạng thái: OPEN → PROCESSING → DONE',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiQuery({
    name: 'status',
    enum: IssueStatus,
    description: 'Trạng thái mới',
  })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Query('status') status: IssueStatus,
  ) {
    return this.issuesService.updateStatus(id, status);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Xóa sự cố',
    description: 'Xóa sự cố khỏi hệ thống',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 204, description: 'Xóa thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy sự cố' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.issuesService.remove(id);
  }
}

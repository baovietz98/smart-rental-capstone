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

@ApiTags('Issues - Quản lý sự cố')
@ApiBearerAuth()
@Roles('ADMIN')
@Controller('issues')
export class IssuesController {
    constructor(private readonly issuesService: IssuesService) { }

    @Post()
    @Roles('ADMIN', 'TENANT')
    @ApiOperation({
        summary: 'Tạo sự cố mới',
        description: 'Tạo ticket báo sự cố cho một phòng. Admin hoặc Tenant đều có thể tạo.',
    })
    @ApiResponse({ status: 201, description: 'Tạo thành công' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy phòng' })
    create(@Body() dto: CreateIssueDto) {
        return this.issuesService.create(dto);
    }

    @Get()
    @ApiOperation({
        summary: 'Lấy danh sách sự cố',
        description: 'Lấy tất cả sự cố với các filter tùy chọn',
    })
    @ApiQuery({
        name: 'status',
        required: false,
        enum: IssueStatus,
        description: 'Lọc theo trạng thái',
    })
    @ApiQuery({
        name: 'roomId',
        required: false,
        type: Number,
        description: 'Lọc theo phòng',
    })
    @ApiQuery({
        name: 'buildingId',
        required: false,
        type: Number,
        description: 'Lọc theo tòa nhà',
    })
    findAll(
        @Query('status') status?: IssueStatus,
        @Query('roomId') roomId?: string,
        @Query('buildingId') buildingId?: string,
    ) {
        return this.issuesService.findAll({
            status,
            roomId: roomId ? parseInt(roomId, 10) : undefined,
            buildingId: buildingId ? parseInt(buildingId, 10) : undefined,
        });
    }

    @Get('stats')
    @ApiOperation({
        summary: 'Thống kê sự cố',
        description: 'Trả về số lượng sự cố theo từng trạng thái',
    })
    getStats() {
        return this.issuesService.getStats();
    }

    @Get('room/:roomId')
    @ApiOperation({
        summary: 'Lấy sự cố theo phòng',
        description: 'Lấy tất cả sự cố của một phòng',
    })
    @ApiParam({ name: 'roomId', type: Number })
    findByRoom(@Param('roomId', ParseIntPipe) roomId: number) {
        return this.issuesService.findByRoom(roomId);
    }

    @Get(':id')
    @ApiOperation({
        summary: 'Lấy chi tiết sự cố',
        description: 'Trả về thông tin chi tiết của sự cố',
    })
    @ApiParam({ name: 'id', type: Number })
    @ApiResponse({ status: 200, description: 'Thành công' })
    @ApiResponse({ status: 404, description: 'Không tìm thấy sự cố' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.issuesService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({
        summary: 'Cập nhật sự cố',
        description: 'Cập nhật thông tin sự cố (tiêu đề, mô tả, trạng thái)',
    })
    @ApiParam({ name: 'id', type: Number })
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateIssueDto,
    ) {
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

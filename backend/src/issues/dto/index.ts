import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsInt, IsEnum } from 'class-validator';

export enum IssueStatus {
    OPEN = 'OPEN',
    PROCESSING = 'PROCESSING',
    DONE = 'DONE',
}

export class CreateIssueDto {
    @ApiProperty({
        description: 'Tiêu đề sự cố',
        example: 'Hỏng điều hòa',
    })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiPropertyOptional({
        description: 'Mô tả chi tiết sự cố',
        example: 'Điều hòa không lạnh, chạy nhưng không mát',
    })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({
        description: 'ID phòng có sự cố',
        example: 1,
    })
    @IsInt()
    @IsNotEmpty()
    roomId: number;

    @ApiPropertyOptional({
        description: 'Mức độ ưu tiên',
        enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
        example: 'NORMAL',
    })
    @IsOptional()
    priority?: string;

    @ApiPropertyOptional({
        description: 'Danh sách ảnh minh chứng',
        example: ['https://example.com/img1.jpg'],
    })
    @IsOptional()
    images?: string[];
}

export class UpdateIssueDto {
    @ApiPropertyOptional({
        description: 'Tiêu đề sự cố',
        example: 'Hỏng điều hòa - Đã sửa',
    })
    @IsString()
    @IsOptional()
    title?: string;

    @ApiPropertyOptional({
        description: 'Mô tả chi tiết sự cố',
    })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional({
        description: 'Trạng thái sự cố',
        enum: IssueStatus,
        example: 'PROCESSING',
    })
    @IsEnum(IssueStatus)
    @IsOptional()
    status?: IssueStatus;

    @ApiPropertyOptional({
        description: 'Mức độ ưu tiên',
        enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
    })
    @IsOptional()
    priority?: string;

    @ApiPropertyOptional({
        description: 'Danh sách ảnh minh chứng',
    })
    @IsOptional()
    images?: string[];
}

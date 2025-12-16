import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNumber, IsOptional, IsString, IsNotEmpty } from 'class-validator';

export enum PriceUpdateType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_ADD = 'FIXED_ADD',
  FIXED_SET = 'FIXED_SET',
}

export class BulkUpdatePriceDto {
  @ApiProperty({ description: 'Danh sách ID phòng cần cập nhật', type: [Number] })
  @IsArray()
  @IsNumber({}, { each: true })
  roomIds: number[];

  @ApiProperty({ enum: PriceUpdateType, description: 'Loại cập nhật giá (Theo % hoặc cộng thêm số tiền cố định)' })
  @IsEnum(PriceUpdateType)
  type: PriceUpdateType;

  @ApiProperty({ description: 'Giá trị cập nhật (VD: 10 cho 10%, 500000 cho 500k)', example: 10 })
  @IsNumber()
  value: number;
}

export class BulkCreateIssueDto {
  @ApiProperty({ description: 'Danh sách ID phòng', type: [Number] })
  @IsArray()
  @IsNumber({}, { each: true })
  roomIds: number[];

  @ApiProperty({ description: 'Tiêu đề sự cố', example: 'Kiểm tra máy lạnh định kỳ' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Mô tả chi tiết', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}

export class BulkNotifyDto {
  @ApiProperty({ description: 'Danh sách ID phòng', type: [Number] })
  @IsArray()
  @IsNumber({}, { each: true })
  roomIds: number[];

  @ApiProperty({ description: 'Nội dung thông báo', example: 'Thông báo thu tiền điện...' })
  @IsString()
  @IsNotEmpty()
  message: string;
}

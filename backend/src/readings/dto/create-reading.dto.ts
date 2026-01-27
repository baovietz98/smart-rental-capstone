import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsString,
  Min,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class CreateReadingDto {
  @ApiProperty({ example: 1, description: 'ID hợp đồng' })
  @IsNumber()
  contractId: number;

  @ApiProperty({ example: 1, description: 'ID dịch vụ (VD: 1 = Điện)' })
  @IsNumber()
  serviceId: number;

  @ApiProperty({ example: '11-2025', description: 'Tháng chốt (MM-YYYY)' })
  @IsString()
  month: string;

  @ApiPropertyOptional({
    example: 1000,
    description:
      'Chỉ số cũ (auto-fill từ API prepare, FE có thể gửi để double-check)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  oldIndex?: number;

  @ApiProperty({ example: 1150, description: 'Chỉ số mới (chủ nhà nhập)' })
  @IsNumber()
  @Min(0)
  newIndex: number;

  @ApiPropertyOptional({
    example: false,
    description:
      'Đánh dấu thay đồng hồ mới (reset về 0). Khi true, cho phép newIndex < oldIndex',
  })
  @IsOptional()
  @IsBoolean()
  isMeterReset?: boolean;

  @ApiPropertyOptional({
    example: 9999,
    description:
      'Chỉ số tối đa của đồng hồ cũ trước khi reset (mặc định 9999). Dùng khi isMeterReset=true',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxMeterValue?: number;

  @ApiPropertyOptional({ description: 'Link ảnh minh chứng (Mảng string)', example: ['url1', 'url2'] })
  @IsOptional()
  imageUrls?: string[];

  @ApiPropertyOptional({ description: 'Đã xác nhận bởi Admin chưa?', default: true })
  @IsOptional()
  @IsBoolean()
  isConfirmed?: boolean;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsInt,
  IsOptional,
  IsDateString,
  IsBoolean,
  Min,
  IsObject,
} from 'class-validator';

export class CreateContractDto {
  @ApiProperty({
    description: 'Ngày bắt đầu hợp đồng',
    example: '2025-01-01',
  })
  @IsDateString({}, { message: 'Ngày bắt đầu không hợp lệ' })
  @IsNotEmpty({ message: 'Ngày bắt đầu không được để trống' })
  startDate: string;

  @ApiPropertyOptional({
    description: 'Ngày kết thúc hợp đồng (null nếu không thời hạn)',
    example: '2025-12-31',
  })
  @IsDateString({}, { message: 'Ngày kết thúc không hợp lệ' })
  @IsOptional()
  endDate?: string;

  @ApiProperty({
    description: 'Tiền cọc (VNĐ)',
    example: 3000000,
    minimum: 0,
  })
  @IsNumber({}, { message: 'Tiền cọc phải là số' })
  @Min(0, { message: 'Tiền cọc không được âm' })
  @Min(0, { message: 'Tiền cọc không được âm' })
  deposit: number;

  @ApiPropertyOptional({
    description: 'Tiền cọc thực đóng (VNĐ)',
    example: 500000,
    minimum: 0,
  })
  @IsNumber({}, { message: 'Tiền cọc thực đóng phải là số' })
  @Min(0, { message: 'Tiền cọc thực đóng không được âm' })
  @IsOptional()
  paidDeposit?: number;

  @ApiProperty({
    description: 'Giá thuê chốt tại thời điểm ký (VNĐ/tháng)',
    example: 3000000,
    minimum: 0,
  })
  @IsNumber({}, { message: 'Giá thuê phải là số' })
  @Min(0, { message: 'Giá thuê không được âm' })
  price: number;

  @ApiProperty({
    description: 'ID phòng',
    example: 1,
  })
  @IsInt({ message: 'ID phòng phải là số nguyên' })
  roomId: number;

  @ApiProperty({
    description: 'ID khách thuê (người đại diện)',
    example: 1,
  })
  @IsInt({ message: 'ID khách thuê phải là số nguyên' })
  tenantId: number;

  @ApiPropertyOptional({
    description: 'Hợp đồng có hiệu lực hay không',
    default: true,
  })
  @IsBoolean({ message: 'isActive phải là boolean' })
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description:
      'Chỉ số bàn giao lúc ký hợp đồng. Key = serviceId, Value = chỉ số',
    example: { '1': 1000, '2': 505 },
  })
  @IsObject({ message: 'initialIndexes phải là object' })
  @IsOptional()
  initialIndexes?: Record<string, number>;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsString,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO để tạo hóa đơn (generate draft)
 * Chỉ cần contractId và month, hệ thống tự tính toán
 */
/**
 * DTO cho từng dòng hóa đơn (khi update full hoặc snapshot)
 */
export class LineItemDto {
  @ApiProperty({ example: 'RENT', description: 'Loại khoản thu' })
  @IsString()
  type: string;

  @ApiProperty({ example: 'Tiền phòng', description: 'Tên khoản thu' })
  @IsString()
  name: string;

  @ApiProperty({ example: 1, description: 'Số lượng' })
  @IsNumber()
  quantity: number;

  @ApiPropertyOptional({ example: 'tháng', description: 'Đơn vị' })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiProperty({ example: 3000000, description: 'Đơn giá' })
  @IsNumber()
  unitPrice: number;

  @ApiProperty({ example: 3000000, description: 'Thành tiền' })
  @IsNumber()
  amount: number;

  @ApiPropertyOptional({ example: 'Ghi chú', description: 'Ghi chú' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ example: 1, description: 'ID chỉ số điện/nước' })
  @IsOptional()
  @IsNumber()
  readingId?: number;

  @ApiPropertyOptional({ example: 1, description: 'ID dịch vụ' })
  @IsOptional()
  @IsNumber()
  serviceId?: number;
}

/**
 * DTO để tạo hóa đơn (generate draft)
 * Chỉ cần contractId và month, hệ thống tự tính toán
 */
export class GenerateInvoiceDto {
  @ApiProperty({ example: 1, description: 'ID hợp đồng' })
  @IsNumber()
  contractId: number;

  @ApiProperty({ example: '11-2025', description: 'Tháng hóa đơn (MM-YYYY)' })
  @IsString()
  month: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Tính tiền phòng theo ngày (prorated) nếu vào giữa tháng',
  })
  @IsOptional()
  @IsBoolean()
  proratedRent?: boolean;

  @ApiPropertyOptional({
    example: 15,
    description:
      'Ngày bắt đầu tính (nếu prorated). Mặc định lấy từ startDate của hợp đồng',
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  startDay?: number;

  @ApiPropertyOptional({
    type: [LineItemDto],
    description: 'Danh sách chi tiết hóa đơn (Snapshot từ Preview)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LineItemDto)
  lineItems?: LineItemDto[];
}

/**
 * DTO để thêm khoản phát sinh (extra charge)
 */
export class ExtraChargeDto {
  @ApiProperty({
    example: 'Sửa vòi nước',
    description: 'Mô tả khoản phát sinh',
  })
  @IsString()
  name: string;

  @ApiProperty({ example: 50000, description: 'Số tiền' })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ example: 'Sửa ngày 15/11', description: 'Ghi chú' })
  @IsOptional()
  @IsString()
  note?: string;
}

/**
 * DTO để cập nhật hóa đơn (draft)
 */
export class UpdateInvoiceDto {
  @ApiPropertyOptional({
    type: [ExtraChargeDto],
    description: 'Danh sách khoản phát sinh (Legacy: dùng khi chỉ thêm extra)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExtraChargeDto)
  extraCharges?: ExtraChargeDto[];

  @ApiPropertyOptional({
    type: [LineItemDto],
    description: 'Danh sách chi tiết hóa đơn (Dùng khi sửa linh hoạt)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LineItemDto)
  lineItems?: LineItemDto[];

  @ApiPropertyOptional({ example: 0, description: 'Giảm giá' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @ApiPropertyOptional({ example: '2025-11-30', description: 'Hạn thanh toán' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ example: 'Ghi chú hóa đơn', description: 'Ghi chú' })
  @IsOptional()
  @IsString()
  note?: string;
}

/**
 * DTO để ghi nhận thanh toán
 */
export class RecordPaymentDto {
  @ApiProperty({ example: 2000000, description: 'Số tiền thanh toán' })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({
    example: 'BANK',
    enum: ['CASH', 'BANK', 'MOMO', 'ZALOPAY', 'OTHER'],
    description: 'Phương thức thanh toán',
  })
  @IsString()
  method: 'CASH' | 'BANK' | 'MOMO' | 'ZALOPAY' | 'OTHER';

  @ApiPropertyOptional({ example: 'CK Vietcombank', description: 'Ghi chú' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ example: 'Chủ nhà', description: 'Người nhận tiền' })
  @IsOptional()
  @IsString()
  receivedBy?: string;

  @ApiPropertyOptional({
    example: '2025-11-15',
    description: 'Ngày thanh toán (mặc định là ngày hiện tại)',
  })
  @IsOptional()
  @IsDateString()
  paymentDate?: string;
}

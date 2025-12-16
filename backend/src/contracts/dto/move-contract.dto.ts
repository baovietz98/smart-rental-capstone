import { IsInt, IsOptional, IsEnum, IsNumber, IsString, IsArray, ValidateNested, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RoomStatus } from '@prisma/client';
import { Type } from 'class-transformer';

// Sub-DTO for meter readings
export class MeterReadingDto {
  @ApiProperty({ description: 'Service ID (e.g., electricity, water)' })
  @IsInt()
  serviceId: number;

  @ApiProperty({ description: 'Closing/Opening index value' })
  @IsNumber()
  indexValue: number;
}

export enum SettlementOption {
  IMMEDIATE = 'IMMEDIATE',  // Create settlement invoice now
  DEFER = 'DEFER',          // Add to next month's invoice
}

export class MoveContractDto {
  @ApiProperty({ description: 'ID của hợp đồng cần chuyển' })
  @IsInt()
  contractId: number;

  @ApiProperty({ description: 'ID của phòng mới' })
  @IsInt()
  newRoomId: number;

  @ApiProperty({ description: 'Ngày chuyển phòng' })
  @IsDateString()
  moveDate: string;

  @ApiProperty({ 
    description: 'Trạng thái của phòng cũ sau khi chuyển đi',
    enum: RoomStatus,
    default: RoomStatus.MAINTENANCE
  })
  @IsOptional()
  @IsEnum(RoomStatus)
  oldRoomStatus?: RoomStatus = RoomStatus.MAINTENANCE;

  @ApiProperty({ description: 'Giá thuê mới (mặc định = giá phòng mới, có thể sửa)' })
  @IsNumber()
  newRentPrice: number;

  @ApiProperty({ description: 'Số tiền cọc mới (nếu điều chỉnh)', required: false })
  @IsOptional()
  @IsNumber()
  newDepositAmount?: number;

  @ApiProperty({ 
    description: 'Chỉ số chốt của phòng CŨ (đóng sổ)', 
    type: [MeterReadingDto],
    required: false 
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MeterReadingDto)
  oldRoomReadings?: MeterReadingDto[];

  @ApiProperty({ 
    description: 'Chỉ số đầu của phòng MỚI', 
    type: [MeterReadingDto],
    required: false 
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MeterReadingDto)
  newRoomReadings?: MeterReadingDto[];

  @ApiProperty({ 
    description: 'Phương thức thanh toán công nợ phòng cũ',
    enum: SettlementOption,
    default: SettlementOption.DEFER
  })
  @IsOptional()
  @IsEnum(SettlementOption)
  settlementOption?: SettlementOption = SettlementOption.DEFER;

  @ApiProperty({ description: 'Ghi chú chuyển phòng', required: false })
  @IsOptional()
  @IsString()
  note?: string;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsInt,
  IsOptional,
  Min,
  Max,
  IsEnum,
} from 'class-validator';

export enum RoomStatus {
  AVAILABLE = 'AVAILABLE',
  RENTED = 'RENTED',
  MAINTENANCE = 'MAINTENANCE',
}

export enum Gender {
  ALL = 'ALL',
  MALE = 'MALE',
  FEMALE = 'FEMALE',
}

export class CreateRoomDto {
  @ApiProperty({
    description: 'Tên phòng',
    example: 'P.101',
  })
  @IsString({ message: 'Tên phòng phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Tên phòng không được để trống' })
  name: string;

  @ApiProperty({
    description: 'Giá thuê cơ bản (VNĐ/tháng)',
    example: 3000000,
    minimum: 0,
  })
  @IsNumber({}, { message: 'Giá thuê phải là số' })
  @Min(0, { message: 'Giá thuê không được âm' })
  price: number;

  @ApiPropertyOptional({
    description: 'Tiền cọc (VNĐ)',
    example: 3000000,
    minimum: 0,
  })
  @IsNumber({}, { message: 'Tiền cọc phải là số' })
  @IsOptional()
  @Min(0, { message: 'Tiền cọc không được âm' })
  depositPrice?: number;

  @ApiPropertyOptional({
    description: 'Tầng',
    example: 1,
    default: 1,
  })
  @IsInt({ message: 'Tầng phải là số nguyên' })
  @IsOptional()
  @Min(0, { message: 'Tầng không được âm' })
  floor?: number;

  @ApiProperty({
    description: 'ID tòa nhà (khóa ngoại)',
    example: 1,
  })
  @IsInt({ message: 'ID tòa nhà phải là số nguyên' })
  buildingId: number;

  @ApiPropertyOptional({
    description: 'Diện tích phòng (m²)',
    example: 25,
  })
  @IsNumber({}, { message: 'Diện tích phải là số' })
  @IsOptional()
  @Min(0, { message: 'Diện tích không được âm' })
  area?: number;

  @ApiPropertyOptional({
    description: 'Số người tối đa',
    example: 2,
    default: 2,
  })
  @IsInt({ message: 'Số người tối đa phải là số nguyên' })
  @IsOptional()
  @Min(1, { message: 'Số người tối đa ít nhất là 1' })
  @Max(10, { message: 'Số người tối đa không quá 10' })
  maxTenants?: number;

  @ApiPropertyOptional({
    description: 'Trạng thái phòng',
    enum: RoomStatus,
    default: RoomStatus.AVAILABLE,
  })
  @IsEnum(RoomStatus, { message: 'Trạng thái không hợp lệ' })
  @IsOptional()
  status?: RoomStatus;

  @ApiPropertyOptional({
    description: 'Giới tính cho phép',
    enum: Gender,
    default: Gender.ALL,
  })
  @IsEnum(Gender, { message: 'Giới tính không hợp lệ' })
  @IsOptional()
  gender?: Gender;

  @ApiPropertyOptional({
    description: 'Danh sách tài sản trong phòng (JSON)',
    example: ['Điều hòa', 'Nóng lạnh', 'Tủ lạnh'],
  })
  @IsOptional()
  assets?: any;
}

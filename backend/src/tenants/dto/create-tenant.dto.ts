import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsPhoneNumber,
  Length,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTenantDto {
  @ApiProperty({
    description: 'Họ và tên khách thuê',
    example: 'Nguyễn Văn A',
  })
  @IsString({ message: 'Họ tên phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Họ tên không được để trống' })
  fullName: string;

  @ApiProperty({
    description: 'Số điện thoại (duy nhất)',
    example: '0901234567',
  })
  @IsString({ message: 'Số điện thoại phải là chuỗi' })
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  @Length(10, 11, { message: 'Số điện thoại phải có 10-11 số' })
  phone: string;

  @ApiPropertyOptional({
    description: 'Số căn cước công dân',
    example: '001234567890',
  })
  @IsString({ message: 'CCCD phải là chuỗi' })
  @IsOptional()
  @Length(12, 12, { message: 'CCCD phải có 12 số' })
  cccd?: string;

  @ApiPropertyOptional({
    description: 'Thông tin bổ sung (JSON): ảnh CCCD, quê quán...',
    example: {
      hometown: 'Hà Nội',
      cccdFront: 'url_to_image',
      cccdBack: 'url_to_image',
    },
  })
  @IsOptional()
  info?: any;

  @ApiPropertyOptional({
    description: 'Danh sách xe',
    example: [{ plateNumber: '29A-123.45', type: 'Xe máy' }],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVehicleDto)
  vehicles?: CreateVehicleDto[];
}

export class CreateVehicleDto {
  @ApiProperty({ description: 'Biển số xe', example: '29A-123.45' })
  @IsString()
  @IsNotEmpty()
  plateNumber: string;

  @ApiPropertyOptional({ description: 'Loại xe', example: 'Xe máy' })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({ description: 'Ảnh xe', example: 'url' })
  @IsString()
  @IsOptional()
  image?: string;
}

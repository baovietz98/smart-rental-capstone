import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateBuildingDto {
  @ApiProperty({
    description: 'Tên tòa nhà/nhà trọ',
    example: 'Nhà trọ Xanh',
  })
  @IsString({ message: 'Tên phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Tên không được để trống' })
  name: string;

  @ApiPropertyOptional({
    description: 'Địa chỉ tòa nhà',
    example: '123 Đường ABC, Quận 1, TP.HCM',
  })
  @IsString({ message: 'Địa chỉ phải là chuỗi ký tự' })
  @IsOptional()
  address?: string;
}

import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateReadingDto } from './create-reading.dto';
import { IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateReadingDto extends PartialType(
  OmitType(CreateReadingDto, ['contractId', 'serviceId', 'month'] as const),
) {
  @ApiPropertyOptional({ description: 'Xác nhận số liệu khách gửi (dành cho Admin)' })
  @IsBoolean()
  @IsOptional()
  isConfirmed?: boolean;
}

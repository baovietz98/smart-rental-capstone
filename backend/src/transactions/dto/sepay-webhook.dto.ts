import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional, IsDateString } from 'class-validator';

export class SePayWebhookDto {
  @ApiProperty({ description: 'ID giao dịch tại SePay' })
  @IsNumber()
  id: number;

  @ApiProperty({ description: 'Thời gian giao dịch' })
  @IsDateString()
  transactionDate: string;

  @ApiProperty({ description: 'Số tài khoản nhận tiền' })
  @IsString()
  accountNumber: string;

  @ApiProperty({ description: 'Mã giao dịch ngân hàng' })
  @IsString()
  referenceCode: string;

  @ApiProperty({ description: 'Số tiền giao dịch' })
  @IsNumber()
  transferAmount: number;

  @ApiProperty({ description: 'Nội dung chuyển khoản' })
  @IsString()
  content: string;

  @ApiProperty({ description: 'Mã đối soát (nếu có)', required: false })
  @IsOptional()
  @IsString()
  subAccount?: string;

  @ApiProperty({ description: 'Ngân hàng' })
  @IsOptional()
  @IsString()
  bankName?: string;
}

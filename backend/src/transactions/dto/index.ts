import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsInt,
    IsEnum,
    IsNumber,
    IsDateString,
} from 'class-validator';

export enum TransactionType {
    DEPOSIT = 'DEPOSIT',
    INVOICE_PAYMENT = 'INVOICE_PAYMENT',
    OTHER = 'OTHER',
}

export class CreateTransactionDto {
    @ApiProperty({
        description: 'Số tiền giao dịch',
        example: 500000,
    })
    @IsNumber()
    @IsNotEmpty()
    amount: number;

    @ApiProperty({
        description: 'Loại giao dịch',
        enum: TransactionType,
        example: 'DEPOSIT',
    })
    @IsEnum(TransactionType)
    @IsNotEmpty()
    type: TransactionType;

    @ApiPropertyOptional({
        description: 'Ngày giao dịch (ISO date string)',
        example: '2025-12-08T00:00:00Z',
    })
    @IsDateString()
    @IsOptional()
    date?: string;

    @ApiPropertyOptional({
        description: 'Ghi chú',
        example: 'Thanh toán tiền cọc đợt 1',
    })
    @IsString()
    @IsOptional()
    note?: string;

    @ApiProperty({
        description: 'ID hợp đồng',
        example: 1,
    })
    @IsInt()
    @IsNotEmpty()
    contractId: number;

    @ApiPropertyOptional({
        description: 'ID hóa đơn (nếu là thanh toán hóa đơn)',
        example: 1,
    })
    @IsInt()
    @IsOptional()
    invoiceId?: number;
}

export class UpdateTransactionDto {
    @ApiPropertyOptional({
        description: 'Số tiền giao dịch',
    })
    @IsNumber()
    @IsOptional()
    amount?: number;

    @ApiPropertyOptional({
        description: 'Ngày giao dịch',
    })
    @IsDateString()
    @IsOptional()
    date?: string;

    @ApiPropertyOptional({
        description: 'Ghi chú',
    })
    @IsString()
    @IsOptional()
    note?: string;
}

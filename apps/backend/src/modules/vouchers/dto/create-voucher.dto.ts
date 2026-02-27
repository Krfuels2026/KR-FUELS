import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsNotEmpty,
    IsString,
    IsNumber,
    IsUUID,
    IsDateString,
    IsOptional,
    Min,
    MaxLength,
    ValidateIf,
} from 'class-validator';

export class CreateVoucherDto {
    @ApiProperty({ example: '2025-02-25', description: 'Transaction date (YYYY-MM-DD)' })
    @IsNotEmpty({ message: 'Transaction date is required' })
    @IsDateString({}, { message: 'Date must be in YYYY-MM-DD format' })
    date: string;

    @ApiProperty({ example: 'uuid-of-account' })
    @IsNotEmpty({ message: 'Account ID is required' })
    @IsUUID('4', { message: 'Account ID must be a valid UUID' })
    accountId: string;

    @ApiProperty({ example: 5000.0 })
    @IsNumber({}, { message: 'Debit must be a number' })
    @Min(0, { message: 'Debit cannot be negative' })
    debit: number;

    @ApiProperty({ example: 0.0 })
    @IsNumber({}, { message: 'Credit must be a number' })
    @Min(0, { message: 'Credit cannot be negative' })
    credit: number;

    @ApiPropertyOptional({ example: 'Cash deposit from daily sales' })
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    description?: string;

    @ApiProperty({ example: 'uuid-of-bunk' })
    @IsNotEmpty({ message: 'Bunk ID is required' })
    @IsUUID('4', { message: 'Bunk ID must be a valid UUID' })
    bunkId: string;
}

export class UpdateVoucherDto {
    @ApiPropertyOptional({ example: '2025-02-26' })
    @IsOptional()
    @IsDateString({}, { message: 'Date must be in YYYY-MM-DD format' })
    date?: string;

    @ApiPropertyOptional({ example: 'uuid-of-account' })
    @IsOptional()
    @IsUUID('4', { message: 'Account ID must be a valid UUID' })
    accountId?: string;

    @ApiPropertyOptional({ example: 6000.0 })
    @IsOptional()
    @IsNumber()
    @Min(0)
    debit?: number;

    @ApiPropertyOptional({ example: 0.0 })
    @IsOptional()
    @IsNumber()
    @Min(0)
    credit?: number;

    @ApiPropertyOptional({ example: 'Updated description' })
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    description?: string;
}

export class VoucherQueryDto {
    @ApiPropertyOptional({ example: 'uuid-of-bunk' })
    @IsOptional()
    @IsUUID('4')
    bunkId?: string;

    @ApiPropertyOptional({ example: '2025-02-25' })
    @IsOptional()
    @IsDateString()
    date?: string;

    @ApiPropertyOptional({ example: '2025-02-01' })
    @IsOptional()
    @IsDateString()
    fromDate?: string;

    @ApiPropertyOptional({ example: '2025-02-28' })
    @IsOptional()
    @IsDateString()
    toDate?: string;
}

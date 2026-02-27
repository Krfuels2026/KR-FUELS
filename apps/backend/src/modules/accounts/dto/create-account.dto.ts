import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsNotEmpty,
    IsString,
    IsOptional,
    IsNumber,
    IsUUID,
    MaxLength,
    Min,
} from 'class-validator';

export class CreateAccountDto {
    @ApiProperty({ example: 'CASH IN HAND' })
    @IsNotEmpty({ message: 'Account name is required' })
    @IsString()
    @MaxLength(200)
    name: string;

    @ApiPropertyOptional({ example: 'uuid-of-parent', nullable: true })
    @IsOptional()
    @IsUUID('4', { message: 'Parent ID must be a valid UUID' })
    parentId?: string | null;

    @ApiProperty({ example: 15000.0 })
    @IsNumber({}, { message: 'Opening debit must be a number' })
    @Min(0, { message: 'Opening debit cannot be negative' })
    openingDebit: number;

    @ApiProperty({ example: 0.0 })
    @IsNumber({}, { message: 'Opening credit must be a number' })
    @Min(0, { message: 'Opening credit cannot be negative' })
    openingCredit: number;

    @ApiProperty({ example: 'uuid-of-bunk' })
    @IsNotEmpty({ message: 'Bunk ID is required' })
    @IsUUID('4', { message: 'Bunk ID must be a valid UUID' })
    bunkId: string;
}

export class UpdateAccountDto {
    @ApiPropertyOptional({ example: 'CASH IN HAND (UPDATED)' })
    @IsOptional()
    @IsString()
    @MaxLength(200)
    name?: string;

    @ApiPropertyOptional({ example: 'uuid-or-null', nullable: true })
    @IsOptional()
    @IsUUID('4', { message: 'Parent ID must be a valid UUID' })
    parentId?: string | null;

    @ApiPropertyOptional({ example: 20000.0 })
    @IsOptional()
    @IsNumber({}, { message: 'Opening debit must be a number' })
    @Min(0)
    openingDebit?: number;

    @ApiPropertyOptional({ example: 0.0 })
    @IsOptional()
    @IsNumber({}, { message: 'Opening credit must be a number' })
    @Min(0)
    openingCredit?: number;
}

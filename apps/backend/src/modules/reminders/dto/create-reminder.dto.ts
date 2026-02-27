import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsNotEmpty,
    IsString,
    IsOptional,
    IsDateString,
    MaxLength,
} from 'class-validator';

export class CreateReminderDto {
    @ApiProperty({ example: 'Fuel Stock Audit' })
    @IsNotEmpty({ message: 'Title is required' })
    @IsString()
    @MaxLength(255)
    title: string;

    @ApiPropertyOptional({ example: 'Monthly fuel inventory reconciliation' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ example: '2025-02-20', description: 'When to send the alert (YYYY-MM-DD)' })
    @IsNotEmpty({ message: 'Reminder date is required' })
    @IsDateString({}, { message: 'Reminder date must be in YYYY-MM-DD format' })
    reminderDate: string;

    @ApiProperty({ example: '2025-02-25', description: 'Deadline date (YYYY-MM-DD)' })
    @IsNotEmpty({ message: 'Due date is required' })
    @IsDateString({}, { message: 'Due date must be in YYYY-MM-DD format' })
    dueDate: string;
}

export class UpdateReminderDto {
    @ApiPropertyOptional({ example: 'Updated Fuel Audit' })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    title?: string;

    @ApiPropertyOptional({ example: 'Updated description' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ example: '2025-03-01' })
    @IsOptional()
    @IsDateString()
    reminderDate?: string;

    @ApiPropertyOptional({ example: '2025-03-05' })
    @IsOptional()
    @IsDateString()
    dueDate?: string;
}

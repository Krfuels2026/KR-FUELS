import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsNotEmpty,
    IsString,
    IsEnum,
    IsOptional,
    IsArray,
    IsUUID,
    MinLength,
    MaxLength,
} from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
    @ApiProperty({ example: 'john_admin' })
    @IsNotEmpty({ message: 'Username is required' })
    @IsString()
    @MaxLength(100)
    username: string;

    @ApiProperty({ example: 'securePassword123' })
    @IsNotEmpty({ message: 'Password is required' })
    @IsString()
    @MinLength(6, { message: 'Password must be at least 6 characters' })
    password: string;

    @ApiProperty({ example: 'John Doe' })
    @IsNotEmpty({ message: 'Name is required' })
    @IsString()
    @MaxLength(150)
    name: string;

    @ApiProperty({ enum: UserRole, example: UserRole.ADMIN })
    @IsEnum(UserRole, { message: 'Role must be either admin or super_admin' })
    role: UserRole;

    @ApiPropertyOptional({
        type: [String],
        example: ['uuid-1', 'uuid-2'],
        description: 'Bunk IDs this user can access (ignored for super_admin)',
    })
    @IsOptional()
    @IsArray()
    @IsUUID('4', { each: true, message: 'Each bunk ID must be a valid UUID' })
    accessibleBunkIds?: string[];
}

export class UpdateBunkAccessDto {
    @ApiProperty({ type: [String], example: ['uuid-1', 'uuid-2'] })
    @IsArray()
    @IsUUID('4', { each: true, message: 'Each bunk ID must be a valid UUID' })
    accessibleBunkIds: string[];
}

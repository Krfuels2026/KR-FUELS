import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
    @ApiProperty({ example: 'admin' })
    @IsNotEmpty({ message: 'Username is required' })
    @IsString()
    username: string;

    @ApiProperty({ example: 'password123' })
    @IsNotEmpty({ message: 'Password is required' })
    @IsString()
    @MinLength(6)
    password: string;
}

export class LoginResponseDto {
    @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIs...' })
    accessToken: string;

    @ApiProperty({
        example: {
            id: 'uuid',
            username: 'admin',
            name: 'System Administrator',
            role: 'super_admin',
        },
    })
    user: {
        id: string;
        username: string;
        name: string;
        role: string;
        accessibleBunkIds: string[];
    };
}

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateBunkDto {
    @ApiProperty({ example: 'KR FUELS - COIMBATORE' })
    @IsNotEmpty({ message: 'Bunk name is required' })
    @IsString()
    @MaxLength(150)
    name: string;

    @ApiProperty({ example: 'CBE01' })
    @IsNotEmpty({ message: 'Station code is required' })
    @IsString()
    @MaxLength(20)
    code: string;

    @ApiProperty({ example: 'Coimbatore', required: false })
    @IsString()
    @MaxLength(100)
    location?: string;
}

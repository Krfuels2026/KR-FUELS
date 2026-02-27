import {
    Controller,
    Get,
    Post,
    Delete,
    Param,
    Body,
    UseGuards,
    ParseUUIDPipe,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import {
    ApiTags,
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiParam,
} from '@nestjs/swagger';
import { BunksService } from './bunks.service';
import { CreateBunkDto } from './dto/create-bunk.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { Bunk } from './entities/bunk.entity';

@ApiTags('Bunks')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('bunks')
export class BunksController {
    constructor(private readonly bunksService: BunksService) { }

    @Get()
    @ApiOperation({ summary: 'List all fuel stations' })
    @ApiResponse({ status: 200, type: [Bunk] })
    findAll(): Promise<Bunk[]> {
        return this.bunksService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a single fuel station by ID' })
    @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
    @ApiResponse({ status: 200, type: Bunk })
    @ApiResponse({ status: 404, description: 'Bunk not found' })
    findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Bunk> {
        return this.bunksService.findOne(id);
    }

    @Post()
    @UseGuards(RolesGuard)
    @Roles(UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Create a new fuel station (super_admin only)' })
    @ApiResponse({ status: 201, type: Bunk })
    @ApiResponse({ status: 409, description: 'Duplicate station code' })
    create(@Body() dto: CreateBunkDto): Promise<Bunk> {
        return this.bunksService.create(dto);
    }

    @Delete(':id')
    @UseGuards(RolesGuard)
    @Roles(UserRole.SUPER_ADMIN)
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete a fuel station (super_admin only)' })
    @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
    @ApiResponse({ status: 204, description: 'Bunk deleted successfully' })
    @ApiResponse({ status: 404, description: 'Bunk not found' })
    remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
        return this.bunksService.remove(id);
    }
}

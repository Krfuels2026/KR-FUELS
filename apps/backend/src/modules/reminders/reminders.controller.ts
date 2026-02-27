import {
    Controller,
    Get,
    Post,
    Put,
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
import { RemindersService } from './reminders.service';
import { CreateReminderDto, UpdateReminderDto } from './dto/create-reminder.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Reminders')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('reminders')
export class RemindersController {
    constructor(private readonly remindersService: RemindersService) { }

    @Get()
    @ApiOperation({ summary: 'List all reminders' })
    @ApiResponse({ status: 200, description: 'Array of reminders' })
    findAll() {
        return this.remindersService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a single reminder by ID' })
    @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
    @ApiResponse({ status: 200, description: 'Reminder details' })
    @ApiResponse({ status: 404, description: 'Reminder not found' })
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.remindersService.findOne(id);
    }

    @Post()
    @ApiOperation({ summary: 'Create a new reminder' })
    @ApiResponse({ status: 201, description: 'Reminder created' })
    create(
        @Body() dto: CreateReminderDto,
        @CurrentUser('username') username: string,
    ) {
        return this.remindersService.create(dto, username);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update an existing reminder' })
    @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
    @ApiResponse({ status: 200, description: 'Reminder updated' })
    @ApiResponse({ status: 404, description: 'Reminder not found' })
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateReminderDto,
    ) {
        return this.remindersService.update(id, dto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete a reminder' })
    @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
    @ApiResponse({ status: 204, description: 'Reminder deleted' })
    @ApiResponse({ status: 404, description: 'Reminder not found' })
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.remindersService.remove(id);
    }
}

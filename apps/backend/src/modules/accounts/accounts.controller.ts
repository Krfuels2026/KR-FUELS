import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Param,
    Body,
    Query,
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
    ApiQuery,
} from '@nestjs/swagger';
import { AccountsService } from './accounts.service';
import { CreateAccountDto, UpdateAccountDto } from './dto/create-account.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Accounts')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('accounts')
export class AccountsController {
    constructor(private readonly accountsService: AccountsService) { }

    @Get()
    @ApiOperation({ summary: 'List accounts, optionally filtered by bunk' })
    @ApiQuery({ name: 'bunkId', required: false, type: 'string', description: 'Filter by bunk UUID' })
    @ApiResponse({ status: 200, description: 'Array of accounts' })
    findAll(@Query('bunkId') bunkId?: string) {
        return this.accountsService.findAll(bunkId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a single account with parent & children' })
    @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
    @ApiResponse({ status: 200, description: 'Account details' })
    @ApiResponse({ status: 404, description: 'Account not found' })
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.accountsService.findOne(id);
    }

    @Post()
    @ApiOperation({ summary: 'Create a new account' })
    @ApiResponse({ status: 201, description: 'Account created' })
    @ApiResponse({ status: 400, description: 'Validation error or invalid parent' })
    create(@Body() dto: CreateAccountDto) {
        return this.accountsService.create(dto);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update an existing account' })
    @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
    @ApiResponse({ status: 200, description: 'Account updated' })
    @ApiResponse({ status: 400, description: 'Validation error' })
    @ApiResponse({ status: 404, description: 'Account not found' })
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateAccountDto,
    ) {
        return this.accountsService.update(id, dto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete an account (fails if it has children)' })
    @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
    @ApiResponse({ status: 204, description: 'Account deleted' })
    @ApiResponse({ status: 400, description: 'Has child accounts' })
    @ApiResponse({ status: 404, description: 'Account not found' })
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.accountsService.remove(id);
    }
}

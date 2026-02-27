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
} from '@nestjs/swagger';
import { VouchersService } from './vouchers.service';
import { CreateVoucherDto, UpdateVoucherDto, VoucherQueryDto } from './dto/create-voucher.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Vouchers')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('vouchers')
export class VouchersController {
    constructor(private readonly vouchersService: VouchersService) { }

    @Get()
    @ApiOperation({ summary: 'List vouchers with optional filters (bunkId, date, date range)' })
    @ApiResponse({ status: 200, description: 'Array of vouchers' })
    findAll(@Query() query: VoucherQueryDto) {
        return this.vouchersService.findAll(query);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a single voucher by ID' })
    @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
    @ApiResponse({ status: 200, description: 'Voucher details' })
    @ApiResponse({ status: 404, description: 'Voucher not found' })
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.vouchersService.findOne(id);
    }

    @Post()
    @ApiOperation({ summary: 'Create a new voucher' })
    @ApiResponse({ status: 201, description: 'Voucher created' })
    @ApiResponse({ status: 400, description: 'Validation error' })
    create(@Body() dto: CreateVoucherDto) {
        return this.vouchersService.create(dto);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update an existing voucher' })
    @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
    @ApiResponse({ status: 200, description: 'Voucher updated' })
    @ApiResponse({ status: 404, description: 'Voucher not found' })
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateVoucherDto,
    ) {
        return this.vouchersService.update(id, dto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete a voucher' })
    @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
    @ApiResponse({ status: 204, description: 'Voucher deleted' })
    @ApiResponse({ status: 404, description: 'Voucher not found' })
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.vouchersService.remove(id);
    }
}

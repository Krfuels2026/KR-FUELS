import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Voucher } from './entities/voucher.entity';
import { CreateVoucherDto, UpdateVoucherDto, VoucherQueryDto } from './dto/create-voucher.dto';

@Injectable()
export class VouchersService {
    constructor(
        @InjectRepository(Voucher)
        private readonly voucherRepo: Repository<Voucher>,
    ) { }

    async findAll(query: VoucherQueryDto): Promise<Voucher[]> {
        const qb = this.voucherRepo.createQueryBuilder('v');

        if (query.bunkId) {
            qb.andWhere('v.bunk_id = :bunkId', { bunkId: query.bunkId });
        }
        if (query.date) {
            qb.andWhere('v.txn_date = :date', { date: query.date });
        }
        if (query.fromDate) {
            qb.andWhere('v.txn_date >= :fromDate', { fromDate: query.fromDate });
        }
        if (query.toDate) {
            qb.andWhere('v.txn_date <= :toDate', { toDate: query.toDate });
        }

        qb.orderBy('v.txn_date', 'DESC').addOrderBy('v.created_at', 'DESC');

        return qb.getMany();
    }

    async findOne(id: string): Promise<Voucher> {
        const voucher = await this.voucherRepo.findOne({ where: { id } });
        if (!voucher) throw new NotFoundException(`Voucher with ID "${id}" not found`);
        return voucher;
    }

    async create(dto: CreateVoucherDto): Promise<Voucher> {
        if (dto.debit <= 0 && dto.credit <= 0) {
            throw new BadRequestException('Voucher must have either debit or credit greater than 0');
        }

        const voucher = this.voucherRepo.create({
            date: dto.date,
            accountId: dto.accountId,
            debit: dto.debit,
            credit: dto.credit,
            description: dto.description || '',
            bunkId: dto.bunkId,
        });
        return this.voucherRepo.save(voucher);
    }

    async update(id: string, dto: UpdateVoucherDto): Promise<Voucher> {
        const voucher = await this.findOne(id);
        Object.assign(voucher, dto);

        // Validate debit/credit constraint after merge
        if (voucher.debit <= 0 && voucher.credit <= 0) {
            throw new BadRequestException('Voucher must have either debit or credit greater than 0');
        }

        return this.voucherRepo.save(voucher);
    }

    async remove(id: string): Promise<void> {
        const voucher = await this.findOne(id);
        await this.voucherRepo.remove(voucher);
    }
}

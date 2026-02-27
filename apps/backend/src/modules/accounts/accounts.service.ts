import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from './entities/account.entity';
import { CreateAccountDto, UpdateAccountDto } from './dto/create-account.dto';

@Injectable()
export class AccountsService {
    constructor(
        @InjectRepository(Account)
        private readonly accountRepo: Repository<Account>,
    ) { }

    async findAll(bunkId?: string): Promise<Account[]> {
        const where = bunkId ? { bunkId } : {};
        return this.accountRepo.find({
            where,
            order: { createdAt: 'ASC' },
            relations: ['parent'],
        });
    }

    async findOne(id: string): Promise<Account> {
        const account = await this.accountRepo.findOne({
            where: { id },
            relations: ['parent', 'children'],
        });
        if (!account) throw new NotFoundException(`Account with ID "${id}" not found`);
        return account;
    }

    async create(dto: CreateAccountDto): Promise<Account> {
        // Validate parent exists if specified
        if (dto.parentId) {
            const parent = await this.accountRepo.findOne({ where: { id: dto.parentId } });
            if (!parent) {
                throw new BadRequestException(`Parent account with ID "${dto.parentId}" not found`);
            }
            // Ensure parent belongs to the same bunk
            if (parent.bunkId !== dto.bunkId) {
                throw new BadRequestException('Parent account must belong to the same bunk');
            }
        }

        const account = this.accountRepo.create({
            name: dto.name,
            parentId: dto.parentId || null,
            openingDebit: dto.openingDebit,
            openingCredit: dto.openingCredit,
            bunkId: dto.bunkId,
        });
        return this.accountRepo.save(account);
    }

    async update(id: string, dto: UpdateAccountDto): Promise<Account> {
        const account = await this.findOne(id);

        if (dto.parentId !== undefined) {
            // Prevent circular references
            if (dto.parentId === id) {
                throw new BadRequestException('An account cannot be its own parent');
            }
            if (dto.parentId) {
                const parent = await this.accountRepo.findOne({ where: { id: dto.parentId } });
                if (!parent) {
                    throw new BadRequestException(`Parent account with ID "${dto.parentId}" not found`);
                }
            }
        }

        Object.assign(account, dto);
        return this.accountRepo.save(account);
    }

    async remove(id: string): Promise<void> {
        const account = await this.findOne(id);

        // Check for child accounts
        const children = await this.accountRepo.find({ where: { parentId: id } });
        if (children.length > 0) {
            throw new BadRequestException(
                'Cannot delete account group with active sub-accounts. Remove child accounts first.',
            );
        }

        await this.accountRepo.remove(account);
    }
}

import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bunk } from './entities/bunk.entity';
import { CreateBunkDto } from './dto/create-bunk.dto';

@Injectable()
export class BunksService {
    constructor(
        @InjectRepository(Bunk)
        private readonly bunkRepo: Repository<Bunk>,
    ) { }

    async findAll(): Promise<Bunk[]> {
        return this.bunkRepo.find({ order: { createdAt: 'ASC' } });
    }

    async findOne(id: string): Promise<Bunk> {
        const bunk = await this.bunkRepo.findOne({ where: { id } });
        if (!bunk) throw new NotFoundException(`Bunk with ID "${id}" not found`);
        return bunk;
    }

    async findByIds(ids: string[]): Promise<Bunk[]> {
        return this.bunkRepo.findByIds(ids);
    }

    async create(dto: CreateBunkDto): Promise<Bunk> {
        const existing = await this.bunkRepo.findOne({ where: { code: dto.code.toUpperCase() } });
        if (existing) {
            throw new ConflictException(`Station code "${dto.code}" already exists`);
        }

        const bunk = this.bunkRepo.create({
            name: dto.name.toUpperCase(),
            code: dto.code.toUpperCase(),
            location: (dto.location || '').toUpperCase(),
        });
        return this.bunkRepo.save(bunk);
    }

    async remove(id: string): Promise<void> {
        const bunk = await this.findOne(id);
        await this.bunkRepo.remove(bunk);
    }
}

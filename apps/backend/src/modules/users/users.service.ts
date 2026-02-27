import {
    Injectable,
    ConflictException,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './entities/user.entity';
import { CreateUserDto, UpdateBunkAccessDto } from './dto/create-user.dto';
import { BunksService } from '../bunks/bunks.service';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        private readonly bunksService: BunksService,
    ) { }

    async findAll(): Promise<User[]> {
        return this.userRepo.find({
            relations: ['accessibleBunks'],
            order: { createdAt: 'ASC' },
        });
    }

    async findOne(id: string): Promise<User> {
        const user = await this.userRepo.findOne({
            where: { id },
            relations: ['accessibleBunks'],
        });
        if (!user) throw new NotFoundException(`User with ID "${id}" not found`);
        return user;
    }

    async findByUsername(username: string): Promise<User | null> {
        return this.userRepo.findOne({
            where: { username },
            relations: ['accessibleBunks'],
        });
    }

    async findByUsernameWithPassword(username: string): Promise<User | null> {
        return this.userRepo
            .createQueryBuilder('user')
            .addSelect('user.passwordHash')
            .leftJoinAndSelect('user.accessibleBunks', 'bunk')
            .where('user.username = :username', { username })
            .getOne();
    }

    async create(dto: CreateUserDto): Promise<User> {
        const existing = await this.findByUsername(dto.username.toLowerCase());
        if (existing) {
            throw new ConflictException(`Username "${dto.username}" already exists`);
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(dto.password, salt);

        const user = this.userRepo.create({
            username: dto.username.toLowerCase(),
            passwordHash,
            name: dto.name,
            role: dto.role,
        });

        // Assign bunk access for non-super_admin users
        if (dto.role !== UserRole.SUPER_ADMIN && dto.accessibleBunkIds?.length) {
            user.accessibleBunks = await this.bunksService.findByIds(dto.accessibleBunkIds);
        } else {
            user.accessibleBunks = [];
        }

        return this.userRepo.save(user);
    }

    async updateBunkAccess(id: string, dto: UpdateBunkAccessDto): Promise<User> {
        const user = await this.findOne(id);
        user.accessibleBunks = await this.bunksService.findByIds(dto.accessibleBunkIds);
        return this.userRepo.save(user);
    }

    async remove(id: string): Promise<void> {
        const user = await this.findOne(id);
        await this.userRepo.remove(user);
    }

    async validatePassword(plaintext: string, hash: string): Promise<boolean> {
        return bcrypt.compare(plaintext, hash);
    }
}

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Bunk } from '../../modules/bunks/entities/bunk.entity';
import { User, UserRole } from '../../modules/users/entities/user.entity';

/**
 * Seeds the database with initial data on first startup.
 * Only runs if no bunks or users exist yet.
 */
@Injectable()
export class SeedService implements OnModuleInit {
    private readonly logger = new Logger(SeedService.name);

    constructor(
        @InjectRepository(Bunk) private readonly bunkRepo: Repository<Bunk>,
        @InjectRepository(User) private readonly userRepo: Repository<User>,
    ) { }

    async onModuleInit() {
        await this.seedBunks();
        await this.seedUsers();
    }

    private async seedBunks() {
        const count = await this.bunkRepo.count();
        if (count > 0) return;

        this.logger.log('Seeding initial fuel stations...');

        const bunks = this.bunkRepo.create([
            { name: 'KR FUELS - UDUMELPET', code: 'UDM01', location: 'Udumelpettai' },
            { name: 'KR FUELS - SARAVANAMPATTI', code: 'SRV02', location: 'Saravanampatti' },
            { name: 'KR FUELS - METTUPALAYAM', code: 'MTP03', location: 'Mettupalayam' },
            { name: 'KR FUELS - TIRUCHY', code: 'TRY04', location: 'Tiruchirappalli' },
            { name: 'KR FUELS - POLLACHI', code: 'POL05', location: 'Pollachi' },
            { name: 'KR FUELS - KANGAYAM', code: 'KGP06', location: 'Kangayam' },
            { name: 'KR FUELS - COIMBATORE', code: 'COI07', location: 'Coimbatore' },
            { name: 'KR FUELS - SALEM', code: 'SAL08', location: 'Salem' },
        ]);

        await this.bunkRepo.save(bunks);
        this.logger.log(`✅ Seeded ${bunks.length} fuel stations`);
    }

    private async seedUsers() {
        const count = await this.userRepo.count();
        if (count > 0) return;

        this.logger.log('Seeding default admin user...');

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('password123', salt);

        // Get all bunks to assign to super admin
        const allBunks = await this.bunkRepo.find();

        const admin = this.userRepo.create({
            username: 'admin',
            passwordHash,
            name: 'System Administrator',
            role: UserRole.SUPER_ADMIN,
            accessibleBunks: allBunks,
        });

        await this.userRepo.save(admin);
        this.logger.log('✅ Seeded default admin (username: admin, password: password123)');
    }
}

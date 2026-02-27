import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { Bunk } from '../../modules/bunks/entities/bunk.entity';
import { User } from '../../modules/users/entities/user.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Bunk, User])],
    providers: [SeedService],
})
export class SeedModule { }

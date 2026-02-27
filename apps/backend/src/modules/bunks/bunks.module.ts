import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bunk } from './entities/bunk.entity';
import { BunksService } from './bunks.service';
import { BunksController } from './bunks.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Bunk])],
    controllers: [BunksController],
    providers: [BunksService],
    exports: [BunksService],
})
export class BunksModule { }

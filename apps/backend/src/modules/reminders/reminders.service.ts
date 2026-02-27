import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reminder } from './entities/reminder.entity';
import { CreateReminderDto, UpdateReminderDto } from './dto/create-reminder.dto';

@Injectable()
export class RemindersService {
    constructor(
        @InjectRepository(Reminder)
        private readonly reminderRepo: Repository<Reminder>,
    ) { }

    async findAll(): Promise<Reminder[]> {
        return this.reminderRepo.find({ order: { dueDate: 'ASC' } });
    }

    async findOne(id: string): Promise<Reminder> {
        const reminder = await this.reminderRepo.findOne({ where: { id } });
        if (!reminder) throw new NotFoundException(`Reminder with ID "${id}" not found`);
        return reminder;
    }

    async create(dto: CreateReminderDto, createdBy?: string): Promise<Reminder> {
        const reminder = this.reminderRepo.create({
            title: dto.title,
            description: dto.description || '',
            reminderDate: dto.reminderDate,
            dueDate: dto.dueDate,
            createdBy: createdBy || 'system',
        });
        return this.reminderRepo.save(reminder);
    }

    async update(id: string, dto: UpdateReminderDto): Promise<Reminder> {
        const reminder = await this.findOne(id);
        Object.assign(reminder, dto);
        return this.reminderRepo.save(reminder);
    }

    async remove(id: string): Promise<void> {
        const reminder = await this.findOne(id);
        await this.reminderRepo.remove(reminder);
    }
}

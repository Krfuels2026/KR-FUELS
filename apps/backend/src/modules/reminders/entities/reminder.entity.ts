import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('reminders')
export class Reminder {
    @ApiProperty({ example: 'uuid-string' })
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ApiProperty({ example: 'Fuel Stock Audit' })
    @Column({ type: 'varchar', length: 255 })
    title: string;

    @ApiProperty({ example: 'Monthly inventory reconciliation' })
    @Column({ type: 'text', default: '' })
    description: string;

    @ApiProperty({ example: '2025-02-20' })
    @Column({ type: 'date', name: 'reminder_date' })
    reminderDate: string;

    @ApiProperty({ example: '2025-02-25' })
    @Column({ type: 'date', name: 'due_date' })
    dueDate: string;

    @ApiProperty({ example: 'admin' })
    @Column({ type: 'varchar', length: 100, name: 'created_by', nullable: true })
    createdBy: string;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;
}

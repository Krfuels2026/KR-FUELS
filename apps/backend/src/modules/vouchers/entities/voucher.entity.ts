import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Check,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Account } from '../../accounts/entities/account.entity';
import { Bunk } from '../../bunks/entities/bunk.entity';

@Entity('vouchers')
@Check(`"debit" > 0 OR "credit" > 0`)
export class Voucher {
    @ApiProperty({ example: 'uuid-string' })
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ApiProperty({ example: '2025-02-25' })
    @Column({ type: 'date', name: 'txn_date' })
    date: string;

    @ApiProperty({ example: 'uuid-string' })
    @Column({ type: 'uuid', name: 'account_id' })
    accountId: string;

    @ApiProperty({ example: 5000.0 })
    @Column({
        type: 'numeric',
        precision: 15,
        scale: 2,
        default: 0,
        transformer: { to: (v: number) => v, from: (v: string) => parseFloat(v) },
    })
    debit: number;

    @ApiProperty({ example: 0.0 })
    @Column({
        type: 'numeric',
        precision: 15,
        scale: 2,
        default: 0,
        transformer: { to: (v: number) => v, from: (v: string) => parseFloat(v) },
    })
    credit: number;

    @ApiProperty({ example: 'Cash deposit from daily sales' })
    @Column({ type: 'text', default: '' })
    description: string;

    @ApiProperty({ example: 'uuid-string' })
    @Column({ type: 'uuid', name: 'bunk_id' })
    bunkId: string;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    // ─── Relations ─────────────────────────────────
    @ManyToOne(() => Account, (account) => account.vouchers, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'account_id' })
    account: Account;

    @ManyToOne(() => Bunk, (bunk) => bunk.vouchers, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'bunk_id' })
    bunk: Bunk;
}

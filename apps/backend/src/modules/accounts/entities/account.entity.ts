import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Bunk } from '../../bunks/entities/bunk.entity';
import { Voucher } from '../../vouchers/entities/voucher.entity';

@Entity('accounts')
export class Account {
    @ApiProperty({ example: 'uuid-string' })
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ApiProperty({ example: 'CASH IN HAND' })
    @Column({ type: 'varchar', length: 200 })
    name: string;

    @ApiProperty({ example: 'uuid-or-null', nullable: true })
    @Column({ type: 'uuid', name: 'parent_id', nullable: true })
    parentId: string | null;

    @ApiProperty({ example: 15000.0 })
    @Column({
        type: 'numeric',
        precision: 15,
        scale: 2,
        default: 0,
        name: 'opening_debit',
        transformer: { to: (v: number) => v, from: (v: string) => parseFloat(v) },
    })
    openingDebit: number;

    @ApiProperty({ example: 0.0 })
    @Column({
        type: 'numeric',
        precision: 15,
        scale: 2,
        default: 0,
        name: 'opening_credit',
        transformer: { to: (v: number) => v, from: (v: string) => parseFloat(v) },
    })
    openingCredit: number;

    @ApiProperty({ example: 'uuid-string' })
    @Column({ type: 'uuid', name: 'bunk_id' })
    bunkId: string;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    // ─── Relations ─────────────────────────────────
    @ManyToOne(() => Account, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'parent_id' })
    parent: Account;

    @OneToMany(() => Account, (account) => account.parent)
    children: Account[];

    @ManyToOne(() => Bunk, (bunk) => bunk.accounts, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'bunk_id' })
    bunk: Bunk;

    @OneToMany(() => Voucher, (voucher) => voucher.account)
    vouchers: Voucher[];
}

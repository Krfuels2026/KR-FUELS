import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    OneToMany,
    ManyToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Account } from '../../modules/accounts/entities/account.entity';
import { Voucher } from '../../modules/vouchers/entities/voucher.entity';
import { User } from '../../modules/users/entities/user.entity';

@Entity('bunks')
export class Bunk {
    @ApiProperty({ example: 'uuid-string' })
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ApiProperty({ example: 'KR FUELS - UDUMELPET' })
    @Column({ type: 'varchar', length: 150 })
    name: string;

    @ApiProperty({ example: 'UDM01' })
    @Column({ type: 'varchar', length: 20, unique: true })
    code: string;

    @ApiProperty({ example: 'Udumelpettai' })
    @Column({ type: 'varchar', length: 100, default: '' })
    location: string;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    // ─── Relations ─────────────────────────────────
    @OneToMany(() => Account, (account) => account.bunk)
    accounts: Account[];

    @OneToMany(() => Voucher, (voucher) => voucher.bunk)
    vouchers: Voucher[];

    @ManyToMany(() => User, (user) => user.accessibleBunks)
    users: User[];
}

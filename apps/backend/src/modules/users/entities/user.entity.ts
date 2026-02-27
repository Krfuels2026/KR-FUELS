import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToMany,
    JoinTable,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { Bunk } from '../../bunks/entities/bunk.entity';

export enum UserRole {
    ADMIN = 'admin',
    SUPER_ADMIN = 'super_admin',
}

@Entity('users')
export class User {
    @ApiProperty({ example: 'uuid-string' })
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ApiProperty({ example: 'admin' })
    @Column({ type: 'varchar', length: 100, unique: true })
    username: string;

    @Exclude()
    @Column({ type: 'varchar', length: 255, name: 'password_hash' })
    passwordHash: string;

    @ApiProperty({ example: 'System Administrator' })
    @Column({ type: 'varchar', length: 150 })
    name: string;

    @ApiProperty({ enum: UserRole, example: UserRole.ADMIN })
    @Column({ type: 'enum', enum: UserRole, default: UserRole.ADMIN })
    role: UserRole;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    // ─── Relations ─────────────────────────────────
    @ApiProperty({ type: () => [Bunk], description: 'Bunks this user can access' })
    @ManyToMany(() => Bunk, (bunk) => bunk.users, { eager: true })
    @JoinTable({
        name: 'user_bunk_access',
        joinColumn: { name: 'user_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'bunk_id', referencedColumnName: 'id' },
    })
    accessibleBunks: Bunk[];
}

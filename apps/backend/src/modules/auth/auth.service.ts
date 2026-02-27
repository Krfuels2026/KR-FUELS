import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto, LoginResponseDto } from './dto/login.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
    ) { }

    async login(dto: LoginDto): Promise<LoginResponseDto> {
        const user = await this.usersService.findByUsernameWithPassword(dto.username.toLowerCase());

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isValid = await this.usersService.validatePassword(dto.password, user.passwordHash);
        if (!isValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const payload = { sub: user.id, username: user.username, role: user.role };
        const accessToken = this.jwtService.sign(payload);

        return {
            accessToken,
            user: {
                id: user.id,
                username: user.username,
                name: user.name,
                role: user.role,
                accessibleBunkIds: user.accessibleBunks?.map((b) => b.id) || [],
            },
        };
    }

    async getProfile(userId: string) {
        const user = await this.usersService.findOne(userId);
        return {
            id: user.id,
            username: user.username,
            name: user.name,
            role: user.role,
            accessibleBunkIds: user.accessibleBunks?.map((b) => b.id) || [],
        };
    }
}

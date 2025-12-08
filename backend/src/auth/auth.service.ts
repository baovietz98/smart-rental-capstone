import {
    Injectable,
    UnauthorizedException,
    ConflictException,
    ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto, UserRole } from './dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private mailService: MailService,
    ) { }

    private generateRandomString(length: number): string {
        return crypto.randomBytes(Math.ceil(length / 2))
            .toString('hex')
            .slice(0, length);
    }

    async register(dto: RegisterDto) {
        // Check if email already exists
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (existingUser) {
            throw new ConflictException('Email đã được sử dụng');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(dto.password, 10);

        // Create user
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                password: hashedPassword,
                name: dto.name,
                role: dto.role || UserRole.ADMIN,
            },
        });

        // Generate tokens
        const tokens = await this.generateTokens(user.id, user.email, user.role);

        // Save refresh token
        await this.updateRefreshToken(user.id, tokens.refreshToken);

        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
            ...tokens,
        };
    }

    async login(dto: LoginDto) {
        // Find user
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (!user) {
            throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
        }

        if (!user.isActive) {
            throw new ForbiddenException('Tài khoản đã bị vô hiệu hóa');
        }

        // Verify password
        const passwordValid = await bcrypt.compare(dto.password, user.password);

        if (!passwordValid) {
            throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
        }

        // Generate tokens
        const tokens = await this.generateTokens(user.id, user.email, user.role);

        // Save refresh token
        await this.updateRefreshToken(user.id, tokens.refreshToken);

        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
            ...tokens,
        };
    }

    async logout(userId: number) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { refreshToken: null },
        });

        return { message: 'Đăng xuất thành công' };
    }

    async refreshTokens(userId: number, refreshToken: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user || !user.refreshToken) {
            throw new ForbiddenException('Không thể làm mới token');
        }

        const refreshTokenValid = await bcrypt.compare(
            refreshToken,
            user.refreshToken,
        );

        if (!refreshTokenValid) {
            throw new ForbiddenException('Refresh token không hợp lệ');
        }

        // Generate new tokens
        const tokens = await this.generateTokens(user.id, user.email, user.role);

        // Update refresh token
        await this.updateRefreshToken(user.id, tokens.refreshToken);

        return tokens;
    }

    async getProfile(userId: number) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isActive: true,
                createdAt: true,
            },
        });

        if (!user) {
            throw new UnauthorizedException('Người dùng không tồn tại');
        }

        return user;
    }

    async forgotPassword(email: string) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) {
            return;
        }

        const token = this.generateRandomString(40);
        const expires = new Date(Date.now() + 3600000); // 1 hour

        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken: token,
                resetTokenExp: expires,
            },
        });

        await this.mailService.sendPasswordReset(user, token);
    }

    async resetPassword(token: string, newPass: string) {
        const user = await this.prisma.user.findFirst({
            where: {
                resetToken: token,
                resetTokenExp: { gt: new Date() },
            },
        });

        if (!user) {
            throw new ForbiddenException('Invalid or expired token');
        }

        const hash = await bcrypt.hash(newPass, 10);

        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                password: hash,
                resetToken: null,
                resetTokenExp: null,
            },
        });

        return { message: 'Password reset successfully' };
    }


    private async generateTokens(userId: number, email: string, role: string) {
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(
                { sub: userId, email, role },
                { expiresIn: '15m' },
            ),
            this.jwtService.signAsync(
                { sub: userId, email, role },
                { expiresIn: '7d' },
            ),
        ]);

        return { accessToken, refreshToken };
    }

    private async updateRefreshToken(userId: number, refreshToken: string) {
        const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

        await this.prisma.user.update({
            where: { id: userId },
            data: { refreshToken: hashedRefreshToken },
        });
    }
}

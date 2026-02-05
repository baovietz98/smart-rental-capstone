import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto, UserRole, UpdateProfileDto } from './dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  private generateRandomString(length: number): string {
    return crypto
      .randomBytes(Math.ceil(length / 2))
      .toString('hex')
      .slice(0, length);
  }

  async register(dto: RegisterDto) {
    // Check if email already exists
    if (dto.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (existingUser) {
        throw new ConflictException('Email đã được sử dụng');
      }
    }

    if (dto.phoneNumber) {
      const existingUserPhone = await this.prisma.user.findUnique({
        where: { phoneNumber: dto.phoneNumber },
      });
      if (existingUserPhone) {
        throw new ConflictException('Số điện thoại đã được sử dụng');
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: dto.email || '', // Handle optional email
        phoneNumber: dto.phoneNumber,
        password: hashedPassword,
        name: dto.name,
        role: dto.role || UserRole.ADMIN,
      },
    });

    // Auto-link with match Tenant by Phone
    if (dto.phoneNumber) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { phone: dto.phoneNumber },
      });

      // Link if tenant exists and not yet linked
      if (tenant && !tenant.userId) {
        await this.prisma.tenant.update({
          where: { id: tenant.id },
          data: { userId: user.id },
        });

        // Optional: Update user role to TENANT if it matches
        // For now, we respect the registered role or default
      }
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

  async login(dto: LoginDto) {
    // Find user
    let user;
    if (dto.email) {
      user = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
    } else if (dto.phoneNumber) {
      user = await this.prisma.user.findUnique({
        where: { phoneNumber: dto.phoneNumber },
      });
    }

    if (!user) {
      throw new UnauthorizedException('Tài khoản không tồn tại');
    }

    if (!user.isActive) {
      throw new ForbiddenException('Tài khoản đã bị vô hiệu hóa');
    }

    // Verify password
    const passwordValid = await bcrypt.compare(dto.password, user.password);

    if (!passwordValid) {
      throw new UnauthorizedException('Mật khẩu không chính xác');
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
      include: {
        tenant: {
          include: {
            contracts: {
              // Fetch all contracts (history)
              orderBy: { startDate: 'desc' },
              include: { room: { include: { building: true } } },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    return user;
  }

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    // 1. Check if phone is taken (if changing)
    if (dto.phoneNumber) {
      const existingUser = await this.prisma.user.findUnique({
        where: { phoneNumber: dto.phoneNumber },
      });
      if (existingUser && existingUser.id !== userId) {
        throw new ConflictException(
          'Số điện thoại đã được sử dụng bởi tài khoản khác',
        );
      }
    }

    // 2. Update User
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: dto.name,
        phoneNumber: dto.phoneNumber,
      },
    });

    // 3. Sync with Tenant if linked
    const tenant = await this.prisma.tenant.findUnique({
      where: { userId },
    });

    if (tenant) {
      await this.prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          fullName: dto.name || tenant.fullName,
          phone: dto.phoneNumber || tenant.phone,
        },
      });
    }

    return updatedUser;
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

  private async generateTokens(
    userId: number,
    email: string,
    role: string,
    isRemember = false,
  ) {
    const accessTokenExpiresIn = isRemember ? '30d' : '1d';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, email, role },
        { expiresIn: accessTokenExpiresIn },
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

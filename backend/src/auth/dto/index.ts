import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsNotEmpty,
    IsEmail,
    MinLength,
    IsOptional,
    IsEnum,
} from 'class-validator';

export enum UserRole {
    ADMIN = 'ADMIN',
    TENANT = 'TENANT',
}

export class RegisterDto {
    @ApiProperty({
        description: 'Email đăng nhập',
        example: 'admin@example.com',
    })
    @IsEmail()
    @IsOptional()
    email?: string;

    @ApiPropertyOptional({
        description: 'Số điện thoại',
        example: '0901234567',
    })
    @IsString()
    @IsOptional()
    phoneNumber?: string;

    @ApiProperty({
        description: 'Mật khẩu (tối thiểu 6 ký tự)',
        example: 'password123',
    })
    @IsString()
    @MinLength(6)
    @IsNotEmpty()
    password: string;

    @ApiProperty({
        description: 'Tên hiển thị',
        example: 'Nguyễn Văn A',
    })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional({
        description: 'Vai trò người dùng',
        enum: UserRole,
        default: 'ADMIN',
    })
    @IsEnum(UserRole)
    @IsOptional()
    role?: UserRole;
}

export class LoginDto {
    @ApiProperty({
        description: 'Email đăng nhập',
        example: 'admin@example.com',
    })
    @IsEmail()
    @IsOptional()
    email?: string;

    @ApiProperty({
        description: 'Số điện thoại',
        example: '0901234567',
    })
    @IsString()
    @IsOptional()
    phoneNumber?: string;

    @ApiProperty({
        description: 'Mật khẩu',
        example: 'password123',
    })
    @IsString()
    @IsNotEmpty()
    password: string;

    @ApiPropertyOptional({
        description: 'Ghi nhớ đăng nhập',
        example: true,
    })
    @IsOptional()
    remember?: boolean;
}

export class RefreshTokenDto {
    @ApiProperty({
        description: 'Refresh token',
    })
    @IsString()
    @IsNotEmpty()
    refreshToken: string;
}

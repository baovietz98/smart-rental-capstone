import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  UpdateProfileDto,
} from './dto';
import { JwtAuthGuard, JwtRefreshGuard } from './guards/jwt-auth.guard';
import { Public } from './decorators/public.decorator';
import { GetUser } from './decorators/get-user.decorator';

@ApiTags('Auth - Xác thực')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({
    summary: 'Đăng ký tài khoản',
    description: 'Tạo tài khoản mới cho Admin hoặc Tenant',
  })
  @ApiResponse({ status: 201, description: 'Đăng ký thành công' })
  @ApiResponse({ status: 409, description: 'Email đã được sử dụng' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Đăng nhập',
    description: 'Đăng nhập bằng email và mật khẩu',
  })
  @ApiResponse({ status: 200, description: 'Đăng nhập thành công' })
  @ApiResponse({ status: 401, description: 'Thông tin đăng nhập sai' })
  login(@Body() dto: LoginDto) {
    console.log('DEBUG LOGIN DTO:', JSON.stringify(dto, null, 2));
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Đăng xuất',
    description: 'Đăng xuất và xóa refresh token',
  })
  @ApiResponse({ status: 200, description: 'Đăng xuất thành công' })
  logout(@GetUser('id') userId: number) {
    return this.authService.logout(userId);
  }

  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Làm mới token',
    description: 'Sử dụng refresh token để lấy access token mới',
  })
  @ApiResponse({ status: 200, description: 'Làm mới thành công' })
  @ApiResponse({ status: 403, description: 'Refresh token không hợp lệ' })
  refreshTokens(
    @GetUser('userId') userId: number,
    @Body() dto: RefreshTokenDto,
  ) {
    return this.authService.refreshTokens(userId, dto.refreshToken);
  }

  @Public()
  @Post('forgot-password')
  @ApiOperation({ summary: 'Quên mật khẩu' })
  async forgotPassword(@Body('email') email: string) {
    await this.authService.forgotPassword(email);
    return { message: 'If the email exists, a reset link has been sent.' };
  }

  @Public()
  @Post('reset-password')
  @ApiOperation({ summary: 'Đặt lại mật khẩu' })
  async resetPassword(@Body() body: any) {
    // Body: { token, newPassword }
    return this.authService.resetPassword(body.token, body.newPassword);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Lấy thông tin người dùng',
    description: 'Trả về thông tin người dùng đang đăng nhập',
  })
  @ApiResponse({ status: 200, description: 'Thành công' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  getProfile(@GetUser('id') userId: number) {
    return this.authService.getProfile(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Cập nhật hồ sơ',
    description: 'Cập nhật thông tin cá nhân (Tên, SĐT)',
  })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  updateProfile(@GetUser('id') userId: number, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(userId, dto);
  }
}

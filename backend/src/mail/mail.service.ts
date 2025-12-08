import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) { }

  async sendUserConfirmation(user: any, token: string) {
    const url = `example.com/auth/confirm?token=${token}`;

    await this.mailerService.sendMail({
      to: user.email,
      // from: '"Support Team" <support@example.com>', // override default from
      subject: 'Welcome to Smart Rental App! Confirm your Email',
      html: `
        <h1>Welcome ${user.name}</h1>
        <p>Please click below to confirm your email</p>
        <p><a href="${url}">Confirm</a></p>
      `,
    });
  }

  async sendPasswordReset(user: any, token: string) {
    // URL Frontend để reset password
    const url = `http://localhost:3000/reset-password?token=${token}`;

    await this.mailerService.sendMail({
      to: user.email,
      subject: '[CAMEL STAY] Yêu cầu đặt lại mật khẩu',
      html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
                    .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                    .header { background-color: #FFC900; padding: 20px; text-align: center; border-bottom: 4px solid #000; }
                    .header h1 { margin: 0; color: #000; font-size: 24px; text-transform: uppercase; letter-spacing: 2px; font-weight: 900; }
                    .content { padding: 30px; }
                    .button-container { text-align: center; margin: 30px 0; }
                    .button { display: inline-block; background-color: #000; color: #fff !important; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 4px; text-transform: uppercase; font-size: 14px; letter-spacing: 1px; transition: all 0.3s; }
                    .footer { background-color: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Camel Stay</h1>
                    </div>
                    <div class="content">
                        <h2 style="margin-top: 0; color: #000;">Xin chào ${user.name},</h2>
                        <p>Chúng tôi vừa nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
                        <p>Để tiếp tục, vui lòng nhấn vào nút bên dưới để tạo mật khẩu mới:</p>
                        
                        <div class="button-container">
                            <a href="${url}" class="button">Đặt lại mật khẩu</a>
                        </div>
                        
                        <p style="font-size: 14px; color: #666;">⚠️ Link này sẽ hết hạn sau 1 giờ. Nếu bạn không yêu cầu thay đổi mật khẩu, vui lòng bỏ qua email này. Tài khoản của bạn vẫn an toàn.</p>
                    </div>
                    <div class="footer">
                        <p>&copy; ${new Date().getFullYear()} Camel Stay Management System. All rights reserved.</p>
                        <p>Đây là email tự động, vui lòng không trả lời email này.</p>
                    </div>
                </div>
            </body>
            </html>
            `,
    });

    console.log(`[MailService] Sent Reset Link to ${user.email}`);
  }
}

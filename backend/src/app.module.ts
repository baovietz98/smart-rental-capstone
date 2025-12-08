import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { BuildingsModule } from './buildings/buildings.module';
import { RoomsModule } from './rooms/rooms.module';
import { TenantsModule } from './tenants/tenants.module';
import { ContractsModule } from './contracts/contracts.module';
import { UploadModule } from './upload/upload.module';
import { ServicesModule } from './services/services.module';
import { ReadingsModule } from './readings/readings.module';
import { InvoicesModule } from './invoices/invoices.module';
import { IssuesModule } from './issues/issues.module';
import { TransactionsModule } from './transactions/transactions.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: join(process.cwd(), '.env'),
    }),
    PrismaModule,
    BuildingsModule,
    RoomsModule,
    TenantsModule,
    ContractsModule,
    UploadModule,
    ServicesModule,
    ReadingsModule,
    InvoicesModule,
    IssuesModule,
    TransactionsModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Global guards - all routes require JWT auth by default
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Role-based access control
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule { }


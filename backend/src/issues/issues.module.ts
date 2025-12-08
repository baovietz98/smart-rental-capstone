import { Module } from '@nestjs/common';
import { IssuesService } from './issues.service';
import { IssuesController } from './issues.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [IssuesController],
    providers: [IssuesService],
    exports: [IssuesService],
})
export class IssuesModule { }

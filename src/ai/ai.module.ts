import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RecordsModule } from '../records/records.module';

@Module({
  imports: [PrismaModule, RecordsModule],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
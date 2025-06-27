import { Module } from '@nestjs/common';
import { TagsController } from './tags.controller';
import { RecordsModule } from '../records/records.module';

@Module({
  imports: [RecordsModule],
  controllers: [TagsController],
})
export class TagsModule {}
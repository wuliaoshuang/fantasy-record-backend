import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../auth/decorators/user.decorator';
import { RecordsService } from '../records/records.service';

@Controller('tags')
@UseGuards(JwtAuthGuard)
export class TagsController {
  constructor(private readonly recordsService: RecordsService) {}

  @Get()
  getAllTags(@User() user: any) {
    return this.recordsService.getAllTags(user.id);
  }
}
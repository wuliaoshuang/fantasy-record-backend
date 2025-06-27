import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../auth/decorators/user.decorator';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('mood-trend')
  getMoodTrend(
    @User() user: any,
    @Query('period') period: string = 'weekly',
  ) {
    return this.analyticsService.getMoodTrend(user.id, period);
  }

  @Get('records-summary')
  getRecordsSummary(
    @User() user: any,
    @Query('period') period: string = 'monthly',
  ) {
    return this.analyticsService.getRecordsSummary(user.id, period);
  }
}
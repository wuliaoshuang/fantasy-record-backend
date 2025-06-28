import { Controller, Get, Post, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../auth/decorators/user.decorator';

@ApiTags('数据分析')
@Controller('analytics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('mood-trend')
  @ApiOperation({ summary: '获取心情趋势' })
  @ApiResponse({ status: 200, description: '获取心情趋势成功' })
  getMoodTrend(
    @User() user: any,
    @Query('period') period: string = 'weekly',
  ) {
    return this.analyticsService.getMoodTrend(user.id, period);
  }

  @Get('records-summary')
  @ApiOperation({ summary: '获取记录统计摘要' })
  @ApiResponse({ status: 200, description: '获取统计摘要成功' })
  getRecordsSummary(
    @User() user: any,
    @Query('period') period: string = 'monthly',
  ) {
    return this.analyticsService.getRecordsSummary(user.id, period);
  }

  @Post('mood-analysis')
  @ApiOperation({ summary: '创建心情分析' })
  @ApiResponse({ status: 201, description: '心情分析创建成功' })
  createMoodAnalysis(
    @User() user: any,
    @Body('date') dateString: string,
  ) {
    const date = dateString ? new Date(dateString) : new Date();
    return this.analyticsService.createMoodAnalysis(user.id, date);
  }

  @Get('mood-analysis')
  @ApiOperation({ summary: '获取指定日期的心情分析' })
  @ApiResponse({ status: 200, description: '获取心情分析成功' })
  getMoodAnalysis(
    @User() user: any,
    @Query('date') dateString: string,
  ) {
    const date = dateString ? new Date(dateString) : new Date();
    return this.analyticsService.getMoodAnalysisByDate(user.id, date);
  }
}
import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../auth/decorators/user.decorator';
import { IsString, IsNotEmpty } from 'class-validator';

class FeasibilityAnalysisDto {
  @ApiProperty({ description: '记录ID' })
  @IsString()
  @IsNotEmpty()
  recordId: string;
}

@ApiTags('AI分析')
@Controller('ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('mental-state-analysis')
  @ApiOperation({ summary: '获取心理状态分析' })
  @ApiResponse({ status: 200, description: '获取心理状态分析成功' })
  getMentalStateAnalysis(
    @User() user: any,
    @Query('period') period: string = '30d',
  ) {
    return this.aiService.getMentalStateAnalysis(user.id, period);
  }

  @Post('feasibility-analysis')
  @ApiOperation({ summary: '获取软件创意可行性分析' })
  @ApiResponse({ status: 200, description: '获取可行性分析成功' })
  getFeasibilityAnalysis(
    @User() user: any,
    @Body() dto: FeasibilityAnalysisDto,
  ) {
    return this.aiService.getFeasibilityAnalysis(user.id, dto.recordId);
  }
}
import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../auth/decorators/user.decorator';
import { IsString, IsNotEmpty } from 'class-validator';

class FeasibilityAnalysisDto {
  @IsString()
  @IsNotEmpty()
  recordId: string;
}

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('mental-state-analysis')
  getMentalStateAnalysis(
    @User() user: any,
    @Query('period') period: string = '30d',
  ) {
    return this.aiService.getMentalStateAnalysis(user.id, period);
  }

  @Post('feasibility-analysis')
  getFeasibilityAnalysis(
    @User() user: any,
    @Body() dto: FeasibilityAnalysisDto,
  ) {
    return this.aiService.getFeasibilityAnalysis(user.id, dto.recordId);
  }
}
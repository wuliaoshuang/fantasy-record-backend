import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  private getMoodScore(mood: string): number {
    // Map mood strings to numeric scores
    const moodScores: { [key: string]: number } = {
      '极度沮丧': 1,
      '沮丧': 2,
      '低落': 3,
      '平静': 4,
      '一般': 5,
      '愉快': 6,
      '开心': 7,
      '兴奋': 8,
      '狂欢': 9,
      '充满希望': 8,
      '沉思': 6,
      '焦虑': 3,
      '紧张': 4,
      '放松': 7,
    };
    return moodScores[mood] || 5;
  }

  private getDateLabels(period: string): string[] {
    const now = new Date();
    const labels: string[] = [];
    
    if (period === 'weekly') {
      const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        labels.push(weekdays[date.getDay()]);
      }
    } else if (period === 'monthly') {
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        labels.push(`${date.getMonth() + 1}-${date.getDate().toString().padStart(2, '0')}`);
      }
    }
    
    return labels;
  }

  async getMoodTrend(userId: string, period: string = 'weekly') {
    const now = new Date();
    const daysBack = period === 'weekly' ? 7 : 30;
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - daysBack + 1);
    startDate.setHours(0, 0, 0, 0);

    const records = await this.prisma.fantasyRecord.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        mood: true,
        createdAt: true,
      },
    });

    const labels = this.getDateLabels(period);
    const dataPoints: number[] = [];

    // Group records by date and calculate average mood score
    for (let i = 0; i < daysBack; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayRecords = records.filter(
        (record) => record.createdAt >= date && record.createdAt < nextDate,
      );

      if (dayRecords.length > 0) {
        const avgScore = dayRecords.reduce(
          (sum, record) => sum + this.getMoodScore(record.mood),
          0,
        ) / dayRecords.length;
        dataPoints.push(Math.round(avgScore));
      } else {
        // Use previous day's score or default to 5
        const prevScore = dataPoints.length > 0 ? dataPoints[dataPoints.length - 1] : 5;
        dataPoints.push(prevScore);
      }
    }

    return {
      labels,
      dataPoints,
    };
  }

  async getRecordsSummary(userId: string, period: string = 'monthly') {
    const now = new Date();
    let startDate: Date;

    if (period === 'monthly') {
      // Start of current month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      // Default to last 30 days
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30);
    }

    const records = await this.prisma.fantasyRecord.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        tags: true,
        mood: true,
      },
    });

    const totalRecords = records.length;
    
    // Count records with specific tags
    const softwareIdeasCount = records.filter((record) =>
      Array.isArray(record.tags) && record.tags.includes('软件灵感'),
    ).length;
    
    const storyFragmentsCount = records.filter((record) =>
      Array.isArray(record.tags) && record.tags.includes('故事片段'),
    ).length;

    // Calculate average mood score
    const averageMoodScore = totalRecords > 0
      ? records.reduce((sum, record) => sum + this.getMoodScore(record.mood), 0) / totalRecords
      : 0;

    return {
      totalRecords,
      softwareIdeasCount,
      storyFragmentsCount,
      averageMoodScore: Math.round(averageMoodScore * 10) / 10, // Round to 1 decimal
    };
  }
}
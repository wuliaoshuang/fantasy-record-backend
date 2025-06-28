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
        createdAt: true,
      },
    });

    const totalRecords = records.length;
    
    // Parse and count tags from JSON
    const tagCounts = new Map<string, number>();
    records.forEach(record => {
      try {
        const tags = JSON.parse(record.tags as string);
        if (Array.isArray(tags)) {
          tags.forEach(tag => {
            tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
          });
        }
      } catch (e) {
        // 忽略解析错误
      }
    });

    const softwareIdeasCount = tagCounts.get('软件灵感') || 0;
    const storyFragmentsCount = tagCounts.get('故事片段') || 0;

    // Calculate average mood score
    const averageMoodScore = totalRecords > 0
      ? records.reduce((sum, record) => sum + this.getMoodScore(record.mood), 0) / totalRecords
      : 0;

    // Calculate active days
    const activeDays = new Set(
      records.map(record => record.createdAt.toISOString().split('T')[0])
    ).size;

    // Get top tags
    const topTags = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag, count]) => ({ tag, count }));

    return {
      totalRecords,
      softwareIdeasCount,
      storyFragmentsCount,
      averageMoodScore: Math.round(averageMoodScore * 10) / 10,
      activeDays,
      topTags,
    };
  }

  async createMoodAnalysis(userId: string, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const records = await this.prisma.fantasyRecord.findMany({
      where: {
        userId,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      select: {
        mood: true,
        content: true,
      },
    });

    if (records.length === 0) {
      return null;
    }

    // 计算当天平均心情
    const totalMoodScore = records.reduce((sum, record) => {
      return sum + this.getMoodScore(record.mood);
    }, 0);
    const averageMood = totalMoodScore / records.length;

    // 生成心情文本描述
    let moodText = '';
    if (averageMood >= 8) {
      moodText = '今天心情非常好，充满正能量！';
    } else if (averageMood >= 6) {
      moodText = '今天心情不错，状态良好。';
    } else if (averageMood >= 4) {
      moodText = '今天心情一般，平平淡淡。';
    } else if (averageMood >= 2) {
      moodText = '今天心情有些低落，需要关注。';
    } else {
      moodText = '今天心情很不好，建议寻求帮助。';
    }

    // 创建或更新心情分析记录
    const analysis = await this.prisma.moodAnalysis.upsert({
      where: {
        userId_date: {
          userId,
          date: startOfDay,
        },
      },
      update: {
        moodScore: averageMood,
        moodText,
        recordCount: records.length,
      },
      create: {
        userId,
        date: startOfDay,
        moodScore: averageMood,
        moodText,
        recordCount: records.length,
      },
    });

    return analysis;
  }

  async getMoodAnalysisByDate(userId: string, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    return this.prisma.moodAnalysis.findFirst({
      where: {
        userId,
        date: startOfDay,
      },
    });
  }
}
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AiService {
  constructor(private prisma: PrismaService) {}

  private getMoodScore(mood: string): number {
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

  private generateWordCloud(records: any[]): Array<{ text: string; value: number }> {
    const wordCount: { [key: string]: number } = {};
    
    records.forEach(record => {
      // Extract words from title and content
      const text = `${record.title} ${record.content}`.toLowerCase();
      const words = text.match(/[\u4e00-\u9fa5]+/g) || []; // Extract Chinese characters
      
      words.forEach(word => {
        if (word.length >= 2) { // Only count words with 2+ characters
          wordCount[word] = (wordCount[word] || 0) + 1;
        }
      });
      
      // Also count tags
      if (Array.isArray(record.tags)) {
        record.tags.forEach((tag: string) => {
          wordCount[tag] = (wordCount[tag] || 0) + 3; // Give tags higher weight
        });
      }
    });

    // Convert to array and sort by frequency
    return Object.entries(wordCount)
      .map(([text, value]) => ({ text, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 20); // Top 20 words
  }

  private generateSummaryReport(records: any[], period: string): string {
    const totalRecords = records.length;
    if (totalRecords === 0) {
      return `在过去的${period === '7d' ? '7天' : period === '30d' ? '30天' : '90天'}内，您还没有创建任何幻想记录。建议您开始记录您的想法和情感，以便进行更好的分析。`;
    }

    // Calculate average mood
    const avgMood = records.reduce((sum, record) => sum + this.getMoodScore(record.mood), 0) / totalRecords;
    
    // Count different types of records
    const softwareIdeas = records.filter(r => Array.isArray(r.tags) && r.tags.includes('软件灵感')).length;
    const storyFragments = records.filter(r => Array.isArray(r.tags) && r.tags.includes('故事片段')).length;
    
    // Most common mood
    const moodCount: { [key: string]: number } = {};
    records.forEach(record => {
      moodCount[record.mood] = (moodCount[record.mood] || 0) + 1;
    });
    const mostCommonMood = Object.entries(moodCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '未知';

    const periodText = period === '7d' ? '过去一周' : period === '30d' ? '过去一个月' : '过去三个月';
    
    return `在${periodText}内，您共创建了${totalRecords}条幻想记录。您的平均情绪评分为${avgMood.toFixed(1)}分（满分10分），最常见的情绪状态是"${mostCommonMood}"。其中包含${softwareIdeas}条软件创意和${storyFragments}条故事片段。${avgMood >= 7 ? '您的整体情绪状态较为积极，继续保持这种创造性的思维！' : avgMood >= 5 ? '您的情绪状态相对平稳，可以尝试更多激发灵感的活动。' : '建议您关注自己的情绪健康，适当调节心情，保持创造力的同时也要照顾好自己。'}`;
  }

  async getMentalStateAnalysis(userId: string, period: string = '30d') {
    const daysBack = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const records = await this.prisma.fantasyRecord.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        title: true,
        content: true,
        tags: true,
        mood: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Generate emotion chart data
    const emotionChartData = {
      labels: [],
      datasets: [
        {
          label: '情绪波动',
          data: [],
          borderColor: '#4A90E2',
        },
      ],
    };

    // Group records by date for emotion chart
    const dateGroups: { [key: string]: any[] } = {};
    records.forEach(record => {
      const dateKey = record.createdAt.toISOString().split('T')[0];
      if (!dateGroups[dateKey]) {
        dateGroups[dateKey] = [];
      }
      dateGroups[dateKey].push(record);
    });

    // Generate chart data
    Object.entries(dateGroups).forEach(([date, dayRecords]) => {
      const avgMood = dayRecords.reduce((sum, record) => sum + this.getMoodScore(record.mood), 0) / dayRecords.length;
      emotionChartData.labels.push(date.substring(5)); // MM-DD format
      emotionChartData.datasets[0].data.push(Math.round(avgMood));
    });

    // Generate theme word cloud
    const themeWordCloud = this.generateWordCloud(records);

    // Generate summary report
    const summaryReport = this.generateSummaryReport(records, period);

    return {
      emotionChartData,
      themeWordCloud,
      summaryReport,
    };
  }

  async getFeasibilityAnalysis(userId: string, recordId: string) {
    // Find the record
    const record = await this.prisma.fantasyRecord.findUnique({
      where: { id: recordId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    if (!record) {
      throw new NotFoundException('Record not found');
    }

    if (record.userId !== userId) {
      throw new BadRequestException('Access denied');
    }

    // Check if record has '软件灵感' tag
    if (!Array.isArray(record.tags) || !record.tags.includes('软件灵感')) {
      throw new BadRequestException('Record must have "软件灵感" tag for feasibility analysis');
    }

    // Generate AI analysis (mock implementation)
    const analysis = this.generateFeasibilityAnalysis(record);

    return {
      recordTitle: record.title,
      analysisDate: new Date().toISOString(),
      ...analysis,
    };
  }

  private generateFeasibilityAnalysis(record: any) {
    // This is a mock implementation. In a real application, you would integrate with an AI service
    const content = record.content.toLowerCase();
    const title = record.title.toLowerCase();
    
    // Extract key concepts for analysis
    const hasUserInterface = content.includes('界面') || content.includes('ui') || content.includes('用户');
    const hasDataStorage = content.includes('数据') || content.includes('存储') || content.includes('数据库');
    const hasSocialFeatures = content.includes('社交') || content.includes('分享') || content.includes('用户');
    const hasAI = content.includes('ai') || content.includes('人工智能') || content.includes('智能');
    
    // Generate core user pain point
    let coreUserPainPoint = '用户需要一个解决特定问题的数字化解决方案。';
    if (content.includes('时间') || content.includes('效率')) {
      coreUserPainPoint = '用户希望提高时间管理效率，减少重复性工作。';
    } else if (content.includes('社交') || content.includes('交流')) {
      coreUserPainPoint = '用户渴望更好的社交互动和信息交流方式。';
    } else if (content.includes('学习') || content.includes('教育')) {
      coreUserPainPoint = '用户需要更有效的学习和知识获取途径。';
    }

    // Generate target user persona
    let targetUserPersona = '18-35岁的年轻用户，对新技术有较高接受度。';
    if (content.includes('专业') || content.includes('工作')) {
      targetUserPersona = '25-40岁的职场人士，注重工作效率和专业发展。';
    } else if (content.includes('学生') || content.includes('学习')) {
      targetUserPersona = '16-25岁的学生群体，追求高效学习和知识管理。';
    }

    // Generate core function modules
    const coreFunctionModules = [];
    if (hasUserInterface) coreFunctionModules.push('用户界面模块');
    if (hasDataStorage) coreFunctionModules.push('数据存储模块');
    if (hasSocialFeatures) coreFunctionModules.push('社交互动模块');
    if (hasAI) coreFunctionModules.push('智能分析模块');
    coreFunctionModules.push('核心业务逻辑模块');
    if (coreFunctionModules.length < 3) {
      coreFunctionModules.push('用户管理模块', '通知系统模块');
    }

    // Calculate market feasibility score
    let marketFeasibilityScore = 70;
    if (hasAI) marketFeasibilityScore += 10;
    if (hasSocialFeatures) marketFeasibilityScore += 5;
    if (content.includes('创新') || content.includes('新颖')) marketFeasibilityScore += 10;
    marketFeasibilityScore = Math.min(marketFeasibilityScore, 95);

    // Generate market feasibility reason
    const marketFeasibilityReason = marketFeasibilityScore >= 80 
      ? '该创意具有较强的市场潜力，概念新颖且有明确的用户需求。'
      : marketFeasibilityScore >= 70
      ? '该创意有一定的市场可行性，但需要进一步验证用户需求。'
      : '该创意的市场可行性有待验证，建议进行更深入的市场调研。';

    // Generate technical challenges
    let technicalChallenges = '需要考虑系统架构设计和用户体验优化。';
    if (hasAI) {
      technicalChallenges = '需要集成AI算法，考虑模型训练和推理性能优化。';
    } else if (hasDataStorage && hasSocialFeatures) {
      technicalChallenges = '需要设计可扩展的数据架构，确保高并发下的系统稳定性。';
    } else if (hasDataStorage) {
      technicalChallenges = '需要设计高效的数据存储方案，确保数据安全和访问性能。';
    }

    // Generate suggested next step
    const suggestedNextStep = marketFeasibilityScore >= 80
      ? '建议立即开始MVP开发，先实现核心功能进行用户测试。'
      : '建议先进行用户调研和竞品分析，验证核心假设后再开始开发。';

    return {
      coreUserPainPoint,
      targetUserPersona,
      coreFunctionModules,
      marketFeasibilityScore,
      marketFeasibilityReason,
      technicalChallenges,
      suggestedNextStep,
    };
  }
}
import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RecordsService } from '../records/records.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import OpenAI from 'openai';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly openai: OpenAI;

  constructor(
    private prisma: PrismaService,
    private recordsService: RecordsService,
  ) {
    if (!process.env.DEEPSEEK_API_KEY) {
      throw new Error('DEEPSEEK_API_KEY environment variable is required');
    }
    
    this.openai = new OpenAI({
      baseURL: 'https://api.deepseek.com',
      apiKey: process.env.DEEPSEEK_API_KEY,
    });
  }

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
        try {
          const tags = JSON.parse(record.tags as string);
          if (Array.isArray(tags)) {
            tags.forEach((tag: string) => {
              wordCount[tag] = (wordCount[tag] || 0) + 3; // Give tags higher weight
            });
          }
        } catch (e) {
          // Handle parsing error
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
    const softwareIdeas = records.filter(r => {
        try {
          const tags = JSON.parse(r.tags as string);
          return Array.isArray(tags) && tags.includes('软件灵感');
        } catch (e) {
          return false;
        }
      }).length;
      const storyFragments = records.filter(r => {
        try {
          const tags = JSON.parse(r.tags as string);
          return Array.isArray(tags) && tags.includes('故事片段');
        } catch (e) {
          return false;
        }
      }).length;
    
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

    // Get latest mood analysis from database
    const latestMoodAnalysis = await this.prisma.moodAnalysis.findFirst({
      where: { userId },
      orderBy: { analysisDate: 'desc' },
      select: {
        id: true,
        analysisText: true,
        emotionScore: true,
        creativityScore: true,
        recordCount: true,
        analysisDate: true,
        createdAt: true,
      },
    });

    return {
      emotionChartData,
      themeWordCloud,
      summaryReport: latestMoodAnalysis?.analysisText,
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
    let tags: string[] = [];
    try {
      tags = JSON.parse(record.tags as string);
    } catch (e) {
      // Handle parsing error
    }
    if (!Array.isArray(tags) || !tags.includes('软件灵感')) {
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

  // 定时任务：每12小时执行一次AI分析
  @Cron('0 */12 * * *')
  async handleScheduledAnalysis() {
    this.logger.log('开始执行定时AI分析任务');
    
    try {
      // 获取所有用户
      const users = await this.prisma.user.findMany({
        select: { id: true, username: true }
      });

      for (const user of users) {
        await this.performUserAnalysis(user.id);
      }

      this.logger.log('定时AI分析任务完成');
    } catch (error) {
      this.logger.error('定时AI分析任务失败:', error);
    }
  }

  // 为单个用户执行AI分析
  private async performUserAnalysis(userId: string) {
    try {
      // 获取用户最近7天的记录
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      const records = await this.prisma.fantasyRecord.findMany({
        where: {
          userId,
          createdAt: { gte: startDate }
        },
        select: {
          id: true,
          title: true,
          content: true,
          mood: true,
          tags: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 10 // 最多分析最近10条记录
      });

      if (records.length === 0) {
        this.logger.log(`用户 ${userId} 最近7天无记录，跳过分析`);
        return;
      }

      // 使用DeepSeek进行AI分析
      const analysis = await this.generateDeepSeekAnalysis(records);
      
      // 保存分析结果到数据库
      await this.saveMoodAnalysis(userId, analysis);
      
      this.logger.log(`用户 ${userId} 的AI分析完成`);
    } catch (error) {
      this.logger.error(`用户 ${userId} 的AI分析失败:`, error);
    }
  }

  // 使用DeepSeek API进行真正的AI分析
  private async generateDeepSeekAnalysis(records: any[]) {
    const recordsText = records.map(record => {
      const tags = this.parseJsonField(record.tags);
      return `标题: ${record.title}\n内容: ${record.content}\n情绪: ${record.mood}\n标签: ${Array.isArray(tags) ? tags.join(', ') : '无'}\n时间: ${record.createdAt.toISOString().split('T')[0]}`;
    }).join('\n\n---\n\n');

    const prompt = `请分析以下用户的幻想记录，提供专业的心理状态和创意分析：

${recordsText}

请从以下几个维度进行分析：
1. 情绪趋势分析（积极/消极情绪的变化趋势）
2. 创意质量评估（创意的新颖性和可行性）
3. 心理健康状态（基于记录内容判断用户的心理状态）
4. 建议和改进方向（如何提升创意质量和心理健康）

请用中文回答，保持专业和温暖的语调。`;

    try {
      const completion = await this.openai.chat.completions.create({
        messages: [
          { 
            role: "system", 
            content: "你是一位专业的心理分析师和创意顾问，擅长分析用户的情绪状态和创意内容，提供有价值的建议。" 
          },
          { role: "user", content: prompt }
        ],
        model: "deepseek-chat",
        temperature: 0.7,
        max_tokens: 1000
      });

      const analysisText = completion.choices[0].message.content || '分析生成失败';
      
      return {
        analysisText,
        emotionScore: this.calculateAverageEmotion(records),
        creativityScore: this.calculateCreativityScore(records),
        recordCount: records.length,
        analysisDate: new Date()
      };
    } catch (error) {
      this.logger.error('DeepSeek API调用失败:', error);
      // 如果API调用失败，返回基础分析
      return this.generateBasicAnalysis(records);
    }
  }

  // 计算平均情绪分数
  private calculateAverageEmotion(records: any[]): number {
    if (records.length === 0) return 5;
    const total = records.reduce((sum, record) => sum + this.getMoodScore(record.mood), 0);
    return Math.round((total / records.length) * 10) / 10;
  }

  // 计算创意分数
  private calculateCreativityScore(records: any[]): number {
    let score = 50; // 基础分数
    
    records.forEach(record => {
      const content = record.content.toLowerCase();
      const title = record.title.toLowerCase();
      
      // 检查创新关键词
      if (content.includes('创新') || content.includes('新颖') || title.includes('创意')) {
        score += 10;
      }
      
      // 检查技术相关内容
      if (content.includes('技术') || content.includes('算法') || content.includes('ai')) {
        score += 8;
      }
      
      // 检查详细程度
      if (content.length > 200) {
        score += 5;
      }
      
      // 检查标签多样性
      const tags = this.parseJsonField(record.tags);
      if (Array.isArray(tags) && tags.length > 2) {
        score += 3;
      }
    });
    
    return Math.min(Math.max(score, 0), 100);
  }

  // 生成基础分析（当API调用失败时使用）
  private generateBasicAnalysis(records: any[]) {
    const avgEmotion = this.calculateAverageEmotion(records);
    const creativityScore = this.calculateCreativityScore(records);
    
    let analysisText = `基于您最近${records.length}条记录的分析：\n\n`;
    analysisText += `情绪状态：您的平均情绪评分为${avgEmotion}分，`;
    
    if (avgEmotion >= 7) {
      analysisText += '整体情绪状态积极向上，保持这种良好的心态！\n\n';
    } else if (avgEmotion >= 5) {
      analysisText += '情绪状态相对平稳，可以尝试更多激发灵感的活动。\n\n';
    } else {
      analysisText += '建议关注情绪健康，适当调节心情。\n\n';
    }
    
    analysisText += `创意质量：您的创意评分为${creativityScore}分，`;
    
    if (creativityScore >= 80) {
      analysisText += '创意质量很高，继续保持这种创造性思维！';
    } else if (creativityScore >= 60) {
      analysisText += '创意有一定质量，可以尝试更深入的思考和探索。';
    } else {
      analysisText += '建议多观察生活，寻找更多灵感来源。';
    }
    
    return {
      analysisText,
      emotionScore: avgEmotion,
      creativityScore,
      recordCount: records.length,
      analysisDate: new Date()
    };
  }

  // 保存情绪分析结果到数据库
  private async saveMoodAnalysis(userId: string, analysis: any) {
    try {
      await this.prisma.moodAnalysis.create({
        data: {
          userId,
          analysisText: analysis.analysisText,
          emotionScore: analysis.emotionScore,
          creativityScore: analysis.creativityScore,
          recordCount: analysis.recordCount,
          analysisDate: analysis.analysisDate
        }
      });
    } catch (error) {
      this.logger.error('保存分析结果失败:', error);
    }
  }

  // 解析JSON字段的辅助方法
  private parseJsonField(field: any): any {
    if (typeof field === 'string') {
      try {
        return JSON.parse(field);
      } catch (e) {
        return field;
      }
    }
    return field;
  }

  // 获取用户的AI分析历史
  async getUserAnalysisHistory(userId: string, limit: number = 10) {
    return this.prisma.moodAnalysis.findMany({
      where: { userId },
      orderBy: { analysisDate: 'desc' },
      take: limit
    });
  }

  // 手动触发AI分析
  async triggerManualAnalysis(userId: string) {
    this.logger.log(`手动触发用户 ${userId} 的AI分析`);
    await this.performUserAnalysis(userId);
    return { message: 'AI分析已完成' };
  }
}
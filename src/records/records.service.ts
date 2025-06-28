import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRecordDto } from './dto/create-record.dto';
import { UpdateRecordDto } from './dto/update-record.dto';
import { QueryRecordsDto } from './dto/query-records.dto';

@Injectable()
export class RecordsService {
  constructor(private prisma: PrismaService) {}

  private generateSnippet(content: string): string {
    // Remove HTML tags and get first 117 characters (leaving room for '...')
    const plainText = content.replace(/<[^>]*>/g, '');
    return plainText.length > 117 ? plainText.substring(0, 117) + '...' : plainText;
  }

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

  private formatRecord(record: any): any {
    return {
      ...record,
      tags: this.parseJsonField(record.tags),
      attachments: this.parseJsonField(record.attachments),
    };
  }

  async create(createRecordDto: CreateRecordDto, userId: string) {
    const snippet = this.generateSnippet(createRecordDto.content);
    
    const record = await this.prisma.fantasyRecord.create({
      data: {
        title: createRecordDto.title,
        content: createRecordDto.content,
        mood: createRecordDto.mood,
        snippet,
        userId,
        categoryId: createRecordDto.categoryId,
        tags: JSON.stringify(createRecordDto.tags),
        attachments: JSON.stringify(createRecordDto.attachments || []),
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
          },
        },
      },
    });

    return this.formatRecord(record);
  }

  async findAll(queryDto: QueryRecordsDto, userId: string) {
    const { q, tag, categoryId, limit, page, sortBy, order } = queryDto;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      userId,
    };

    if (q) {
      where.OR = [
        { title: { contains: q } },
        { content: { contains: q } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    // TODO: Fix JSON field query for tags
    // if (tag) {
    //   where.tags = {
    //     path: '$[*]',
    //     string_contains: tag,
    //   };
    // }

    // Get total count
    const totalRecords = await this.prisma.fantasyRecord.count({ where });

    // Get records
    const records = await this.prisma.fantasyRecord.findMany({
      where,
      select: {
        id: true,
        title: true,
        snippet: true,
        tags: true,
        mood: true,
        createdAt: true,
        updatedAt: true,
        category: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
          },
        },
      },
      orderBy: {
        [sortBy]: order,
      },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(totalRecords / limit);

    return {
      records: records.map(record => this.formatRecord(record)),
      pagination: {
        totalRecords,
        currentPage: page,
        totalPages,
      },
    };
  }

  async findOne(id: string, userId: string) {
    const record = await this.prisma.fantasyRecord.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
          },
        },
      },
    });

    if (!record) {
      throw new NotFoundException('Record not found');
    }

    if (record.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return this.formatRecord(record);
  }

  async update(id: string, updateRecordDto: UpdateRecordDto, userId: string) {
    // Check if record exists and belongs to user
    await this.findOne(id, userId);

    const updateData: any = {};
    
    // Only update provided fields
    if (updateRecordDto.title !== undefined) updateData.title = updateRecordDto.title;
    if (updateRecordDto.content !== undefined) {
      updateData.content = updateRecordDto.content;
      updateData.snippet = this.generateSnippet(updateRecordDto.content);
    }
    if (updateRecordDto.mood !== undefined) updateData.mood = updateRecordDto.mood;
    if (updateRecordDto.categoryId !== undefined) updateData.categoryId = updateRecordDto.categoryId;
    if (updateRecordDto.tags !== undefined) updateData.tags = JSON.stringify(updateRecordDto.tags);
    if (updateRecordDto.attachments !== undefined) updateData.attachments = JSON.stringify(updateRecordDto.attachments);

    const record = await this.prisma.fantasyRecord.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
          },
        },
      },
    });

    return this.formatRecord(record);
  }

  async remove(id: string, userId: string) {
    // Check if record exists and belongs to user
    await this.findOne(id, userId);

    await this.prisma.fantasyRecord.delete({
      where: { id },
    });
  }

  async getAllTags(userId: string) {
    const records = await this.prisma.fantasyRecord.findMany({
      where: { userId },
      select: { tags: true },
    });

    const allTags = new Set<string>();
    records.forEach((record) => {
      if (record.tags) {
          try {
            const tags = JSON.parse(record.tags as string);
            if (Array.isArray(tags)) {
              tags.forEach((tag: string) => allTags.add(tag));
            }
          } catch (e) {
            // Handle legacy string tags
            if (typeof record.tags === 'string') {
              allTags.add(record.tags);
            }
          }
        }
    });

    return Array.from(allTags);
  }

  async getRecordsByMood(userId: string, mood: string) {
    return this.prisma.fantasyRecord.findMany({
      where: {
        userId,
        mood,
      },
      select: {
        id: true,
        title: true,
        snippet: true,
        mood: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getRecordsByDateRange(userId: string, startDate: Date, endDate: Date) {
    const records = await this.prisma.fantasyRecord.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        title: true,
        snippet: true,
        mood: true,
        tags: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return records.map(record => this.formatRecord(record));
  }

  async getRecordsCount(userId: string) {
    return this.prisma.fantasyRecord.count({
      where: { userId },
    });
  }

  async searchByTags(userId: string, tags: string[], page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    // Get all records for the user
    const allRecords = await this.prisma.fantasyRecord.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        snippet: true,
        tags: true,
        mood: true,
        createdAt: true,
        updatedAt: true,
        category: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true,
          },
        },
      },
    });

    // Filter records that contain any of the specified tags
    const filteredRecords = allRecords.filter(record => {
      const recordTags = this.parseJsonField(record.tags);
      if (!Array.isArray(recordTags)) return false;
      
      return tags.some(searchTag => 
        recordTags.some(recordTag => 
          recordTag.toLowerCase().includes(searchTag.toLowerCase())
        )
      );
    });

    // Apply pagination
    const totalRecords = filteredRecords.length;
    const paginatedRecords = filteredRecords
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(skip, skip + limit);

    const totalPages = Math.ceil(totalRecords / limit);

    return {
      records: paginatedRecords.map(record => this.formatRecord(record)),
      pagination: {
        totalRecords,
        currentPage: page,
        totalPages,
        searchTags: tags,
      },
    };
  }
}
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRecordDto } from './dto/create-record.dto';
import { UpdateRecordDto } from './dto/update-record.dto';
import { QueryRecordsDto } from './dto/query-records.dto';

@Injectable()
export class RecordsService {
  constructor(private prisma: PrismaService) {}

  private generateSnippet(content: string): string {
    // Remove HTML tags and get first 120 characters
    const plainText = content.replace(/<[^>]*>/g, '');
    return plainText.length > 120 ? plainText.substring(0, 120) + '...' : plainText;
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
      },
    });

    return record;
  }

  async findAll(queryDto: QueryRecordsDto, userId: string) {
    const { q, tag, limit, page, sortBy, order } = queryDto;
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

    if (tag) {
      where.tags = {
        array_contains: tag,
      };
    }

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
      },
      orderBy: {
        [sortBy]: order,
      },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(totalRecords / limit);

    return {
      records,
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
      },
    });

    if (!record) {
      throw new NotFoundException('Record not found');
    }

    if (record.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return record;
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
      },
    });

    return record;
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
      if (Array.isArray(record.tags)) {
        record.tags.forEach((tag: string) => allTags.add(tag));
      }
    });

    return Array.from(allTags);
  }
}
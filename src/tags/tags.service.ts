import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

@Injectable()
export class TagsService {
  constructor(private prisma: PrismaService) {}

  async create(createTagDto: CreateTagDto, userId: string) {
    return this.prisma.tag.create({
      data: {
        name: createTagDto.name,
        color: createTagDto.color,
        userId,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.tag.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    return this.prisma.tag.findFirst({
      where: { id, userId },
    });
  }

  async update(id: string, updateTagDto: UpdateTagDto, userId: string) {
    return this.prisma.tag.update({
      where: { id },
      data: {
        name: updateTagDto.name,
        color: updateTagDto.color,
      },
    });
  }

  async remove(id: string, userId: string) {
    return this.prisma.tag.delete({
      where: { id },
    });
  }

  async getTagsWithUsageCount(userId: string) {
    const tags = await this.prisma.tag.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    // 获取每个标签的使用次数
    const tagsWithCount = await Promise.all(
      tags.map(async (tag) => {
        const records = await this.prisma.fantasyRecord.findMany({
          where: {
            userId,
            tags: {
              path: '$[*]',
              string_contains: tag.name,
            },
          },
        });
        
        return {
          ...tag,
          usageCount: records.length,
        };
      })
    );

    return tagsWithCount;
  }
}
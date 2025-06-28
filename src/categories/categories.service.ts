import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto, userId: string) {
    return this.prisma.category.create({
      data: {
        name: createCategoryDto.name,
        description: createCategoryDto.description,
        color: createCategoryDto.color,
        icon: createCategoryDto.icon,
        userId,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.category.findMany({
      where: { userId },
      include: {
        _count: {
          select: { records: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    return this.prisma.category.findFirst({
      where: { id, userId },
      include: {
        _count: {
          select: { records: true },
        },
      },
    });
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto, userId: string) {
    return this.prisma.category.update({
      where: { id },
      data: {
        name: updateCategoryDto.name,
        description: updateCategoryDto.description,
        color: updateCategoryDto.color,
        icon: updateCategoryDto.icon,
      },
    });
  }

  async remove(id: string, userId: string) {
    return this.prisma.category.delete({
      where: { id },
    });
  }

  async getCategoriesWithRecordCount(userId: string) {
    const categories = await this.prisma.category.findMany({
      where: { userId },
      include: {
        _count: {
          select: { records: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return categories.map(category => ({
      ...category,
      recordCount: category._count.records,
    }));
  }
}
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../auth/decorators/user.decorator';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('分类管理')
@Controller('categories')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: '创建分类' })
  @ApiResponse({ status: 201, description: '分类创建成功' })
  create(@Body() createCategoryDto: CreateCategoryDto, @User() user: any) {
    return this.categoriesService.create(createCategoryDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: '获取所有分类' })
  @ApiResponse({ status: 200, description: '获取分类列表成功' })
  findAll(@User() user: any) {
    return this.categoriesService.getCategoriesWithRecordCount(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个分类' })
  @ApiResponse({ status: 200, description: '获取分类成功' })
  findOne(@Param('id') id: string, @User() user: any) {
    return this.categoriesService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新分类' })
  @ApiResponse({ status: 200, description: '分类更新成功' })
  update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto, @User() user: any) {
    return this.categoriesService.update(id, updateCategoryDto, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除分类' })
  @ApiResponse({ status: 200, description: '分类删除成功' })
  remove(@Param('id') id: string, @User() user: any) {
    return this.categoriesService.remove(id, user.id);
  }
}
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../auth/decorators/user.decorator';
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

@ApiTags('标签管理')
@Controller('tags')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Post()
  @ApiOperation({ summary: '创建标签' })
  @ApiResponse({ status: 201, description: '标签创建成功' })
  create(@Body() createTagDto: CreateTagDto, @User() user: any) {
    return this.tagsService.create(createTagDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: '获取所有标签' })
  @ApiResponse({ status: 200, description: '获取标签列表成功' })
  findAll(@User() user: any) {
    return this.tagsService.getTagsWithUsageCount(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个标签' })
  @ApiResponse({ status: 200, description: '获取标签成功' })
  findOne(@Param('id') id: string, @User() user: any) {
    return this.tagsService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新标签' })
  @ApiResponse({ status: 200, description: '标签更新成功' })
  update(@Param('id') id: string, @Body() updateTagDto: UpdateTagDto, @User() user: any) {
    return this.tagsService.update(id, updateTagDto, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除标签' })
  @ApiResponse({ status: 200, description: '标签删除成功' })
  remove(@Param('id') id: string, @User() user: any) {
    return this.tagsService.remove(id, user.id);
  }
} 
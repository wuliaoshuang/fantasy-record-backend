import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
  Put,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RecordsService } from './records.service';
import { CreateRecordDto } from './dto/create-record.dto';
import { UpdateRecordDto } from './dto/update-record.dto';
import { QueryRecordsDto } from './dto/query-records.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../auth/decorators/user.decorator';

@ApiTags('记录管理')
@Controller('records')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RecordsController {
  constructor(private readonly recordsService: RecordsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '创建新记录' })
  @ApiResponse({ status: 201, description: '记录创建成功' })
  create(@Body() createRecordDto: CreateRecordDto, @User() user: any) {
    return this.recordsService.create(createRecordDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: '获取记录列表' })
  @ApiResponse({ status: 200, description: '获取记录列表成功' })
  findAll(@Query() queryDto: QueryRecordsDto, @User() user: any) {
    return this.recordsService.findAll(queryDto, user.id);
  }

  @Get('tags')
  @ApiOperation({ summary: '获取所有标签' })
  @ApiResponse({ status: 200, description: '获取标签成功' })
  getAllTags(@User() user: any) {
    return this.recordsService.getAllTags(user.id);
  }

  @Get('count')
  @ApiOperation({ summary: '获取记录总数' })
  @ApiResponse({ status: 200, description: '获取记录总数成功' })
  getRecordsCount(@User() user: any) {
    return this.recordsService.getRecordsCount(user.id);
  }

  @Get('mood/:mood')
  @ApiOperation({ summary: '根据心情获取记录' })
  @ApiResponse({ status: 200, description: '获取记录成功' })
  getRecordsByMood(@Param('mood') mood: string, @User() user: any) {
    return this.recordsService.getRecordsByMood(user.id, mood);
  }

  @Get('date-range')
  @ApiOperation({ summary: '根据日期范围获取记录' })
  @ApiResponse({ status: 200, description: '获取记录成功' })
  getRecordsByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @User() user: any,
  ) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return this.recordsService.getRecordsByDateRange(user.id, start, end);
  }

  @Get('search/tags')
  @ApiOperation({ summary: '根据标签搜索记录' })
  @ApiResponse({ status: 200, description: '搜索记录成功' })
  searchByTags(
    @Query('tags') tags: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @User() user: any,
  ) {
    const tagArray = tags ? tags.split(',').map(tag => tag.trim()) : [];
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    return this.recordsService.searchByTags(user.id, tagArray, pageNum, limitNum);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个记录' })
  @ApiResponse({ status: 200, description: '获取记录成功' })
  findOne(@Param('id') id: string, @User() user: any) {
    return this.recordsService.findOne(id, user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新记录' })
  @ApiResponse({ status: 200, description: '记录更新成功' })
  update(
    @Param('id') id: string,
    @Body() updateRecordDto: UpdateRecordDto,
    @User() user: any,
  ) {
    return this.recordsService.update(id, updateRecordDto, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除记录' })
  @ApiResponse({ status: 204, description: '记录删除成功' })
  remove(@Param('id') id: string, @User() user: any) {
    return this.recordsService.remove(id, user.id);
  }
}
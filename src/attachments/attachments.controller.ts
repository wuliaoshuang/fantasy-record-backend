import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { AttachmentsService } from './attachments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../auth/decorators/user.decorator';

@ApiTags('附件管理')
@Controller('attachments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Post('upload')
  @ApiOperation({ summary: '上传文件' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: '文件上传成功' })
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @User() user: any,
    @Query('recordId') recordId?: string,
  ) {
    return this.attachmentsService.uploadFile(file, user.id, recordId);
  }

  @Get()
  @ApiOperation({ summary: '获取用户所有附件' })
  @ApiResponse({ status: 200, description: '获取附件列表成功' })
  findAll(@User() user: any) {
    return this.attachmentsService.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个附件信息' })
  @ApiResponse({ status: 200, description: '获取附件成功' })
  findOne(@Param('id') id: string, @User() user: any) {
    return this.attachmentsService.findOne(id, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除附件' })
  @ApiResponse({ status: 200, description: '附件删除成功' })
  remove(@Param('id') id: string, @User() user: any) {
    return this.attachmentsService.remove(id, user.id);
  }

  @Get('record/:recordId')
  @ApiOperation({ summary: '获取记录的所有附件' })
  @ApiResponse({ status: 200, description: '获取记录附件成功' })
  getFilesByRecord(@Param('recordId') recordId: string, @User() user: any) {
    return this.attachmentsService.getFilesByRecord(recordId, user.id);
  }
}
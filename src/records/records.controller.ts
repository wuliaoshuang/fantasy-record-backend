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
import { RecordsService } from './records.service';
import { CreateRecordDto } from './dto/create-record.dto';
import { UpdateRecordDto } from './dto/update-record.dto';
import { QueryRecordsDto } from './dto/query-records.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../auth/decorators/user.decorator';

@Controller('records')
@UseGuards(JwtAuthGuard)
export class RecordsController {
  constructor(private readonly recordsService: RecordsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createRecordDto: CreateRecordDto, @User() user: any) {
    return this.recordsService.create(createRecordDto, user.id);
  }

  @Get()
  findAll(@Query() queryDto: QueryRecordsDto, @User() user: any) {
    return this.recordsService.findAll(queryDto, user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @User() user: any) {
    return this.recordsService.findOne(id, user.id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateRecordDto: UpdateRecordDto,
    @User() user: any,
  ) {
    return this.recordsService.update(id, updateRecordDto, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @User() user: any) {
    return this.recordsService.remove(id, user.id);
  }
}
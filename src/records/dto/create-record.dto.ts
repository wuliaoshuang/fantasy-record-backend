import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

class AttachmentDto {
  @IsString()
  url: string;

  @IsString()
  fileName: string;

  @IsString()
  fileType: string;
}

export class CreateRecordDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  content: string;

  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @IsNotEmpty()
  @IsString()
  mood: string;

  @IsOptional()
  @IsArray()
  attachments?: AttachmentDto[];
}
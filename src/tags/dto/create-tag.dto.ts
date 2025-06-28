import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTagDto {
  @ApiProperty({ description: '标签名称', maxLength: 50 })
  @IsString()
  @MaxLength(50)
  name: string;

  @ApiProperty({ description: '标签颜色', required: false, maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  color?: string;
}
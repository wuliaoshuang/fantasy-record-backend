import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AttachmentsService {
  private readonly uploadPath = 'uploads';

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    // Ensure upload directory exists
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  async uploadFile(file: Express.Multer.File, userId: string, recordId?: string) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file type
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('File type not allowed');
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size too large (max 10MB)');
    }

    // Generate unique filename
    const fileExtension = path.extname(file.originalname);
    const uniqueFilename = `${uuidv4()}${fileExtension}`;
    const filePath = path.join(this.uploadPath, uniqueFilename);

    // Save file
    fs.writeFileSync(filePath, file.buffer);

    // Save to database
    const attachment = await this.prisma.attachment.create({
      data: {
        url: `/uploads/${uniqueFilename}`,
        fileName: file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
        userId,
        recordId,
      },
    });

    return attachment;
  }

  async findAll(userId: string) {
    return this.prisma.attachment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        record: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
  }

  async findOne(id: string, userId: string) {
    const attachment = await this.prisma.attachment.findFirst({
      where: { id, userId },
      include: {
        record: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    return attachment;
  }

  async remove(id: string, userId: string) {
    const attachment = await this.prisma.attachment.findFirst({
      where: { id, userId },
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    // Delete file from filesystem
    const filename = path.basename(attachment.url);
    const filePath = path.join(this.uploadPath, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    await this.prisma.attachment.delete({
      where: { id },
    });

    return { message: 'Attachment deleted successfully' };
  }

  async getFilesByRecord(recordId: string, userId: string) {
    return this.prisma.attachment.findMany({
      where: { recordId, userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { buildPaginationMeta, MessageResponse, PaginatedResponse } from '../common/entities';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { QueryFeedbackDto } from './dto/query-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';
import { FeedbackEntity } from './entities';

const FEEDBACK_INCLUDE = {
  user: { select: { id: true, name: true, email: true } },
  book: { select: { id: true, title: true, author: true } },
} satisfies Prisma.FeedbackInclude;

@Injectable()
export class FeedbackService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateFeedbackDto): Promise<FeedbackEntity> {
    const book = await this.prisma.book.findUnique({ where: { id: dto.bookId } });
    if (!book) {
      throw new NotFoundException(`Book with ID ${dto.bookId} not found`);
    }

    const existing = await this.prisma.feedback.findUnique({
      where: { userId_bookId: { userId, bookId: dto.bookId } },
    });
    if (existing) {
      throw new ConflictException('You have already provided feedback for this book');
    }

    return this.prisma.feedback.create({
      data: {
        rating: dto.rating,
        comment: dto.comment,
        userId,
        bookId: dto.bookId,
        isApproved: false,
      },
      include: FEEDBACK_INCLUDE,
    });
  }

  async findAll(queryDto: QueryFeedbackDto): Promise<PaginatedResponse<FeedbackEntity>> {
    const { bookId, userId, isApproved, minRating, page = 1, limit = 10 } = queryDto;

    const pageNum = typeof page === 'string' ? parseInt(page, 10) : page;
    const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : limit;

    const where: Prisma.FeedbackWhereInput = {};
    if (bookId) where.bookId = bookId;
    if (userId) where.userId = userId;

    if (isApproved !== undefined && isApproved !== null) {
      where.isApproved = typeof isApproved === 'string'
        ? isApproved === 'true'
        : isApproved;
    }

    if (minRating !== undefined && minRating !== null) {
      where.rating = { gte: minRating };
    }

    const [feedback, total] = await Promise.all([
      this.prisma.feedback.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: FEEDBACK_INCLUDE,
      }),
      this.prisma.feedback.count({ where }),
    ]);

    return {
      data: feedback,
      pagination: buildPaginationMeta(pageNum, limitNum, total),
    };
  }

  async findOne(id: string): Promise<FeedbackEntity> {
    const feedback = await this.prisma.feedback.findUnique({
      where: { id },
      include: FEEDBACK_INCLUDE,
    });

    if (!feedback) {
      throw new NotFoundException(`Feedback with ID ${id} not found`);
    }

    return feedback;
  }

  async update(
    id: string,
    dto: UpdateFeedbackDto,
    userId: string,
    userRole: string,
  ): Promise<FeedbackEntity> {
    const existing = await this.prisma.feedback.findUnique({
      where: { id },
      include: FEEDBACK_INCLUDE,
    });

    if (!existing) {
      throw new NotFoundException(`Feedback with ID ${id} not found`);
    }

    const isOwner = existing.userId === userId;
    const isAdmin = userRole === 'ADMIN';

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('You can only update your own feedback');
    }

    if (isOwner && !isAdmin && existing.isApproved) {
      throw new ForbiddenException('Cannot update approved feedback');
    }

    if (dto.isApproved !== undefined && !isAdmin) {
      throw new ForbiddenException('Only admins can change approval status');
    }

    return this.prisma.feedback.update({
      where: { id },
      data: {
        ...dto,
        isApproved: isAdmin ? dto.isApproved : false,
      },
      include: FEEDBACK_INCLUDE,
    });
  }

  async remove(id: string, userId: string, userRole: string): Promise<MessageResponse> {
    const existing = await this.prisma.feedback.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException(`Feedback with ID ${id} not found`);
    }

    const isOwner = existing.userId === userId;
    const isAdmin = userRole === 'ADMIN';

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('You can only delete your own feedback');
    }

    await this.prisma.feedback.delete({ where: { id } });

    return { message: 'Feedback deleted successfully' };
  }

  async getBookFeedback(bookId: string, queryDto: QueryFeedbackDto): Promise<PaginatedResponse<FeedbackEntity>> {
    const book = await this.prisma.book.findUnique({ where: { id: bookId } });
    if (!book) {
      throw new NotFoundException(`Book with ID ${bookId} not found`);
    }

    return this.findAll({ ...queryDto, bookId, isApproved: true });
  }

  async getUserFeedback(userId: string, queryDto: QueryFeedbackDto): Promise<PaginatedResponse<FeedbackEntity>> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return this.findAll({ ...queryDto, userId });
  }

  async approveFeedback(id: string): Promise<FeedbackEntity> {
    const existing = await this.prisma.feedback.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException(`Feedback with ID ${id} not found`);
    }

    if (existing.isApproved) {
      throw new BadRequestException('Feedback is already approved');
    }

    return this.prisma.feedback.update({
      where: { id },
      data: { isApproved: true },
      include: FEEDBACK_INCLUDE,
    });
  }

  async rejectFeedback(id: string): Promise<FeedbackEntity> {
    const existing = await this.prisma.feedback.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException(`Feedback with ID ${id} not found`);
    }

    if (!existing.isApproved) {
      throw new BadRequestException('Feedback is already rejected');
    }

    return this.prisma.feedback.update({
      where: { id },
      data: { isApproved: false },
      include: FEEDBACK_INCLUDE,
    });
  }
}

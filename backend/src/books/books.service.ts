import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { buildPaginationMeta, MessageResponse, PaginatedResponse } from '../common/entities';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateBookDto } from './dto/create-book.dto';
import { QueryBookDto } from './dto/query-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { BookEntity, BookWithFeedbackEntity } from './entities';

@Injectable()
export class BooksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createBookDto: CreateBookDto): Promise<BookEntity> {
    const existingBook = await this.prisma.book.findUnique({
      where: { isbn: createBookDto.isbn },
    });

    if (existingBook) {
      throw new ConflictException('Book with this ISBN already exists');
    }

    return this.prisma.book.create({
      data: {
        title: createBookDto.title,
        author: createBookDto.author,
        isbn: createBookDto.isbn,
        description: createBookDto.description,
        publishedAt: createBookDto.publishedAt
          ? new Date(createBookDto.publishedAt)
          : null,
      },
    });
  }

  async findAll(queryDto: QueryBookDto): Promise<PaginatedResponse<BookWithFeedbackEntity>> {
    const { title, author, isbn, page = 1, limit = 10 } = queryDto;

    const pageNum = typeof page === 'string' ? parseInt(page, 10) : page;
    const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : limit;

    const where: Prisma.BookWhereInput = {};
    if (title) where.title = { contains: title };
    if (author) where.author = { contains: author };
    if (isbn) where.isbn = { contains: isbn };

    const [books, total] = await Promise.all([
      this.prisma.book.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          feedbacks: {
            where: { isApproved: true },
            select: { id: true, rating: true },
          },
        },
      }),
      this.prisma.book.count({ where }),
    ]);

    return {
      data: books,
      pagination: buildPaginationMeta(pageNum, limitNum, total),
    };
  }

  async findOne(id: string): Promise<BookEntity> {
    const book = await this.prisma.book.findUnique({ where: { id } });

    if (!book) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }

    return book;
  }

  async update(id: string, updateBookDto: UpdateBookDto): Promise<BookEntity> {
    const existingBook = await this.prisma.book.findUnique({ where: { id } });

    if (!existingBook) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }

    if (updateBookDto.isbn && updateBookDto.isbn !== existingBook.isbn) {
      const isbnExists = await this.prisma.book.findUnique({
        where: { isbn: updateBookDto.isbn },
      });

      if (isbnExists) {
        throw new ConflictException('Book with this ISBN already exists');
      }
    }

    return this.prisma.book.update({
      where: { id },
      data: {
        ...updateBookDto,
        publishedAt: updateBookDto.publishedAt
          ? new Date(updateBookDto.publishedAt)
          : undefined,
      },
    });
  }

  async remove(id: string): Promise<MessageResponse> {
    const existingBook = await this.prisma.book.findUnique({ where: { id } });

    if (!existingBook) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }

    await this.prisma.book.delete({ where: { id } });

    return { message: 'Book deleted successfully' };
  }
}

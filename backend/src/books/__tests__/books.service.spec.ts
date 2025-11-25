import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { BooksService } from '../books.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateBookDto } from '../dto/create-book.dto';
import { UpdateBookDto } from '../dto/update-book.dto';
import { QueryBookDto } from '../dto/query-book.dto';

describe('BooksService (Unit)', () => {
  let service: BooksService;
  let prismaService: PrismaService;

  const mockBook = {
    id: 'book-123',
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    isbn: '978-0-7432-7356-5',
    description: 'A classic American novel',
    publishedAt: new Date('1925-04-10'),
    createdAt: new Date('2025-09-28T19:42:56.559Z'),
    updatedAt: new Date('2025-09-28T19:42:56.559Z'),
  };

  const mockCreateBookDto: CreateBookDto = {
    title: 'To Kill a Mockingbird',
    author: 'Harper Lee',
    isbn: '978-0-06-112008-4',
    description: 'A gripping tale of racial injustice',
    publishedAt: '1960-07-11',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BooksService,
        {
          provide: PrismaService,
          useValue: {
            book: {
              findUnique: jest.fn(),
              create: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<BooksService>(BooksService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new book successfully', async () => {
      const createdBook = { ...mockBook, ...mockCreateBookDto };
      (prismaService.book.findUnique as jest.Mock).mockResolvedValue(null);
      (prismaService.book.create as jest.Mock).mockResolvedValue(createdBook);

      const result = await service.create(mockCreateBookDto);

      expect(prismaService.book.findUnique).toHaveBeenCalledWith({
        where: { isbn: mockCreateBookDto.isbn },
      });
      expect(prismaService.book.create).toHaveBeenCalledWith({
        data: {
          title: mockCreateBookDto.title,
          author: mockCreateBookDto.author,
          isbn: mockCreateBookDto.isbn,
          description: mockCreateBookDto.description,
          publishedAt: new Date(mockCreateBookDto.publishedAt!),
        },
      });
      expect(result).toEqual(createdBook);
    });

    it('should throw ConflictException if book with ISBN already exists', async () => {
      (prismaService.book.findUnique as jest.Mock).mockResolvedValue(mockBook);

      await expect(service.create(mockCreateBookDto)).rejects.toThrow(
        ConflictException
      );
      await expect(service.create(mockCreateBookDto)).rejects.toThrow(
        'Book with this ISBN already exists'
      );

      expect(prismaService.book.findUnique).toHaveBeenCalledWith({
        where: { isbn: mockCreateBookDto.isbn },
      });
      expect(prismaService.book.create).not.toHaveBeenCalled();
    });

    it('should handle optional fields correctly', async () => {
      const bookWithoutOptionalFields: CreateBookDto = {
        title: 'Simple Book',
        author: 'Simple Author',
        isbn: '978-0-123456-78-9',
      };
      const createdBook = {
        ...mockBook,
        ...bookWithoutOptionalFields,
        description: null,
        publishedAt: null,
      };

      (prismaService.book.findUnique as jest.Mock).mockResolvedValue(null);
      (prismaService.book.create as jest.Mock).mockResolvedValue(createdBook);

      const result = await service.create(bookWithoutOptionalFields);

      expect(prismaService.book.create).toHaveBeenCalledWith({
        data: {
          title: bookWithoutOptionalFields.title,
          author: bookWithoutOptionalFields.author,
          isbn: bookWithoutOptionalFields.isbn,
          description: bookWithoutOptionalFields.description,
          publishedAt: null,
        },
      });
      expect(result).toEqual(createdBook);
    });
  });

  describe('findAll', () => {
    const mockQueryDto: QueryBookDto = {
      page: 1,
      limit: 10,
      title: 'Gatsby',
      author: 'Fitzgerald',
    };

    it('should return paginated books with filtering', async () => {
      const mockBooks = [mockBook];
      const totalCount = 1;

      (prismaService.book.findMany as jest.Mock).mockResolvedValue(mockBooks);
      (prismaService.book.count as jest.Mock).mockResolvedValue(totalCount);

      const result = await service.findAll(mockQueryDto);

      expect(prismaService.book.findMany).toHaveBeenCalledWith({
        where: {
          title: { contains: mockQueryDto.title },
          author: { contains: mockQueryDto.author },
        },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          feedbacks: {
            where: { isApproved: true },
            select: { id: true, rating: true },
          },
        },
      });
      expect(prismaService.book.count).toHaveBeenCalledWith({
        where: {
          title: { contains: mockQueryDto.title },
          author: { contains: mockQueryDto.author },
        },
      });
      expect(result).toEqual({
        data: mockBooks,
        pagination: {
          page: 1,
          limit: 10,
          total: totalCount,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      });
    });

    it('should handle string parameters correctly', async () => {
      const queryWithStringParams: QueryBookDto = {
        page: '2' as any,
        limit: '5' as any,
      };
      const mockBooks = [];
      const totalCount = 0;

      (prismaService.book.findMany as jest.Mock).mockResolvedValue(mockBooks);
      (prismaService.book.count as jest.Mock).mockResolvedValue(totalCount);

      const result = await service.findAll(queryWithStringParams);

      expect(prismaService.book.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 5,
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          feedbacks: {
            where: { isApproved: true },
            select: { id: true, rating: true },
          },
        },
      });
      expect(result.pagination).toEqual({
        page: 2,
        limit: 5,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: true,
      });
    });

    it('should use default pagination values', async () => {
      const queryWithDefaults: QueryBookDto = {};
      const mockBooks = [];
      const totalCount = 0;

      (prismaService.book.findMany as jest.Mock).mockResolvedValue(mockBooks);
      (prismaService.book.count as jest.Mock).mockResolvedValue(totalCount);

      const result = await service.findAll(queryWithDefaults);

      expect(prismaService.book.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          feedbacks: {
            where: { isApproved: true },
            select: { id: true, rating: true },
          },
        },
      });
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
    });
  });

  describe('findOne', () => {
    it('should return a book by ID', async () => {
      const bookId = 'book-123';
      (prismaService.book.findUnique as jest.Mock).mockResolvedValue(mockBook);

      const result = await service.findOne(bookId);

      expect(prismaService.book.findUnique).toHaveBeenCalledWith({
        where: { id: bookId },
      });
      expect(result).toEqual(mockBook);
    });

    it('should throw NotFoundException if book not found', async () => {
      const bookId = 'non-existent-id';
      (prismaService.book.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne(bookId)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(bookId)).rejects.toThrow(
        `Book with ID ${bookId} not found`
      );
    });
  });

  describe('update', () => {
    const updateDto: UpdateBookDto = {
      title: 'Updated Title',
      description: 'Updated description',
    };

    it('should update a book successfully', async () => {
      const bookId = 'book-123';
      const updatedBook = { ...mockBook, ...updateDto };

      (prismaService.book.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockBook) // First call for existence check
        .mockResolvedValueOnce(null); // Second call for ISBN conflict check
      (prismaService.book.update as jest.Mock).mockResolvedValue(updatedBook);

      const result = await service.update(bookId, updateDto);

      expect(prismaService.book.findUnique).toHaveBeenCalledWith({
        where: { id: bookId },
      });
      expect(prismaService.book.update).toHaveBeenCalledWith({
        where: { id: bookId },
        data: updateDto,
      });
      expect(result).toEqual(updatedBook);
    });

    it('should throw NotFoundException if book not found', async () => {
      const bookId = 'non-existent-id';
      (prismaService.book.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.update(bookId, updateDto)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.update(bookId, updateDto)).rejects.toThrow(
        `Book with ID ${bookId} not found`
      );
    });

    it('should check ISBN conflict when ISBN is being updated', async () => {
      const bookId = 'book-123';
      const updateWithISBN: UpdateBookDto = {
        isbn: '978-0-123456-78-9',
      };
      const conflictingBook = { ...mockBook, isbn: updateWithISBN.isbn };

      (prismaService.book.findUnique as jest.Mock).mockImplementation(
        ({ where }) => {
          if (where.id === bookId) {
            return Promise.resolve(mockBook);
          } else if (where.isbn === updateWithISBN.isbn) {
            return Promise.resolve(conflictingBook);
          }
          return Promise.resolve(null);
        }
      );

      await expect(service.update(bookId, updateWithISBN)).rejects.toThrow(
        ConflictException
      );
      await expect(service.update(bookId, updateWithISBN)).rejects.toThrow(
        'Book with this ISBN already exists'
      );
    });

    it('should handle publishedAt date conversion', async () => {
      const bookId = 'book-123';
      const updateWithDate: UpdateBookDto = {
        publishedAt: '1960-07-11',
      };
      const updatedBook = { ...mockBook, ...updateWithDate };

      (prismaService.book.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockBook)
        .mockResolvedValueOnce(null);
      (prismaService.book.update as jest.Mock).mockResolvedValue(updatedBook);

      await service.update(bookId, updateWithDate);

      expect(prismaService.book.update).toHaveBeenCalledWith({
        where: { id: bookId },
        data: {
          ...updateWithDate,
          publishedAt: new Date(updateWithDate.publishedAt!),
        },
      });
    });
  });

  describe('remove', () => {
    it('should delete a book successfully', async () => {
      const bookId = 'book-123';
      (prismaService.book.findUnique as jest.Mock).mockResolvedValue(mockBook);
      (prismaService.book.delete as jest.Mock).mockResolvedValue(mockBook);

      const result = await service.remove(bookId);

      expect(prismaService.book.findUnique).toHaveBeenCalledWith({
        where: { id: bookId },
      });
      expect(prismaService.book.delete).toHaveBeenCalledWith({
        where: { id: bookId },
      });
      expect(result).toEqual({ message: 'Book deleted successfully' });
    });

    it('should throw NotFoundException if book not found', async () => {
      const bookId = 'non-existent-id';
      (prismaService.book.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.remove(bookId)).rejects.toThrow(NotFoundException);
      await expect(service.remove(bookId)).rejects.toThrow(
        `Book with ID ${bookId} not found`
      );
    });
  });
});

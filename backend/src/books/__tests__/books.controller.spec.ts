import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { BooksController } from '../books.controller';
import { BooksService } from '../books.service';
import { CreateBookDto } from '../dto/create-book.dto';
import { UpdateBookDto } from '../dto/update-book.dto';
import { QueryBookDto } from '../dto/query-book.dto';

describe('BooksController (Unit)', () => {
  let controller: BooksController;
  let booksService: BooksService;

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

  const mockPaginatedResponse = {
    data: [mockBook],
    pagination: {
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BooksController],
      providers: [
        {
          provide: BooksService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<BooksController>(BooksController);
    booksService = module.get<BooksService>(BooksService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createBookDto: CreateBookDto = {
      title: 'To Kill a Mockingbird',
      author: 'Harper Lee',
      isbn: '978-0-06-112008-4',
      description: 'A gripping tale of racial injustice',
      publishedAt: '1960-07-11',
    };

    it('should create a new book', async () => {
      const createdBook = { ...mockBook, ...createBookDto };
      (booksService.create as jest.Mock).mockResolvedValue(createdBook);

      const result = await controller.create(createBookDto);

      expect(booksService.create).toHaveBeenCalledWith(createBookDto);
      expect(result).toEqual(createdBook);
    });

    it('should handle service exceptions', async () => {
      (booksService.create as jest.Mock).mockRejectedValue(
        new ConflictException('Book with this ISBN already exists')
      );

      await expect(controller.create(createBookDto)).rejects.toThrow(
        ConflictException
      );
      await expect(controller.create(createBookDto)).rejects.toThrow(
        'Book with this ISBN already exists'
      );
    });
  });

  describe('findAll', () => {
    const queryDto: QueryBookDto = {
      page: 1,
      limit: 10,
      title: 'Gatsby',
      author: 'Fitzgerald',
    };

    it('should return paginated books with query parameters', async () => {
      (booksService.findAll as jest.Mock).mockResolvedValue(
        mockPaginatedResponse
      );

      const result = await controller.findAll(queryDto);

      expect(booksService.findAll).toHaveBeenCalledWith(queryDto);
      expect(result).toEqual(mockPaginatedResponse);
    });

    it('should handle empty query parameters', async () => {
      const emptyQuery: QueryBookDto = {};
      (booksService.findAll as jest.Mock).mockResolvedValue(
        mockPaginatedResponse
      );

      const result = await controller.findAll(emptyQuery);

      expect(booksService.findAll).toHaveBeenCalledWith(emptyQuery);
      expect(result).toEqual(mockPaginatedResponse);
    });

    it('should handle string query parameters', async () => {
      const stringQuery: QueryBookDto = {
        page: '2' as any,
        limit: '5' as any,
        title: 'Mockingbird',
      };
      (booksService.findAll as jest.Mock).mockResolvedValue(
        mockPaginatedResponse
      );

      const result = await controller.findAll(stringQuery);

      expect(booksService.findAll).toHaveBeenCalledWith(stringQuery);
      expect(result).toEqual(mockPaginatedResponse);
    });
  });

  describe('findOne', () => {
    const bookId = 'book-123';

    it('should return a book by ID', async () => {
      (booksService.findOne as jest.Mock).mockResolvedValue(mockBook);

      const result = await controller.findOne(bookId);

      expect(booksService.findOne).toHaveBeenCalledWith(bookId);
      expect(result).toEqual(mockBook);
    });

    it('should handle NotFoundException', async () => {
      (booksService.findOne as jest.Mock).mockRejectedValue(
        new NotFoundException(`Book with ID ${bookId} not found`)
      );

      await expect(controller.findOne(bookId)).rejects.toThrow(
        NotFoundException
      );
      await expect(controller.findOne(bookId)).rejects.toThrow(
        `Book with ID ${bookId} not found`
      );
    });
  });

  describe('update', () => {
    const bookId = 'book-123';
    const updateBookDto: UpdateBookDto = {
      title: 'Updated Title',
      description: 'Updated description',
    };

    it('should update a book successfully', async () => {
      const updatedBook = { ...mockBook, ...updateBookDto };
      (booksService.update as jest.Mock).mockResolvedValue(updatedBook);

      const result = await controller.update(bookId, updateBookDto);

      expect(booksService.update).toHaveBeenCalledWith(bookId, updateBookDto);
      expect(result).toEqual(updatedBook);
    });

    it('should handle NotFoundException', async () => {
      (booksService.update as jest.Mock).mockRejectedValue(
        new NotFoundException(`Book with ID ${bookId} not found`)
      );

      await expect(controller.update(bookId, updateBookDto)).rejects.toThrow(
        NotFoundException
      );
      await expect(controller.update(bookId, updateBookDto)).rejects.toThrow(
        `Book with ID ${bookId} not found`
      );
    });

    it('should handle ConflictException for ISBN conflicts', async () => {
      (booksService.update as jest.Mock).mockRejectedValue(
        new ConflictException('Book with this ISBN already exists')
      );

      await expect(controller.update(bookId, updateBookDto)).rejects.toThrow(
        ConflictException
      );
      await expect(controller.update(bookId, updateBookDto)).rejects.toThrow(
        'Book with this ISBN already exists'
      );
    });

    it('should handle partial updates', async () => {
      const partialUpdate: UpdateBookDto = {
        title: 'Only Title Updated',
      };
      const updatedBook = { ...mockBook, title: partialUpdate.title };
      (booksService.update as jest.Mock).mockResolvedValue(updatedBook);

      const result = await controller.update(bookId, partialUpdate);

      expect(booksService.update).toHaveBeenCalledWith(bookId, partialUpdate);
      expect(result).toEqual(updatedBook);
    });
  });

  describe('remove', () => {
    const bookId = 'book-123';

    it('should delete a book successfully', async () => {
      const deleteResult = { message: 'Book deleted successfully' };
      (booksService.remove as jest.Mock).mockResolvedValue(deleteResult);

      const result = await controller.remove(bookId);

      expect(booksService.remove).toHaveBeenCalledWith(bookId);
      expect(result).toEqual(deleteResult);
    });

    it('should handle NotFoundException', async () => {
      (booksService.remove as jest.Mock).mockRejectedValue(
        new NotFoundException(`Book with ID ${bookId} not found`)
      );

      await expect(controller.remove(bookId)).rejects.toThrow(
        NotFoundException
      );
      await expect(controller.remove(bookId)).rejects.toThrow(
        `Book with ID ${bookId} not found`
      );
    });
  });
});

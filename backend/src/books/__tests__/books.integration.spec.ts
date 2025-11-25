import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { BooksService } from '../books.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateBookDto } from '../dto/create-book.dto';
import { UpdateBookDto } from '../dto/update-book.dto';
import { QueryBookDto } from '../dto/query-book.dto';

describe('BooksService Integration', () => {
  let service: BooksService;
  let prismaService: PrismaService;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      providers: [BooksService, PrismaService],
    }).compile();

    service = module.get<BooksService>(BooksService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    // Clean up test data before each test
    await prismaService.book.deleteMany({
      where: {
        isbn: {
          in: [
            '978-0-06-112008-4',
            '978-0-123456-78-9',
            '978-0-987654-32-1',
            '978-0-555555-55-5',
            '978-0-777777-77-7',
            '978-0-111111-11-1',
            '978-0-222222-22-2',
            '978-0-666666-66-6',
          ],
        },
      },
    });
  });

  describe('create integration', () => {
    const createBookDto: CreateBookDto = {
      title: 'To Kill a Mockingbird',
      author: 'Harper Lee',
      isbn: '978-0-06-112008-4',
      description:
        'A gripping tale of racial injustice and childhood innocence',
      publishedAt: '1960-07-11',
    };

    it('should create book with real database and return correct data', async () => {
      const book = await service.create(createBookDto);

      expect(book).toHaveProperty('id');
      expect(book).toHaveProperty('title', createBookDto.title);
      expect(book).toHaveProperty('author', createBookDto.author);
      expect(book).toHaveProperty('isbn', createBookDto.isbn);
      expect(book).toHaveProperty('description', createBookDto.description);
      expect(book).toHaveProperty('publishedAt');
      expect(book).toHaveProperty('createdAt');
      expect(book).toHaveProperty('updatedAt');

      // Verify in database
      const dbBook = await prismaService.book.findUnique({
        where: { isbn: createBookDto.isbn },
      });
      expect(dbBook).toBeDefined();
      expect(dbBook?.title).toBe(createBookDto.title);
      expect(dbBook?.author).toBe(createBookDto.author);
    });

    it('should throw ConflictException when creating duplicate ISBN', async () => {
      await service.create(createBookDto);

      await expect(service.create(createBookDto)).rejects.toThrow(
        ConflictException
      );
      await expect(service.create(createBookDto)).rejects.toThrow(
        'Book with this ISBN already exists'
      );
    });

    it('should handle optional fields correctly in database', async () => {
      const bookWithoutOptionalFields: CreateBookDto = {
        title: 'Simple Book',
        author: 'Simple Author',
        isbn: `978-0-123456-78-${Date.now()}`,
      };

      const book = await service.create(bookWithoutOptionalFields);

      expect(book.description).toBeNull();
      expect(book.publishedAt).toBeNull();

      // Verify in database
      const dbBook = await prismaService.book.findUnique({
        where: { isbn: bookWithoutOptionalFields.isbn },
      });
      expect(dbBook?.description).toBeNull();
      expect(dbBook?.publishedAt).toBeNull();
    });

    it('should handle date conversion correctly', async () => {
      const book = await service.create(createBookDto);

      expect(book.publishedAt).toBeInstanceOf(Date);
      expect(book.publishedAt?.toISOString()).toBe('1960-07-11T00:00:00.000Z');
    });
  });

  describe('findAll integration', () => {
    beforeEach(async () => {
      // Create test books for pagination and filtering tests
      await service.create({
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        isbn: '978-0-123456-78-9',
        description: 'A classic American novel',
      });

      await service.create({
        title: 'To Kill a Mockingbird',
        author: 'Harper Lee',
        isbn: '978-0-987654-32-1',
        description: 'A gripping tale',
      });
    });

    it('should return all books with pagination', async () => {
      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('pagination');
      expect(result.data).toBeInstanceOf(Array);
      expect(result.data.length).toBeGreaterThanOrEqual(2);
      expect(result.pagination).toHaveProperty('page', 1);
      expect(result.pagination).toHaveProperty('limit', 10);
      expect(result.pagination).toHaveProperty('total');
      expect(result.pagination).toHaveProperty('totalPages');
      expect(result.pagination).toHaveProperty('hasNextPage');
      expect(result.pagination).toHaveProperty('hasPreviousPage');
    });

    it('should filter books by title', async () => {
      const result = await service.findAll({ title: 'Mockingbird' });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].title).toContain('Mockingbird');
      expect(result.pagination.total).toBe(1);
    });

    it('should filter books by author', async () => {
      const result = await service.findAll({ author: 'Harper' });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].author).toContain('Harper');
      expect(result.pagination.total).toBe(1);
    });

    it('should filter books by ISBN', async () => {
      const result = await service.findAll({ isbn: '978-0-123456-78-9' });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].isbn).toContain('978-0-123456-78-9');
      expect(result.pagination.total).toBe(1);
    });

    it('should handle pagination correctly', async () => {
      const page1 = await service.findAll({ page: 1, limit: 1 });
      const page2 = await service.findAll({ page: 2, limit: 1 });

      expect(page1.data).toHaveLength(1);
      expect(page2.data).toHaveLength(1);
      expect(page1.data[0].id).not.toBe(page2.data[0].id);
      expect(page1.pagination.hasNextPage).toBe(true);
      expect(page2.pagination.hasPreviousPage).toBe(true);
    });

    it('should handle string parameters correctly', async () => {
      const result = await service.findAll({
        page: '1' as any,
        limit: '10' as any,
      });

      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
    });
  });

  describe('findOne integration', () => {
    let testBook: any;

    beforeEach(async () => {
      testBook = await service.create({
        title: 'Test Book',
        author: 'Test Author',
        isbn: '978-0-555555-55-5',
        description: 'Test description',
      });
    });

    it('should return book by ID from database', async () => {
      const book = await service.findOne(testBook.id);

      expect(book.id).toBe(testBook.id);
      expect(book.title).toBe(testBook.title);
      expect(book.author).toBe(testBook.author);
      expect(book.isbn).toBe(testBook.isbn);
    });

    it('should throw NotFoundException for non-existent ID', async () => {
      const nonExistentId = 'non-existent-id';

      await expect(service.findOne(nonExistentId)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.findOne(nonExistentId)).rejects.toThrow(
        `Book with ID ${nonExistentId} not found`
      );
    });
  });

  describe('update integration', () => {
    let testBook: any;

    beforeEach(async () => {
      testBook = await service.create({
        title: 'Original Title',
        author: 'Original Author',
        isbn: '978-0-555555-55-5',
        description: 'Original description',
      });
    });

    it('should update book in database', async () => {
      const updateDto: UpdateBookDto = {
        title: 'Updated Title',
        description: 'Updated description',
      };

      const updatedBook = await service.update(testBook.id, updateDto);

      expect(updatedBook.title).toBe(updateDto.title);
      expect(updatedBook.description).toBe(updateDto.description);
      expect(updatedBook.author).toBe(testBook.author);
      expect(updatedBook.isbn).toBe(testBook.isbn);

      // Verify in database
      const dbBook = await prismaService.book.findUnique({
        where: { id: testBook.id },
      });
      expect(dbBook?.title).toBe(updateDto.title);
      expect(dbBook?.description).toBe(updateDto.description);
    });

    it('should handle ISBN conflict when updating', async () => {
      // Create the test book first
      const testBook = await service.create({
        title: 'Test Book',
        author: 'Test Author',
        isbn: '978-0-123456-78-9',
      });

      const anotherBook = await service.create({
        title: 'Another Book',
        author: 'Another Author',
        isbn: '978-0-666666-66-6',
      });

      const updateDto: UpdateBookDto = {
        isbn: anotherBook.isbn,
      };

      await expect(service.update(testBook.id, updateDto)).rejects.toThrow(
        ConflictException
      );
      await expect(service.update(testBook.id, updateDto)).rejects.toThrow(
        'Book with this ISBN already exists'
      );
    });

    it('should handle date conversion in updates', async () => {
      const updateDto: UpdateBookDto = {
        publishedAt: '2020-01-01',
      };

      const updatedBook = await service.update(testBook.id, updateDto);

      expect(updatedBook.publishedAt).toBeInstanceOf(Date);
      expect(updatedBook.publishedAt?.toISOString()).toBe(
        '2020-01-01T00:00:00.000Z'
      );
    });

    it('should throw NotFoundException for non-existent book', async () => {
      const nonExistentId = 'non-existent-id';
      const updateDto: UpdateBookDto = { title: 'New Title' };

      await expect(service.update(nonExistentId, updateDto)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.update(nonExistentId, updateDto)).rejects.toThrow(
        `Book with ID ${nonExistentId} not found`
      );
    });
  });

  describe('remove integration', () => {
    let testBook: any;

    beforeEach(async () => {
      testBook = await service.create({
        title: 'Book to Delete',
        author: 'Author to Delete',
        isbn: '978-0-777777-77-7',
        description: 'Description to delete',
      });
    });

    it('should delete book from database', async () => {
      const result = await service.remove(testBook.id);

      expect(result).toEqual({ message: 'Book deleted successfully' });

      // Verify book is deleted from database
      const dbBook = await prismaService.book.findUnique({
        where: { id: testBook.id },
      });
      expect(dbBook).toBeNull();
    });

    it('should throw NotFoundException for non-existent book', async () => {
      const nonExistentId = 'non-existent-id';

      await expect(service.remove(nonExistentId)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.remove(nonExistentId)).rejects.toThrow(
        `Book with ID ${nonExistentId} not found`
      );
    });
  });

  describe('database transaction handling', () => {
    it('should handle concurrent operations correctly', async () => {
      const createPromises = [
        service.create({
          title: 'Concurrent Book 1',
          author: 'Author 1',
          isbn: '978-0-111111-11-1',
        }),
        service.create({
          title: 'Concurrent Book 2',
          author: 'Author 2',
          isbn: '978-0-222222-22-2',
        }),
      ];

      const results = await Promise.all(createPromises);

      expect(results).toHaveLength(2);
      expect(results[0].id).not.toBe(results[1].id);
      expect(results[0].isbn).not.toBe(results[1].isbn);

      // Verify both books exist in database
      const allBooks = await service.findAll({ limit: 100 });
      const isbnList = allBooks.data.map((book) => book.isbn);
      expect(isbnList).toContain('978-0-111111-11-1');
      expect(isbnList).toContain('978-0-222222-22-2');
    });
  });
});

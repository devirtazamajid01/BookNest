import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { FeedbackService } from '../feedback.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateFeedbackDto } from '../dto/create-feedback.dto';
import { UpdateFeedbackDto } from '../dto/update-feedback.dto';
import * as bcrypt from 'bcryptjs';

describe('FeedbackService Integration', () => {
  let service: FeedbackService;
  let prismaService: PrismaService;
  let module: TestingModule;
  let testUser: any;
  let testBook: any;
  let userRole: any;
  let adminRole: any;
  const createdUserIds: string[] = [];
  const createdBookIds: string[] = [];
  const createdFeedbackIds: string[] = [];

  beforeAll(async () => {
    module = await Test.createTestingModule({
      providers: [FeedbackService, PrismaService],
    }).compile();

    service = module.get<FeedbackService>(FeedbackService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Ensure roles are seeded for tests
    userRole = await prismaService.role.upsert({
      where: { id: 'user' },
      update: {},
      create: { id: 'user', name: 'USER', description: 'Regular user' },
    });
    adminRole = await prismaService.role.upsert({
      where: { id: 'admin' },
      update: {},
      create: { id: 'admin', name: 'ADMIN', description: 'Administrator' },
    });
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    // Clean up ALL test data to ensure clean state
    await prismaService.feedback.deleteMany({});
    await prismaService.book.deleteMany({});
    await prismaService.user.deleteMany({
      where: {
        email: {
          contains: '@example.com',
        },
      },
    });

    // Clear tracking arrays
    createdFeedbackIds.length = 0;
    createdUserIds.length = 0;
    createdBookIds.length = 0;

    // Create test user with proper role reference
    testUser = await prismaService.user.create({
      data: {
        email: 'testuser@example.com',
        password: await bcrypt.hash('password123', 10),
        name: 'Test User',
        roleId: userRole.id, // Use the actual role ID from beforeAll
      },
    });
    createdUserIds.push(testUser.id);

    // Create test book with unique ISBN
    testBook = await prismaService.book.create({
      data: {
        title: 'Test Book',
        author: 'Test Author',
        isbn: `978-0-123456-78-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        description: 'A test book for integration testing',
      },
    });
    createdBookIds.push(testBook.id);
  });

  describe('create integration', () => {
    it('should create feedback with real database', async () => {
      const createFeedbackDto: CreateFeedbackDto = {
        rating: 5,
        comment: 'This book is absolutely amazing! Great plot and characters.',
        bookId: testBook.id,
      };

      const feedback = await service.create(testUser.id, createFeedbackDto);

      expect(feedback).toHaveProperty('id');
      expect(feedback.rating).toBe(createFeedbackDto.rating);
      expect(feedback.comment).toBe(createFeedbackDto.comment);
      expect(feedback.userId).toBe(testUser.id);
      expect(feedback.bookId).toBe(testBook.id);
      expect(feedback.isApproved).toBe(false);
      expect(feedback.user).toBeDefined();
      expect(feedback.book).toBeDefined();

      // Verify in database
      const dbFeedback = await prismaService.feedback.findUnique({
        where: { id: feedback.id },
        include: { user: true, book: true },
      });
      expect(dbFeedback).toBeDefined();
      expect(dbFeedback?.rating).toBe(createFeedbackDto.rating);
    });

    it('should throw NotFoundException if book not found', async () => {
      const createFeedbackDto: CreateFeedbackDto = {
        rating: 5,
        comment: 'This book is absolutely amazing! Great plot and characters.',
        bookId: 'non-existent-book-id',
      };

      await expect(
        service.create(testUser.id, createFeedbackDto)
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.create(testUser.id, createFeedbackDto)
      ).rejects.toThrow('Book with ID non-existent-book-id not found');
    });

    it('should throw ConflictException when creating duplicate feedback', async () => {
      const createFeedbackDto: CreateFeedbackDto = {
        rating: 5,
        comment: 'This book is absolutely amazing! Great plot and characters.',
        bookId: testBook.id,
      };

      // Create first feedback
      await service.create(testUser.id, createFeedbackDto);

      // Try to create second feedback for same book
      await expect(
        service.create(testUser.id, createFeedbackDto)
      ).rejects.toThrow(ConflictException);
      await expect(
        service.create(testUser.id, createFeedbackDto)
      ).rejects.toThrow('You have already provided feedback for this book');
    });

    it('should handle database constraints correctly', async () => {
      const createFeedbackDto: CreateFeedbackDto = {
        rating: 5,
        comment: 'This book is absolutely amazing! Great plot and characters.',
        bookId: testBook.id,
      };

      const feedback = await service.create(testUser.id, createFeedbackDto);

      // Verify unique constraint is enforced
      const duplicateFeedback = await prismaService.feedback.findUnique({
        where: {
          userId_bookId: {
            userId: testUser.id,
            bookId: testBook.id,
          },
        },
      });
      expect(duplicateFeedback?.id).toBe(feedback.id);
    });
  });

  describe('findAll integration', () => {
    beforeEach(async () => {
      // Create additional test data to avoid unique constraint violations
      const testUser2 = await prismaService.user.create({
        data: {
          name: 'Test User 2',
          email: `testuser2-${Date.now()}@example.com`,
          password: 'password123',
          roleId: userRole.id,
        },
      });
      createdUserIds.push(testUser2.id);

      const testBook2 = await prismaService.book.create({
        data: {
          title: 'Test Book 2',
          author: 'Test Author 2',
          isbn: `978-0-123456-78-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          description: 'A second test book',
          publishedAt: new Date('2020-01-01'),
        },
      });
      createdBookIds.push(testBook2.id);

      // Create multiple feedback entries for testing
      const feedbackData = [
        {
          rating: 5,
          comment: 'Excellent book!',
          userId: testUser.id,
          bookId: testBook.id,
          isApproved: true,
        },
        {
          rating: 4,
          comment: 'Very good book.',
          userId: testUser2.id,
          bookId: testBook2.id,
          isApproved: false,
        },
      ];

      for (const data of feedbackData) {
        const created = await prismaService.feedback.create({
          data,
          include: { user: true, book: true },
        });
        createdFeedbackIds.push(created.id);
      }
    });

    it('should return all feedback with pagination', async () => {
      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('pagination');
      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.page).toBe(1);
    });

    it('should filter feedback by bookId', async () => {
      const result = await service.findAll({ bookId: testBook.id });

      expect(result.data).toHaveLength(1);
      expect(result.data.every((f) => f.bookId === testBook.id)).toBe(true);
    });

    it('should filter feedback by userId', async () => {
      const result = await service.findAll({ userId: testUser.id });

      expect(result.data).toHaveLength(1);
      expect(result.data.every((f) => f.userId === testUser.id)).toBe(true);
    });

    it('should filter feedback by approval status', async () => {
      const result = await service.findAll({ isApproved: true });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].isApproved).toBe(true);
    });

    it('should filter feedback by minimum rating', async () => {
      const result = await service.findAll({ minRating: 5 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].rating).toBe(5);
    });

    it('should apply pagination correctly', async () => {
      const result = await service.findAll({ page: 1, limit: 1 });

      expect(result.data).toHaveLength(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(1);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.hasNextPage).toBe(true);
    });
  });

  describe('findOne integration', () => {
    let createdFeedback: any;

    beforeEach(async () => {
      createdFeedback = await prismaService.feedback.create({
        data: {
          rating: 4,
          comment: 'Good book for testing.',
          userId: testUser.id,
          bookId: testBook.id,
          isApproved: false,
        },
        include: { user: true, book: true },
      });
      createdFeedbackIds.push(createdFeedback.id);
    });

    it('should return feedback by ID', async () => {
      const feedback = await service.findOne(createdFeedback.id);

      expect(feedback.id).toBe(createdFeedback.id);
      expect(feedback.rating).toBe(4);
      expect(feedback.user).toBeDefined();
      expect(feedback.book).toBeDefined();
    });

    it('should throw NotFoundException for non-existent ID', async () => {
      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException
      );
      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        'Feedback with ID non-existent-id not found'
      );
    });
  });

  describe('update integration', () => {
    let createdFeedback: any;

    beforeEach(async () => {
      createdFeedback = await prismaService.feedback.create({
        data: {
          rating: 3,
          comment: 'Initial comment.',
          userId: testUser.id,
          bookId: testBook.id,
          isApproved: false,
        },
        include: { user: true, book: true },
      });
    });

    it('should update feedback by owner', async () => {
      const updateDto: UpdateFeedbackDto = {
        rating: 5,
        comment: 'Updated comment - this book is great!',
      };

      const updatedFeedback = await service.update(
        createdFeedback.id,
        updateDto,
        testUser.id,
        'USER'
      );

      expect(updatedFeedback.rating).toBe(5);
      expect(updatedFeedback.comment).toBe(updateDto.comment);
      expect(updatedFeedback.isApproved).toBe(false); // Reset when user updates

      // Verify in database
      const dbFeedback = await prismaService.feedback.findUnique({
        where: { id: createdFeedback.id },
      });
      expect(dbFeedback?.rating).toBe(5);
      expect(dbFeedback?.comment).toBe(updateDto.comment);
    });

    it('should update feedback with approval by admin', async () => {
      const updateDto: UpdateFeedbackDto = {
        rating: 5,
        isApproved: true,
      };

      const updatedFeedback = await service.update(
        createdFeedback.id,
        updateDto,
        'admin-user-id',
        'ADMIN'
      );

      expect(updatedFeedback.rating).toBe(5);
      expect(updatedFeedback.isApproved).toBe(true);
    });

    it('should throw NotFoundException for non-existent feedback', async () => {
      const updateDto: UpdateFeedbackDto = { rating: 5 };

      await expect(
        service.update('non-existent-id', updateDto, testUser.id, 'USER')
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when non-owner tries to update', async () => {
      const otherUser = await prismaService.user.create({
        data: {
          email: 'testuser2@example.com',
          password: await bcrypt.hash('password123', 10),
          name: 'Other User',
          roleId: userRole.id,
        },
      });
      createdUserIds.push(otherUser.id);

      const updateDto: UpdateFeedbackDto = { rating: 5 };

      await expect(
        service.update(createdFeedback.id, updateDto, otherUser.id, 'USER')
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.update(createdFeedback.id, updateDto, otherUser.id, 'USER')
      ).rejects.toThrow('You can only update your own feedback');
    });

    it('should throw ForbiddenException when user tries to update approved feedback', async () => {
      // First approve the feedback
      await prismaService.feedback.update({
        where: { id: createdFeedback.id },
        data: { isApproved: true },
      });

      const updateDto: UpdateFeedbackDto = { rating: 5 };

      await expect(
        service.update(createdFeedback.id, updateDto, testUser.id, 'USER')
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.update(createdFeedback.id, updateDto, testUser.id, 'USER')
      ).rejects.toThrow('Cannot update approved feedback');
    });
  });

  describe('remove integration', () => {
    let createdFeedback: any;

    beforeEach(async () => {
      createdFeedback = await prismaService.feedback.create({
        data: {
          rating: 3,
          comment: 'Book to be deleted.',
          userId: testUser.id,
          bookId: testBook.id,
          isApproved: false,
        },
        include: { user: true, book: true },
      });
    });

    it('should delete feedback by owner', async () => {
      const result = await service.remove(
        createdFeedback.id,
        testUser.id,
        'USER'
      );

      expect(result.message).toBe('Feedback deleted successfully');

      // Verify deletion in database
      const dbFeedback = await prismaService.feedback.findUnique({
        where: { id: createdFeedback.id },
      });
      expect(dbFeedback).toBeNull();
    });

    it('should throw NotFoundException for non-existent feedback', async () => {
      await expect(
        service.remove('non-existent-id', testUser.id, 'USER')
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when non-owner tries to delete', async () => {
      const otherUser = await prismaService.user.create({
        data: {
          email: 'testuser2@example.com',
          password: await bcrypt.hash('password123', 10),
          name: 'Other User',
          roleId: userRole.id,
        },
      });

      await expect(
        service.remove(createdFeedback.id, otherUser.id, 'USER')
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.remove(createdFeedback.id, otherUser.id, 'USER')
      ).rejects.toThrow('You can only delete your own feedback');
    });
  });

  describe('approveFeedback integration', () => {
    let createdFeedback: any;

    beforeEach(async () => {
      createdFeedback = await prismaService.feedback.create({
        data: {
          rating: 4,
          comment: 'Good book.',
          userId: testUser.id,
          bookId: testBook.id,
          isApproved: false,
        },
        include: { user: true, book: true },
      });
      createdFeedbackIds.push(createdFeedback.id);
    });

    it('should approve feedback successfully', async () => {
      const approvedFeedback = await service.approveFeedback(
        createdFeedback.id
      );

      expect(approvedFeedback.isApproved).toBe(true);

      // Verify in database
      const dbFeedback = await prismaService.feedback.findUnique({
        where: { id: createdFeedback.id },
      });
      expect(dbFeedback?.isApproved).toBe(true);
    });

    it('should throw NotFoundException for non-existent feedback', async () => {
      await expect(service.approveFeedback('non-existent-id')).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw BadRequestException if already approved', async () => {
      // First approve the feedback
      await prismaService.feedback.update({
        where: { id: createdFeedback.id },
        data: { isApproved: true },
      });

      await expect(service.approveFeedback(createdFeedback.id)).rejects.toThrow(
        BadRequestException
      );
      await expect(service.approveFeedback(createdFeedback.id)).rejects.toThrow(
        'Feedback is already approved'
      );
    });
  });

  describe('rejectFeedback integration', () => {
    let createdFeedback: any;

    beforeEach(async () => {
      createdFeedback = await prismaService.feedback.create({
        data: {
          rating: 4,
          comment: 'Good book.',
          userId: testUser.id,
          bookId: testBook.id,
          isApproved: true,
        },
        include: { user: true, book: true },
      });
      createdFeedbackIds.push(createdFeedback.id);
    });

    it('should reject feedback successfully', async () => {
      const rejectedFeedback = await service.rejectFeedback(createdFeedback.id);

      expect(rejectedFeedback.isApproved).toBe(false);

      // Verify in database
      const dbFeedback = await prismaService.feedback.findUnique({
        where: { id: createdFeedback.id },
      });
      expect(dbFeedback?.isApproved).toBe(false);
    });

    it('should throw NotFoundException for non-existent feedback', async () => {
      await expect(service.rejectFeedback('non-existent-id')).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw BadRequestException if already rejected', async () => {
      // First reject the feedback
      await prismaService.feedback.update({
        where: { id: createdFeedback.id },
        data: { isApproved: false },
      });

      await expect(service.rejectFeedback(createdFeedback.id)).rejects.toThrow(
        BadRequestException
      );
      await expect(service.rejectFeedback(createdFeedback.id)).rejects.toThrow(
        'Feedback is already rejected'
      );
    });
  });

  describe('getBookFeedback integration', () => {
    beforeEach(async () => {
      // Create additional test data to avoid unique constraint violations
      const testUser3 = await prismaService.user.create({
        data: {
          name: 'Test User 3',
          email: `testuser3-${Date.now()}@example.com`,
          password: 'password123',
          roleId: userRole.id,
        },
      });
      createdUserIds.push(testUser3.id);

      const testBook3 = await prismaService.book.create({
        data: {
          title: 'Test Book 3',
          author: 'Test Author 3',
          isbn: `978-0-123456-79-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          description: 'A third test book',
          publishedAt: new Date('2020-01-01'),
        },
      });
      createdBookIds.push(testBook3.id);

      // Create approved and unapproved feedback
      const f1 = await prismaService.feedback.create({
        data: {
          rating: 5,
          comment: 'Approved feedback.',
          userId: testUser.id,
          bookId: testBook.id,
          isApproved: true,
        },
        include: { user: true, book: true },
      });
      createdFeedbackIds.push(f1.id);

      const f2 = await prismaService.feedback.create({
        data: {
          rating: 3,
          comment: 'Unapproved feedback.',
          userId: testUser3.id,
          bookId: testBook3.id,
          isApproved: false,
        },
        include: { user: true, book: true },
      });
      createdFeedbackIds.push(f2.id);
    });

    it('should return only approved feedback for book', async () => {
      const result = await service.getBookFeedback(testBook.id, {});

      expect(result.data).toHaveLength(1);
      expect(result.data[0].isApproved).toBe(true);
      expect(result.data[0].bookId).toBe(testBook.id);
    });

    it('should throw NotFoundException for non-existent book', async () => {
      await expect(
        service.getBookFeedback('non-existent-book', {})
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUserFeedback integration', () => {
    beforeEach(async () => {
      // Create multiple feedback for the user
      await prismaService.feedback.create({
        data: {
          rating: 5,
          comment: 'First feedback.',
          userId: testUser.id,
          bookId: testBook.id,
          isApproved: true,
        },
        include: { user: true, book: true },
      });

      // Create another book for second feedback
      const secondBook = await prismaService.book.create({
        data: {
          title: 'Second Test Book',
          author: 'Second Author',
          isbn: '978-0-987654-32-1',
        },
      });
      createdBookIds.push(secondBook.id);

      const f3 = await prismaService.feedback.create({
        data: {
          rating: 4,
          comment: 'Second feedback.',
          userId: testUser.id,
          bookId: secondBook.id,
          isApproved: false,
        },
        include: { user: true, book: true },
      });
      createdFeedbackIds.push(f3.id);
    });

    afterEach(async () => {
      // Precise cleanup of created entities in this spec
      if (createdFeedbackIds.length) {
        await prismaService.feedback.deleteMany({
          where: { id: { in: createdFeedbackIds } },
        });
        createdFeedbackIds.length = 0;
      }
      if (createdUserIds.length) {
        await prismaService.user.deleteMany({
          where: { id: { in: createdUserIds } },
        });
        createdUserIds.length = 0;
      }
      if (createdBookIds.length) {
        await prismaService.book.deleteMany({
          where: { id: { in: createdBookIds } },
        });
        createdBookIds.length = 0;
      }
    });

    it('should return all feedback for user', async () => {
      const result = await service.getUserFeedback(testUser.id, {});

      expect(result.data).toHaveLength(2);
      expect(result.data.every((f) => f.userId === testUser.id)).toBe(true);
    });

    it('should throw NotFoundException for non-existent user', async () => {
      await expect(
        service.getUserFeedback('non-existent-user', {})
      ).rejects.toThrow(NotFoundException);
    });
  });
});

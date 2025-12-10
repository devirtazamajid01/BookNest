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
import { QueryFeedbackDto } from '../dto/query-feedback.dto';

describe('FeedbackService (Unit)', () => {
  let service: FeedbackService;
  let prismaService: PrismaService;

  const mockUser = {
    id: 'user-123',
    name: 'John Doe',
    email: 'john@example.com',
  };

  const mockBook = {
    id: 'book-123',
    title: 'Test Book',
    author: 'Test Author',
  };

  const mockFeedback = {
    id: 'feedback-123',
    rating: 5,
    comment: 'This book is amazing!',
    userId: 'user-123',
    bookId: 'book-123',
    isApproved: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    user: mockUser,
    book: mockBook,
  };

  const mockPrismaService = {
    feedback: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    book: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedbackService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<FeedbackService>(FeedbackService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateFeedbackDto = {
      rating: 5,
      comment: 'This book is amazing!',
      bookId: 'book-123',
    };

    it('should create feedback successfully', async () => {
      (prismaService.book.findUnique as jest.Mock).mockResolvedValue(mockBook);
      (prismaService.feedback.findUnique as jest.Mock).mockResolvedValue(null);
      (prismaService.feedback.create as jest.Mock).mockResolvedValue(
        mockFeedback
      );

      const result = await service.create('user-123', createDto);

      expect(prismaService.book.findUnique).toHaveBeenCalledWith({
        where: { id: createDto.bookId },
      });
      expect(prismaService.feedback.findUnique).toHaveBeenCalledWith({
        where: {
          userId_bookId: {
            userId: 'user-123',
            bookId: createDto.bookId,
          },
        },
      });
      expect(prismaService.feedback.create).toHaveBeenCalledWith({
        data: {
          rating: createDto.rating,
          comment: createDto.comment,
          userId: 'user-123',
          bookId: createDto.bookId,
          isApproved: false,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          book: {
            select: {
              id: true,
              title: true,
              author: true,
            },
          },
        },
      });
      expect(result).toEqual(mockFeedback);
    });

    it('should throw NotFoundException if book not found', async () => {
      (prismaService.book.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.create('user-123', createDto)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.create('user-123', createDto)).rejects.toThrow(
        `Book with ID ${createDto.bookId} not found`
      );
    });

    it('should throw ConflictException if feedback already exists', async () => {
      (prismaService.book.findUnique as jest.Mock).mockResolvedValue(mockBook);
      (prismaService.feedback.findUnique as jest.Mock).mockResolvedValue(
        mockFeedback
      );

      await expect(service.create('user-123', createDto)).rejects.toThrow(
        ConflictException
      );
      await expect(service.create('user-123', createDto)).rejects.toThrow(
        'You have already provided feedback for this book'
      );
    });
  });

  describe('findAll', () => {
    const queryDto: QueryFeedbackDto = { page: 1, limit: 10 };

    it('should return paginated feedback', async () => {
      const mockFeedbackList = [mockFeedback];
      const totalCount = 1;

      (prismaService.feedback.findMany as jest.Mock).mockResolvedValue(
        mockFeedbackList
      );
      (prismaService.feedback.count as jest.Mock).mockResolvedValue(totalCount);

      const result = await service.findAll(queryDto);

      expect(prismaService.feedback.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          book: {
            select: {
              id: true,
              title: true,
              author: true,
            },
          },
        },
      });
      expect(result.data).toEqual(mockFeedbackList);
      expect(result.pagination.total).toBe(totalCount);
    });

    it('should filter feedback by bookId', async () => {
      const queryWithBookId: QueryFeedbackDto = { bookId: 'book-123' };
      const mockFeedbackList = [mockFeedback];
      const totalCount = 1;

      (prismaService.feedback.findMany as jest.Mock).mockResolvedValue(
        mockFeedbackList
      );
      (prismaService.feedback.count as jest.Mock).mockResolvedValue(totalCount);

      await service.findAll(queryWithBookId);

      expect(prismaService.feedback.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { bookId: 'book-123' },
        })
      );
    });

    it('should filter feedback by userId', async () => {
      const queryWithUserId: QueryFeedbackDto = { userId: 'user-123' };
      const mockFeedbackList = [mockFeedback];
      const totalCount = 1;

      (prismaService.feedback.findMany as jest.Mock).mockResolvedValue(
        mockFeedbackList
      );
      (prismaService.feedback.count as jest.Mock).mockResolvedValue(totalCount);

      await service.findAll(queryWithUserId);

      expect(prismaService.feedback.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-123' },
        })
      );
    });

    it('should filter feedback by approval status', async () => {
      const queryWithApproval: QueryFeedbackDto = { isApproved: true };
      const mockFeedbackList = [mockFeedback];
      const totalCount = 1;

      (prismaService.feedback.findMany as jest.Mock).mockResolvedValue(
        mockFeedbackList
      );
      (prismaService.feedback.count as jest.Mock).mockResolvedValue(totalCount);

      await service.findAll(queryWithApproval);

      expect(prismaService.feedback.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isApproved: true },
        })
      );
    });

    it('should filter feedback by minimum rating', async () => {
      const queryWithMinRating: QueryFeedbackDto = { minRating: 4 };
      const mockFeedbackList = [mockFeedback];
      const totalCount = 1;

      (prismaService.feedback.findMany as jest.Mock).mockResolvedValue(
        mockFeedbackList
      );
      (prismaService.feedback.count as jest.Mock).mockResolvedValue(totalCount);

      await service.findAll(queryWithMinRating);

      expect(prismaService.feedback.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { rating: { gte: 4 } },
        })
      );
    });
  });

  describe('findOne', () => {
    it('should return feedback by ID', async () => {
      (prismaService.feedback.findUnique as jest.Mock).mockResolvedValue(
        mockFeedback
      );

      const result = await service.findOne('feedback-123');

      expect(prismaService.feedback.findUnique).toHaveBeenCalledWith({
        where: { id: 'feedback-123' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          book: {
            select: {
              id: true,
              title: true,
              author: true,
            },
          },
        },
      });
      expect(result).toEqual(mockFeedback);
    });

    it('should throw NotFoundException if feedback not found', async () => {
      (prismaService.feedback.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException
      );
      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        `Feedback with ID non-existent-id not found`
      );
    });
  });

  describe('update', () => {
    const updateDto: UpdateFeedbackDto = {
      rating: 4,
      comment: 'Updated comment',
    };

    it('should update feedback successfully by owner', async () => {
      const updatedFeedback = { ...mockFeedback, ...updateDto };
      (prismaService.feedback.findUnique as jest.Mock).mockResolvedValue(
        mockFeedback
      );
      (prismaService.feedback.update as jest.Mock).mockResolvedValue(
        updatedFeedback
      );

      const result = await service.update(
        'feedback-123',
        updateDto,
        'user-123',
        'USER'
      );

      expect(prismaService.feedback.update).toHaveBeenCalledWith({
        where: { id: 'feedback-123' },
        data: {
          ...updateDto,
          isApproved: false, // Reset approval when user updates
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          book: {
            select: {
              id: true,
              title: true,
              author: true,
            },
          },
        },
      });
      expect(result).toEqual(updatedFeedback);
    });

    it('should update feedback with approval status by admin', async () => {
      const updateWithApproval: UpdateFeedbackDto = {
        rating: 4,
        isApproved: true,
      };
      const updatedFeedback = { ...mockFeedback, ...updateWithApproval };
      (prismaService.feedback.findUnique as jest.Mock).mockResolvedValue(
        mockFeedback
      );
      (prismaService.feedback.update as jest.Mock).mockResolvedValue(
        updatedFeedback
      );

      const result = await service.update(
        'feedback-123',
        updateWithApproval,
        'admin-123',
        'ADMIN'
      );

      expect(prismaService.feedback.update).toHaveBeenCalledWith({
        where: { id: 'feedback-123' },
        data: updateWithApproval,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          book: {
            select: {
              id: true,
              title: true,
              author: true,
            },
          },
        },
      });
      expect(result).toEqual(updatedFeedback);
    });

    it('should throw NotFoundException if feedback not found', async () => {
      (prismaService.feedback.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.update('non-existent-id', updateDto, 'user-123', 'USER')
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not owner and not admin', async () => {
      (prismaService.feedback.findUnique as jest.Mock).mockResolvedValue(
        mockFeedback
      );

      await expect(
        service.update('feedback-123', updateDto, 'other-user', 'USER')
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.update('feedback-123', updateDto, 'other-user', 'USER')
      ).rejects.toThrow('You can only update your own feedback');
    });

    it('should throw ForbiddenException if user tries to update approved feedback', async () => {
      const approvedFeedback = { ...mockFeedback, isApproved: true };
      (prismaService.feedback.findUnique as jest.Mock).mockResolvedValue(
        approvedFeedback
      );

      await expect(
        service.update('feedback-123', updateDto, 'user-123', 'USER')
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.update('feedback-123', updateDto, 'user-123', 'USER')
      ).rejects.toThrow('Cannot update approved feedback');
    });

    it('should throw ForbiddenException if non-admin tries to change approval status', async () => {
      const updateWithApproval: UpdateFeedbackDto = { isApproved: true };
      (prismaService.feedback.findUnique as jest.Mock).mockResolvedValue(
        mockFeedback
      );

      await expect(
        service.update('user-123', updateWithApproval, 'user-123', 'USER')
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.update('user-123', updateWithApproval, 'user-123', 'USER')
      ).rejects.toThrow('Only admins can change approval status');
    });
  });

  describe('remove', () => {
    it('should delete feedback successfully by owner', async () => {
      (prismaService.feedback.findUnique as jest.Mock).mockResolvedValue(
        mockFeedback
      );
      (prismaService.feedback.delete as jest.Mock).mockResolvedValue(
        mockFeedback
      );

      const result = await service.remove('feedback-123', 'user-123', 'USER');

      expect(prismaService.feedback.delete).toHaveBeenCalledWith({
        where: { id: 'feedback-123' },
      });
      expect(result).toEqual({ message: 'Feedback deleted successfully' });
    });

    it('should delete feedback successfully by admin', async () => {
      (prismaService.feedback.findUnique as jest.Mock).mockResolvedValue(
        mockFeedback
      );
      (prismaService.feedback.delete as jest.Mock).mockResolvedValue(
        mockFeedback
      );

      const result = await service.remove('feedback-123', 'admin-123', 'ADMIN');

      expect(result).toEqual({ message: 'Feedback deleted successfully' });
    });

    it('should throw NotFoundException if feedback not found', async () => {
      (prismaService.feedback.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.remove('non-existent-id', 'user-123', 'USER')
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not owner and not admin', async () => {
      (prismaService.feedback.findUnique as jest.Mock).mockResolvedValue(
        mockFeedback
      );

      await expect(
        service.remove('feedback-123', 'other-user', 'USER')
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.remove('feedback-123', 'other-user', 'USER')
      ).rejects.toThrow('You can only delete your own feedback');
    });
  });

  describe('approveFeedback', () => {
    it('should approve feedback successfully', async () => {
      const approvedFeedback = { ...mockFeedback, isApproved: true };
      (prismaService.feedback.findUnique as jest.Mock).mockResolvedValue(
        mockFeedback
      );
      (prismaService.feedback.update as jest.Mock).mockResolvedValue(
        approvedFeedback
      );

      const result = await service.approveFeedback('feedback-123');

      expect(prismaService.feedback.update).toHaveBeenCalledWith({
        where: { id: 'feedback-123' },
        data: { isApproved: true },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          book: {
            select: {
              id: true,
              title: true,
              author: true,
            },
          },
        },
      });
      expect(result).toEqual(approvedFeedback);
    });

    it('should throw NotFoundException if feedback not found', async () => {
      (prismaService.feedback.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.approveFeedback('non-existent-id')).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw BadRequestException if feedback already approved', async () => {
      const approvedFeedback = { ...mockFeedback, isApproved: true };
      (prismaService.feedback.findUnique as jest.Mock).mockResolvedValue(
        approvedFeedback
      );

      await expect(service.approveFeedback('feedback-123')).rejects.toThrow(
        BadRequestException
      );
      await expect(service.approveFeedback('feedback-123')).rejects.toThrow(
        'Feedback is already approved'
      );
    });
  });

  describe('rejectFeedback', () => {
    it('should reject feedback successfully', async () => {
      const approvedFeedback = { ...mockFeedback, isApproved: true };
      const rejectedFeedback = { ...mockFeedback, isApproved: false };
      (prismaService.feedback.findUnique as jest.Mock).mockResolvedValue(
        approvedFeedback
      );
      (prismaService.feedback.update as jest.Mock).mockResolvedValue(
        rejectedFeedback
      );

      const result = await service.rejectFeedback('feedback-123');

      expect(prismaService.feedback.update).toHaveBeenCalledWith({
        where: { id: 'feedback-123' },
        data: { isApproved: false },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          book: {
            select: {
              id: true,
              title: true,
              author: true,
            },
          },
        },
      });
      expect(result).toEqual(rejectedFeedback);
    });

    it('should throw NotFoundException if feedback not found', async () => {
      (prismaService.feedback.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.rejectFeedback('non-existent-id')).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw BadRequestException if feedback already rejected', async () => {
      (prismaService.feedback.findUnique as jest.Mock).mockResolvedValue(
        mockFeedback
      );

      await expect(service.rejectFeedback('feedback-123')).rejects.toThrow(
        BadRequestException
      );
      await expect(service.rejectFeedback('feedback-123')).rejects.toThrow(
        'Feedback is already rejected'
      );
    });
  });

  describe('getBookFeedback', () => {
    it('should return approved feedback for a book', async () => {
      const mockFeedbackList = [mockFeedback];
      const totalCount = 1;

      (prismaService.book.findUnique as jest.Mock).mockResolvedValue(mockBook);
      (prismaService.feedback.findMany as jest.Mock).mockResolvedValue(
        mockFeedbackList
      );
      (prismaService.feedback.count as jest.Mock).mockResolvedValue(totalCount);

      const result = await service.getBookFeedback('book-123', {});

      expect(prismaService.book.findUnique).toHaveBeenCalledWith({
        where: { id: 'book-123' },
      });
      expect(prismaService.feedback.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { bookId: 'book-123', isApproved: true },
        })
      );
      expect(result.data).toEqual(mockFeedbackList);
    });

    it('should throw NotFoundException if book not found', async () => {
      (prismaService.book.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.getBookFeedback('non-existent-book', {})
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUserFeedback', () => {
    it('should return feedback for a user', async () => {
      const mockFeedbackList = [mockFeedback];
      const totalCount = 1;

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.feedback.findMany as jest.Mock).mockResolvedValue(
        mockFeedbackList
      );
      (prismaService.feedback.count as jest.Mock).mockResolvedValue(totalCount);

      const result = await service.getUserFeedback('user-123', {});

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
      expect(prismaService.feedback.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-123' },
        })
      );
      expect(result.data).toEqual(mockFeedbackList);
    });

    it('should throw NotFoundException if user not found', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.getUserFeedback('non-existent-user', {})
      ).rejects.toThrow(NotFoundException);
    });
  });
});

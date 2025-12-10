import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { FeedbackController } from '../feedback.controller';
import { FeedbackService } from '../feedback.service';
import { CreateFeedbackDto } from '../dto/create-feedback.dto';
import { UpdateFeedbackDto } from '../dto/update-feedback.dto';
import { QueryFeedbackDto } from '../dto/query-feedback.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';

describe('FeedbackController (Unit)', () => {
  let controller: FeedbackController;
  let service: FeedbackService;

  const mockUser = {
    id: 'user-123',
    email: 'john@example.com',
    name: 'John Doe',
    role: {
      id: 'user',
      name: 'USER',
      description: 'Regular user',
    },
  };

  const mockAdminUser = {
    id: 'admin-123',
    email: 'admin@example.com',
    name: 'Admin User',
    role: {
      id: 'admin',
      name: 'ADMIN',
      description: 'Administrator',
    },
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
    user: {
      id: 'user-123',
      name: 'John Doe',
      email: 'john@example.com',
    },
    book: {
      id: 'book-123',
      title: 'Test Book',
      author: 'Test Author',
    },
  };

  const mockPaginatedResponse = {
    data: [mockFeedback],
    pagination: {
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  };

  const mockFeedbackService = {
    create: jest.fn().mockResolvedValue(mockFeedback),
    findAll: jest.fn().mockResolvedValue(mockPaginatedResponse),
    findOne: jest.fn().mockResolvedValue(mockFeedback),
    update: jest.fn().mockResolvedValue(mockFeedback),
    remove: jest
      .fn()
      .mockResolvedValue({ message: 'Feedback deleted successfully' }),
    getBookFeedback: jest.fn().mockResolvedValue(mockPaginatedResponse),
    getUserFeedback: jest.fn().mockResolvedValue(mockPaginatedResponse),
    approveFeedback: jest.fn().mockResolvedValue(mockFeedback),
    rejectFeedback: jest.fn().mockResolvedValue(mockFeedback),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FeedbackController],
      providers: [
        {
          provide: FeedbackService,
          useValue: mockFeedbackService,
        },
        // Mock JwtAuthGuard and RolesGuard to allow tests to pass without actual authentication
        {
          provide: JwtAuthGuard,
          useValue: { canActivate: jest.fn(() => true) },
        },
        {
          provide: RolesGuard,
          useValue: { canActivate: jest.fn(() => true) },
        },
        // Provide Reflector for RolesGuard to work
        Reflector,
      ],
    }).compile();

    controller = module.get<FeedbackController>(FeedbackController);
    service = module.get<FeedbackService>(FeedbackService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createFeedbackDto: CreateFeedbackDto = {
      rating: 5,
      comment: 'This book is amazing!',
      bookId: 'book-123',
    };

    it('should create feedback successfully', async () => {
      const req = { user: mockUser };

      const result = await controller.create(req, createFeedbackDto);

      expect(service.create).toHaveBeenCalledWith(
        mockUser.id,
        createFeedbackDto
      );
      expect(result).toEqual(mockFeedback);
    });

    it('should handle service exceptions', async () => {
      const req = { user: mockUser };
      (service.create as jest.Mock).mockRejectedValue(
        new ConflictException(
          'You have already provided feedback for this book'
        )
      );

      await expect(controller.create(req, createFeedbackDto)).rejects.toThrow(
        ConflictException
      );
      await expect(controller.create(req, createFeedbackDto)).rejects.toThrow(
        'You have already provided feedback for this book'
      );
    });
  });

  describe('findAll', () => {
    const queryDto: QueryFeedbackDto = { page: 1, limit: 10 };

    it('should return paginated feedback list', async () => {
      const result = await controller.findAll(queryDto);

      expect(service.findAll).toHaveBeenCalledWith(queryDto);
      expect(result).toEqual(mockPaginatedResponse);
    });

    it('should handle empty query parameters', async () => {
      const emptyQuery: QueryFeedbackDto = {};

      const result = await controller.findAll(emptyQuery);

      expect(service.findAll).toHaveBeenCalledWith(emptyQuery);
      expect(result).toEqual(mockPaginatedResponse);
    });

    it('should handle filtering parameters', async () => {
      const filterQuery: QueryFeedbackDto = {
        bookId: 'book-123',
        isApproved: true,
        minRating: 4,
      };

      const result = await controller.findAll(filterQuery);

      expect(service.findAll).toHaveBeenCalledWith(filterQuery);
      expect(result).toEqual(mockPaginatedResponse);
    });
  });

  describe('getBookFeedback', () => {
    const bookId = 'book-123';
    const queryDto: QueryFeedbackDto = { page: 1, limit: 10 };

    it('should return feedback for a specific book', async () => {
      const result = await controller.getBookFeedback(bookId, queryDto);

      expect(service.getBookFeedback).toHaveBeenCalledWith(bookId, queryDto);
      expect(result).toEqual(mockPaginatedResponse);
    });

    it('should handle service exceptions', async () => {
      (service.getBookFeedback as jest.Mock).mockRejectedValue(
        new NotFoundException(`Book with ID ${bookId} not found`)
      );

      await expect(
        controller.getBookFeedback(bookId, queryDto)
      ).rejects.toThrow(NotFoundException);
      await expect(
        controller.getBookFeedback(bookId, queryDto)
      ).rejects.toThrow(`Book with ID ${bookId} not found`);
    });
  });

  describe('getUserFeedback', () => {
    const userId = 'user-123';
    const queryDto: QueryFeedbackDto = { page: 1, limit: 10 };

    it('should return feedback for a specific user', async () => {
      const result = await controller.getUserFeedback(userId, queryDto);

      expect(service.getUserFeedback).toHaveBeenCalledWith(userId, queryDto);
      expect(result).toEqual(mockPaginatedResponse);
    });

    it('should handle service exceptions', async () => {
      const userId = 'user-123';
      const errorMessage = `User with ID ${userId} not found`;
      (service.getUserFeedback as jest.Mock).mockRejectedValue(
        new NotFoundException(errorMessage)
      );

      await expect(
        controller.getUserFeedback(userId, queryDto)
      ).rejects.toThrow(NotFoundException);
      await expect(
        controller.getUserFeedback(userId, queryDto)
      ).rejects.toThrow(errorMessage);

      // Reset the mock after the test
      (service.getUserFeedback as jest.Mock).mockResolvedValue(
        mockPaginatedResponse
      );
    });
  });

  describe('getMyFeedback', () => {
    const queryDto: QueryFeedbackDto = { page: 1, limit: 10 };

    it('should return current user feedback', async () => {
      const req = { user: mockUser };

      const result = await controller.getMyFeedback(req, queryDto);

      expect(service.getUserFeedback).toHaveBeenCalledWith(
        mockUser.id,
        queryDto
      );
      expect(result).toEqual(mockPaginatedResponse);
    });
  });

  describe('findOne', () => {
    const feedbackId = 'feedback-123';

    it('should return feedback by ID', async () => {
      const result = await controller.findOne(feedbackId);

      expect(service.findOne).toHaveBeenCalledWith(feedbackId);
      expect(result).toEqual(mockFeedback);
    });

    it('should handle NotFoundException', async () => {
      (service.findOne as jest.Mock).mockRejectedValue(
        new NotFoundException(`Feedback with ID ${feedbackId} not found`)
      );

      await expect(controller.findOne(feedbackId)).rejects.toThrow(
        NotFoundException
      );
      await expect(controller.findOne(feedbackId)).rejects.toThrow(
        `Feedback with ID ${feedbackId} not found`
      );
    });
  });

  describe('update', () => {
    const feedbackId = 'feedback-123';
    const updateFeedbackDto: UpdateFeedbackDto = {
      rating: 4,
      comment: 'Updated comment',
    };

    it('should update feedback successfully', async () => {
      const req = { user: mockUser };
      const updatedFeedback = { ...mockFeedback, ...updateFeedbackDto };
      (service.update as jest.Mock).mockResolvedValue(updatedFeedback);

      const result = await controller.update(
        feedbackId,
        updateFeedbackDto,
        req
      );

      expect(service.update).toHaveBeenCalledWith(
        feedbackId,
        updateFeedbackDto,
        mockUser.id,
        mockUser.role.name
      );
      expect(result).toEqual(updatedFeedback);
    });

    it('should handle NotFoundException', async () => {
      const req = { user: mockUser };
      (service.update as jest.Mock).mockRejectedValue(
        new NotFoundException(`Feedback with ID ${feedbackId} not found`)
      );

      await expect(
        controller.update(feedbackId, updateFeedbackDto, req)
      ).rejects.toThrow(NotFoundException);
      await expect(
        controller.update(feedbackId, updateFeedbackDto, req)
      ).rejects.toThrow(`Feedback with ID ${feedbackId} not found`);
    });

    it('should handle ForbiddenException', async () => {
      const req = { user: mockUser };
      (service.update as jest.Mock).mockRejectedValue(
        new ForbiddenException('You can only update your own feedback')
      );

      await expect(
        controller.update(feedbackId, updateFeedbackDto, req)
      ).rejects.toThrow(ForbiddenException);
      await expect(
        controller.update(feedbackId, updateFeedbackDto, req)
      ).rejects.toThrow('You can only update your own feedback');
    });

    it('should handle admin updates with approval status', async () => {
      const req = { user: mockAdminUser };
      const updateWithApproval: UpdateFeedbackDto = {
        rating: 4,
        isApproved: true,
      };
      const updatedFeedback = { ...mockFeedback, ...updateWithApproval };
      (service.update as jest.Mock).mockResolvedValue(updatedFeedback);

      const result = await controller.update(
        feedbackId,
        updateWithApproval,
        req
      );

      expect(service.update).toHaveBeenCalledWith(
        feedbackId,
        updateWithApproval,
        mockAdminUser.id,
        mockAdminUser.role.name
      );
      expect(result).toEqual(updatedFeedback);
    });
  });

  describe('remove', () => {
    const feedbackId = 'feedback-123';

    it('should delete feedback successfully', async () => {
      const req = { user: mockUser };
      const deleteResult = { message: 'Feedback deleted successfully' };
      (service.remove as jest.Mock).mockResolvedValue(deleteResult);

      const result = await controller.remove(feedbackId, req);

      expect(service.remove).toHaveBeenCalledWith(
        feedbackId,
        mockUser.id,
        mockUser.role.name
      );
      expect(result).toEqual(deleteResult);
    });

    it('should handle NotFoundException', async () => {
      const req = { user: mockUser };
      (service.remove as jest.Mock).mockRejectedValue(
        new NotFoundException(`Feedback with ID ${feedbackId} not found`)
      );

      await expect(controller.remove(feedbackId, req)).rejects.toThrow(
        NotFoundException
      );
      await expect(controller.remove(feedbackId, req)).rejects.toThrow(
        `Feedback with ID ${feedbackId} not found`
      );
    });

    it('should handle ForbiddenException', async () => {
      const req = { user: mockUser };
      (service.remove as jest.Mock).mockRejectedValue(
        new ForbiddenException('You can only delete your own feedback')
      );

      await expect(controller.remove(feedbackId, req)).rejects.toThrow(
        ForbiddenException
      );
      await expect(controller.remove(feedbackId, req)).rejects.toThrow(
        'You can only delete your own feedback'
      );
    });
  });

  describe('approveFeedback', () => {
    const feedbackId = 'feedback-123';

    it('should approve feedback successfully', async () => {
      const approvedFeedback = { ...mockFeedback, isApproved: true };
      (service.approveFeedback as jest.Mock).mockResolvedValue(
        approvedFeedback
      );

      const result = await controller.approveFeedback(feedbackId);

      expect(service.approveFeedback).toHaveBeenCalledWith(feedbackId);
      expect(result).toEqual(approvedFeedback);
    });

    it('should handle NotFoundException', async () => {
      (service.approveFeedback as jest.Mock).mockRejectedValue(
        new NotFoundException(`Feedback with ID ${feedbackId} not found`)
      );

      await expect(controller.approveFeedback(feedbackId)).rejects.toThrow(
        NotFoundException
      );
      await expect(controller.approveFeedback(feedbackId)).rejects.toThrow(
        `Feedback with ID ${feedbackId} not found`
      );
    });
  });

  describe('rejectFeedback', () => {
    const feedbackId = 'feedback-123';

    it('should reject feedback successfully', async () => {
      const rejectedFeedback = { ...mockFeedback, isApproved: false };
      (service.rejectFeedback as jest.Mock).mockResolvedValue(rejectedFeedback);

      const result = await controller.rejectFeedback(feedbackId);

      expect(service.rejectFeedback).toHaveBeenCalledWith(feedbackId);
      expect(result).toEqual(rejectedFeedback);
    });

    it('should handle NotFoundException', async () => {
      (service.rejectFeedback as jest.Mock).mockRejectedValue(
        new NotFoundException(`Feedback with ID ${feedbackId} not found`)
      );

      await expect(controller.rejectFeedback(feedbackId)).rejects.toThrow(
        NotFoundException
      );
      await expect(controller.rejectFeedback(feedbackId)).rejects.toThrow(
        `Feedback with ID ${feedbackId} not found`
      );
    });
  });

  describe('Guards and Roles', () => {
    it('should apply JwtAuthGuard and RolesGuard to create endpoint', async () => {
      const guards = Reflect.getMetadata('__guards__', controller.create);
      expect(guards).toHaveLength(1);
      expect(new guards[0]()).toBeInstanceOf(JwtAuthGuard);
    });

    it('should apply JwtAuthGuard and RolesGuard to findAll endpoint', async () => {
      const guards = Reflect.getMetadata('__guards__', controller.findAll);
      expect(guards).toHaveLength(2);
      expect(new guards[0]()).toBeInstanceOf(JwtAuthGuard);
      expect(new guards[1]()).toBeInstanceOf(RolesGuard);

      const roles = Reflect.getMetadata('roles', controller.findAll);
      expect(roles).toEqual(['ADMIN']);
    });

    it('should apply JwtAuthGuard and RolesGuard to approve endpoint', async () => {
      const guards = Reflect.getMetadata(
        '__guards__',
        controller.approveFeedback
      );
      expect(guards).toHaveLength(2);
      expect(new guards[0]()).toBeInstanceOf(JwtAuthGuard);
      expect(new guards[1]()).toBeInstanceOf(RolesGuard);

      const roles = Reflect.getMetadata('roles', controller.approveFeedback);
      expect(roles).toEqual(['ADMIN']);
    });

    it('should apply JwtAuthGuard and RolesGuard to reject endpoint', async () => {
      const guards = Reflect.getMetadata(
        '__guards__',
        controller.rejectFeedback
      );
      expect(guards).toHaveLength(2);
      expect(new guards[0]()).toBeInstanceOf(JwtAuthGuard);
      expect(new guards[1]()).toBeInstanceOf(RolesGuard);

      const roles = Reflect.getMetadata('roles', controller.rejectFeedback);
      expect(roles).toEqual(['ADMIN']);
    });

    it('should apply only JwtAuthGuard to public endpoints', async () => {
      const guards = Reflect.getMetadata(
        '__guards__',
        controller.getBookFeedback
      );
      expect(guards).toBeUndefined(); // No guards for public book feedback endpoint

      const userGuards = Reflect.getMetadata(
        '__guards__',
        controller.getMyFeedback
      );
      expect(userGuards).toHaveLength(1);
      expect(new userGuards[0]()).toBeInstanceOf(JwtAuthGuard);
    });
  });
});

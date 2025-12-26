import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from '../users.controller';
import { UsersService } from '../users.service';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    roleId: 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
    role: {
      id: 'user',
      name: 'USER',
      description: 'Regular user',
    },
  };

  const mockPaginatedResponse = {
    data: [mockUser],
    pagination: {
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    },
  };

  const mockStats = {
    totalUsers: 10,
    userRoleCount: 8,
    adminRoleCount: 2,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            changeRole: jest.fn(),
            getUserStats: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const queryDto = { page: 1, limit: 10 };
      (service.findAll as jest.Mock).mockResolvedValue(mockPaginatedResponse);

      const result = await controller.findAll(queryDto);

      expect(result).toEqual(mockPaginatedResponse);
      expect(service.findAll).toHaveBeenCalledWith(queryDto);
    });

    it('should handle service exceptions', async () => {
      const queryDto = { page: 1, limit: 10 };
      const errorMessage = 'Database error';
      (service.findAll as jest.Mock).mockRejectedValue(new Error(errorMessage));

      await expect(controller.findAll(queryDto)).rejects.toThrow(Error);
      await expect(controller.findAll(queryDto)).rejects.toThrow(errorMessage);
    });
  });

  describe('getUserStats', () => {
    it('should return user statistics', async () => {
      (service.getUserStats as jest.Mock).mockResolvedValue(mockStats);

      const result = await controller.getUserStats();

      expect(result).toEqual(mockStats);
      expect(service.getUserStats).toHaveBeenCalled();
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user from request', async () => {
      const mockRequest = { user: mockUser };

      const result = await controller.getCurrentUser(mockRequest);

      expect(result).toEqual(mockUser);
    });
  });

  describe('findOne', () => {
    it('should return user by id', async () => {
      (service.findOne as jest.Mock).mockResolvedValue(mockUser);

      const result = await controller.findOne('user-123');

      expect(result).toEqual(mockUser);
      expect(service.findOne).toHaveBeenCalledWith('user-123');
    });

    it('should handle service exceptions', async () => {
      const userId = 'user-123';
      const errorMessage = `User with ID ${userId} not found`;
      (service.findOne as jest.Mock).mockRejectedValue(
        new NotFoundException(errorMessage)
      );

      await expect(controller.findOne(userId)).rejects.toThrow(
        NotFoundException
      );
      await expect(controller.findOne(userId)).rejects.toThrow(errorMessage);
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      const updateDto = { name: 'Updated Name' };
      const updatedUser = { ...mockUser, name: 'Updated Name' };
      (service.update as jest.Mock).mockResolvedValue(updatedUser);

      const result = await controller.update('user-123', updateDto);

      expect(result).toEqual(updatedUser);
      expect(service.update).toHaveBeenCalledWith('user-123', updateDto);
    });

    it('should handle service exceptions', async () => {
      const userId = 'user-123';
      const updateDto = { email: 'existing@example.com' };
      const errorMessage = 'User with this email already exists';
      (service.update as jest.Mock).mockRejectedValue(
        new ConflictException(errorMessage)
      );

      await expect(controller.update(userId, updateDto)).rejects.toThrow(
        ConflictException
      );
      await expect(controller.update(userId, updateDto)).rejects.toThrow(
        errorMessage
      );
    });
  });

  describe('changeRole', () => {
    it('should change user role successfully', async () => {
      const changeRoleDto = { roleId: 'admin' };
      const updatedUser = { ...mockUser, roleId: 'admin' };
      (service.changeRole as jest.Mock).mockResolvedValue(updatedUser);

      const result = await controller.changeRole('user-123', changeRoleDto);

      expect(result).toEqual(updatedUser);
      expect(service.changeRole).toHaveBeenCalledWith(
        'user-123',
        changeRoleDto
      );
    });

    it('should handle service exceptions', async () => {
      const userId = 'user-123';
      const changeRoleDto = { roleId: 'nonexistent' };
      const errorMessage = 'Role with ID nonexistent not found';
      (service.changeRole as jest.Mock).mockRejectedValue(
        new NotFoundException(errorMessage)
      );

      await expect(
        controller.changeRole(userId, changeRoleDto)
      ).rejects.toThrow(NotFoundException);
      await expect(
        controller.changeRole(userId, changeRoleDto)
      ).rejects.toThrow(errorMessage);
    });
  });

  describe('remove', () => {
    it('should delete user successfully', async () => {
      const deleteResponse = { message: 'User deleted successfully' };
      (service.remove as jest.Mock).mockResolvedValue(deleteResponse);

      const result = await controller.remove('user-123');

      expect(result).toEqual(deleteResponse);
      expect(service.remove).toHaveBeenCalledWith('user-123');
    });

    it('should handle service exceptions', async () => {
      const userId = 'user-123';
      const errorMessage =
        'Cannot delete user with existing feedback. Please delete feedback first.';
      (service.remove as jest.Mock).mockRejectedValue(
        new BadRequestException(errorMessage)
      );

      await expect(controller.remove(userId)).rejects.toThrow(
        BadRequestException
      );
      await expect(controller.remove(userId)).rejects.toThrow(errorMessage);
    });
  });
});

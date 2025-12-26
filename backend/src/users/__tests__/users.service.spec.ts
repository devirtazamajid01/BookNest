import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../users.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: PrismaService;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashedpassword',
    roleId: 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
    role: {
      id: 'user',
      name: 'USER',
      description: 'Regular user',
    },
  };

  const mockRole = {
    id: 'admin',
    name: 'ADMIN',
    description: 'Administrator',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findMany: jest.fn(),
              count: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            role: {
              findUnique: jest.fn(),
            },
            feedback: {
              findFirst: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated users with default pagination', async () => {
      const mockUsers = [mockUser];
      const mockCount = 1;

      (prismaService.user.findMany as jest.Mock).mockResolvedValue(mockUsers);
      (prismaService.user.count as jest.Mock).mockResolvedValue(mockCount);

      const result = await service.findAll({});

      expect(result).toEqual({
        data: [{ ...mockUser, password: undefined }],
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      });
    });

    it('should apply name filter', async () => {
      const queryDto = { name: 'test', page: 1, limit: 10 };
      const mockUsers = [mockUser];
      const mockCount = 1;

      (prismaService.user.findMany as jest.Mock).mockResolvedValue(mockUsers);
      (prismaService.user.count as jest.Mock).mockResolvedValue(mockCount);

      await service.findAll(queryDto);

      expect(prismaService.user.findMany).toHaveBeenCalledWith({
        where: {
          name: {
            contains: 'test',
          },
        },
        include: { role: true },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should apply email filter', async () => {
      const queryDto = { email: 'test@example.com', page: 1, limit: 10 };
      const mockUsers = [mockUser];
      const mockCount = 1;

      (prismaService.user.findMany as jest.Mock).mockResolvedValue(mockUsers);
      (prismaService.user.count as jest.Mock).mockResolvedValue(mockCount);

      await service.findAll(queryDto);

      expect(prismaService.user.findMany).toHaveBeenCalledWith({
        where: {
          email: {
            contains: 'test@example.com',
          },
        },
        include: { role: true },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should apply role filter', async () => {
      const queryDto = { role: 'USER', page: 1, limit: 10 };
      const mockUsers = [mockUser];
      const mockCount = 1;

      (prismaService.user.findMany as jest.Mock).mockResolvedValue(mockUsers);
      (prismaService.user.count as jest.Mock).mockResolvedValue(mockCount);

      await service.findAll(queryDto);

      expect(prismaService.user.findMany).toHaveBeenCalledWith({
        where: {
          role: {
            name: 'USER',
          },
        },
        include: { role: true },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return user by id', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.findOne('user-123');

      expect(result).toEqual({ ...mockUser, password: undefined });
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        include: { role: true },
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException
      );
      await expect(service.findOne('nonexistent')).rejects.toThrow(
        'User with ID nonexistent not found'
      );
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      const updateDto = { name: 'Updated Name' };
      const updatedUser = { ...mockUser, name: 'Updated Name' };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.user.update as jest.Mock).mockResolvedValue(updatedUser);

      const result = await service.update('user-123', updateDto);

      expect(result).toEqual({ ...updatedUser, password: undefined });
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: updateDto,
        include: { role: true },
      });
    });

    it('should hash password when updating', async () => {
      const updateDto = { password: 'newpassword' };
      const hashedPassword = 'hashednewpassword';
      const updatedUser = { ...mockUser, password: hashedPassword };

      jest.spyOn(bcrypt, 'hash').mockResolvedValue(hashedPassword as never);
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.user.update as jest.Mock).mockResolvedValue(updatedUser);

      await service.update('user-123', updateDto);

      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword', 10);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { password: hashedPassword },
        include: { role: true },
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.update('nonexistent', {})).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw ConflictException when email already exists', async () => {
      const updateDto = { email: 'existing@example.com' };
      const existingUser = { ...mockUser, email: 'existing@example.com' };

      (prismaService.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockUser) // First call for user existence check
        .mockResolvedValueOnce(existingUser); // Second call for email conflict check

      await expect(service.update('user-123', updateDto)).rejects.toThrow(
        ConflictException
      );
    });
  });

  describe('remove', () => {
    it('should delete user successfully', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.feedback.findFirst as jest.Mock).mockResolvedValue(null);
      (prismaService.user.delete as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.remove('user-123');

      expect(result).toEqual({ message: 'User deleted successfully' });
      expect(prismaService.user.delete).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw BadRequestException when user has feedback', async () => {
      const mockFeedback = { id: 'feedback-123', userId: 'user-123' };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.feedback.findFirst as jest.Mock).mockResolvedValue(
        mockFeedback
      );

      await expect(service.remove('user-123')).rejects.toThrow(
        BadRequestException
      );
      await expect(service.remove('user-123')).rejects.toThrow(
        'Cannot delete user with existing feedback. Please delete feedback first.'
      );
    });
  });

  describe('changeRole', () => {
    it('should change user role successfully', async () => {
      const changeRoleDto = { roleId: 'admin' };
      const updatedUser = { ...mockUser, roleId: 'admin', role: mockRole };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.role.findUnique as jest.Mock).mockResolvedValue(mockRole);
      (prismaService.user.update as jest.Mock).mockResolvedValue(updatedUser);

      const result = await service.changeRole('user-123', changeRoleDto);

      expect(result).toEqual({ ...updatedUser, password: undefined });
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { roleId: 'admin' },
        include: { role: true },
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.changeRole('nonexistent', { roleId: 'admin' })
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when role not found', async () => {
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.role.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.changeRole('user-123', { roleId: 'nonexistent' })
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.changeRole('user-123', { roleId: 'nonexistent' })
      ).rejects.toThrow('Role with ID nonexistent not found');
    });

    it('should throw BadRequestException when user already has the role', async () => {
      const changeRoleDto = { roleId: 'user' };

      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prismaService.role.findUnique as jest.Mock).mockResolvedValue(mockRole);

      await expect(
        service.changeRole('user-123', changeRoleDto)
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.changeRole('user-123', changeRoleDto)
      ).rejects.toThrow('User already has this role');
    });
  });

  describe('getUserStats', () => {
    it('should return user statistics', async () => {
      (prismaService.user.count as jest.Mock)
        .mockResolvedValueOnce(10) // Total users
        .mockResolvedValueOnce(8) // User role count
        .mockResolvedValueOnce(2); // Admin role count

      const result = await service.getUserStats();

      expect(result).toEqual({
        totalUsers: 10,
        userRoleCount: 8,
        adminRoleCount: 2,
      });
    });
  });
});

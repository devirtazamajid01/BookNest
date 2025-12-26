import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../users.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

describe('UsersService Integration', () => {
  let service: UsersService;
  let prismaService: PrismaService;
  let testUser: any;
  let testRole: any;
  let adminRole: any;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, PrismaService],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Find or create test roles
    testRole = await prismaService.role.upsert({
      where: { id: 'user' },
      update: {},
      create: {
        id: 'user',
        name: 'USER',
        description: 'Regular user',
      },
    });

    adminRole = await prismaService.role.upsert({
      where: { id: 'admin' },
      update: {},
      create: {
        id: 'admin',
        name: 'ADMIN',
        description: 'Administrator',
      },
    });
  });

  beforeEach(async () => {
    // Clean up test data
    await prismaService.user.deleteMany({
      where: {
        email: {
          contains: 'testuser',
        },
      },
    });

    // Create test user
    const hashedPassword = await bcrypt.hash('password123', 10);
    testUser = await prismaService.user.create({
      data: {
        email: `testuser-${Date.now()}@example.com`,
        name: 'Test User',
        password: hashedPassword,
        roleId: testRole.id,
      },
    });
  });

  afterAll(async () => {
    // Clean up all test data
    await prismaService.user.deleteMany();
    await prismaService.role.deleteMany();
  });

  describe('findAll integration', () => {
    it('should return all users with pagination', async () => {
      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('pagination');
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.pagination).toHaveProperty('total');
      expect(result.pagination).toHaveProperty('page');
      expect(result.pagination).toHaveProperty('limit');
    });

    it('should filter users by name', async () => {
      const result = await service.findAll({
        name: 'Test User',
        page: 1,
        limit: 10,
      });

      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach((user: any) => {
        expect(user.name.toLowerCase()).toContain('test user');
      });
    });

    it('should filter users by email', async () => {
      const result = await service.findAll({
        email: 'testuser',
        page: 1,
        limit: 10,
      });

      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach((user: any) => {
        expect(user.email.toLowerCase()).toContain('testuser');
      });
    });

    it('should filter users by role', async () => {
      const result = await service.findAll({
        role: 'USER',
        page: 1,
        limit: 10,
      });

      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach((user: any) => {
        expect(user.role.name).toBe('USER');
      });
    });
  });

  describe('findOne integration', () => {
    it('should return user by id', async () => {
      const result = await service.findOne(testUser.id);

      expect(result).toEqual({
        ...testUser,
        password: undefined,
        role: testRole,
      });
    });

    it('should throw NotFoundException for non-existent user', async () => {
      await expect(service.findOne('nonexistent-id')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('update integration', () => {
    it('should update user successfully', async () => {
      const updateData = { name: 'Updated Test User' };
      const result = await service.update(testUser.id, updateData);

      expect(result.name).toBe('Updated Test User');
      expect(result.email).toBe(testUser.email);
      expect(result.id).toBe(testUser.id);
    });

    it('should update user password', async () => {
      const updateData = { password: 'newpassword123' };
      const result = await service.update(testUser.id, updateData);

      expect(result.id).toBe(testUser.id);
      // Verify password was hashed
      const updatedUser = await prismaService.user.findUnique({
        where: { id: testUser.id },
      });
      const isPasswordValid = await bcrypt.compare(
        'newpassword123',
        updatedUser!.password
      );
      expect(isPasswordValid).toBe(true);
    });

    it('should throw NotFoundException for non-existent user', async () => {
      await expect(
        service.update('nonexistent-id', { name: 'Test' })
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException for duplicate email', async () => {
      // Create another user
      const anotherUser = await prismaService.user.create({
        data: {
          email: `anotheruser-${Date.now()}@example.com`,
          name: 'Another User',
          password: await bcrypt.hash('password123', 10),
          roleId: testRole.id,
        },
      });

      // Try to update first user with second user's email
      await expect(
        service.update(testUser.id, { email: anotherUser.email })
      ).rejects.toThrow(ConflictException);

      // Clean up
      await prismaService.user.delete({ where: { id: anotherUser.id } });
    });
  });

  describe('changeRole integration', () => {
    it('should change user role successfully', async () => {
      const result = await service.changeRole(testUser.id, {
        roleId: adminRole.id,
      });

      expect(result.roleId).toBe(adminRole.id);
      expect(result.role.name).toBe('ADMIN');
    });

    it('should throw NotFoundException for non-existent user', async () => {
      await expect(
        service.changeRole('nonexistent-id', { roleId: adminRole.id })
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException for non-existent role', async () => {
      await expect(
        service.changeRole(testUser.id, { roleId: 'nonexistent-role' })
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when user already has the role', async () => {
      await expect(
        service.changeRole(testUser.id, { roleId: testUser.roleId })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove integration', () => {
    it('should delete user successfully', async () => {
      // Create a user without feedback
      const userToDelete = await prismaService.user.create({
        data: {
          email: `deleteme-${Date.now()}@example.com`,
          name: 'Delete Me',
          password: await bcrypt.hash('password123', 10),
          roleId: testRole.id,
        },
      });

      const result = await service.remove(userToDelete.id);

      expect(result).toEqual({ message: 'User deleted successfully' });

      // Verify user was deleted
      const deletedUser = await prismaService.user.findUnique({
        where: { id: userToDelete.id },
      });
      expect(deletedUser).toBeNull();
    });

    it('should throw NotFoundException for non-existent user', async () => {
      await expect(service.remove('nonexistent-id')).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw BadRequestException when user has feedback', async () => {
      // Create a book first
      const testBook = await prismaService.book.create({
        data: {
          title: 'Test Book',
          author: 'Test Author',
          isbn: `978-0-${Date.now()}-78-9`,
        },
      });

      // Create feedback for the user
      await prismaService.feedback.create({
        data: {
          rating: 5,
          comment: 'Great book!',
          userId: testUser.id,
          bookId: testBook.id,
        },
      });

      await expect(service.remove(testUser.id)).rejects.toThrow(
        BadRequestException
      );

      // Clean up
      await prismaService.feedback.deleteMany({
        where: { userId: testUser.id },
      });
      await prismaService.book.delete({ where: { id: testBook.id } });
    });
  });

  describe('getUserStats integration', () => {
    it('should return user statistics', async () => {
      const result = await service.getUserStats();

      expect(result).toHaveProperty('totalUsers');
      expect(result).toHaveProperty('userRoleCount');
      expect(result).toHaveProperty('adminRoleCount');
      expect(typeof result.totalUsers).toBe('number');
      expect(typeof result.userRoleCount).toBe('number');
      expect(typeof result.adminRoleCount).toBe('number');
    });
  });
});

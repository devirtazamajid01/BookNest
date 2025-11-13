import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from '../jwt.strategy';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let prismaService: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    const mockPayload = {
      sub: 'user123',
      email: 'test@example.com',
      role: 'USER',
    };

    const mockUser = {
      id: 'user123',
      email: 'test@example.com',
      name: 'Test User',
      password: 'hashedPassword123',
      roleId: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
      role: {
        id: 'user',
        name: 'USER',
        description: 'Regular user',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };

    it('should return user without password when user exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await strategy.validate(mockPayload);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockPayload.sub },
        include: { role: true },
      });

      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        roleId: mockUser.roleId,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
        role: mockUser.role,
      });
      expect(result).not.toHaveProperty('password');
    });

    it('should throw UnauthorizedException when user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(strategy.validate(mockPayload)).rejects.toThrow(
        UnauthorizedException
      );
      await expect(strategy.validate(mockPayload)).rejects.toThrow(
        'User not found'
      );

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockPayload.sub },
        include: { role: true },
      });
    });

    it('should include role information in returned user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await strategy.validate(mockPayload);

      expect(result).toHaveProperty('role');
      expect(result.role).toEqual(mockUser.role);
    });
  });
});

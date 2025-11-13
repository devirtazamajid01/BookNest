import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../auth.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

// Mock bcrypt
jest.mock('bcryptjs');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  // Mock PrismaService
  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    role: {
      upsert: jest.fn(),
    },
  };

  // Mock JwtService
  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signup', () => {
    const signupData = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    };

    it('should create a new user successfully', async () => {
      const hashedPassword = 'hashedPassword123';
      const createdUser = {
        id: 'user123',
        email: signupData.email,
        name: signupData.name,
        password: hashedPassword,
        roleId: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.role.upsert.mockResolvedValue({
        id: 'user',
        name: 'USER',
        description: 'Regular user',
      });
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(createdUser);
      mockedBcrypt.hash.mockResolvedValue(hashedPassword as never);

      const result = await service.signup(
        signupData.email,
        signupData.password,
        signupData.name
      );

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: signupData.email },
      });
      expect(mockedBcrypt.hash).toHaveBeenCalledWith(signupData.password, 10);
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: signupData.email,
          password: hashedPassword,
          name: signupData.name,
          roleId: 'user',
        },
      });

      // Should not return password in response
      expect(result).toEqual({
        id: createdUser.id,
        email: createdUser.email,
        name: createdUser.name,
        roleId: createdUser.roleId,
        createdAt: createdUser.createdAt,
        updatedAt: createdUser.updatedAt,
      });
      expect(result).not.toHaveProperty('password');
    });

    it('should throw ConflictException if user already exists', async () => {
      const existingUser = {
        id: 'existing123',
        email: signupData.email,
        name: 'Existing User',
        password: 'hashedPassword',
        roleId: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(existingUser);

      await expect(
        service.signup(signupData.email, signupData.password, signupData.name)
      ).rejects.toThrow(ConflictException);
      await expect(
        service.signup(signupData.email, signupData.password, signupData.name)
      ).rejects.toThrow('User with this email already exists');

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: signupData.email },
      });
      expect(mockPrismaService.user.create).not.toHaveBeenCalled();
    });

    it('should hash password with correct salt rounds', async () => {
      const hashedPassword = 'hashedPassword123';
      const createdUser = {
        id: 'user123',
        email: signupData.email,
        name: signupData.name,
        password: hashedPassword,
        roleId: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.role.upsert.mockResolvedValue({
        id: 'user',
        name: 'USER',
        description: 'Regular user',
      });
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(createdUser);
      mockedBcrypt.hash.mockResolvedValue(hashedPassword as never);

      await service.signup(
        signupData.email,
        signupData.password,
        signupData.name
      );

      expect(mockedBcrypt.hash).toHaveBeenCalledWith(signupData.password, 10);
    });
  });

  describe('login', () => {
    const loginData = {
      email: 'test@example.com',
      password: 'password123',
    };

    const mockUser = {
      id: 'user123',
      email: loginData.email,
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

    it('should login successfully and return user with JWT token', async () => {
      const mockToken = 'mock-jwt-token';

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(true as never);
      mockJwtService.sign.mockReturnValue(mockToken);

      const result = await service.login(loginData.email, loginData.password);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginData.email },
        include: { role: true },
      });
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(
        loginData.password,
        mockUser.password
      );
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role.name,
      });

      expect(result).toEqual({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          roleId: mockUser.roleId,
          createdAt: mockUser.createdAt,
          updatedAt: mockUser.updatedAt,
          role: mockUser.role,
        },
        access_token: mockToken,
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login(loginData.email, loginData.password)
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.login(loginData.email, loginData.password)
      ).rejects.toThrow('Invalid email or password');

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginData.email },
        include: { role: true },
      });
      expect(mockedBcrypt.compare).not.toHaveBeenCalled();
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      await expect(
        service.login(loginData.email, loginData.password)
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.login(loginData.email, loginData.password)
      ).rejects.toThrow('Invalid email or password');

      expect(mockedBcrypt.compare).toHaveBeenCalledWith(
        loginData.password,
        mockUser.password
      );
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });

    it('should generate JWT token with correct payload', async () => {
      const mockToken = 'mock-jwt-token';

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(true as never);
      mockJwtService.sign.mockReturnValue(mockToken);

      await service.login(loginData.email, loginData.password);

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role.name,
      });
    });
  });
});

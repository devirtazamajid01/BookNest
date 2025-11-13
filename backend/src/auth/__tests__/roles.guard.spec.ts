import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { RolesGuard } from '../roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    const mockExecutionContext = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: {
            id: 'user123',
            email: 'test@example.com',
            role: {
              name: 'USER',
            },
          },
        }),
      }),
    } as unknown as ExecutionContext;

    it('should allow access when no roles are specified', () => {
      mockReflector.getAllAndOverride.mockReturnValue(undefined);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith('roles', [
        mockExecutionContext.getHandler(),
        mockExecutionContext.getClass(),
      ]);
    });

    it('should allow access when user has required role', () => {
      mockReflector.getAllAndOverride.mockReturnValue(['USER', 'ADMIN']);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should deny access when user does not have required role', () => {
      mockReflector.getAllAndOverride.mockReturnValue(['ADMIN']);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(false);
    });

    it('should deny access when user is not present in request', () => {
      mockReflector.getAllAndOverride.mockReturnValue(['USER']);

      const mockContextWithoutUser = {
        ...mockExecutionContext,
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({}),
        }),
      } as unknown as ExecutionContext;

      const result = guard.canActivate(mockContextWithoutUser);

      expect(result).toBe(false);
    });

    it('should deny access when user has no role', () => {
      mockReflector.getAllAndOverride.mockReturnValue(['USER']);

      const mockContextWithoutRole = {
        ...mockExecutionContext,
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            user: {
              id: 'user123',
              email: 'test@example.com',
            },
          }),
        }),
      } as unknown as ExecutionContext;

      const result = guard.canActivate(mockContextWithoutRole);

      expect(result).toBe(false);
    });

    it('should handle multiple required roles correctly', () => {
      mockReflector.getAllAndOverride.mockReturnValue(['ADMIN', 'MODERATOR']);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(false);
    });

    it('should handle admin role correctly', () => {
      mockReflector.getAllAndOverride.mockReturnValue(['ADMIN']);

      const mockContextWithAdmin = {
        ...mockExecutionContext,
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            user: {
              id: 'admin123',
              email: 'admin@example.com',
              role: {
                name: 'ADMIN',
              },
            },
          }),
        }),
      } as unknown as ExecutionContext;

      const result = guard.canActivate(mockContextWithAdmin);

      expect(result).toBe(true);
    });
  });
});

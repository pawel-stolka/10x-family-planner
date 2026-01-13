import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../services/auth.service';
import { UserEntity } from '../entities/user.entity';
import {
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: jest.Mocked<Repository<UserEntity>>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUser: UserEntity = {
    userId: 'user-123',
    email: 'test@example.com',
    passwordHash: '$2b$10$hashedpassword',
    displayName: 'Test User',
    createdAt: new Date('2026-01-09T12:00:00Z'),
    updatedAt: new Date('2026-01-09T12:00:00Z'),
    deletedAt: null,
    lastLoginAt: null,
  };

  beforeEach(async () => {
    // Create mocked repository
    const mockUserRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    // Create mocked JWT service
    const mockJwtService = {
      sign: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockUserRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(getRepositoryToken(UserEntity));
    jwtService = module.get(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const registerDto = {
        email: 'newuser@example.com',
        password: 'SecurePass123!',
        displayName: 'New User',
      };

      userRepository.findOne.mockResolvedValue(null); // Email doesn't exist
      userRepository.create.mockReturnValue(mockUser as any);
      userRepository.save.mockResolvedValue(mockUser);
      jwtService.sign.mockReturnValue('mock-jwt-token');

      const result = await service.register(registerDto);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
      expect(userRepository.create).toHaveBeenCalled();
      expect(userRepository.save).toHaveBeenCalled();
      expect(jwtService.sign).toHaveBeenCalled();
      expect(result).toEqual({
        token: 'mock-jwt-token',
        user: {
          id: mockUser.userId,
          email: mockUser.email,
          displayName: mockUser.displayName,
          createdAt: mockUser.createdAt.toISOString(),
        },
      });
    });

    it('should throw ConflictException if email already exists', async () => {
      const registerDto = {
        email: 'existing@example.com',
        password: 'SecurePass123!',
      };

      userRepository.findOne.mockResolvedValue(mockUser); // Email exists

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException
      );
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
      expect(userRepository.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if email was soft-deleted', async () => {
      const registerDto = {
        email: 'deleted@example.com',
        password: 'SecurePass123!',
      };

      const deletedUser = { ...mockUser, deletedAt: new Date() };
      userRepository.findOne.mockResolvedValue(deletedUser as UserEntity);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException
      );
    });

    it('should hash the password before saving', async () => {
      const registerDto = {
        email: 'newuser@example.com',
        password: 'PlainTextPassword',
      };

      userRepository.findOne.mockResolvedValue(null);
      userRepository.create.mockReturnValue(mockUser as any);
      userRepository.save.mockResolvedValue(mockUser);
      jwtService.sign.mockReturnValue('mock-jwt-token');

      const bcryptHashSpy = jest.spyOn(bcrypt, 'hash');

      await service.register(registerDto);

      expect(bcryptHashSpy).toHaveBeenCalledWith(registerDto.password, 10);
    });
  });

  describe('login', () => {
    it('should login user with valid credentials', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'CorrectPassword',
      };

      userRepository.findOne.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      userRepository.save.mockResolvedValue(mockUser);
      jwtService.sign.mockReturnValue('mock-jwt-token');

      const result = await service.login(loginDto);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: {
          email: loginDto.email,
          deletedAt: IsNull(),
        },
      });
      expect(result).toEqual({
        token: 'mock-jwt-token',
        user: {
          id: mockUser.userId,
          email: mockUser.email,
          displayName: mockUser.displayName,
          createdAt: mockUser.createdAt.toISOString(),
        },
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      const loginDto = {
        email: 'nonexistent@example.com',
        password: 'password',
      };

      userRepository.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should throw UnauthorizedException if password is incorrect', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'WrongPassword',
      };

      userRepository.findOne.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should update lastLoginAt timestamp on successful login', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'CorrectPassword',
      };

      userRepository.findOne.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      userRepository.save.mockResolvedValue(mockUser);
      jwtService.sign.mockReturnValue('mock-jwt-token');

      await service.login(loginDto);

      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          lastLoginAt: expect.any(Date),
        })
      );
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      const userId = 'user-123';

      userRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.logout(userId)).resolves.not.toThrow();

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: {
          userId,
          deletedAt: IsNull(),
        },
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      const userId = 'nonexistent-user';

      userRepository.findOne.mockResolvedValue(null);

      await expect(service.logout(userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUserById', () => {
    it('should return user by ID', async () => {
      const userId = 'user-123';

      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.getUserById(userId);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: {
          userId,
          deletedAt: IsNull(),
        },
      });
      expect(result).toEqual({
        id: mockUser.userId,
        email: mockUser.email,
        displayName: mockUser.displayName,
        createdAt: mockUser.createdAt.toISOString(),
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      const userId = 'nonexistent-user';

      userRepository.findOne.mockResolvedValue(null);

      await expect(service.getUserById(userId)).rejects.toThrow(
        NotFoundException
      );
    });
  });
});

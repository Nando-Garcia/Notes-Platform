import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User } from '../entities/user.entity';

jest.mock('bcrypt');
const bcryptMock = bcrypt as jest.Mocked<typeof bcrypt>;

const mockUsersRepository = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
};

const mockJwtService = {
  signAsync: jest.fn(),
  verify: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockUsersRepository },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── register ─────────────────────────────────────────────────────────────

  describe('register', () => {
    it('debería registrar un usuario exitosamente', async () => {
      mockUsersRepository.findOne.mockResolvedValue(null);
      mockUsersRepository.create.mockReturnValue({ username: 'testuser' });
      mockUsersRepository.save.mockResolvedValue({ id: 1, username: 'testuser' });
      bcryptMock.hash.mockResolvedValue('hashed_password' as never);

      const result = await service.register('testuser', 'password123');

      expect(result).toEqual({ message: 'Usuario registrado exitosamente' });
      expect(mockUsersRepository.findOne).toHaveBeenCalledWith({ where: { username: 'testuser' } });
      expect(bcryptMock.hash).toHaveBeenCalledWith('password123', 10);
    });

    it('debería lanzar ConflictException si el usuario ya existe', async () => {
      mockUsersRepository.findOne.mockResolvedValue({ id: 1, username: 'testuser' });

      await expect(service.register('testuser', 'password123')).rejects.toThrow(ConflictException);
      expect(mockUsersRepository.save).not.toHaveBeenCalled();
    });
  });

  // ─── login ────────────────────────────────────────────────────────────────

  describe('login', () => {
    const user = { id: 1, username: 'testuser', password: 'hashed_password' };

    it('debería retornar access_token y refresh_token al hacer login', async () => {
      mockUsersRepository.findOne.mockResolvedValue(user);
      bcryptMock.compare.mockResolvedValue(true as never);
      mockJwtService.signAsync
        .mockResolvedValueOnce('access_token')
        .mockResolvedValueOnce('refresh_token');
      bcryptMock.hash.mockResolvedValue('hashed_refresh' as never);
      mockUsersRepository.update.mockResolvedValue({});

      const result = await service.login('testuser', 'password123');

      expect(result).toEqual({ access_token: 'access_token', refresh_token: 'refresh_token' });
      expect(bcryptMock.compare).toHaveBeenCalledWith('password123', 'hashed_password');
    });

    it('debería lanzar UnauthorizedException si el usuario no existe', async () => {
      mockUsersRepository.findOne.mockResolvedValue(null);

      await expect(service.login('noexiste', 'pass')).rejects.toThrow(UnauthorizedException);
      expect(bcryptMock.compare).not.toHaveBeenCalled();
    });

    it('debería lanzar UnauthorizedException si la contraseña es incorrecta', async () => {
      mockUsersRepository.findOne.mockResolvedValue(user);
      bcryptMock.compare.mockResolvedValue(false as never);

      await expect(service.login('testuser', 'wrong')).rejects.toThrow(UnauthorizedException);
      expect(mockJwtService.signAsync).not.toHaveBeenCalled();
    });
  });

  // ─── refresh ──────────────────────────────────────────────────────────────

  describe('refresh', () => {
    const payload = { sub: 1, username: 'testuser' };

    it('debería renovar los tokens con un refresh token válido', async () => {
      mockJwtService.verify.mockReturnValue(payload);
      mockUsersRepository.findOne.mockResolvedValue({
        id: 1,
        username: 'testuser',
        refreshToken: 'hashed_refresh',
      });
      bcryptMock.compare.mockResolvedValue(true as never);
      mockJwtService.signAsync
        .mockResolvedValueOnce('new_access')
        .mockResolvedValueOnce('new_refresh');
      bcryptMock.hash.mockResolvedValue('new_hashed' as never);
      mockUsersRepository.update.mockResolvedValue({});

      const result = await service.refresh('valid_refresh_token');

      expect(result).toEqual({ access_token: 'new_access', refresh_token: 'new_refresh' });
    });

    it('debería lanzar UnauthorizedException si el token JWT es inválido', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('invalid token');
      });

      await expect(service.refresh('bad_token')).rejects.toThrow(UnauthorizedException);
    });

    it('debería lanzar UnauthorizedException si el usuario no tiene sesión activa', async () => {
      mockJwtService.verify.mockReturnValue(payload);
      mockUsersRepository.findOne.mockResolvedValue({ id: 1, refreshToken: null });

      await expect(service.refresh('token')).rejects.toThrow(UnauthorizedException);
    });

    it('debería lanzar UnauthorizedException si el refresh token no coincide con el guardado', async () => {
      mockJwtService.verify.mockReturnValue(payload);
      mockUsersRepository.findOne.mockResolvedValue({ id: 1, refreshToken: 'hashed_refresh' });
      bcryptMock.compare.mockResolvedValue(false as never);

      await expect(service.refresh('invalid_token')).rejects.toThrow(UnauthorizedException);
    });
  });

  // ─── logout ───────────────────────────────────────────────────────────────

  describe('logout', () => {
    it('debería cerrar sesión y retornar mensaje de éxito', async () => {
      mockUsersRepository.update.mockResolvedValue({});

      const result = await service.logout(1);

      expect(result).toEqual({ message: 'Sesión cerrada exitosamente' });
      expect(mockUsersRepository.update).toHaveBeenCalledWith(1, { refreshToken: null });
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { AuthenticatedRequest } from './interfaces/authenticated-request.interface';

const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
  refresh: jest.fn(),
  logout: jest.fn(),
};

const mockReq = {
  user: { userId: 1, username: 'testuser' },
} as unknown as AuthenticatedRequest;

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('debería delegar a authService.register con los datos del body', async () => {
      mockAuthService.register.mockResolvedValue({ message: 'Usuario registrado exitosamente' });

      const result = await controller.register({ username: 'testuser', password: 'pass123' });

      expect(result).toEqual({ message: 'Usuario registrado exitosamente' });
      expect(mockAuthService.register).toHaveBeenCalledWith('testuser', 'pass123');
    });
  });

  describe('login', () => {
    it('debería delegar a authService.login y retornar los tokens', async () => {
      const tokens = { access_token: 'acc', refresh_token: 'ref' };
      mockAuthService.login.mockResolvedValue(tokens);

      const result = await controller.login({ username: 'testuser', password: 'pass123' });

      expect(result).toEqual(tokens);
      expect(mockAuthService.login).toHaveBeenCalledWith('testuser', 'pass123');
    });
  });

  describe('refresh', () => {
    it('debería delegar a authService.refresh con el refresh token', async () => {
      const tokens = { access_token: 'new_acc', refresh_token: 'new_ref' };
      mockAuthService.refresh.mockResolvedValue(tokens);

      const result = await controller.refresh({ refresh_token: 'old_token' });

      expect(result).toEqual(tokens);
      expect(mockAuthService.refresh).toHaveBeenCalledWith('old_token');
    });
  });

  describe('logout', () => {
    it('debería delegar a authService.logout con el userId del token', async () => {
      mockAuthService.logout.mockResolvedValue({ message: 'Sesión cerrada exitosamente' });

      const result = await controller.logout(mockReq);

      expect(result).toEqual({ message: 'Sesión cerrada exitosamente' });
      expect(mockAuthService.logout).toHaveBeenCalledWith(1);
    });
  });
});

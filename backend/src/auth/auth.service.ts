import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(username: string, password: string): Promise<{ message: string }> {
    const existing = await this.usersRepository.findOne({ where: { username } });
    if (existing) {
      throw new ConflictException('El usuario ya existe');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.usersRepository.create({
      username,
      password: hashedPassword,
    });
    await this.usersRepository.save(user);

    return { message: 'Usuario registrado exitosamente' };
  }

  async login(username: string, password: string): Promise<{ access_token: string; refresh_token: string }> {
    const user = await this.usersRepository.findOne({ where: { username } });
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const tokens = await this.generateTokens(user.id, user.username);
    await this.saveRefreshToken(user.id, tokens.refresh_token);
    return tokens;
  }

  async refresh(refreshToken: string): Promise<{ access_token: string; refresh_token: string }> {
    let payload: { sub: number; username: string };
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }

    const user = await this.usersRepository.findOne({ where: { id: payload.sub } });
    if (!user?.refreshToken) {
      throw new UnauthorizedException('Sesión no encontrada');
    }

    const isValid = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!isValid) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    const tokens = await this.generateTokens(user.id, user.username);
    await this.saveRefreshToken(user.id, tokens.refresh_token);
    return tokens;
  }

  async logout(userId: number): Promise<{ message: string }> {
    await this.usersRepository.update(userId, { refreshToken: null });
    return { message: 'Sesión cerrada exitosamente' };
  }

  private async generateTokens(userId: number, username: string) {
    const payload = { sub: userId, username };
    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: '7d',
      }),
    ]);
    return { access_token, refresh_token };
  }

  private async saveRefreshToken(userId: number, refreshToken: string): Promise<void> {
    const hashed = await bcrypt.hash(refreshToken, 10);
    await this.usersRepository.update(userId, { refreshToken: hashed });
  }
}

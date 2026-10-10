import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';

@Injectable()
export class AuthService {
  constructor(
  private readonly prisma: PrismaService,
  private readonly jwtService: JwtService,
) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: {
        email: registerDto.email,
      },
    });

    if (existingUser) {
      throw new ConflictException(
        'Email đã được đăng ký',
      );
    }

    const passwordHash = await bcrypt.hash(
      registerDto.password,
      10,
    );

    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        passwordHash,
        name: registerDto.name,
        loyaltyPoints: 0,
      },
      select: {
        id: true,
        email: true,
        name: true,
        loyaltyPoints: true,
        createdAt: true,
      },
    });

    return {
      message: 'Đăng ký thành công',
      user,
    };
  }

async login(loginDto: LoginDto) {
  const user = await this.prisma.user.findUnique({
    where: {
      email: loginDto.email,
    },
  });

  if (!user) {
    throw new UnauthorizedException(
      'Email hoặc mật khẩu không đúng',
    );
  }

  const passwordMatched = await bcrypt.compare(
    loginDto.password,
    user.passwordHash,
  );

  if (!passwordMatched) {
    throw new UnauthorizedException(
      'Email hoặc mật khẩu không đúng',
    );
  }

  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = await this.jwtService.signAsync(
    payload,
  );

  return {
    message: 'Đăng nhập thành công',
    accessToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      loyaltyPoints: user.loyaltyPoints,
      role: user.role,
    },
  };
}
}
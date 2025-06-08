import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { EmailsService } from '../emails/emails.service';
import * as bcrypt from 'bcrypt';
import { UserRole, UserStatus } from 'generated/prisma';
import { SignUpDto } from './dto/sign-up';
import { ActivateDto } from './dto/activate.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailsService: EmailsService,
  ) {}

  async activateUser({ password, token }: ActivateDto) {
    const decoded = this.jwtService.verify(token);

    const user = await this.prismaService.user.findUnique({
      where: { email: decoded.email },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.status === UserStatus.ACTIVE) {
      return { message: 'Account activated successfully' };
    }

    if (!password && !user.password) {
      throw new Error('Password required to activate account');
    }

    if (user.password) {
      await this.prismaService.user.update({
        where: { email: decoded.email },
        data: { status: UserStatus.ACTIVE },
      });

      return { message: 'Account activated successfully' };
    }

    const hashedPassword = await bcrypt.hash(password!, 10);

    await this.prismaService.user.update({
      where: { email: decoded.email },
      data: { password: hashedPassword, status: UserStatus.ACTIVE },
    });

    return { message: 'Account activated, password set successfully' };
  }

  async createUser({ email, password, role }: SignUpDto) {
    try {
      const existingUser = await this.prismaService.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new Error('Email already registered');
      }

      const hashedPassword = password ? await bcrypt.hash(password, 10) : '';

      const newUser = await this.prismaService.user.create({
        data: {
          email: email,
          password: hashedPassword,
          role: (role as UserRole) ?? UserRole.USER,
        },
      });

      const activationToken = await this.jwtService.signAsync(
        { email },
        { expiresIn: '7d' },
      );
      await this.emailsService.sendAccountActivationInvite(
        email,
        `${process.env.CLIENT_HOST}/activate?token=${activationToken}`,
      );

      return newUser;
    } catch (error) {
      throw new Error(error?.message);
    }
  }

  async signIn(signInDto: { email: string; password: string }) {
    const user = await this.prismaService.user.findUnique({
      where: { email: signInDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user?.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account not activated');
    }

    if (await bcrypt.compare(signInDto.password, user?.password ?? '')) {
      return {
        access_token: this.jwtService.sign({
          email: signInDto.email,
          sub: user.id,
          role: user.role,
        }),
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      };
    }
    throw new UnauthorizedException('Invalid credentials');
  }
}

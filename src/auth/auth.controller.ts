import {
  Controller,
  Request,
  Post,
  UseGuards,
  Body,
  Get,
  HttpException,
  BadRequestException,
  HttpStatus,
  Res,
  HttpCode,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { UserRole } from 'generated/prisma';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up';
import { ActivateDto } from './dto/activate.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('sign-up')
  @HttpCode(HttpStatus.CREATED)
  async signUp(@Body() signUpDto: SignUpDto) {
    try {
      await this.authService.createUser(signUpDto);
      return { message: 'Sign Up Successful' };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('sign-in')
  @HttpCode(HttpStatus.OK)
  async signIn(
    @Body() signInDto: SignInDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const { access_token, user: userInfo } =
        await this.authService.signIn(signInDto);

      // Set JWT as HTTP-only cookie
      res.cookie('token', access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
      });

      return { user: userInfo, message: 'Sign In Successful' };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('activate')
  @HttpCode(HttpStatus.OK)
  async activate(@Body() activateDto: ActivateDto) {
    try {
      return await this.authService.activateUser(activateDto);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('sign-out')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    return { message: 'Logged out' };
  }

  @Get('check-auth')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async checkAuth(@Request() req) {
    return {
      authenticated: true,
      user: req.user,
      message: 'Your authentication is working correctly',
    };
  }

  @Get('check-admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async checkAdminRole(@Request() req) {
    // This endpoint requires a valid JWT token AND the ADMIN role
    return {
      authenticated: true,
      role: req.user.role,
      hasAdminAccess: true,
      message: 'Your ADMIN role is working correctly',
    };
  }
}

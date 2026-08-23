import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { CreateUserDto, LoginUserDto } from './dto/auth.dto';
import { AuthService } from './auth.service';
import type { Response, Request } from 'express';
import {
  REFRESH_COOKIE,
  refreshCookieOptions,
} from './constants/auth.constants';
import { AuthGuard, type AuthenticatedRequest } from './guards/auth/auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() body: CreateUserDto) {
    const user = await this.authService.createUser(body);

    return {
      message: 'User created successfully',
      data: user,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: LoginUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken, data } =
      await this.authService.loginUser(body);

    res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions);

    return {
      message: 'User logged in successfully',
      data: {
        accessToken,
        user: data,
      },
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request) {
    const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;

    if (!token) {
      throw new UnauthorizedException('Refresh token not found');
    }

    return this.authService.refreshTokenService({ refreshToken: token });
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(REFRESH_COOKIE, refreshCookieOptions);

    return {
      message: 'User logged out successfully',
    };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async getMe(@Req() req: AuthenticatedRequest) {
    const userId = req.user!.sub;
    const user = await this.authService.getProfileInfo(userId);

    return {
      data: user,
    };
  }
}

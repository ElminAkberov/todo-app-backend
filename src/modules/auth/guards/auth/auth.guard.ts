import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

export interface JwtPayload {
  sub: string; // user_id
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const [type, token] = request?.headers?.authorization?.split(' ') ?? [];
    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Access token not found');
    }

    try {
      request.user = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: process.env.JWT_SECRET_ACCESS_TOKEN,
      });
    } catch (error) {
      console.warn(error);
      throw new UnauthorizedException('Invalid access token');
    }
    return true;
  }
}

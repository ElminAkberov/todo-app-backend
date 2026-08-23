import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import cookieParser from 'cookie-parser';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  private readonly parser = cookieParser();

  use(req: Request, res: Response, next: NextFunction) {
    this.parser(req, res, next);
  }
}

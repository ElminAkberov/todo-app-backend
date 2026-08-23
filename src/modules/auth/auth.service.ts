import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateUserDto, LoginUserDto, RefreshTokenDto } from './dto/auth.dto';
import { PrismaService } from '../prisma/prisma.service';
import bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

interface JwtPayload {
  sub: string;
}

const DUMMY_HASH =
  '$2b$12$C6UzMDM.H6dfI/f/IKcEeO1pFhCXUCU0RVIQ0O8jTvGxUxLOFtVGa';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async createUser(body: CreateUserDto) {
    const { email, password } = body;

    const findUser = await this.prisma.users.findUnique({ where: { email } });

    if (findUser) {
      throw new HttpException('User already exists', HttpStatus.CONFLICT);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await this.prisma.users.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    return user;
  }

  async loginUser(body: LoginUserDto) {
    const { email, password } = body;

    const findUser = await this.prisma.users.findUnique({
      where: { email },
      omit: { password: false },
    });

    const isPasswordValid = await bcrypt.compare(
      password,
      findUser?.password ?? DUMMY_HASH,
    );

    if (!findUser || !isPasswordValid) {
      throw new HttpException(
        'Email or password are incorrect',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const payload = { sub: findUser.id };

    const accessToken = await this.jwtService.signAsync(payload);
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET_REFRESH_TOKEN,
      expiresIn: '30d',
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _password, ...user } = findUser;

    return {
      accessToken,
      refreshToken,
      data: user,
    };
  }

  async refreshTokenService(body: RefreshTokenDto) {
    let payload: JwtPayload;

    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(
        body.refreshToken,
        { secret: process.env.JWT_SECRET_REFRESH_TOKEN },
      );
    } catch {
      throw new HttpException('Invalid Refresh token', HttpStatus.UNAUTHORIZED);
    }

    const findUser = await this.prisma.users.findUnique({
      where: { id: payload.sub },
    });

    if (!findUser) {
      throw new HttpException('User not found', HttpStatus.UNAUTHORIZED);
    }

    const accessToken = await this.jwtService.signAsync({ sub: findUser.id });

    return { accessToken };
  }

  async getProfileInfo(userInfo: string) {
    const findUser = await this.prisma.users.findUnique({
      where: { id: userInfo },
    });

    if (!findUser) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    return findUser;
  }
}

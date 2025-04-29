import { PrismaService } from '@/src/core/prisma/prisma.service';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginInput } from './inputs/login.input';
import { verify } from 'argon2';
import { type Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { getSessionMetada } from '@/src/core/shared/utils/session-metadata.util';
import { RedisService } from '@/src/core/redis/redis.service';
import {
  destroySession,
  saveSession,
} from '@/src/core/shared/utils/session.util';
import { VerificationService } from '../verification/verification.service';

@Injectable()
export class SessionService {
  public constructor(
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
    private readonly verificationService: VerificationService,
  ) {}

  public async findByUser(req: Request) {
    const userId = req.session.userId;

    if (!userId) {
      throw new NotFoundException('User not founded in session');
    }

    const keys = await this.redisService.keys('*');
    const userSessions: Array<{
      id: string;
      userId: string;
      createdAt: number;
      [key: string]: any;
    }> = [];

    for (const key of keys) {
      const sessionData = await this.redisService.get(key);
      if (sessionData) {
        const session = JSON.parse(sessionData) as {
          userId: string;
          createdAt: number;
          [key: string]: any;
        };

        if (session.userId === userId) {
          userSessions.push({
            ...session,
            id: key.split(':')[1],
          });
        }
      }
    }

    userSessions.sort((a, b) => b.createdAt - a.createdAt);

    return userSessions.filter((session) => session.id !== req.session.id);
  }

  public async findCurrent(req: Request) {
    const sessionId = req.session.id;

    const sessionData = await this.redisService.get(
      `${this.configService.getOrThrow<string>('SESSION_FOLDER')}${sessionId}`,
    );

    if (!sessionData) {
      throw new NotFoundException('Session data not found');
    }
    interface SessionData {
      userId: string;
      createdAt: number;
      [key: string]: any;
    }

    const session = JSON.parse(sessionData) as SessionData;

    return {
      ...session,
      id: sessionId,
    };
  }

  public async loginUser(req: Request, input: LoginInput, userAgent: string) {
    const { login, password } = input;

    const user = await this.prismaService.user.findFirst({
      where: {
        OR: [{ username: { equals: login } }, { email: { equals: login } }],
      },
    });

    if (!user) throw new NotFoundException('Пользователь не найден');

    if (!user.isEmailVerified) {
      await this.verificationService.sendVerificationToken(user);

      throw new BadRequestException(
        'Аккаунт не верифицирован. Пожалуйста, проверьте свою почту для подтверждения',
      );
    }

    const isValidPassword = await verify(user.password, password);

    if (!isValidPassword) throw new UnauthorizedException('Неверный пароль');

    const metadata = getSessionMetada(req, userAgent);

    return await saveSession(req, user, metadata);
  }

  public async logoutUser(req: Request) {
    await destroySession(req, this.configService);
  }

  public async clearSession(req: Request) {
    req.res?.clearCookie(this.configService.getOrThrow<string>('SESSION_NAME'));

    return true;
  }

  public async remove(req: Request, id: string) {
    if (req.session.id === id) {
      throw new ConflictException('Текущую сессию удалить нельзя');
    }

    await this.redisService.del(
      `${this.configService.getOrThrow<string>('SESSION_FOLDER')}${id}`,
    );

    return true;
  }
}

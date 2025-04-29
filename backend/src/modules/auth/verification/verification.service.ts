import { PrismaService } from '@/src/core/prisma/prisma.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MailService } from '../../libs/mail/mail.service';
import { VerificationInput } from './inputs/verification.input';
import { TokenType, type User } from '@/prisma/generated';
import { getSessionMetada } from '@/src/core/shared/utils/session-metadata.util';
import { Request } from 'express';
import { saveSession } from '@/src/core/shared/utils/session.util';
import { generateToken } from '@/src/core/shared/utils/generate-token.util';

@Injectable()
export class VerificationService {
  public constructor(
    private readonly prismaService: PrismaService,
    private readonly mailSerivce: MailService,
  ) {}

  public async verify(
    req: Request,
    input: VerificationInput,
    userAgent: string,
  ) {
    const { token } = input;

    const existingToken = await this.prismaService.token.findUnique({
      where: {
        token,
        type: TokenType.EMAIL_VERIFY,
      },
    });

    if (!existingToken) {
      throw new NotFoundException('Токен не найден');
    }

    const hasExpired = new Date(existingToken.expiresIn) < new Date();

    if (hasExpired) {
      throw new BadRequestException('Токен истек');
    }

    const user = await this.prismaService.user.update({
      where: {
        id: existingToken.userId!,
      },
      data: {
        isEmailVerified: true,
      },
    });

    await this.prismaService.token.delete({
      where: {
        id: existingToken.id,
        type: TokenType.EMAIL_VERIFY,
      },
    });

    const metadata = getSessionMetada(req, userAgent);

    return await saveSession(req, user, metadata);
  }

  public async sendVerificationToken(user: User) {
    const verificationToken = await generateToken(
      this.prismaService,
      user,
      TokenType.EMAIL_VERIFY,
    );

    await this.mailSerivce.sendVerificationToken(
      user.email,
      verificationToken.token,
    );

    return true;
  }
}

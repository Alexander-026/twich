import { type TokenType, User } from '@/prisma/generated';
import { PrismaService } from '../../prisma/prisma.service';
import { v4 as uuid } from 'uuid';
export async function generateToken(
  prismaService: PrismaService,
  user: User,
  type: TokenType,
  isUUID: boolean = false,
) {
  let token: string;

  if (isUUID) {
    token = uuid();
  } else {
    token = Math.floor(Math.random() * (1000000 - 100000) + 100000).toString();
  }

  const expiresIn = new Date(new Date().getTime() + 300000);

  const existingToken = await prismaService.token.findFirst({
    where: {
      type,
      user: {
        id: user.id,
      },
    },
  });

  if (existingToken) {
    await prismaService.token.delete({
      where: {
        id: existingToken.id,
      },
    });
  }

  const newToken = await prismaService.token.create({
    data: {
      token,
      expiresIn,
      type,
      user: {
        connect: {
          id: user.id,
        },
      },
    },
    include: {
      user: true,
    },
  });

  return newToken;
}

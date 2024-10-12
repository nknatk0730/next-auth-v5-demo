
'use server';

import { getUserByEmail } from '@/db/user';
import { getVerificationTokenByToken } from '@/db/verification-token';
import prisma from '@/lib/db';
import { ActionsResult } from '@/types/actions-result';

export const newVerification = async (
  token: string
): Promise<ActionsResult> => {
  const existingToken = await getVerificationTokenByToken(token);

  if (!existingToken) {
    return {
      isSuccess: false,
      error: {
        message: 'トークンが見つかりませんでした。',
      },
    };
  }

  const hasExpired = new Date(existingToken.expires) < new Date();

  if (hasExpired) {
    return {
      isSuccess: false,
      error: { message: 'トークンの有効期限が切れています。' },
    };
  }

  const existingUser = await getUserByEmail(existingToken.email);

  if (!existingUser) {
    return {
      isSuccess: false,
      error: { message: 'ユーザーが見つかりませんでした。' },
    };
  }

  await prisma.user.update({
    where: { id: existingUser.id },
    data: {
      emailVerified: new Date(),
      email: existingToken.email,
    },
  });

  await prisma.verificationToken.delete({
    where: { id: existingToken.id },
  });

  return {
    isSuccess: true,
    message:
      'メールアドレスの認証が完了しました。サインインページに移動しますので、このままお待ちください。',
  };
};

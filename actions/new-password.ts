'use server';

import * as z from 'zod';
import bcrypt from 'bcryptjs';
import { newPasswordSchema } from '@/schemas/index';
import { getUserByEmail } from '@/db/user';
import prisma from '@/lib/db';
import { ActionsResult } from '@/types/actions-result';
import { getPasswordResetTokenByToken } from '@/db/reset-password-token';

export const newPassword = async (
  values: z.infer<typeof newPasswordSchema>,
  token?: string | null
): Promise<ActionsResult> => {
  if (!token) {
    return {
      isSuccess: false,
      error: {
        message: 'トークンが無効です。',
      },
    };
  }

  const validatedFields = newPasswordSchema.safeParse(values);

  if (!validatedFields.success) {
    return { isSuccess: false, error: validatedFields.error };
  }

  const { password } = validatedFields.data;

  const existingToken = await getPasswordResetTokenByToken(token);

  if (!existingToken) {
    return {
      isSuccess: false,
      error: {
        message: 'トークンが無効です。',
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
      error: { message: 'ユーザーが見つかりません。' },
    };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: { id: existingUser.id },
    data: { password: hashedPassword },
  });

  await prisma.passwordResetToken.delete({
    where: { id: existingToken.id },
  });

  return { isSuccess: true, message: 'パスワードをリセットしました。' };
};

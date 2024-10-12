'use server';

import { signUpSchema } from '@/schemas';
import { ActionsResult } from '@/types/actions-result';
import { z } from 'zod';
import { getUserByEmail } from '@/db/user';
import { handleError } from '@/lib/utils';
import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';
import { sendVerificationEmail } from '@/lib/mail';
import { generateVerificationToken } from '@/lib/tokens';

export const signUp = async (
  values: z.infer<typeof signUpSchema>
): Promise<ActionsResult> => {
  const validatedFields = signUpSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      isSuccess: false,
      error: {
        message: validatedFields.error.message,
      },
    };
  }

  const { email, password, nickname } = validatedFields.data;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const existingUser = await getUserByEmail(email);

    if (existingUser) {
      return {
        isSuccess: false,
        error: {
          message: 'このメールアドレスは既に登録されています。',
        },
      };
    }

    await prisma.user.create({
      data: {
        name: nickname,
        email,
        password: hashedPassword,
      },
    });

    const verificationToken = await generateVerificationToken(email);
    await sendVerificationEmail(
      verificationToken.email,
      verificationToken.token
    );

    return {
      isSuccess: true,
      message: '確認メールを送信しました。',
    };
  } catch (error) {
    handleError(error);

    return {
      isSuccess: false,
      error: {
        message: 'サインアップに失敗しました。',
      },
    };
  }
};

import bcrypt from 'bcryptjs';
import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { signInSchema } from './schemas';
import { getUserByEmail } from './db/user';
import Github from 'next-auth/providers/github';
import Google from 'next-auth/providers/google';


export default {
  providers: [
    Google,
    Github,
    // TODO: Google,Github認証を追加する

    Credentials({
      async authorize(credentials) {
        const validatedFields = signInSchema.safeParse(credentials);

        if (validatedFields.success) {
          const { email, password } = validatedFields.data;

          const user = await getUserByEmail(email);
          if (!user || !user.password) return null;

          const passwordsMatch = await bcrypt.compare(password, user.password);

          if (passwordsMatch) return user;
        }

        return null;
      },
    }),
  ],
} satisfies NextAuthConfig;
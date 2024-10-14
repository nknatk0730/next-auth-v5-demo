import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import authConfig from '@/auth.config';
import { UserRole } from '@prisma/client';
import { getUserById } from '@/db/user';
import prisma from './lib/db';
import { getAccountByUserId } from './db/accounts';
import { getTwoFactorConfirmationByUserId } from './db/two-factor-confirmation';
import { apiAuthPrefix, authRoutes, DEFAULT_LOGIN_REDIRECT, publicRoutes } from './routes';

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  pages: {
    signIn: "/signin",
  },
  events: {
    async linkAccount({ user }) {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      });
    },
  },
  callbacks: {
    authorized({ request, auth }) {
      const { nextUrl } = request;
      const isLoggedIn = !!auth;

      const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
      const isPublicRoute = publicRoutes.includes(nextUrl.pathname);
      const isAuthRoute = authRoutes.includes(nextUrl.pathname);

      if (isApiAuthRoute) {
        // /api/auth は未認証でもアクセス可能
        return true;
      }

      if (isAuthRoute) {
        if (isLoggedIn) {
          // すでにログイン済みの場合は、リダイレクトさせる
          return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
        }

        // 未ログインで認証ページの場合は、アクセス可能
        return true;
      }

      return !(!isLoggedIn && !isPublicRoute);
    },
    async signIn({ user, account }) {
      if (account?.provider !== "credentials") return true;

      const existingUser = await getUserById(user.id!);

      if (!existingUser?.emailVerified) return false;

      if (existingUser.isTwoFactorEnabled) {
        const twoFactorConfirmation = await getTwoFactorConfirmationByUserId(
          existingUser.id
        );

        if (!twoFactorConfirmation) return false;

        await prisma.twoFactorConfirmation.delete({
          where: { id: twoFactorConfirmation.id },
        });
      }
      // Prevent sign in without email verification
      if (!existingUser?.emailVerified) return false;

      return true;
    },
    async session({ token, session }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      if (session.user) {
        session.user.name = token.name;
        session.user.email = token.email!;
      }
      if (token.role && session.user) {
        session.user.role = token.role as UserRole;
      }
      if (session.user) {
        session.user.isTwoFactorEnabled = token.isTwoFactorEnabled as boolean;
      }
      return session;
    },
    async jwt({ token }) {
      if (!token.sub) return token;

      const existingUser = await getUserById(token.sub);
      if (!existingUser) return token;

      const existingAccount = await getAccountByUserId(existingUser.id);

      token.isOAuth = !!existingAccount;
      token.name = existingUser.name;
      token.email = existingUser.email;
      token.role = existingUser.role;
      token.isTwoFactorEnabled = existingUser.isTwoFactorEnabled;

      return token;
    },
  },
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  ...authConfig,
});

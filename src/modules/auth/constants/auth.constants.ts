import type { CookieOptions } from 'express';

export const REFRESH_COOKIE = 'refreshToken';

export const refreshCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // http or https
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  path: '/auth',
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

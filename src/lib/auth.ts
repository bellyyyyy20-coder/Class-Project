// Host login helpers.
//
// The host cookie is a signature computed from HOST_PASSWORD. That means:
// - nobody can invent a valid cookie without knowing the password
// - changing the password in .env instantly logs everyone out
import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from './env.ts';

export const HOST_COOKIE_NAME = 'shortstay_host';

/** The only cookie value that counts as "logged in". */
function expectedSessionValue(): string {
  return createHmac('sha256', env('HOST_PASSWORD'))
    .update('shortstay-host-session-v1')
    .digest('hex');
}

/** The value to store in the host cookie after a successful login. */
export function sessionCookieValue(): string {
  return expectedSessionValue();
}

/** True when the cookie matches the signature for the current password. */
export function isValidSessionCookie(value: string | undefined): boolean {
  const expected = expectedSessionValue();
  if (!value || !expected) return false;

  const given = Buffer.from(value);
  const wanted = Buffer.from(expected);
  if (given.length !== wanted.length) return false;

  // timingSafeEqual avoids leaking the answer through how long the check takes.
  return timingSafeEqual(given, wanted);
}

/** Checks the typed password against HOST_PASSWORD, without leaking timing. */
export function checkHostPassword(input: string): boolean {
  const password = env('HOST_PASSWORD');
  if (password === '') return false;

  const given = Buffer.from(input);
  const wanted = Buffer.from(password);
  if (given.length !== wanted.length) return false;

  return timingSafeEqual(given, wanted);
}

// POST /host/session
// Checks the password from the login form and sets the host cookie.
import type { APIRoute } from 'astro';
import { checkHostPassword, HOST_COOKIE_NAME, sessionCookieValue } from '../../lib/auth.ts';

export const POST: APIRoute = async ({ request, cookies }) => {
  const form = await request.formData();
  const password = String(form.get('password') ?? '');

  if (!checkHostPassword(password)) {
    return new Response(null, {
      status: 303,
      headers: { Location: '/host/login?error=wrong' },
    });
  }

  // httpOnly means JavaScript in the browser cannot read the cookie, which
  // keeps it out of reach of any script that sneaks onto the page.
  cookies.set(HOST_COOKIE_NAME, sessionCookieValue(), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // one week
  });

  return new Response(null, { status: 303, headers: { Location: '/host' } });
};

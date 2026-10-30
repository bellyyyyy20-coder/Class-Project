// GET /host/logout - forgets the host cookie and goes back to the login page.
import type { APIRoute } from 'astro';
import { HOST_COOKIE_NAME } from '../../lib/auth.ts';

export const GET: APIRoute = async ({ cookies }) => {
  cookies.delete(HOST_COOKIE_NAME, { path: '/' });
  return new Response(null, { status: 303, headers: { Location: '/host/login' } });
};

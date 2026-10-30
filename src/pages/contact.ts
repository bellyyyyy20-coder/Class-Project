// POST /contact
// The contact form on the landing page has no JavaScript: it posts here, we
// check everything on the server, email the host through Resend, and send the
// guest back to the page with a clear success or error message.
import type { APIRoute } from 'astro';
import { sendEmail } from '../lib/email.ts';
import { env } from '../lib/env.ts';

const CONTACT_ANCHOR = '#contact';

/** Sends the guest back with a code the page turns into a visible message. */
function backWith(code: string): Response {
  return new Response(null, {
    status: 303,
    headers: { Location: `/?contact=${code}${CONTACT_ANCHOR}` },
  });
}

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const read = (name: string) => String(form.get(name) ?? '').trim();

  // Honeypot: a hidden field real people never see. Bots fill it in, so we
  // quietly pretend it worked and send nothing.
  if (read('website') !== '') {
    return backWith('sent');
  }

  const name = read('name');
  const email = read('email');
  const phone = read('phone');
  const message = read('message');

  // Server-side validation (never trust the browser).
  const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const looksLikePhone = /^[+()\d][\d\s()+.-]{6,}$/.test(phone);

  if (
    name.length < 2 ||
    name.length > 100 ||
    !looksLikeEmail ||
    email.length > 254 ||
    !looksLikePhone ||
    phone.length > 30 ||
    message.length < 5 ||
    message.length > 3000
  ) {
    return backWith('invalid');
  }

  const result = await sendEmail({
    // The host's own address comes from .env, never from the form.
    to: env('HOST_EMAIL'),
    replyTo: email,
    subject: `ShortStay enquiry from ${name}`,
    text: [
      'New enquiry from the ShortStay website',
      '',
      `Name:  ${name}`,
      `Email: ${email}`,
      `Phone: ${phone}`,
      '',
      'Message:',
      message,
    ].join('\n'),
    html: `
      <h2 style="font-family:Georgia,serif;color:#1B3A8C;margin:0 0 16px;">New enquiry from the ShortStay website</h2>
      <table cellpadding="0" cellspacing="0" style="font-family:Arial,sans-serif;font-size:15px;color:#1F2433;">
        <tr><td style="padding:4px 12px 4px 0;color:#62697A;">Name</td><td>${escapeHtml(name)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#62697A;">Email</td><td>${escapeHtml(email)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#62697A;">Phone</td><td>${escapeHtml(phone)}</td></tr>
      </table>
      <p style="font-family:Arial,sans-serif;font-size:15px;color:#1F2433;white-space:pre-wrap;margin-top:20px;">${escapeHtml(message)}</p>
    `,
  });

  if (result !== 'sent') {
    // Either no Resend key is set, or Resend refused. Tell the guest honestly
    // and give them WhatsApp and email as a way through.
    return backWith('error');
  }

  return backWith('sent');
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

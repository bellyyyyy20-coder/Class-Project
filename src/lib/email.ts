// Sending email through Resend (https://resend.com).
//
// We call Resend's HTTP API with fetch, so no extra npm package is needed.
// The API key is only ever read on the server, from .env.
//
// Sending email must never crash the site, so sendEmail() catches every
// problem and reports a simple result instead of throwing.
import { env } from './env.ts';

export type EmailResult = 'sent' | 'skipped-no-key' | 'failed';

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  /** Optional rich version. Plain text above is always sent as the fallback. */
  html?: string;
  /** Where the host's "Reply" should go (the guest's address, for example). */
  replyTo?: string;
}

/** True when both the key and the "from" address are present in .env. */
export function emailConfigured(): boolean {
  return env('RESEND_API_KEY').trim() !== '' && env('FROM_EMAIL').trim() !== '';
}

/**
 * Sends one email. Returns:
 *  - 'sent'           the API accepted it
 *  - 'skipped-no-key' no API key/from address in .env, so nothing was sent
 *  - 'failed'         Resend refused, or the network timed out
 */
export async function sendEmail(message: EmailMessage): Promise<EmailResult> {
  const apiKey = env('RESEND_API_KEY').trim();
  const from = env('FROM_EMAIL').trim();

  if (apiKey === '' || from === '') {
    return 'skipped-no-key';
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      // Give up after 8 seconds so a slow email cannot stall the form.
      signal: AbortSignal.timeout(8000),
      body: JSON.stringify({
        from,
        to: [message.to],
        subject: message.subject,
        text: message.text,
        ...(message.html ? { html: message.html } : {}),
        ...(message.replyTo ? { reply_to: message.replyTo } : {}),
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      console.error(`[email] Resend replied ${response.status}: ${detail}`);
      return 'failed';
    }

    return 'sent';
  } catch (error) {
    console.error('[email] could not send:', error);
    return 'failed';
  }
}

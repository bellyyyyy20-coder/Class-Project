// Talks to Paystack's API. Everything here runs on the server only - the
// secret key never reaches the browser.
//
// If PAYSTACK_SECRET_KEY is empty, the app runs in "demo payment mode":
// bookings are confirmed locally and the confirmation page shows a clear
// DEMO badge. As soon as you put a real test key in .env, the Paystack path
// is used instead and demo mode turns itself off.
import { env } from './env.ts';

const PAYSTACK_BASE = 'https://api.paystack.co';

/** True when a Paystack secret key has been configured in .env. */
export function hasPaystackKey(): boolean {
  return env('PAYSTACK_SECRET_KEY').trim() !== '';
}

function paystackHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${env('PAYSTACK_SECRET_KEY').trim()}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Starts a Paystack checkout and returns the address to send the guest to.
 * The amount must already be in kobo.
 */
export async function initializePayment(options: {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl: string;
}): Promise<string> {
  const response = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: 'POST',
    headers: paystackHeaders(),
    body: JSON.stringify({
      email: options.email,
      amount: options.amountKobo,
      reference: options.reference,
      callback_url: options.callbackUrl,
      currency: 'NGN',
    }),
  });

  const body = (await response.json()) as {
    status?: boolean;
    message?: string;
    data?: { authorization_url?: string };
  };

  if (!response.ok || !body.status || !body.data?.authorization_url) {
    throw new Error(body.message ?? 'Paystack refused to start the payment');
  }

  return body.data.authorization_url;
}

export interface VerificationResult {
  /** 'success' only when Paystack says the money arrived. */
  status: 'success' | 'failed' | 'pending' | 'reversed';
  /** Amount Paystack says was paid, in kobo. */
  amountKobo: number;
}

/**
 * Asks Paystack whether a reference really was paid. We never trust the
 * browser redirect - only this answer confirms a booking.
 */
export async function verifyPayment(reference: string): Promise<VerificationResult> {
  const response = await fetch(
    `${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: paystackHeaders() }
  );

  const body = (await response.json()) as {
    status?: boolean;
    message?: string;
    data?: { status?: string; amount?: number };
  };

  if (!response.ok || !body.status || !body.data) {
    throw new Error(body.message ?? 'Could not verify the payment with Paystack');
  }

  const paystackStatus = body.data.status ?? 'failed';
  const known: VerificationResult['status'][] = ['success', 'failed', 'pending', 'reversed'];

  return {
    status: (known as string[]).includes(paystackStatus)
      ? (paystackStatus as VerificationResult['status'])
      : 'failed',
    amountKobo: body.data.amount ?? 0,
  };
}

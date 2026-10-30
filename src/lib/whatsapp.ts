// Builds the WhatsApp links used by the header button, the floating mobile
// button and the contact section.
//
// The number comes from PUBLIC_WHATSAPP_NUMBER in .env. It is read at request
// time, so changing .env is enough - no rebuild and no code change.
import { env } from './env.ts';

/** The message that is already typed for the guest when WhatsApp opens. */
export const DEFAULT_WHATSAPP_MESSAGE =
  'Hello ShortStay, I would like to ask about a stay.';

/** Just the digits of the number, e.g. "+234 801 234 5678" -> "2348012345678". */
export function whatsappNumber(): string {
  return env('PUBLIC_WHATSAPP_NUMBER').replace(/\D/g, '');
}

/**
 * Returns a wa.me link with a prefilled message, or '' when no number is set.
 * Callers show a fallback link in that case, so the site never has a dead end.
 */
export function whatsappUrl(message: string = DEFAULT_WHATSAPP_MESSAGE): string {
  const number = whatsappNumber();
  if (!number) return '';
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

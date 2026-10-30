// Money is stored in the database as kobo (whole numbers of 1/100 Naira),
// because floating point numbers are unsafe for money. We only convert to
// Naira when showing it to a person.

/** 4500000 kobo becomes "₦45,000". */
export function formatNaira(kobo: number): string {
  const naira = kobo / 100;
  return `₦${naira.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
}

/** Turns a Naira amount from a form ("45,000" or "45000") into kobo. */
export function nairaToKobo(value: string): number | null {
  const cleaned = value.replace(/[,\s₦]/g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  return Math.round(Number(cleaned) * 100);
}

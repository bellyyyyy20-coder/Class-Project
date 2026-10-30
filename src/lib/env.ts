// Reads the .env file in the project folder into process.env.
//
// Why we do this ourselves: Astro/Vite copies .env values into the code at
// build time, but our server needs the current values at request time (for
// example the Paystack key). Reading the file ourselves is simple and always
// up to date.
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

let alreadyLoaded = false;

export function loadEnv(): void {
  if (alreadyLoaded) return;
  alreadyLoaded = true;

  const envFile = resolve(process.cwd(), '.env');
  if (!existsSync(envFile)) return;

  for (const line of readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    // Skip empty lines and comments like "# my note"
    if (trimmed === '' || trimmed.startsWith('#')) continue;

    const equalsIndex = trimmed.indexOf('=');
    if (equalsIndex === -1) continue;

    const key = trimmed.slice(0, equalsIndex).trim();
    let value = trimmed.slice(equalsIndex + 1).trim();

    // Remove surrounding quotes if the value has them
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    // A value already set in the real environment wins over the file
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

/** Returns a value from .env, or an empty string if it is not set. */
export function env(name: string): string {
  loadEnv();
  return process.env[name] ?? '';
}

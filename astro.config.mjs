import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

// `output: 'server'` means pages are rendered by the server for each request.
// That is required because we read the database and check availability at request time.
export default defineConfig({
  output: 'server',
  adapter: vercel(),
});

import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

// `output: 'server'` means pages are rendered by the server for each request.
// That is required because we read the database and check availability at request time.
export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
});

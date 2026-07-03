// Load environment variables from .env file
// Bun has built-in .env support, but we also manually load for compatibility with ts-node
import { z } from 'zod';

// In Bun, process.env automatically loads .env files
// For Node.js compatibility, we could add dotenv here if needed

const envSchema = z.object({
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  TURSO_DATABASE_URL: z.string().default('http://127.0.0.1:8080'),
  TURSO_AUTH_TOKEN: z.string().optional(),
  JWT_SECRET: z.string().default('dev-secret-change-in-production'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = parsed.data;

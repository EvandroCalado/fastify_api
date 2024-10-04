import { config } from 'dotenv';
import { z } from 'zod';

if (process.env.NODE_ENV === 'test') {
  config({ path: '.env.test' });
} else {
  config();
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('production'),
  DATABASE_CLIENT: z.enum(['sqlite', 'pg']),
  DATABASE_URL: z.string(),
  PORT: z.coerce.number().default(3333),
});

const validateEnv = envSchema.safeParse(process.env);

if (validateEnv.success === false) {
  console.error(
    '❌ Invalid environment variables:',
    validateEnv.error.format(),
  );

  process.exit(1);
}

export const env = validateEnv.data;

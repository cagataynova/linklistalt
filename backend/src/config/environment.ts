import { z } from 'zod';

const environmentSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    PORT: z.coerce.number().int().positive().default(3001),
    DATABASE_URL: z.string().min(1),
    FRONTEND_ORIGINS: z.string().default('http://localhost:3000'),
    AUTH_MODE: z.enum(['firebase', 'emulator', 'test']).default('firebase'),
    FIREBASE_PROJECT_ID: z.string().default('linklist-local'),
    FIREBASE_CLIENT_EMAIL: z.string().optional(),
    FIREBASE_PRIVATE_KEY: z.string().optional(),
    FIREBASE_AUTH_EMULATOR_HOST: z.string().optional(),
    SIGNUP_TICKET_SECRET: z.string().min(32),
    R2_ENDPOINT: z.string().url().optional(),
    R2_REGION: z.string().default('auto'),
    R2_BUCKET: z.string().default('linklist'),
    R2_ACCESS_KEY_ID: z.string().optional(),
    R2_SECRET_ACCESS_KEY: z.string().optional(),
    R2_PUBLIC_URL: z.string().url().optional(),
    PRODUCT_FETCH_TIMEOUT_MS: z.coerce.number().int().positive().default(8000),
    PRODUCT_FETCH_MAX_BYTES: z.coerce
      .number()
      .int()
      .positive()
      .default(2_000_000),
  })
  .superRefine((environment, context) => {
    if (environment.NODE_ENV !== 'production') return;
    for (const key of [
      'FIREBASE_CLIENT_EMAIL',
      'FIREBASE_PRIVATE_KEY',
      'R2_ENDPOINT',
      'R2_ACCESS_KEY_ID',
      'R2_SECRET_ACCESS_KEY',
      'R2_PUBLIC_URL',
    ] as const) {
      if (!environment[key])
        context.addIssue({
          code: 'custom',
          path: [key],
          message: `${key} production ortamında zorunludur.`,
        });
    }
  });

export type Environment = z.infer<typeof environmentSchema>;

export function validateEnvironment(
  config: Record<string, unknown>,
): Environment {
  return environmentSchema.parse(config);
}

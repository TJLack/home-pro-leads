import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  NEXT_PUBLIC_APP_NAME: z
    .string()
    .min(1)
    .default("Website Revenue Leak Detector"),
  NEXT_PUBLIC_COMPANY_NAME: z.string().min(1).default("Key City Digital"),
  NEXT_PUBLIC_TAGLINE: z.string().min(1).default("We Build Local Legends"),
});

export const env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_COMPANY_NAME: process.env.NEXT_PUBLIC_COMPANY_NAME,
  NEXT_PUBLIC_TAGLINE: process.env.NEXT_PUBLIC_TAGLINE,
});

import { env } from "@/lib/config/env";

export const appConfig = {
  productName: env.NEXT_PUBLIC_APP_NAME,
  companyName: env.NEXT_PUBLIC_COMPANY_NAME,
  tagline: env.NEXT_PUBLIC_TAGLINE,
} as const;

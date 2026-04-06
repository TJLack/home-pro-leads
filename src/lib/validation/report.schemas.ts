import { z } from "zod";

export const scanRequestSchema = z.object({
  websiteUrl: z.string().trim().min(1, "Please enter a website URL."),
});

export const unlockRequestSchema = z.object({
  reportReference: z.string().trim().min(1, "Missing report reference."),
  name: z.string().trim().min(2, "Please enter your full name."),
  email: z.string().trim().email("Please provide a valid email address."),
  phone: z.string().trim().min(7, "Please provide a valid phone number."),
  businessName: z.string().trim().min(2, "Please provide your business name."),
  city: z.string().trim().min(2, "Please provide your city."),
  monthlyMarketingBudget: z
    .preprocess((value: unknown) => {
      if (value === "" || value === null || value === undefined) {
        return undefined;
      }
      const normalized = Number(value);
      return Number.isFinite(normalized) ? normalized : value;
    }, z.number().int().positive().optional())
    .optional(),
});

import { db } from "@/lib/storage/db";
import type { LeadRecord } from "@/lib/types/domain";

export type CreateLeadInput = {
  reportReference: string;
  name: string;
  email: string;
  phone: string;
  businessName: string;
  city: string;
  monthlyMarketingBudget?: number;
  submittedUrl: string;
};

export function createLead(input: CreateLeadInput): LeadRecord {
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  db.prepare(
    `
      INSERT INTO leads (
        id, report_reference, name, email, phone, business_name, city, monthly_marketing_budget, submitted_url, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
  ).run(
    id,
    input.reportReference,
    input.name,
    input.email,
    input.phone,
    input.businessName,
    input.city,
    input.monthlyMarketingBudget ?? null,
    input.submittedUrl,
    createdAt,
  );

  return {
    id,
    reportReference: input.reportReference,
    name: input.name,
    email: input.email,
    phone: input.phone,
    businessName: input.businessName,
    city: input.city,
    monthlyMarketingBudget: input.monthlyMarketingBudget ?? null,
    submittedUrl: input.submittedUrl,
    createdAt,
  };
}

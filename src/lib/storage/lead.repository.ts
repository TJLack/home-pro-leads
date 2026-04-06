import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { getStorageDir } from "@/lib/storage/storage-paths";
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

function getLeadsFilePath() {
  return path.join(getStorageDir(), "leads.json");
}

async function readAllLeads(): Promise<LeadRecord[]> {
  const filePath = getLeadsFilePath();
  await mkdir(path.dirname(filePath), { recursive: true });

  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as LeadRecord[];
  } catch {
    return [];
  }
}

async function writeAllLeads(records: LeadRecord[]) {
  const filePath = getLeadsFilePath();
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(records, null, 2), "utf8");
}

export async function createLead(input: CreateLeadInput): Promise<LeadRecord> {
  const lead: LeadRecord = {
    id: crypto.randomUUID(),
    reportReference: input.reportReference,
    name: input.name,
    email: input.email,
    phone: input.phone,
    businessName: input.businessName,
    city: input.city,
    monthlyMarketingBudget: input.monthlyMarketingBudget ?? null,
    submittedUrl: input.submittedUrl,
    createdAt: new Date().toISOString(),
  };

  const all = await readAllLeads();
  all.push(lead);
  await writeAllLeads(all);

  return lead;
}

import { z } from "zod";

const basePackageSectionSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().default(""),
  packages: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid package ID format")).default([]),
  isActive: z.boolean().default(true),
});

export const createPackageSectionSchema = basePackageSectionSchema;
export const updatePackageSectionSchema = basePackageSectionSchema.partial();

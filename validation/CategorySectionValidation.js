import { z } from "zod";

export const createCategorySectionSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().optional(),
  categories: z
    .array(z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid category ID format"))
    .default([]),
  isActive: z.boolean().default(true),
});

export const updateCategorySectionSchema = createCategorySectionSchema.partial();

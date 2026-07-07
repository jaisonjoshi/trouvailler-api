import { z } from "zod";

export const createLocationSectionSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().optional(),
  locations: z
    .array(z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid location ID format"))
    .default([]),
  isActive: z.boolean().default(true),
});

export const updateLocationSectionSchema = createLocationSectionSchema.partial();

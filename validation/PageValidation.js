import { z } from "zod";

const pageSectionSchema = z.object({
  type: z.enum([
    "package-carousel",
    "location-carousel",
    "category-carousel",
    "navbar",
    "hero-header",
    "footer",
  ]),
  title: z.string().trim().optional(),
  isVisible: z.boolean().default(true),
  order: z.number().default(0),
  config: z
    .object({
      packageSectionId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId").optional(),
      locationSectionId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId").optional(),
      categorySectionId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId").optional(),
    })
    .optional(),
});

const seoValidationSchema = z.object({
  title: z.string().trim().optional().default(""),
  description: z.string().trim().optional().default(""),
  keywords: z.string().trim().optional().default(""),
}).optional();

const basePageSchema = z.object({
  title: z.string().trim().min(1, "Page title is required"),
  slug: z
    .string()
    .trim()
    .min(1, "Page slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase alphanumeric characters and hyphens"),
  isActive: z.boolean().default(true),
  type: z.enum(["system", "location", "category"]).default("system"),
  sections: z.array(pageSectionSchema).default([]),
  seo: seoValidationSchema,
});

export const createPageSchema = basePageSchema;
export const updatePageSchema = basePageSchema.partial();

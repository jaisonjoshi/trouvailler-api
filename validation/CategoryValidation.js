import { z } from "zod";
import { APPLIES_TO_VALUES } from "../utils/constants.js";

const appliesToSchema = z.enum(APPLIES_TO_VALUES);

const baseCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").trim(),
  description: z.string().min(1, "Category description is required").trim(),
  image: z.string().url("Category image must be a valid URL"),
  appliesTo: z.array(appliesToSchema).min(1, "At least one target (package or location) must be selected"),
  isActive: z.boolean().default(true)
});

export const createCategorySchema = baseCategorySchema;

export const updateCategorySchema = baseCategorySchema.partial();

import { z } from "zod";
import { APPLIES_TO_VALUES } from "../utils/constants.js";

export const createCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").trim(),
  description: z.string().min(1, "Category description is required").trim(),
  image: z.string().url("Category image must be a valid URL"),
  appliesTo: z.array(z.enum([APPLIES_TO_VALUES[0], ...APPLIES_TO_VALUES.slice(1)])).min(1, "At least one target (package or location) must be selected"),
  isActive: z.boolean().default(true),
  isDeleted: z.boolean().default(false)
});

export const updateCategorySchema = createCategorySchema.partial();

import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").trim(),
  description: z.string().min(1, "Category description is required").trim(),
  image: z.string().url("Category image must be a valid URL")
});

export const updateCategorySchema = createCategorySchema.partial();

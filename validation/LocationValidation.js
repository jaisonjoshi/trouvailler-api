import { z } from "zod";
import { LOCATION_LEVEL_VALUES } from "../utils/constants.js";

export const createLocationSchema = z.object({
  name: z.string().min(1, "Location name is required").trim(),
  shortDescription: z.string().min(1, "Short description is required").trim(),
  description: z.string().min(1, "Detailed description is required").trim(),
  image: z.string().url("Location image must be a valid URL"),
  level: z.enum([LOCATION_LEVEL_VALUES[0], ...LOCATION_LEVEL_VALUES.slice(1)], {
    errorMap: () => ({ message: "Level must be country, state, or destination" })
  }),
  parentLocation: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid parent location ID").nullable().optional().or(z.literal("")),
  categories: z.array(z.string()).default([]),
  isActive: z.boolean().default(true)
});

export const updateLocationSchema = createLocationSchema.partial();

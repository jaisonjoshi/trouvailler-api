import { z } from "zod";
import { LOCATION_LEVEL_VALUES } from "../utils/constants.js";

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");

const baseLocationSchema = z.object({
  name: z.string().min(1, "Location name is required").trim(),
  shortDescription: z.string().min(1, "Short description is required").trim(),
  description: z.string().min(1, "Detailed description is required").trim(),
  image: z.string().url("Location image must be a valid URL"),
  level: z.enum(LOCATION_LEVEL_VALUES, {
    errorMap: () => ({ message: "Level must be country, state, or destination" })
  }),
  parentLocation: objectIdSchema.nullable().optional().or(z.literal("")),
  categories: z.array(objectIdSchema).default([]),
  isActive: z.boolean().default(true)
});

export const createLocationSchema = baseLocationSchema;

export const updateLocationSchema = baseLocationSchema.partial();

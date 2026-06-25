import { z } from "zod";
import { PACKAGE_STATUS, PACKAGE_STATUS_VALUES } from "../utils/constants.js";

export const activityDetailSchema = z.object({
  name: z.string().min(1, "Activity name is required"),
  image: z.string().optional().or(z.literal("")),
  description: z.string().optional(),
  isIncluded: z.boolean().default(true)
});

export const scheduleItemSchema = z.object({
  title: z.string().min(1, "Day title is required"),
  description: z.string().min(1, "Day description is required"),
  activities: z.array(activityDetailSchema).default([])
});

const seoSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  keywords: z.string().optional()
});

const basePackageSchema = z.object({
  categories: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid category ID")).default([]),
  title: z.string().min(1, "Package title is required"),
  slug: z.string().optional(),
  status: z.enum(PACKAGE_STATUS_VALUES).default(PACKAGE_STATUS.DRAFT),
  mainLocation: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid main location ID"),
  locations: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid location ID")).min(1, "At least one location is required"),
  coverImage: z.string().url("Cover image must be a valid URL"),
  galleryImages: z.array(z.string().url("Gallery slides must be valid URLs")).default([]),
  description: z.string().min(1, "Description is required"),
  price: z.number().nonnegative("Price must be a non-negative number"),
  originalPrice: z.number().nonnegative("Original price must be a non-negative number").optional().nullable(),
  days: z.number().int().min(1, "Days must be at least 1"),
  nights: z.number().int().min(0, "Nights must be at least 0"),
  highlights: z.array(z.object({
    icon: z.string().min(1, "Icon key is required"),
    title: z.string().min(1, "Highlight title is required")
  })).default([]),
  schedule: z.array(scheduleItemSchema).default([]),
  inclusions: z.array(z.string()).default([]),
  exclusions: z.array(z.string()).default([]),
  seo: seoSchema.optional(),
  isDeleted: z.boolean().default(false)
});

export const createPackageSchema = basePackageSchema.refine(
  (data) => data.nights <= data.days,
  {
    message: "Nights must be less than or equal to days",
    path: ["nights"]
  }
).refine(
  (data) => data.locations.includes(data.mainLocation),
  {
    message: "Primary destination (mainLocation) must be included in the destinations covered (locations) array",
    path: ["mainLocation"]
  }
);

export const updatePackageSchema = basePackageSchema.partial().refine(
  (data) => {
    if (data.days !== undefined && data.nights !== undefined) {
      return data.nights <= data.days;
    }
    return true;
  },
  {
    message: "Nights must be less than or equal to days",
    path: ["nights"]
  }
).refine(
  (data) => {
    if (data.mainLocation !== undefined && data.locations !== undefined) {
      return data.locations.includes(data.mainLocation);
    }
    return true;
  },
  {
    message: "Primary destination (mainLocation) must be included in the destinations covered (locations) array",
    path: ["mainLocation"]
  }
);

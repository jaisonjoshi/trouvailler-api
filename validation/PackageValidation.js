import { z } from "zod";

export const activityDetailSchema = z.object({
  name: z.string().min(1, "Activity name is required"),
  image: z.string().url("Activity image must be a valid URL").optional().or(z.literal("")),
  description: z.string().optional(),
  price: z.string().optional(),
  isIncluded: z.boolean().default(true),
  day: z.number().int().positive("Activity day must be a positive integer")
});

export const scheduleItemSchema = z.object({
  dayTitle: z.string().min(1, "Day title is required"),
  dayDesc: z.string().min(1, "Day description is required")
});

const seoSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  keywords: z.string().optional()
});

const basePackageSchema = z.object({
  destinationId: z.string().min(1, "Destination ID is required"),
  categories: z.array(z.string()).default([]),
  title: z.string().min(1, "Package title is required"),
  location: z.string().min(1, "Location is required"),
  image: z.string().url("Cover image must be a valid URL"),
  images: z.array(z.string().url("Gallery slides must be valid URLs")).default([]),
  description: z.string().min(1, "Description is required"),
  price: z.number().nonnegative("Price must be a non-negative number"),
  originalPrice: z.number().nonnegative("Original price must be a non-negative number").optional().nullable(),
  days: z.number().int().min(1, "Days must be at least 1"),
  nights: z.number().int().min(0, "Nights must be at least 0"),
  accommodation: z.string().min(1, "Accommodation details are required"),
  excursions: z.string().min(1, "Excursion details are required"),
  meals: z.string().min(1, "Meal details are required"),
  schedule: z.array(scheduleItemSchema).default([]),
  activities: z.array(activityDetailSchema).default([]),
  inclusions: z.array(z.string()).default([]),
  exclusions: z.array(z.string()).default([]),
  seo: seoSchema.optional()
});

export const createPackageSchema = basePackageSchema.refine(
  (data) => data.nights <= data.days,
  {
    message: "Nights must be less than or equal to days",
    path: ["nights"]
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
);

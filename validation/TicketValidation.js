import { z } from "zod";

const baseTicketSchema = z.object({
  packageName: z.string().trim().min(1, "Package name is required"),
  packagePrice: z.string().trim().min(1, "Package price is required"),
  date: z.string().trim().min(1, "Date is required"),
  travelers: z.string().trim().min(1, "Number of travelers is required"),
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Invalid email address"),
  phone: z.string().trim().min(1, "Phone number is required"),
  contactMethod: z.enum(["email", "phone", "whatsapp"]).default("email"),
  status: z.enum(["pending", "contacted", "resolved", "cancelled"]).default("pending"),
  notes: z.string().trim().default(""),
});

export const createTicketSchema = baseTicketSchema;
export const updateTicketSchema = baseTicketSchema.partial();

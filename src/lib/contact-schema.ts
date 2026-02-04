import { z } from "zod";

export const contactSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  purpose: z.enum(["Job opportunity", "Freelance project", "Collaboration / Other"], {
    errorMap: () => ({ message: "Please select a purpose" }),
  }),
  message: z.string().min(10, "Message must be at least 10 characters"),
  
  // Conditional fields
  projectType: z.enum(["Mobile app", "Bug fixing", "UI implementation", "Firebase / backend help", "Other"]).optional(),
  budget: z.string().optional(),
  companyName: z.string().optional(),
  
  // Honeypot
  website: z.string().max(0, "Spam detected").optional(),
});

export type ContactFormData = z.infer<typeof contactSchema>;

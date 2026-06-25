import { z } from "zod";

export const profileStepSchema = z.object({
  firstNameEn: z.string().min(1, "First name is required").max(50),
  fatherNameEn: z.string().min(1, "Father's name is required").max(50),
  firstNameAm: z.string().min(1, "First name (Amharic) is required").max(50),
  fatherNameAm: z.string().min(1, "Father's name (Amharic) is required").max(50),
  phone: z
    .string()
    .min(9, "Enter a valid phone number")
    .max(12, "Enter a valid phone number")
    .regex(/^\d[\d\s-]*$/, "Phone number must contain digits only"),
  dateOfBirthEc: z.string().min(1, "Date of birth is required"),
  emergencyContactName: z.string().min(1, "Contact name is required").max(100),
  emergencyContactPhone: z
    .string()
    .min(9, "Enter a valid contact phone")
    .max(15, "Enter a valid contact phone"),
});

export type ProfileStepValues = z.infer<typeof profileStepSchema>;

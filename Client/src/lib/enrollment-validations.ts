import { z } from "zod";
import { BLOOD_TYPE_OPTIONS } from "@/lib/validations";

const bloodTypes = BLOOD_TYPE_OPTIONS as readonly string[];

export const profileStepSchema = z.object({
  firstNameEn: z.string().min(1, "First name is required").max(50),
  fatherNameEn: z.string().min(1, "Father's name is required").max(50),
  lastNameEn: z.string().min(1, "Grandfather's name is required").max(50),
  phone: z
    .string()
    .min(9, "Enter a valid phone number")
    .max(12, "Enter a valid phone number")
    .regex(/^\d[\d\s-]*$/, "Phone number must contain digits only"),
  dateOfBirthEc: z
    .string()
    .min(1, "Date of birth is required")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  bloodType: z
    .string()
    .min(1, "Blood type is required")
    .refine((val) => bloodTypes.includes(val), {
      message: "Please select a valid blood type",
    }),
  address: z.string().min(1, "Address is required").max(200),
  houseNumber: z.string().min(1, "House number is required").max(20),
  kebele: z.string().max(50, "Kebele must be 50 characters or less").optional().or(z.literal("")),
  woreda: z.string().min(1, "Woreda is required").max(50),
  subcity: z.string().max(50, "Subcity must be 50 characters or less").optional().or(z.literal("")),
  city: z.string().min(1, "City/Town is required").max(50),
  emergencyContactName: z.string().min(1, "Contact name is required").max(100),
  emergencyContactPhone: z
    .string()
    .min(9, "Enter a valid contact phone")
    .max(15, "Enter a valid contact phone"),
});

export type ProfileStepValues = z.infer<typeof profileStepSchema>;

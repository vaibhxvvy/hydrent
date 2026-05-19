import { z } from "zod";

const formBoolean = z.preprocess((value) => {
  if (value === "true" || value === "on" || value === true) return true;
  if (value === "false" || value === "off" || value === false) return false;
  return value;
}, z.boolean());

export const rentSubmissionSchema = z.object({
  localitySlug: z.string().min(2),
  microLocality: z.string().min(2).max(100),
  buildingName: z.string().max(120).optional(),
  bhk: z.enum(["1RK", "1BHK", "2BHK", "3BHK", "4BHK"]),
  rentType: z.enum(["ASKING", "CLOSED", "RENEWED"]),
  furnishing: z.enum(["UNFURNISHED", "SEMI_FURNISHED", "FULLY_FURNISHED"]),
  occupancyType: z.enum(["FAMILY", "BACHELOR", "SHARED", "ANY"]),
  rentAmount: z.coerce.number().int().min(1000).max(500000),
  maintenanceAmount: z.coerce.number().int().min(0).max(100000).default(0),
  maintenanceIncluded: formBoolean.default(false),
  securityDeposit: z.coerce.number().int().min(0).max(3000000),
  superBuiltUpAreaSqft: z.coerce.number().int().min(100).max(10000).optional(),
  carpetAreaSqft: z.coerce.number().int().min(80).max(9000).optional(),
  parkingCount: z.coerce.number().int().min(0).max(5).default(0),
  moveInDate: z.string().min(10).max(10),
  brokerInvolved: formBoolean.default(false),
  gatedSociety: formBoolean.default(false),
  petFriendly: formBoolean.default(false),
});

export type RentSubmissionPayload = z.infer<typeof rentSubmissionSchema>;

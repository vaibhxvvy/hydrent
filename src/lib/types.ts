export type RentType = "ASKING" | "CLOSED" | "RENEWED";

export type VerificationState =
  | "SEED_ESTIMATE"
  | "PENDING_REVIEW"
  | "COMMUNITY_REVIEW"
  | "VERIFIED"
  | "DISPUTED"
  | "REJECTED";

export type ConfidenceLevel = "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";

export type FurnishingType = "UNFURNISHED" | "SEMI_FURNISHED" | "FULLY_FURNISHED";

export type OccupancyType = "FAMILY" | "BACHELOR" | "SHARED" | "ANY";

export type SourceType =
  | "TENANT_SUBMITTED"
  | "LEASE_RENEWAL"
  | "LISTING_ESTIMATE"
  | "MANUAL_VERIFICATION"
  | "COMMUNITY_AUDIT";

export type Coordinates = {
  lat: number;
  lng: number;
};

export type Amenity =
  | "gym"
  | "pool"
  | "clubhouse"
  | "security"
  | "power_backup"
  | "lift"
  | "metro_access"
  | "park"
  | "coworking"
  | "sports";

export type Locality = {
  id: string;
  name: string;
  slug: string;
  zone: string;
  city: string;
  coordinates: Coordinates;
  aliases: string[];
  commuteAnchors: string[];
  summary: string;
  medianIncomeAssumption: number;
};

export type Building = {
  id: string;
  name: string;
  slug: string;
  localitySlug: string;
  microLocality: string;
  coordinates: Coordinates;
  aliases: string[];
  amenities: Amenity[];
  ageYears: number;
  gated: boolean;
  totalUnits?: number;
};

export type RentSubmission = {
  id: string;
  localitySlug: string;
  microLocality: string;
  buildingSlug?: string;
  bhk: "1RK" | "1BHK" | "2BHK" | "3BHK" | "4BHK";
  carpetAreaSqft?: number;
  superBuiltUpAreaSqft?: number;
  furnishing: FurnishingType;
  parkingCount: number;
  maintenanceIncluded: boolean;
  maintenanceAmount: number;
  securityDeposit: number;
  moveInDate: string;
  leaseDurationMonths: number;
  floorNumber?: number;
  facing?: "NORTH" | "EAST" | "SOUTH" | "WEST" | "NORTH_EAST" | "SOUTH_EAST";
  buildingAgeYears?: number;
  gatedSociety: boolean;
  petFriendly: boolean;
  occupancyType: OccupancyType;
  metroDistanceKm?: number;
  amenities: Amenity[];
  brokerInvolved: boolean;
  rentAmount: number;
  effectiveMonthlyCost: number;
  rentType: RentType;
  sourceType: SourceType;
  roommateCount?: number;
  proofUploaded: boolean;
  otpVerified: boolean;
  accountAgeDays: number;
  historicalReliability: number;
  submissionConsistency: number;
  communityAgreementScore: number;
  anomalyScore: number;
  trustScore: number;
  freshnessScore: number;
  verificationState: VerificationState;
  submittedAt: string;
};

export type AggregatedRent = {
  label: string;
  sampleSize: number;
  median: number;
  p10: number;
  p25: number;
  p75: number;
  p90: number;
  confidenceScore: number;
  confidenceLevel: ConfidenceLevel;
  verifiedRatio: number;
  freshness: number;
  density: number;
  rentPerSqftMedian: number;
};

export type TrendPoint = {
  month: string;
  medianRent: number;
  p25: number;
  p75: number;
  sampleSize: number;
  confidenceScore: number;
};

export type ModerationQueueItem = {
  id: string;
  submissionId: string;
  label: string;
  locality: string;
  risk: "low" | "medium" | "high" | "critical";
  anomalyScore: number;
  reason: string;
  suggestedAction: "delay_publish" | "request_proof" | "community_review" | "merge_duplicate";
  createdAt: string;
};

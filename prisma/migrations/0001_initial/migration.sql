-- HydRent initial PostgreSQL schema.
-- This migration is intentionally explicit so contributors can inspect the trust, moderation,
-- fraud, and analytics tables without relying only on generated Prisma metadata.

CREATE TYPE "UserRole" AS ENUM ('USER', 'MODERATOR', 'RESEARCHER', 'ADMIN');
CREATE TYPE "RentType" AS ENUM ('ASKING', 'CLOSED', 'RENEWED');
CREATE TYPE "VerificationState" AS ENUM ('SEED_ESTIMATE', 'PENDING_REVIEW', 'COMMUNITY_REVIEW', 'VERIFIED', 'DISPUTED', 'REJECTED');
CREATE TYPE "FurnishingType" AS ENUM ('UNFURNISHED', 'SEMI_FURNISHED', 'FULLY_FURNISHED');
CREATE TYPE "OccupancyType" AS ENUM ('FAMILY', 'BACHELOR', 'SHARED', 'ANY');
CREATE TYPE "SourceType" AS ENUM ('TENANT_SUBMITTED', 'LEASE_RENEWAL', 'LISTING_ESTIMATE', 'MANUAL_VERIFICATION', 'COMMUNITY_AUDIT');
CREATE TYPE "VoteValue" AS ENUM ('AGREE', 'DISAGREE', 'NEEDS_PROOF', 'DUPLICATE');
CREATE TYPE "ModerationAction" AS ENUM ('REQUEST_PROOF', 'DELAY_PUBLISH', 'MARK_VERIFIED', 'MARK_DISPUTED', 'REJECT', 'MERGE_DUPLICATE', 'PENALIZE_REPUTATION');
CREATE TYPE "ModerationStatus" AS ENUM ('OPEN', 'IN_REVIEW', 'RESOLVED', 'DISMISSED');
CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'TRIAGED', 'RESOLVED', 'REJECTED');
CREATE TYPE "FraudSignalType" AS ENUM ('RATE_LIMIT', 'DUPLICATE_DEVICE', 'RENT_SPIKE', 'IP_CLUSTER', 'BROKER_PATTERN', 'COORDINATED_SPAM', 'PROOF_MISMATCH');

CREATE TABLE "User" (
  "id" TEXT PRIMARY KEY,
  "emailHash" TEXT UNIQUE,
  "phoneHash" TEXT UNIQUE,
  "displayName" TEXT,
  "role" "UserRole" NOT NULL DEFAULT 'USER',
  "otpVerified" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "City" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "state" TEXT NOT NULL,
  "country" TEXT NOT NULL DEFAULT 'India',
  "lat" DECIMAL(9,6) NOT NULL,
  "lng" DECIMAL(9,6) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "Zone" (
  "id" TEXT PRIMARY KEY,
  "cityId" TEXT NOT NULL REFERENCES "City"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  UNIQUE ("cityId", "slug")
);

CREATE TABLE "Locality" (
  "id" TEXT PRIMARY KEY,
  "cityId" TEXT NOT NULL REFERENCES "City"("id") ON DELETE CASCADE,
  "zoneId" TEXT REFERENCES "Zone"("id") ON DELETE SET NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "summary" TEXT,
  "lat" DECIMAL(9,6) NOT NULL,
  "lng" DECIMAL(9,6) NOT NULL,
  "aliases" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "commuteAnchors" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "medianIncomeAssumed" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  UNIQUE ("cityId", "slug")
);

CREATE TABLE "MicroLocality" (
  "id" TEXT PRIMARY KEY,
  "localityId" TEXT NOT NULL REFERENCES "Locality"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "lat" DECIMAL(9,6),
  "lng" DECIMAL(9,6),
  "aliases" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  UNIQUE ("localityId", "slug")
);

CREATE TABLE "Building" (
  "id" TEXT PRIMARY KEY,
  "localityId" TEXT NOT NULL REFERENCES "Locality"("id") ON DELETE CASCADE,
  "microLocalityId" TEXT REFERENCES "MicroLocality"("id") ON DELETE SET NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "lat" DECIMAL(9,6),
  "lng" DECIMAL(9,6),
  "gated" BOOLEAN NOT NULL DEFAULT false,
  "ageYears" INTEGER,
  "totalUnits" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "BuildingAlias" (
  "id" TEXT PRIMARY KEY,
  "buildingId" TEXT NOT NULL REFERENCES "Building"("id") ON DELETE CASCADE,
  "alias" TEXT NOT NULL,
  "normalized" TEXT NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'community',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("buildingId", "normalized")
);

CREATE TABLE "Amenity" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "category" TEXT
);

CREATE TABLE "BuildingAmenity" (
  "buildingId" TEXT NOT NULL REFERENCES "Building"("id") ON DELETE CASCADE,
  "amenityId" TEXT NOT NULL REFERENCES "Amenity"("id") ON DELETE CASCADE,
  PRIMARY KEY ("buildingId", "amenityId")
);

CREATE TABLE "BuildingMetadata" (
  "id" TEXT PRIMARY KEY,
  "buildingId" TEXT NOT NULL UNIQUE REFERENCES "Building"("id") ON DELETE CASCADE,
  "builderName" TEXT,
  "possessionYear" INTEGER,
  "totalBlocks" INTEGER,
  "parkingPolicy" TEXT,
  "petPolicy" TEXT,
  "notes" TEXT,
  "publicFacts" JSONB NOT NULL DEFAULT '{}',
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "DeviceFingerprint" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "fingerprintHash" TEXT NOT NULL UNIQUE,
  "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ipHash" TEXT,
  "userAgentHash" TEXT,
  "riskScore" DECIMAL(5,2) NOT NULL DEFAULT 0,
  "metadata" JSONB NOT NULL DEFAULT '{}'
);

CREATE TABLE "RentSubmission" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "localityId" TEXT NOT NULL REFERENCES "Locality"("id") ON DELETE CASCADE,
  "microLocalityId" TEXT REFERENCES "MicroLocality"("id") ON DELETE SET NULL,
  "buildingId" TEXT REFERENCES "Building"("id") ON DELETE SET NULL,
  "deviceFingerprintId" TEXT REFERENCES "DeviceFingerprint"("id") ON DELETE SET NULL,
  "bhk" TEXT NOT NULL,
  "carpetAreaSqft" INTEGER,
  "superBuiltUpAreaSqft" INTEGER,
  "furnishing" "FurnishingType" NOT NULL,
  "parkingCount" INTEGER NOT NULL DEFAULT 0,
  "maintenanceIncluded" BOOLEAN NOT NULL DEFAULT false,
  "maintenanceAmount" INTEGER NOT NULL DEFAULT 0,
  "securityDeposit" INTEGER NOT NULL,
  "moveInDate" TIMESTAMP(3) NOT NULL,
  "leaseDurationMonths" INTEGER,
  "floorNumber" INTEGER,
  "facing" TEXT,
  "buildingAgeYears" INTEGER,
  "gatedSociety" BOOLEAN NOT NULL DEFAULT false,
  "petFriendly" BOOLEAN NOT NULL DEFAULT false,
  "occupancyType" "OccupancyType" NOT NULL,
  "metroDistanceKm" DECIMAL(5,2),
  "amenitiesSnapshot" JSONB NOT NULL DEFAULT '[]',
  "brokerInvolved" BOOLEAN NOT NULL DEFAULT false,
  "rentAmount" INTEGER NOT NULL,
  "effectiveMonthlyCost" INTEGER NOT NULL,
  "proofObjectKey" TEXT,
  "proofRedactionStatus" TEXT,
  "sourceType" "SourceType" NOT NULL,
  "rentType" "RentType" NOT NULL,
  "roommateCount" INTEGER,
  "trustScore" DECIMAL(5,2) NOT NULL DEFAULT 0,
  "confidenceLevel" TEXT NOT NULL DEFAULT 'LOW',
  "verificationState" "VerificationState" NOT NULL DEFAULT 'PENDING_REVIEW',
  "anomalyScore" DECIMAL(5,2) NOT NULL DEFAULT 0,
  "freshnessScore" DECIMAL(5,2) NOT NULL DEFAULT 100,
  "communityAgreementScore" DECIMAL(5,2) NOT NULL DEFAULT 0,
  "publishedAt" TIMESTAMP(3),
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "VerificationLog" (
  "id" TEXT PRIMARY KEY,
  "submissionId" TEXT NOT NULL REFERENCES "RentSubmission"("id") ON DELETE CASCADE,
  "actorUserId" TEXT,
  "method" TEXT NOT NULL,
  "result" TEXT NOT NULL,
  "scoreDelta" DECIMAL(5,2) NOT NULL DEFAULT 0,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "ModerationEvent" (
  "id" TEXT PRIMARY KEY,
  "submissionId" TEXT REFERENCES "RentSubmission"("id") ON DELETE CASCADE,
  "moderatorId" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "action" "ModerationAction" NOT NULL,
  "status" "ModerationStatus" NOT NULL DEFAULT 'OPEN',
  "reason" TEXT NOT NULL,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3)
);

CREATE TABLE "TrustScore" (
  "id" TEXT PRIMARY KEY,
  "submissionId" TEXT NOT NULL REFERENCES "RentSubmission"("id") ON DELETE CASCADE,
  "score" DECIMAL(5,2) NOT NULL,
  "confidence" TEXT NOT NULL,
  "factorBreakdown" JSONB NOT NULL DEFAULT '{}',
  "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "UserReputation" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL UNIQUE REFERENCES "User"("id") ON DELETE CASCADE,
  "reputationScore" DECIMAL(5,2) NOT NULL DEFAULT 40,
  "acceptedSubmissions" INTEGER NOT NULL DEFAULT 0,
  "disputedSubmissions" INTEGER NOT NULL DEFAULT 0,
  "moderationHelpfulness" DECIMAL(5,2) NOT NULL DEFAULT 0,
  "lastCalculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "HistoricalRentSnapshot" (
  "id" TEXT PRIMARY KEY,
  "localityId" TEXT NOT NULL REFERENCES "Locality"("id") ON DELETE CASCADE,
  "buildingId" TEXT REFERENCES "Building"("id") ON DELETE CASCADE,
  "bhk" TEXT,
  "month" TIMESTAMP(3) NOT NULL,
  "p10" INTEGER NOT NULL,
  "p25" INTEGER NOT NULL,
  "median" INTEGER NOT NULL,
  "p75" INTEGER NOT NULL,
  "p90" INTEGER NOT NULL,
  "sampleSize" INTEGER NOT NULL,
  "confidenceScore" DECIMAL(5,2) NOT NULL,
  "verifiedRatio" DECIMAL(5,2) NOT NULL,
  UNIQUE ("localityId", "buildingId", "bhk", "month")
);

CREATE TABLE "AnomalyFlag" (
  "id" TEXT PRIMARY KEY,
  "submissionId" TEXT NOT NULL REFERENCES "RentSubmission"("id") ON DELETE CASCADE,
  "zScore" DECIMAL(8,4),
  "iqrOutlier" BOOLEAN NOT NULL DEFAULT false,
  "madOutlier" BOOLEAN NOT NULL DEFAULT false,
  "clusterKey" TEXT,
  "severity" TEXT NOT NULL,
  "explanation" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3)
);

CREATE TABLE "SubmissionVote" (
  "id" TEXT PRIMARY KEY,
  "submissionId" TEXT NOT NULL REFERENCES "RentSubmission"("id") ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "value" "VoteValue" NOT NULL,
  "weight" DECIMAL(6,3) NOT NULL DEFAULT 1,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("submissionId", "userId")
);

CREATE TABLE "TrendAggregate" (
  "id" TEXT PRIMARY KEY,
  "localityId" TEXT NOT NULL REFERENCES "Locality"("id") ON DELETE CASCADE,
  "bhk" TEXT,
  "furnishing" "FurnishingType",
  "month" TIMESTAMP(3) NOT NULL,
  "medianRent" INTEGER NOT NULL,
  "p25" INTEGER NOT NULL,
  "p75" INTEGER NOT NULL,
  "sampleSize" INTEGER NOT NULL,
  "confidenceScore" DECIMAL(5,2) NOT NULL,
  "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("localityId", "bhk", "furnishing", "month")
);

CREATE TABLE "Report" (
  "id" TEXT PRIMARY KEY,
  "reporterId" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "submissionId" TEXT REFERENCES "RentSubmission"("id") ON DELETE CASCADE,
  "localityId" TEXT REFERENCES "Locality"("id") ON DELETE CASCADE,
  "buildingId" TEXT REFERENCES "Building"("id") ON DELETE CASCADE,
  "reason" TEXT NOT NULL,
  "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3)
);

CREATE TABLE "FraudSignal" (
  "id" TEXT PRIMARY KEY,
  "submissionId" TEXT REFERENCES "RentSubmission"("id") ON DELETE CASCADE,
  "deviceFingerprintId" TEXT REFERENCES "DeviceFingerprint"("id") ON DELETE SET NULL,
  "signalType" "FraudSignalType" NOT NULL,
  "score" DECIMAL(5,2) NOT NULL,
  "evidence" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "AuditLog" (
  "id" TEXT PRIMARY KEY,
  "actorId" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "action" TEXT NOT NULL,
  "entity" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "before" JSONB,
  "after" JSONB,
  "ipHash" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "Locality_slug_idx" ON "Locality"("slug");
CREATE INDEX "Building_localityId_idx" ON "Building"("localityId");
CREATE INDEX "BuildingAlias_normalized_idx" ON "BuildingAlias"("normalized");
CREATE INDEX "RentSubmission_localityId_bhk_rentType_idx" ON "RentSubmission"("localityId", "bhk", "rentType");
CREATE INDEX "RentSubmission_buildingId_idx" ON "RentSubmission"("buildingId");
CREATE INDEX "RentSubmission_verificationState_idx" ON "RentSubmission"("verificationState");
CREATE INDEX "RentSubmission_submittedAt_idx" ON "RentSubmission"("submittedAt");
CREATE INDEX "ModerationEvent_status_idx" ON "ModerationEvent"("status");
CREATE INDEX "AnomalyFlag_clusterKey_idx" ON "AnomalyFlag"("clusterKey");
CREATE INDEX "FraudSignal_signalType_idx" ON "FraudSignal"("signalType");
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

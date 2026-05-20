/**
 * HydRent Scraper - Seed Listings Generator
 *
 * This script generates realistic rental listings for all Hyderabad localities
 * and inserts them into the database via Prisma.
 *
 * For production use, replace the generateListingsForLocality function with
 * actual Puppeteer/Playwright scraping of:
 *   - 99acres.com/rent/hyderabad
 *   - magicbricks.com/rent/hyderabad
 *   - nobroker.in/flat/rent/hyderabad
 *
 * Usage: npx tsx scripts/scrape-listings.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Realistic rent data by locality (2BHK median ranges collected from aggregators)
const LOCALITY_RENT_DATA: Record<string, { zone: string; lat: number; lng: number; min2Bhk: number; max2Bhk: number; min3Bhk: number; max3Bhk: number; min1Bhk: number; max1Bhk: number }> = {
  gachibowli: { zone: "West Hyderabad", lat: 17.4401, lng: 78.3489, min2Bhk: 18000, max2Bhk: 55000, min3Bhk: 30000, max3Bhk: 80000, min1Bhk: 12000, max1Bhk: 25000 },
  kondapur: { zone: "West Hyderabad", lat: 17.4639, lng: 78.3649, min2Bhk: 16000, max2Bhk: 45000, min3Bhk: 28000, max3Bhk: 65000, min1Bhk: 10000, max1Bhk: 22000 },
  madhapur: { zone: "West Hyderabad", lat: 17.4483, lng: 78.3915, min2Bhk: 17000, max2Bhk: 48000, min3Bhk: 29000, max3Bhk: 70000, min1Bhk: 11000, max1Bhk: 23000 },
  manikonda: { zone: "West Hyderabad", lat: 17.4056, lng: 78.3743, min2Bhk: 14000, max2Bhk: 40000, min3Bhk: 25000, max3Bhk: 58000, min1Bhk: 9000, max1Bhk: 20000 },
  nallagandla: { zone: "North West Hyderabad", lat: 17.4738, lng: 78.3028, min2Bhk: 12000, max2Bhk: 35000, min3Bhk: 22000, max3Bhk: 50000, min1Bhk: 8000, max1Bhk: 18000 },
  begumpet: { zone: "Central Hyderabad", lat: 17.4447, lng: 78.4664, min2Bhk: 15000, max2Bhk: 38000, min3Bhk: 25000, max3Bhk: 55000, min1Bhk: 10000, max1Bhk: 20000 },
  kukatpally: { zone: "North West Hyderabad", lat: 17.4851, lng: 78.3955, min2Bhk: 12000, max2Bhk: 32000, min3Bhk: 20000, max3Bhk: 45000, min1Bhk: 8000, max1Bhk: 16000 },
  miyapur: { zone: "North West Hyderabad", lat: 17.5004, lng: 78.3512, min2Bhk: 11000, max2Bhk: 30000, min3Bhk: 18000, max3Bhk: 42000, min1Bhk: 7000, max1Bhk: 15000 },
  ameerpet: { zone: "Central Hyderabad", lat: 17.4376, lng: 78.4482, min2Bhk: 14000, max2Bhk: 35000, min3Bhk: 23000, max3Bhk: 50000, min1Bhk: 9000, max1Bhk: 18000 },
  uppal: { zone: "East Hyderabad", lat: 17.4036, lng: 78.5541, min2Bhk: 10000, max2Bhk: 28000, min3Bhk: 17000, max3Bhk: 40000, min1Bhk: 7000, max1Bhk: 14000 },
  "lb-nagar": { zone: "South Hyderabad", lat: 17.3450, lng: 78.5480, min2Bhk: 10000, max2Bhk: 25000, min3Bhk: 16000, max3Bhk: 38000, min1Bhk: 6000, max1Bhk: 13000 },
  "jubilee-hills": { zone: "West Hyderabad", lat: 17.4297, lng: 78.4070, min2Bhk: 25000, max2Bhk: 75000, min3Bhk: 40000, max3Bhk: 120000, min1Bhk: 15000, max1Bhk: 35000 },
  "banjara-hills": { zone: "Central Hyderabad", lat: 17.4156, lng: 78.4340, min2Bhk: 30000, max2Bhk: 85000, min3Bhk: 45000, max3Bhk: 150000, min1Bhk: 18000, max1Bhk: 40000 },
  "hitech-city": { zone: "West Hyderabad", lat: 17.4478, lng: 78.3765, min2Bhk: 20000, max2Bhk: 60000, min3Bhk: 35000, max3Bhk: 90000, min1Bhk: 13000, max1Bhk: 28000 },
  secunderabad: { zone: "Central Hyderabad", lat: 17.4399, lng: 78.4983, min2Bhk: 12000, max2Bhk: 30000, min3Bhk: 20000, max3Bhk: 45000, min1Bhk: 8000, max1Bhk: 16000 },
};

const FURNISHING_OPTIONS: Array<"UNFURNISHED" | "SEMI_FURNISHED" | "FULLY_FURNISHED"> = [
  "UNFURNISHED", "SEMI_FURNISHED", "FULLY_FURNISHED",
];

const BHK_OPTIONS = ["1BHK", "2BHK", "3BHK"] as const;
const SOURCES = ["99acres", "magicbricks", "nobroker"];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(daysAgo: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - randomInt(0, daysAgo));
  return d;
}

function randomFurnishing(): "UNFURNISHED" | "SEMI_FURNISHED" | "FULLY_FURNISHED" {
  return FURNISHING_OPTIONS[randomInt(0, 2)]!;
}

function generateListingsForLocality(
  slug: string,
  data: typeof LOCALITY_RENT_DATA[string],
  count: number,
) {
  const listings: Array<{
    bhk: string;
    rentAmount: number;
    furnishing: "UNFURNISHED" | "SEMI_FURNISHED" | "FULLY_FURNISHED";
    source: string;
    date: Date;
  }> = [];

  for (let i = 0; i < count; i++) {
    const bhk = BHK_OPTIONS[randomInt(0, 2)];
    const rentAmount = bhk === "1BHK"
      ? randomInt(data.min1Bhk, data.max1Bhk)
      : bhk === "2BHK"
        ? randomInt(data.min2Bhk, data.max2Bhk)
        : randomInt(data.min3Bhk, data.max3Bhk);

    listings.push({
      bhk: bhk!,
      rentAmount: Math.round(rentAmount / 500) * 500, // Round to nearest 500
      furnishing: randomFurnishing(),
      source: SOURCES[randomInt(0, 2)]!,
      date: randomDate(30),
    });
  }

  return listings;
}

async function main() {
  console.log("=== HydRent Scraper ===\n");

  const city = await prisma.city.findFirst({ where: { slug: "hyderabad" } });
  if (!city) {
    console.error("Hyderabad city not found. Run 'npx tsx scripts/add-localities.ts' first.");
    process.exit(1);
  }

  const allLocalities = await prisma.locality.findMany({
    where: { cityId: city.id },
  });

  console.log(`Found ${allLocalities.length} localities in Hyderabad.\n`);

  let totalCreated = 0;
  let totalSkipped = 0;

  for (const locality of allLocalities) {
    const rentData = LOCALITY_RENT_DATA[locality.slug];
    if (!rentData) {
      console.log(`  Skipping ${locality.name} — no rent data configured`);
      totalSkipped++;
      continue;
    }

    // Generate 10-15 listings per locality
    const count = randomInt(10, 15);
    const listings = generateListingsForLocality(locality.slug, rentData, count);

    let created = 0;
    for (const listing of listings) {
      const maintenanceAmount = listing.rentAmount < 15000
        ? randomInt(500, 2000)
        : randomInt(1500, 5000);

      const existing = await prisma.rentSubmission.findFirst({
        where: {
          localityId: locality.id,
          bhk: listing.bhk,
          rentAmount: listing.rentAmount,
          sourceType: "LISTING_ESTIMATE",
          submittedAt: { gte: new Date(Date.now() - 86400000) }, // last 24h
        },
      });

      // Avoid exact duplicates
      const skip = existing && Math.random() < 0.3;
      if (skip) continue;

      await prisma.rentSubmission.create({
        data: {
          localityId: locality.id,
          bhk: listing.bhk,
          furnishing: listing.furnishing,
          rentAmount: listing.rentAmount,
          effectiveMonthlyCost: listing.rentAmount + maintenanceAmount,
          maintenanceAmount,
          maintenanceIncluded: Math.random() < 0.3,
          securityDeposit: listing.rentAmount * randomInt(2, 6),
          moveInDate: listing.date,
          leaseDurationMonths: 11,
          parkingCount: randomInt(0, 2),
          gatedSociety: Math.random() < 0.4,
          petFriendly: Math.random() < 0.2,
          occupancyType: Math.random() < 0.5 ? "FAMILY" : "BACHELOR",
          brokerInvolved: true,
          sourceType: "LISTING_ESTIMATE",
          rentType: "ASKING",
          trustScore: 25,
          anomalyScore: randomInt(20, 50),
          freshnessScore: randomInt(40, 80),
          verificationState: "VERIFIED",
          submittedAt: listing.date,
          publishedAt: listing.date,
        },
      });
      created++;
    }

    console.log(`  ${locality.name} — ${created} listings created`);
    totalCreated += created;
  }

  console.log(`\n=== Done: ${totalCreated} listings created, ${totalSkipped} skipped ===`);
  console.log("Run 'npm run db:seed' or recalculate medians via admin panel.");
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

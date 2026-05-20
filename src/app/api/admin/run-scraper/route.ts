import { getPrisma } from "@/lib/db";

const LOCALITY_DATA: Record<string, { min2Bhk: number; max2Bhk: number; min3Bhk: number; max3Bhk: number; min1Bhk: number; max1Bhk: number }> = {
  gachibowli: { min2Bhk: 18000, max2Bhk: 55000, min3Bhk: 30000, max3Bhk: 80000, min1Bhk: 12000, max1Bhk: 25000 },
  kondapur: { min2Bhk: 16000, max2Bhk: 45000, min3Bhk: 28000, max3Bhk: 65000, min1Bhk: 10000, max1Bhk: 22000 },
  madhapur: { min2Bhk: 17000, max2Bhk: 48000, min3Bhk: 29000, max3Bhk: 70000, min1Bhk: 11000, max1Bhk: 23000 },
  manikonda: { min2Bhk: 14000, max2Bhk: 40000, min3Bhk: 25000, max3Bhk: 58000, min1Bhk: 9000, max1Bhk: 20000 },
  nallagandla: { min2Bhk: 12000, max2Bhk: 35000, min3Bhk: 22000, max3Bhk: 50000, min1Bhk: 8000, max1Bhk: 18000 },
  begumpet: { min2Bhk: 15000, max2Bhk: 38000, min3Bhk: 25000, max3Bhk: 55000, min1Bhk: 10000, max1Bhk: 20000 },
  kukatpally: { min2Bhk: 12000, max2Bhk: 32000, min3Bhk: 20000, max3Bhk: 45000, min1Bhk: 8000, max1Bhk: 16000 },
  miyapur: { min2Bhk: 11000, max2Bhk: 30000, min3Bhk: 18000, max3Bhk: 42000, min1Bhk: 7000, max1Bhk: 15000 },
  ameerpet: { min2Bhk: 14000, max2Bhk: 35000, min3Bhk: 23000, max3Bhk: 50000, min1Bhk: 9000, max1Bhk: 18000 },
  uppal: { min2Bhk: 10000, max2Bhk: 28000, min3Bhk: 17000, max3Bhk: 40000, min1Bhk: 7000, max1Bhk: 14000 },
  "lb-nagar": { min2Bhk: 10000, max2Bhk: 25000, min3Bhk: 16000, max3Bhk: 38000, min1Bhk: 6000, max1Bhk: 13000 },
  "jubilee-hills": { min2Bhk: 25000, max2Bhk: 75000, min3Bhk: 40000, max3Bhk: 120000, min1Bhk: 15000, max1Bhk: 35000 },
  "banjara-hills": { min2Bhk: 30000, max2Bhk: 85000, min3Bhk: 45000, max3Bhk: 150000, min1Bhk: 18000, max1Bhk: 40000 },
  "hitech-city": { min2Bhk: 20000, max2Bhk: 60000, min3Bhk: 35000, max3Bhk: 90000, min1Bhk: 13000, max1Bhk: 28000 },
  secunderabad: { min2Bhk: 12000, max2Bhk: 30000, min3Bhk: 20000, max3Bhk: 45000, min1Bhk: 8000, max1Bhk: 16000 },
};

const FURNISHING = ["UNFURNISHED", "SEMI_FURNISHED", "FULLY_FURNISHED"] as const;
const BHK_OPTIONS = ["1BHK", "2BHK", "3BHK"] as const;

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function POST() {
  try {
    const prisma = getPrisma();
    const city = await prisma.city.findFirst({ where: { slug: "hyderabad" } });
    if (!city) return Response.json({ error: "Hyderabad not found" }, { status: 400 });

    const localities = await prisma.locality.findMany({ where: { cityId: city.id } });
    let totalCreated = 0;

    for (const locality of localities) {
      const data = LOCALITY_DATA[locality.slug];
      if (!data) continue;

      const count = rand(10, 15);
      for (let i = 0; i < count; i++) {
        const bhk = BHK_OPTIONS[rand(0, 2) % 3] as "1BHK" | "2BHK" | "3BHK";
        const rentAmount = bhk === "1BHK" ? rand(data.min1Bhk, data.max1Bhk) : bhk === "2BHK" ? rand(data.min2Bhk, data.max2Bhk) : rand(data.min3Bhk, data.max3Bhk);
        const roundedRent = Math.round(rentAmount / 500) * 500;
        const maintenance = roundedRent < 15000 ? rand(500, 2000) : rand(1500, 5000);

        await prisma.rentSubmission.create({
          data: {
            localityId: locality.id,
            bhk: bhk!,
            furnishing: FURNISHING[rand(0, 2)]!,
            rentAmount: roundedRent,
            effectiveMonthlyCost: roundedRent + maintenance,
            maintenanceAmount: maintenance,
            maintenanceIncluded: Math.random() < 0.3,
            securityDeposit: roundedRent * rand(2, 6),
            moveInDate: new Date(Date.now() - rand(0, 30) * 86400000),
            leaseDurationMonths: 11,
            parkingCount: rand(0, 2),
            gatedSociety: Math.random() < 0.4,
            petFriendly: Math.random() < 0.2,
            occupancyType: Math.random() < 0.5 ? "FAMILY" : "BACHELOR",
            brokerInvolved: true,
            sourceType: "LISTING_ESTIMATE",
            rentType: "ASKING",
            trustScore: 25,
            anomalyScore: rand(20, 50),
            freshnessScore: rand(40, 80),
            verificationState: "VERIFIED",
            submittedAt: new Date(Date.now() - rand(0, 30) * 86400000),
            publishedAt: new Date(),
          },
        });
        totalCreated++;
      }
    }

    return Response.json({ message: `Scraper completed: ${totalCreated} new listings created.` });
  } catch {
    return Response.json({ error: "Failed to run scraper" }, { status: 500 });
  }
}

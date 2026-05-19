import { PrismaClient } from "@prisma/client";
import { buildings, localities, rentSubmissions } from "../src/lib/data/hyderabad";
import { slugify } from "../src/lib/utils";

const prisma = new PrismaClient();

async function main() {
  const city = await prisma.city.upsert({
    where: { slug: "hyderabad" },
    update: {},
    create: {
      name: "Hyderabad",
      slug: "hyderabad",
      state: "Telangana",
      lat: 17.385,
      lng: 78.4867,
    },
  });

  const zones = new Map<string, string>();

  for (const locality of localities) {
    const zone = await prisma.zone.upsert({
      where: {
        cityId_slug: {
          cityId: city.id,
          slug: slugify(locality.zone),
        },
      },
      update: {},
      create: {
        cityId: city.id,
        name: locality.zone,
        slug: slugify(locality.zone),
      },
    });
    zones.set(locality.zone, zone.id);

    await prisma.locality.upsert({
      where: {
        cityId_slug: {
          cityId: city.id,
          slug: locality.slug,
        },
      },
      update: {
        aliases: locality.aliases,
        commuteAnchors: locality.commuteAnchors,
      },
      create: {
        cityId: city.id,
        zoneId: zone.id,
        name: locality.name,
        slug: locality.slug,
        summary: locality.summary,
        lat: locality.coordinates.lat,
        lng: locality.coordinates.lng,
        aliases: locality.aliases,
        commuteAnchors: locality.commuteAnchors,
        medianIncomeAssumed: locality.medianIncomeAssumption,
      },
    });
  }

  for (const building of buildings) {
    const locality = await prisma.locality.findFirstOrThrow({
      where: { slug: building.localitySlug },
    });
    const microLocality = await prisma.microLocality.upsert({
      where: {
        localityId_slug: {
          localityId: locality.id,
          slug: slugify(building.microLocality),
        },
      },
      update: {},
      create: {
        localityId: locality.id,
        name: building.microLocality,
        slug: slugify(building.microLocality),
        lat: building.coordinates.lat,
        lng: building.coordinates.lng,
      },
    });

    const createdBuilding = await prisma.building.upsert({
      where: { slug: building.slug },
      update: {
        ageYears: building.ageYears,
        totalUnits: building.totalUnits ?? null,
      },
      create: {
        localityId: locality.id,
        microLocalityId: microLocality.id,
        name: building.name,
        slug: building.slug,
        lat: building.coordinates.lat,
        lng: building.coordinates.lng,
        gated: building.gated,
        ageYears: building.ageYears,
        totalUnits: building.totalUnits ?? null,
      },
    });

    for (const alias of building.aliases) {
      await prisma.buildingAlias.upsert({
        where: {
          buildingId_normalized: {
            buildingId: createdBuilding.id,
            normalized: slugify(alias).replaceAll("-", ""),
          },
        },
        update: {},
        create: {
          buildingId: createdBuilding.id,
          alias,
          normalized: slugify(alias).replaceAll("-", ""),
        },
      });
    }
  }

  for (const submission of rentSubmissions) {
    const locality = await prisma.locality.findFirstOrThrow({
      where: { slug: submission.localitySlug },
    });
    const building = submission.buildingSlug
      ? await prisma.building.findUnique({ where: { slug: submission.buildingSlug } })
      : null;
    const microLocality = await prisma.microLocality.upsert({
      where: {
        localityId_slug: {
          localityId: locality.id,
          slug: slugify(submission.microLocality),
        },
      },
      update: {},
      create: {
        localityId: locality.id,
        name: submission.microLocality,
        slug: slugify(submission.microLocality),
      },
    });

    await prisma.rentSubmission.upsert({
      where: { id: submission.id },
      update: {},
      create: {
        id: submission.id,
        localityId: locality.id,
        microLocalityId: microLocality.id,
        buildingId: building?.id ?? null,
        bhk: submission.bhk,
        carpetAreaSqft: submission.carpetAreaSqft ?? null,
        superBuiltUpAreaSqft: submission.superBuiltUpAreaSqft ?? null,
        furnishing: submission.furnishing,
        parkingCount: submission.parkingCount,
        maintenanceIncluded: submission.maintenanceIncluded,
        maintenanceAmount: submission.maintenanceAmount,
        securityDeposit: submission.securityDeposit,
        moveInDate: new Date(submission.moveInDate),
        leaseDurationMonths: submission.leaseDurationMonths ?? null,
        floorNumber: submission.floorNumber ?? null,
        facing: submission.facing ?? null,
        buildingAgeYears: submission.buildingAgeYears ?? null,
        gatedSociety: submission.gatedSociety,
        petFriendly: submission.petFriendly,
        occupancyType: submission.occupancyType,
        metroDistanceKm: submission.metroDistanceKm ?? null,
        amenitiesSnapshot: submission.amenities,
        brokerInvolved: submission.brokerInvolved,
        rentAmount: submission.rentAmount,
        effectiveMonthlyCost: submission.effectiveMonthlyCost,
        sourceType: submission.sourceType,
        rentType: submission.rentType,
        roommateCount: submission.roommateCount ?? null,
        trustScore: submission.trustScore,
        confidenceLevel: submission.trustScore >= 80 ? "HIGH" : "MEDIUM",
        verificationState: submission.verificationState,
        anomalyScore: submission.anomalyScore,
        freshnessScore: submission.freshnessScore,
        communityAgreementScore: submission.communityAgreementScore,
        submittedAt: new Date(submission.submittedAt),
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

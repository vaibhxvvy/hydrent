import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const localities = [
  { name: "Kukatpally", slug: "kukatpally", zone: "North West Hyderabad", lat: 17.4851, lng: 78.3955 },
  { name: "KPHB Colony", slug: "kphb-colony", zone: "North West Hyderabad", lat: 17.4913, lng: 78.4065 },
  { name: "Miyapur", slug: "miyapur", zone: "North West Hyderabad", lat: 17.5004, lng: 78.3512 },
  { name: "Ameerpet", slug: "ameerpet", zone: "Central Hyderabad", lat: 17.4376, lng: 78.4482 },
  { name: "SR Nagar", slug: "sr-nagar", zone: "Central Hyderabad", lat: 17.4377, lng: 78.4355 },
  { name: "Uppal", slug: "uppal", zone: "East Hyderabad", lat: 17.4036, lng: 78.5541 },
  { name: "LB Nagar", slug: "lb-nagar", zone: "South Hyderabad", lat: 17.3450, lng: 78.5480 },
  { name: "Dilsukhnagar", slug: "dilsukhnagar", zone: "East Hyderabad", lat: 17.3700, lng: 78.5370 },
  { name: "Secunderabad", slug: "secunderabad", zone: "Central Hyderabad", lat: 17.4399, lng: 78.4983 },
  { name: "Jubilee Hills", slug: "jubilee-hills", zone: "West Hyderabad", lat: 17.4297, lng: 78.4070 },
  { name: "Banjara Hills", slug: "banjara-hills", zone: "Central Hyderabad", lat: 17.4156, lng: 78.4340 },
  { name: "Film Nagar", slug: "film-nagar", zone: "West Hyderabad", lat: 17.4108, lng: 78.4090 },
  { name: "Tolichowki", slug: "tolichowki", zone: "West Hyderabad", lat: 17.4009, lng: 78.4260 },
  { name: "Attapur", slug: "attapur", zone: "South Hyderabad", lat: 17.3720, lng: 78.4190 },
  { name: "Mehdipatnam", slug: "mehdipatnam", zone: "West Hyderabad", lat: 17.3850, lng: 78.4350 },
  { name: "Himayatnagar", slug: "himayatnagar", zone: "Central Hyderabad", lat: 17.4020, lng: 78.4810 },
  { name: "Somajiguda", slug: "somajiguda", zone: "Central Hyderabad", lat: 17.4130, lng: 78.4630 },
  { name: "Punjagutta", slug: "punjagutta", zone: "Central Hyderabad", lat: 17.4230, lng: 78.4470 },
  { name: "Nampally", slug: "nampally", zone: "Central Hyderabad", lat: 17.3850, lng: 78.4680 },
  { name: "Kompally", slug: "kompally", zone: "North Hyderabad", lat: 17.5420, lng: 78.4860 },
  { name: "Bachupally", slug: "bachupally", zone: "North West Hyderabad", lat: 17.5400, lng: 78.3670 },
  { name: "Nizampet", slug: "nizampet", zone: "North West Hyderabad", lat: 17.5070, lng: 78.3890 },
  { name: "Chandanagar", slug: "chandanagar", zone: "West Hyderabad", lat: 17.4780, lng: 78.3100 },
  { name: "Hafeezpet", slug: "hafeezpet", zone: "North West Hyderabad", lat: 17.4980, lng: 78.3740 },
  { name: "Tellapur", slug: "tellapur", zone: "North West Hyderabad", lat: 17.4950, lng: 78.2950 },
];

async function main() {
  let city = await prisma.city.findFirst({ where: { slug: "hyderabad" } });
  if (!city) {
    city = await prisma.city.create({
      data: {
        name: "Hyderabad",
        slug: "hyderabad",
        state: "Telangana",
        country: "India",
        lat: 17.385044,
        lng: 78.486671,
      },
    });
    console.log("Created Hyderabad city:", city.id);
  } else {
    console.log("Hyderabad city exists:", city.id);
  }

  let created = 0;
  let skipped = 0;

  for (const loc of localities) {
    const existing = await prisma.locality.findFirst({
      where: { cityId: city.id, slug: loc.slug },
    });

    if (existing) {
      console.log(`Skipping ${loc.name} (already exists)`);
      skipped++;
      continue;
    }

    const zone = await prisma.zone.findFirst({
      where: { cityId: city.id, name: loc.zone },
    });

    await prisma.locality.create({
      data: {
        name: loc.name,
        slug: loc.slug,
        cityId: city.id,
        zoneId: zone?.id ?? null,
        lat: loc.lat,
        lng: loc.lng,
        summary: `${loc.name} is a locality in ${loc.zone}, Hyderabad.`,
        aliases: [],
        commuteAnchors: [],
        medianIncomeAssumed: null,
      },
    });
    console.log(`Created ${loc.name} (${loc.slug}) in ${loc.zone}`);
    created++;
  }

  console.log(`\nDone: ${created} created, ${skipped} skipped`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

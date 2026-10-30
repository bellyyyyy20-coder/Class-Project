// One-time database upgrade: adds the room `tier` column, labels the three
// existing apartments, and adds the two new rooms (Suite, Presidential Suite).
//
// It only ADDS things - it never deletes bookings or apartments - so it is
// safe to run on the live database. Run it once with:
//   node db/upgrade-tiers.ts
import { sql } from '../src/lib/db.ts';

// 1. Add the column. "IF NOT EXISTS" makes this safe to run twice.
await sql.query(`ALTER TABLE apartments ADD COLUMN IF NOT EXISTS tier TEXT NOT NULL DEFAULT 'Standard'`);

// 2. Give the existing three rooms their tier.
const existingTiers: Array<[string, string]> = [
  ['yaba-studio', 'Standard'],
  ['lekki-suite', 'Executive'],
  ['ikoyi-garden-flat', 'Deluxe'],
];
for (const [slug, tier] of existingTiers) {
  await sql.query('UPDATE apartments SET tier = $1 WHERE slug = $2', [tier, slug]);
}

// 3. Add the two missing tiers. ON CONFLICT keeps this idempotent.
const newRooms = [
  {
    slug: 'marina-suite',
    name: 'The Marina Suite',
    area: 'Victoria Island, Lagos',
    tier: 'Suite',
    description:
      'A light-filled suite with a separate sitting room, wide city views and a kitchen made for slow breakfasts. Step out to the waterfront, galleries and the business district.',
    pricePerNight: 95000,
    maxGuests: 4,
    amenities:
      'Wi-Fi, Air conditioning, Full kitchen, Separate living room, Smart TV, Washing machine, Backup power, Concierge',
    houseRules:
      'Check-in after 2:00 PM. Check-out before 11:00 AM.\nMaximum 4 guests.\nNo smoking indoors.\nNo parties or events.\nQuiet hours after 10:00 PM.',
    photos: 'marina-suite-1.jpg,marina-suite-2.jpg,marina-suite-3.jpg',
  },
  {
    slug: 'presidential-suite',
    name: 'The Presidential Suite',
    area: 'Ikoyi, Lagos',
    tier: 'Presidential Suite',
    description:
      'Our largest stay: a private three-bedroom residence with a dining room, a study and a terrace above the treetops. Made for families, celebrations and long, unhurried visits.',
    pricePerNight: 150000,
    maxGuests: 6,
    amenities:
      'Wi-Fi, Air conditioning, Full kitchen, Dining room, Study, Private terrace, Smart TV, Housekeeping daily, Secure parking',
    houseRules:
      'Check-in after 2:00 PM. Check-out before 11:00 AM.\nMaximum 6 guests.\nNo smoking indoors.\nNo parties or events without the host’s approval.\nQuiet hours after 10:00 PM.',
    photos: 'presidential-suite-1.jpg,presidential-suite-2.jpg,presidential-suite-3.jpg',
  },
];

for (const room of newRooms) {
  await sql.query(
    `INSERT INTO apartments
       (slug, name, area, tier, description, price_per_night, max_guests, amenities, house_rules, photos)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     ON CONFLICT (slug) DO NOTHING`,
    [
      room.slug,
      room.name,
      room.area,
      room.tier,
      room.description,
      room.pricePerNight * 100,
      room.maxGuests,
      room.amenities,
      room.houseRules,
      room.photos,
    ]
  );
}

const rows = await sql.query('SELECT slug, tier, price_per_night FROM apartments ORDER BY id');
console.log('Apartments after upgrade:');
for (const row of rows as Array<{ slug: string; tier: string; price_per_night: number }>) {
  console.log(`  - ${row.slug}: ${row.tier} (from ₦${row.price_per_night / 100})`);
}

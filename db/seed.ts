// Resets the Neon database and fills it with sample apartments and bookings.
// Run it with: npm run seed
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { sql } from '../src/lib/db.ts';
import { addDays, todayString } from '../src/lib/dates.ts';

const schemaStatements = readFileSync(resolve(process.cwd(), 'db', 'schema.sql'), 'utf8')
  .split(';')
  .map((statement) => statement.trim())
  .filter(Boolean);
for (const statement of schemaStatements) await sql.query(statement);
await sql.transaction((transactionSql) => [
  transactionSql`DELETE FROM payments`,
  transactionSql`DELETE FROM bookings`,
  transactionSql`DELETE FROM apartments`,
]);

interface ApartmentSeed {
  slug: string;
  name: string;
  area: string;
  /** Room tier, shown as "Standard", "Suite", etc. on the site. */
  tier: string;
  description: string;
  pricePerNightNaira: number;
  maxGuests: number;
  amenities: string;
  houseRules: string;
  photos: string;
}

const apartments: ApartmentSeed[] = [
  {
    slug: 'lekki-suite', name: 'The Lekki Suite', area: 'Lekki Phase 1, Lagos', tier: 'Executive',
    description: 'A calm, sunlit two-bedroom apartment a short drive from the beach. Floor-to-ceiling windows, a full kitchen and a quiet balcony for slow mornings. Ideal for families or friends travelling together.',
    pricePerNightNaira: 45000, maxGuests: 4,
    amenities: 'Wi-Fi, Air conditioning, Full kitchen, Smart TV, Washing machine, Backup power, Free parking, Balcony',
    houseRules: 'Check-in after 2:00 PM. Check-out before 11:00 AM.\nMaximum 4 guests.\nNo smoking indoors.\nNo parties or events.\nQuiet hours after 10:00 PM.',
    photos: 'lekki-suite-1.jpg,lekki-suite-2.jpg,lekki-suite-3.jpg',
  },
  {
    slug: 'ikoyi-garden-flat', name: 'Ikoyi Garden Flat', area: 'Old Ikoyi, Lagos', tier: 'Deluxe',
    description: 'A serene one-bedroom flat tucked inside a private garden compound. Tall palms, crisp linens and a workspace with fast internet. Made for business trips that feel like a rest.',
    pricePerNightNaira: 75000, maxGuests: 2,
    amenities: 'Wi-Fi, Air conditioning, Full kitchen, Workspace, Smart TV, Generator, Housekeeping on request',
    houseRules: 'Check-in after 2:00 PM. Check-out before 11:00 AM.\nMaximum 2 guests.\nNo smoking indoors.\nNo pets.\nNo parties or events.',
    photos: 'ikoyi-garden-flat-1.jpg,ikoyi-garden-flat-2.jpg,ikoyi-garden-flat-3.jpg',
  },
  {
    slug: 'yaba-studio', name: 'Yaba Studio', area: 'Yaba, Lagos', tier: 'Standard',
    description: 'A bright, clever studio in the heart of Yaba, minutes from the tech hubs and the mainland market. Everything you need, nothing you do not. A comfortable base for a short city stay.',
    pricePerNightNaira: 30000, maxGuests: 2,
    amenities: 'Wi-Fi, Air conditioning, Kitchenette, Smart TV, Fan, Secure entrance',
    houseRules: 'Check-in after 2:00 PM. Check-out before 11:00 AM.\nMaximum 2 guests.\nNo smoking indoors.\nNo parties or events.\nVisitors are not allowed overnight.',
    photos: 'yaba-studio-1.jpg,yaba-studio-2.jpg,yaba-studio-3.jpg',
  },
  {
    slug: 'marina-suite', name: 'The Marina Suite', area: 'Victoria Island, Lagos', tier: 'Suite',
    description: 'A light-filled suite with a separate sitting room, wide city views and a kitchen made for slow breakfasts. Step out to the waterfront, galleries and the business district.',
    pricePerNightNaira: 95000, maxGuests: 4,
    amenities: 'Wi-Fi, Air conditioning, Full kitchen, Separate living room, Smart TV, Washing machine, Backup power, Concierge',
    houseRules: 'Check-in after 2:00 PM. Check-out before 11:00 AM.\nMaximum 4 guests.\nNo smoking indoors.\nNo parties or events.\nQuiet hours after 10:00 PM.',
    photos: 'marina-suite-1.jpg,marina-suite-2.jpg,marina-suite-3.jpg',
  },
  {
    slug: 'presidential-suite', name: 'The Presidential Suite', area: 'Ikoyi, Lagos', tier: 'Presidential Suite',
    description: 'Our largest stay: a private three-bedroom residence with a dining room, a study and a terrace above the treetops. Made for families, celebrations and long, unhurried visits.',
    pricePerNightNaira: 150000, maxGuests: 6,
    amenities: 'Wi-Fi, Air conditioning, Full kitchen, Dining room, Study, Private terrace, Smart TV, Housekeeping daily, Secure parking',
    houseRules: 'Check-in after 2:00 PM. Check-out before 11:00 AM.\nMaximum 6 guests.\nNo smoking indoors.\nNo parties or events without the host’s approval.\nQuiet hours after 10:00 PM.',
    photos: 'presidential-suite-1.jpg,presidential-suite-2.jpg,presidential-suite-3.jpg',
  },
];

const apartmentIds: Record<string, number> = {};
for (const apartment of apartments) {
  const rows = await sql.query(
    `INSERT INTO apartments
       (slug, name, area, tier, description, price_per_night, max_guests, amenities, house_rules, photos)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
    [apartment.slug, apartment.name, apartment.area, apartment.tier, apartment.description,
      apartment.pricePerNightNaira * 100, apartment.maxGuests, apartment.amenities,
      apartment.houseRules, apartment.photos]
  );
  apartmentIds[apartment.slug] = Number(rows[0].id);
}

interface BookingSeed {
  reference: string;
  apartmentSlug: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guests: number;
  checkInOffset: number;
  checkOutOffset: number;
  status: 'pending' | 'confirmed' | 'conflict' | 'cancelled';
}

const bookings: BookingSeed[] = [
  { reference: 'SSDEMO1001', apartmentSlug: 'lekki-suite', guestName: 'Amara Okafor', guestEmail: 'amara@example.com', guestPhone: '+234 801 234 5678', guests: 3, checkInOffset: 7, checkOutOffset: 10, status: 'confirmed' },
  { reference: 'SSDEMO1002', apartmentSlug: 'yaba-studio', guestName: 'Chidi Bello', guestEmail: 'chidi@example.com', guestPhone: '+234 802 345 6789', guests: 1, checkInOffset: 14, checkOutOffset: 16, status: 'confirmed' },
  { reference: 'SSDEMO1003', apartmentSlug: 'lekki-suite', guestName: 'Zainab Musa', guestEmail: 'zainab@example.com', guestPhone: '+234 803 456 7890', guests: 4, checkInOffset: -20, checkOutOffset: -16, status: 'confirmed' },
  { reference: 'SSDEMO1004', apartmentSlug: 'ikoyi-garden-flat', guestName: 'Tunde Adeyemi', guestEmail: 'tunde@example.com', guestPhone: '+234 804 567 8901', guests: 2, checkInOffset: 21, checkOutOffset: 22, status: 'pending' },
];

const today = todayString();
for (const booking of bookings) {
  const checkIn = addDays(today, booking.checkInOffset);
  const checkOut = addDays(today, booking.checkOutOffset);
  const apartment = apartments.find((item) => item.slug === booking.apartmentSlug)!;
  const totalAmount = (booking.checkOutOffset - booking.checkInOffset) * apartment.pricePerNightNaira * 100;
  const rows = await sql.query(
    `INSERT INTO bookings
       (reference, apartment_id, guest_name, guest_email, guest_phone, guests,
        check_in, check_out, total_amount, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
    [booking.reference, apartmentIds[booking.apartmentSlug], booking.guestName,
      booking.guestEmail, booking.guestPhone, booking.guests, checkIn, checkOut,
      totalAmount, booking.status]
  );

  if (booking.status === 'confirmed') {
    await sql.query(
      `INSERT INTO payments (booking_id, paystack_reference, amount, status)
       VALUES ($1, $2, $3, 'success')`,
      [Number(rows[0].id), booking.reference, totalAmount]
    );
  }
}

console.log(`Seeded ${apartments.length} apartments and ${bookings.length} sample bookings.`);

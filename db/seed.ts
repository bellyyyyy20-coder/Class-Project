// Resets the database and fills it with sample data.
// Run it with:  npm run seed
import { db } from '../src/lib/db.ts';
import { addDays, todayString } from '../src/lib/dates.ts';

/* ------------------------------------------------------------------ */
/* 1. Empty the tables so seeding twice is safe                        */
/* ------------------------------------------------------------------ */
db.exec('DELETE FROM payments');
db.exec('DELETE FROM bookings');
db.exec('DELETE FROM apartments');
// sqlite_sequence keeps the auto-increment counters; reset them too.
db.exec("DELETE FROM sqlite_sequence WHERE name IN ('apartments', 'bookings', 'payments')");

/* ------------------------------------------------------------------ */
/* 2. Three apartments                                                */
/* ------------------------------------------------------------------ */
interface ApartmentSeed {
  slug: string;
  name: string;
  area: string;
  description: string;
  pricePerNightNaira: number;
  maxGuests: number;
  amenities: string;
  houseRules: string;
  photos: string;
}

const apartments: ApartmentSeed[] = [
  {
    slug: 'lekki-suite',
    name: 'The Lekki Suite',
    area: 'Lekki Phase 1, Lagos',
    description:
      'A calm, sunlit two-bedroom apartment a short drive from the beach. Floor-to-ceiling windows, a full kitchen and a quiet balcony for slow mornings. Ideal for families or friends travelling together.',
    pricePerNightNaira: 45000,
    maxGuests: 4,
    amenities:
      'Wi-Fi, Air conditioning, Full kitchen, Smart TV, Washing machine, Backup power, Free parking, Balcony',
    houseRules:
      'Check-in after 2:00 PM. Check-out before 11:00 AM.\nMaximum 4 guests.\nNo smoking indoors.\nNo parties or events.\nQuiet hours after 10:00 PM.',
    photos: 'lekki-suite-1.jpg,lekki-suite-2.jpg,lekki-suite-3.jpg',
  },
  {
    slug: 'ikoyi-garden-flat',
    name: 'Ikoyi Garden Flat',
    area: 'Old Ikoyi, Lagos',
    description:
      'A serene one-bedroom flat tucked inside a private garden compound. Tall palms, crisp linens and a workspace with fast internet. Made for business trips that feel like a rest.',
    pricePerNightNaira: 75000,
    maxGuests: 2,
    amenities:
      'Wi-Fi, Air conditioning, Full kitchen, Workspace, Smart TV, Generator, Housekeeping on request',
    houseRules:
      'Check-in after 2:00 PM. Check-out before 11:00 AM.\nMaximum 2 guests.\nNo smoking indoors.\nNo pets.\nNo parties or events.',
    photos: 'ikoyi-garden-flat-1.jpg,ikoyi-garden-flat-2.jpg,ikoyi-garden-flat-3.jpg',
  },
  {
    slug: 'yaba-studio',
    name: 'Yaba Studio',
    area: 'Yaba, Lagos',
    description:
      'A bright, clever studio in the heart of Yaba, minutes from the tech hubs and the mainland market. Everything you need, nothing you do not. A comfortable base for a short city stay.',
    pricePerNightNaira: 30000,
    maxGuests: 2,
    amenities:
      'Wi-Fi, Air conditioning, Kitchenette, Smart TV, Fan, Secure entrance',
    houseRules:
      'Check-in after 2:00 PM. Check-out before 11:00 AM.\nMaximum 2 guests.\nNo smoking indoors.\nNo parties or events.\nVisitors are not allowed overnight.',
    photos: 'yaba-studio-1.jpg,yaba-studio-2.jpg,yaba-studio-3.jpg',
  },
];

const insertApartment = db.prepare(
  `INSERT INTO apartments
     (slug, name, area, description, price_per_night, max_guests, amenities, house_rules, photos)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
);

const apartmentIds: Record<string, number> = {};
for (const apartment of apartments) {
  const result = insertApartment.run(
    apartment.slug,
    apartment.name,
    apartment.area,
    apartment.description,
    apartment.pricePerNightNaira * 100, // Naira -> kobo
    apartment.maxGuests,
    apartment.amenities,
    apartment.houseRules,
    apartment.photos
  );
  apartmentIds[apartment.slug] = Number(result.lastInsertRowid);
}

/* ------------------------------------------------------------------ */
/* 3. A few sample bookings so the calendar is not empty               */
/* ------------------------------------------------------------------ */
const today = todayString();

interface BookingSeed {
  reference: string;
  apartmentSlug: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guests: number;
  checkInOffset: number; // days from today
  checkOutOffset: number; // days from today
  status: 'pending' | 'confirmed' | 'conflict' | 'cancelled';
}

const bookings: BookingSeed[] = [
  {
    reference: 'SSDEMO1001',
    apartmentSlug: 'lekki-suite',
    guestName: 'Amara Okafor',
    guestEmail: 'amara@example.com',
    guestPhone: '+234 801 234 5678',
    guests: 3,
    checkInOffset: 7,
    checkOutOffset: 10, // 3 nights, blocked on the calendar
    status: 'confirmed',
  },
  {
    reference: 'SSDEMO1002',
    apartmentSlug: 'yaba-studio',
    guestName: 'Chidi Bello',
    guestEmail: 'chidi@example.com',
    guestPhone: '+234 802 345 6789',
    guests: 1,
    checkInOffset: 14,
    checkOutOffset: 16, // 2 nights
    status: 'confirmed',
  },
  {
    reference: 'SSDEMO1003',
    apartmentSlug: 'lekki-suite',
    guestName: 'Zainab Musa',
    guestEmail: 'zainab@example.com',
    guestPhone: '+234 803 456 7890',
    guests: 4,
    checkInOffset: -20,
    checkOutOffset: -16, // a past stay, so the host list has history
    status: 'confirmed',
  },
  {
    reference: 'SSDEMO1004',
    apartmentSlug: 'ikoyi-garden-flat',
    guestName: 'Tunde Adeyemi',
    guestEmail: 'tunde@example.com',
    guestPhone: '+234 804 567 8901',
    guests: 2,
    checkInOffset: 21,
    checkOutOffset: 22,
    // A pending booking does NOT block dates - only confirmed ones do.
    status: 'pending',
  },
];

const insertBooking = db.prepare(
  `INSERT INTO bookings
     (reference, apartment_id, guest_name, guest_email, guest_phone, guests,
      check_in, check_out, total_amount, status)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
);

const insertPayment = db.prepare(
  `INSERT INTO payments (booking_id, paystack_reference, amount, status)
   VALUES (?, ?, ?, ?)`
);

for (const booking of bookings) {
  const apartmentId = apartmentIds[booking.apartmentSlug];
  const checkIn = addDays(today, booking.checkInOffset);
  const checkOut = addDays(today, booking.checkOutOffset);
  const nights = booking.checkOutOffset - booking.checkInOffset;
  const pricePerNight = apartments.find((a) => a.slug === booking.apartmentSlug)!
    .pricePerNightNaira;
  const totalAmount = nights * pricePerNight * 100; // kobo

  const result = insertBooking.run(
    booking.reference,
    apartmentId,
    booking.guestName,
    booking.guestEmail,
    booking.guestPhone,
    booking.guests,
    checkIn,
    checkOut,
    totalAmount,
    booking.status
  );

  if (booking.status === 'confirmed') {
    insertPayment.run(Number(result.lastInsertRowid), booking.reference, totalAmount, 'success');
  }
}

console.log(`Seeded ${apartments.length} apartments and ${bookings.length} bookings.`);
console.log('Sample bookings start from today:', today);

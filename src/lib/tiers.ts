// The five room tiers, in the order they should appear on the site.
//
// The landing page and the /apartments filter both read this list, so the
// names and links can never drift apart. Each apartment stores its own tier
// in the database (`apartments.tier`), matched to `slug` here.

export interface RoomTier {
  /** Used in the database and in links like /apartments?tier=suite */
  slug: string;
  /** The label a guest sees. */
  name: string;
  /** One short line describing who the tier suits. */
  blurb: string;
}

export const ROOM_TIERS: RoomTier[] = [
  { slug: 'standard', name: 'Standard', blurb: 'Smart, comfortable rooms for a simple city stay.' },
  { slug: 'executive', name: 'Executive', blurb: 'More space and a little extra comfort for longer trips.' },
  { slug: 'deluxe', name: 'Deluxe', blurb: 'Generous living space and thoughtful finishing touches.' },
  { slug: 'suite', name: 'Suite', blurb: 'A separate living area, made for slow mornings.' },
  { slug: 'presidential-suite', name: 'Presidential Suite', blurb: 'Our largest and most private stay, with room to host.' },
];

/** Turns a tier slug into its display name, or '' if it is unknown. */
export function tierName(slug: string): string {
  return ROOM_TIERS.find((tier) => tier.slug === slug)?.name ?? '';
}

/** A safe list of tier slugs, used when reading the ?tier= link. */
export const ROOM_TIER_SLUGS = ROOM_TIERS.map((tier) => tier.slug);

/**
 * Generates a valid mock package object for testing.
 * Pass partial overrides to customize specific fields.
 */
export function buildPackage(overrides = {}) {
  return {
    destinationId: "amalfi",
    category: "Honeymoon",
    categories: ["category-id-1"],
    title: "Amalfi Coast Explorer",
    location: "Italy, Europe",
    image: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=800&q=80",
    ],
    description: "Glide along the stunning clifftops of Amalfi.",
    price: 1299,
    originalPrice: 1599,
    days: 5,
    nights: 4,
    accommodation: "4★ Sea-View Hotel",
    excursions: "Boat Cruise & Ravello Tour",
    meals: "Breakfast & Dinner",
    schedule: [
      { dayTitle: "Day 1: Arrival", dayDesc: "Welcome to Amalfi." },
    ],
    activities: [
      { name: "Boat Tour", day: 1, isIncluded: true },
    ],
    inclusions: ["Hotel Stay", "Daily Breakfast"],
    exclusions: ["Flights"],
    seo: { title: "Amalfi Tour", description: "Book now", keywords: "amalfi" },
    ...overrides,
  };
}

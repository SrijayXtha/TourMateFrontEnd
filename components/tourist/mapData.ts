export type MapEntityType = "guide" | "hotel" | "place";

export interface MapEntity {
  id: string;
  name: string;
  type: MapEntityType;
  latitude: number;
  longitude: number;
  address: string;
  image: string;
  rating: number;
  distance?: number;
  description: string;
  category?: string;
  experience?: string;
  price?: string;
  difficulty?: string;
  duration?: string;
  bestTime?: string;
  activities?: string[];
  highlights?: string[];
  specialties?: string[];
  amenities?: string[];
}

export const DEFAULT_KATHMANDU = {
  name: "Kathmandu",
  latitude: 27.7172,
  longitude: 85.324,
  address: "Kathmandu, Nepal",
};

export const SAMPLE_GUIDES: MapEntity[] = [
  {
    id: "guide-kiran",
    name: "Kiran Tamang",
    type: "guide",
    latitude: 27.7134,
    longitude: 85.3181,
    address: "Thamel, Kathmandu",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&q=80",
    rating: 4.8,
    description: "Cultural walking guide for heritage and food tours.",
    experience: "5 years",
    price: "$45/day",
    specialties: ["Cultural", "Food", "Heritage"],
  },
  {
    id: "guide-priya",
    name: "Priya Shrestha",
    type: "guide",
    latitude: 27.7196,
    longitude: 85.3304,
    address: "Durbar Marg, Kathmandu",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&q=80",
    rating: 4.7,
    description: "Private guide for city highlights and museums.",
    experience: "3 years",
    price: "$38/day",
    specialties: ["Museums", "Family Tours", "History"],
  },
  {
    id: "guide-suman",
    name: "Suman Rai",
    type: "guide",
    latitude: 27.681,
    longitude: 85.3167,
    address: "Jawalakhel, Lalitpur",
    image:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&q=80",
    rating: 4.9,
    description: "Adventure and day-hike guide around the valley.",
    experience: "7 years",
    price: "$55/day",
    specialties: ["Adventure", "Nature", "Hiking"],
  },
];

export const SAMPLE_HOTELS: MapEntity[] = [
  {
    id: "hotel-yak",
    name: "Yak Courtyard Hotel",
    type: "hotel",
    latitude: 27.7115,
    longitude: 85.3128,
    address: "Thamel, Kathmandu",
    image:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80",
    rating: 4.6,
    description: "Boutique stay close to shopping, dining, and nightlife.",
    price: "$82/night",
    amenities: ["Wi-Fi", "Breakfast", "Airport Pickup"],
  },
  {
    id: "hotel-patan",
    name: "Patan Heritage House",
    type: "hotel",
    latitude: 27.6716,
    longitude: 85.3251,
    address: "Mangal Bazaar, Lalitpur",
    image:
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80",
    rating: 4.5,
    description: "Quiet heritage stay near Patan Durbar Square.",
    price: "$64/night",
    amenities: ["Wi-Fi", "Garden", "Breakfast"],
  },
  {
    id: "hotel-boudha",
    name: "Stupa View Suites",
    type: "hotel",
    latitude: 27.7218,
    longitude: 85.3626,
    address: "Boudha, Kathmandu",
    image:
      "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&q=80",
    rating: 4.7,
    description: "Comfortable rooms near the Boudhanath stupa.",
    price: "$73/night",
    amenities: ["Wi-Fi", "Rooftop", "Restaurant"],
  },
];

export const SAMPLE_PLACES: MapEntity[] = [
  {
    id: "place-kathmandu",
    name: "Kathmandu",
    type: "place",
    latitude: 27.7172,
    longitude: 85.324,
    address: "Kathmandu, Nepal",
    image:
      "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=600&q=80",
    rating: 4.8,
    description: "Heritage core and cultural hotspots.",
    category: "City",
    price: "Free",
  },
  {
    id: "place-patan",
    name: "Patan Durbar Square",
    type: "place",
    latitude: 27.6731,
    longitude: 85.3253,
    address: "Lalitpur, Nepal",
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=600&q=80",
    rating: 4.7,
    description: "Palaces, temples, and art courtyards in Lalitpur.",
    category: "Heritage",
    price: "$12 entry",
  },
  {
    id: "place-boudha",
    name: "Boudhanath Stupa",
    type: "place",
    latitude: 27.7215,
    longitude: 85.362,
    address: "Boudha, Kathmandu",
    image:
      "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=600&q=80",
    rating: 4.9,
    description: "A spiritual landmark with cafés and monastery lanes.",
    category: "Landmark",
    price: "$5 entry",
  },
];

export const SAMPLE_MAP_ENTITIES: MapEntity[] = [
  ...SAMPLE_GUIDES,
  ...SAMPLE_HOTELS,
  ...SAMPLE_PLACES,
];

export const toGuideDetails = (entity: MapEntity) => ({
  id: entity.id,
  name: entity.name,
  photo: entity.image,
  rating: entity.rating,
  experience: entity.experience || "3 years",
  specialties: entity.specialties || ["Local Tours"],
  pricePerDay: entity.price || "$40/day",
  verified: true,
  bio: entity.description,
  languages: ["English", "Nepali"],
  location: entity.address,
  availability: ["Today", "Tomorrow"],
  minDurationDays: 1,
  minDurationLabel: "1 day",
});

export const toHotelDetails = (entity: MapEntity) => ({
  id: entity.id,
  name: entity.name,
  image: entity.image,
  rating: entity.rating,
  location: entity.address,
  pricePerNight: entity.price || "$70/night",
  amenities: entity.amenities || ["Wi-Fi", "Breakfast"],
  verified: true,
  description: entity.description,
  roomTypes: ["Standard", "Deluxe"],
});

export const toDestinationDetails = (entity: MapEntity) => ({
  id: entity.id,
  name: entity.name,
  image: entity.image,
  rating: entity.rating,
  location: entity.address,
  category: entity.category || "Destination",
  difficulty: entity.difficulty || "Easy",
  duration: entity.duration || "1 day",
  bestTime: entity.bestTime || "All year",
  description: entity.description,
  activities: entity.activities || ["Sightseeing", "Photography", "Walking"],
  highlights: entity.highlights || ["Local culture", "Nearby guides", "Nearby hotels"],
  price: entity.price || "Free",
});

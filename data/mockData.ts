export interface Review {
  user: string;
  rating: number;
  comment: string;
}

export interface Guide {
  id: string;
  name: string;
  photo: string | number;
  rating: number;
  experience: string;
  specialties: string[];
  specialityLocations?: string[];
  pricePerDay: string;
  verified: boolean;
  bio?: string;
  languages?: string[];
  location?: string;
  reviews?: Review[];
  availability?: string[];
  destinationId?: string;
}

export const mockGuides: Guide[] = [
  {
    id: "1",
    name: "Pema Sherpa",
    photo: require("../assets/images/profile.png"),
    rating: 4.9,
    experience: "8 years",
    specialties: ["Mountain Trekking", "Wildlife Tours"],
    specialityLocations: ["Sagarmatha", "Everest Region", "Annapurna Region"],
    pricePerDay: "Rs 1200",
    verified: true,
    bio: "Experienced mountain guide specializing in Himalayan treks and wildlife tours.",
    languages: ["English", "Nepali", "Hindi"],
    location: "Kathmandu, Nepal",
    availability: ["2026-03-15", "2026-03-16", "2026-03-17", "2026-03-20", "2026-03-21", "2026-03-22"],
    reviews: [
      { user: "Mike Johnson", rating: 5, comment: "Pema is an outstanding guide! The trek was absolutely amazing." },
      { user: "Sarah Williams", rating: 4.8, comment: "Very knowledgeable about the mountains and wildlife. Highly recommend!" },
      { user: "David Brown", rating: 5, comment: "Best mountain guide in Nepal. Worth every rupee." },
    ],
  },
  {
    id: "2",
    name: "Alex Shrestha",
    photo: require("../assets/images/profile.png"),
    rating: 4.8,
    experience: "5 years",
    specialties: ["Cultural Tours", "Food Tours"],
    specialityLocations: ["Kathmandu Valley", "Lumbini"],
    pricePerDay: "Rs 1000",
    verified: true,
    bio: "Cultural expert specializing in heritage sites and authentic local cuisine experiences.",
    languages: ["English", "Nepali", "Hindi"],
    location: "Kathmandu, Nepal",
    availability: ["2026-03-18", "2026-03-19", "2026-03-25", "2026-03-26", "2026-03-27"],
    reviews: [
      { user: "Emma Davis", rating: 5, comment: "Alex's food tour was incredible! Great cultural insights too." },
      { user: "James Wilson", rating: 4.7, comment: "Wonderful experience learning about local culture and cuisine." },
    ],
  },
  {
    id: "3",
    name: "Aadil Bhandari",
    photo: require("../assets/images/profile.png"),
    rating: 4.7,
    experience: "6 years",
    specialties: ["Coastal Tours", "Photography", "Adventure Sports"],
    specialityLocations: ["Pokhara", "Annapurna Region"],
    pricePerDay: "Rs 1100",
    verified: true,
    bio: "Coastal adventure specialist with expertise in beach activities and photography.",
    languages: ["English", "Hindi", "Marathi"],
    location: "Goa, India",
    availability: ["2026-03-14", "2026-03-15", "2026-03-21", "2026-03-22", "2026-03-28"],
    reviews: [
      { user: "Tom Anderson", rating: 4.8, comment: "Great coastal tour! Aadil knows all the best spots." },
      { user: "Lisa Martinez", rating: 4.6, comment: "Loved the photography sessions. Very professional guide." },
    ],
  },
  {
    id: "4",
    name: "Priya Sharma",
    photo: require("../assets/images/profile.png"),
    rating: 4.9,
    experience: "7 years",
    specialties: ["Historical Sites", "Temple Tours", "Heritage Walks"],
    specialityLocations: ["Lumbini", "Kathmandu Valley"],
    pricePerDay: "Rs 950",
    verified: true,
    bio: "Heritage and history specialist with deep knowledge of ancient temples and monuments.",
    languages: ["English", "Hindi", "Tamil"],
    location: "Jaipur, India",
    availability: ["2026-03-16", "2026-03-17", "2026-03-18", "2026-03-23", "2026-03-24"],
    reviews: [
      { user: "Chris Thompson", rating: 5, comment: "Priya's knowledge of history is amazing. Best tour ever!" },
      { user: "Nina Patel", rating: 4.9, comment: "So informative and passionate about heritage. Highly recommend!" },
      { user: "Robert Lee", rating: 4.8, comment: "Wonderful experience exploring historical sites with Priya." },
    ],
  },
  {
    id: "5",
    name: "Rajesh Kumar",
    photo: require("../assets/images/profile.png"),
    rating: 4.6,
    experience: "9 years",
    specialties: ["Desert Safari", "Camping", "Stargazing"],
    specialityLocations: ["Chitwan National Park"],
    pricePerDay: "Rs 1350",
    verified: true,
    bio: "Desert adventure expert specializing in safari tours and desert camping experiences.",
    languages: ["English", "Hindi", "Rajasthani"],
    location: "Jaisalmer, India",
    availability: ["2026-03-19", "2026-03-20", "2026-03-26", "2026-03-27"],
    reviews: [
      { user: "Anna Kim", rating: 4.7, comment: "Amazing desert experience! Rajesh is a fantastic guide." },
      { user: "Mark Zhang", rating: 4.5, comment: "The night camping under stars was unforgettable." },
    ],
  },
  {
    id: "6",
    name: "Nisha Thapa",
    photo: require("../assets/images/profile.png"),
    rating: 4.8,
    experience: "6 years",
    specialties: ["Yoga Retreats", "Wellness Tours", "Spiritual Journeys"],
    specialityLocations: ["Pokhara", "Lumbini"],
    pricePerDay: "Rs 1150",
    verified: true,
    bio: "Wellness and spirituality guide specializing in yoga retreats and meditation tours.",
    languages: ["English", "Nepali", "Hindi"],
    location: "Rishikesh, India",
    availability: ["2026-03-15", "2026-03-16", "2026-03-22", "2026-03-23", "2026-03-29", "2026-03-30"],
    reviews: [
      { user: "Jessica Taylor", rating: 5, comment: "Nisha's yoga retreat was life-changing. Perfect guidance!" },
      { user: "Daniel Moore", rating: 4.7, comment: "Great spiritual journey. Very peaceful and enlightening." },
      { user: "Karen White", rating: 4.8, comment: "Best wellness tour guide in Rishikesh. Highly recommend!" },
    ],
  },
];

export interface Hotel {
  id: string;
  name: string;
  image: string;
  rating: number;
  location: string;
  pricePerNight: string;
  amenities: string[];
  verified: boolean;
  description?: string;
  roomTypes?: string[];
}

export const mockHotels: Hotel[] = [
  {
    id: "1",
    name: "Hotel Himalaya",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
    rating: 4.8,
    location: "Lalitpur, Kathmandu",
    pricePerNight: "Rs 12,500",
    amenities: ["Free WiFi", "Pool", "Restaurant", "Spa", "Gym"],
    verified: true,
    description: "Luxury hotel with stunning mountain views and world-class amenities",
    roomTypes: ["Standard", "Deluxe", "Suite"],
  },
  {
    id: "2",
    name: "Temple Tree Resort & Spa",
    image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800",
    rating: 4.9,
    location: "Lakeside, Pokhara",
    pricePerNight: "Rs 8,500",
    amenities: ["Free WiFi", "Lake View", "Garden", "Restaurant", "Spa"],
    verified: true,
    description: "Peaceful lakeside resort with beautiful Annapurna views",
    roomTypes: ["Standard", "Lake View", "Suite"],
  },
  {
    id: "3",
    name: "Dwarika's Hotel",
    image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800",
    rating: 4.6,
    location: "Battisputali, Kathmandu",
    pricePerNight: "Rs 15,000",
    amenities: ["Free WiFi", "Heritage Architecture", "Pool", "Spa", "Restaurant"],
    verified: true,
    description: "Heritage boutique hotel showcasing traditional Newari architecture",
    roomTypes: ["Standard", "Heritage Suite", "Royal Suite"],
  },
  {
    id: "4",
    name: "Meghauli Serai",
    image: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800",
    rating: 4.7,
    location: "Chitwan National Park",
    pricePerNight: "Rs 18,000",
    amenities: ["Free WiFi", "Jungle Safari", "Pool", "Restaurant", "Nature Tours"],
    verified: true,
    description: "Luxury jungle resort on the edge of Chitwan National Park",
    roomTypes: ["Standard", "Suite", "Villa"],
  },
  {
    id: "5",
    name: "Pavilions Himalayas",
    image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800",
    rating: 4.5,
    location: "Pokhara Valley",
    pricePerNight: "Rs 22,000",
    amenities: ["Free WiFi", "Private Villas", "Infinity Pool", "Spa", "Fine Dining"],
    verified: true,
    description: "Eco-luxury boutique resort with panoramic Himalayan views",
    roomTypes: ["Premium Villa", "Luxury Villa"],
  },
  {
    id: "6",
    name: "Hyatt Regency Kathmandu",
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800",
    rating: 4.8,
    location: "Boudha, Kathmandu",
    pricePerNight: "Rs 14,800",
    amenities: ["Free WiFi", "Pool", "Casino", "Spa", "Multiple Restaurants"],
    verified: true,
    description: "Five-star hotel near Boudhanath Stupa with extensive facilities",
    roomTypes: ["Deluxe", "Regency Club", "Presidential Suite"],
  },
];

export interface EmergencyContact {
  name: string;
  number: string;
  type: "emergency" | "support";
  description?: string;
}

export const mockEmergencyContacts: EmergencyContact[] = [
  {
    name: "Emergency Services",
    number: "911",
    type: "emergency",
    description: "Police, Fire, Medical emergencies",
  },
  {
    name: "Police Department",
    number: "911",
    type: "emergency",
    description: "Law enforcement assistance",
  },
  {
    name: "Fire Department",
    number: "911",
    type: "emergency",
    description: "Fire and rescue services",
  },
  {
    name: "Medical Emergency",
    number: "911",
    type: "emergency",
    description: "Ambulance and medical services",
  },
  {
    name: "Tourist Helpline",
    number: "1-800-TOURIST",
    type: "support",
    description: "24/7 tourist assistance",
  },
  {
    name: "Embassy Support",
    number: "+1 (202) 501-4444",
    type: "support",
    description: "Consular services and support",
  },
  {
    name: "Travel Insurance",
    number: "1-800-INSURE",
    type: "support",
    description: "Claims and assistance",
  },
  {
    name: "Roadside Assistance",
    number: "1-800-AAA-HELP",
    type: "support",
    description: "Vehicle breakdown support",
  },
];

export interface Destination {
  id: string;
  name: string;
  image: string;
  rating: number;
  location: string;
  category: string;
  difficulty: string;
  duration: string;
  bestTime: string;
  description: string;
  activities: string[];
  highlights: string[];
  price: string;
}

export const mockDestinations: Destination[] = [
  {
    id: "1",
    name: "Mount Everest Base Camp Trek",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
    rating: 4.9,
    location: "Sagarmatha, Nepal",
    category: "Adventure",
    difficulty: "Challenging",
    duration: "12-14 days",
    bestTime: "Mar-May, Sep-Nov",
    description: "Trek to the base of the world's highest mountain through stunning Himalayan landscapes. Experience Sherpa culture and witness breathtaking mountain views.",
    activities: ["Trekking", "Mountain Views", "Cultural Experience", "Photography"],
    highlights: [
      "Reach Everest Base Camp at 5,364m",
      "Visit Tengboche Monastery",
      "Experience Sherpa culture in Namche Bazaar",
      "Stunning views of Everest, Lhotse, and Ama Dablam",
    ],
    price: "Rs 85,000",
  },
  {
    id: "2",
    name: "Pokhara Valley Exploration",
    image: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800",
    rating: 4.8,
    location: "Pokhara, Nepal",
    category: "Scenic",
    difficulty: "Easy",
    duration: "3-5 days",
    bestTime: "Year Round",
    description: "Discover the natural beauty of Pokhara with its serene lakes, stunning mountain views, and adventure activities. Perfect for all ages.",
    activities: ["Boating", "Paragliding", "Cave Exploration", "Sunrise Views"],
    highlights: [
      "Phewa Lake boat rides",
      "Sarangkot sunrise views",
      "World Peace Pagoda visit",
      "Davis Falls and Gupteshwor Cave",
    ],
    price: "Rs 25,000",
  },
  {
    id: "3",
    name: "Annapurna Circuit Trek",
    image: "https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=800",
    rating: 4.9,
    location: "Annapurna Region, Nepal",
    category: "Adventure",
    difficulty: "Challenging",
    duration: "15-20 days",
    bestTime: "Mar-May, Oct-Nov",
    description: "Complete the famous Annapurna circuit, crossing the Thorong La Pass at 5,416m. Experience diverse landscapes from subtropical forests to high mountain deserts.",
    activities: ["Trekking", "High Altitude", "Cultural Tours", "Hot Springs"],
    highlights: [
      "Cross Thorong La Pass",
      "Visit Muktinath Temple",
      "Explore Manang village",
      "Natural hot springs at Tatopani",
    ],
    price: "Rs 95,000",
  },
  {
    id: "4",
    name: "Chitwan Jungle Safari",
    image: "https://images.unsplash.com/photo-1564760055775-d63b17a55c44?w=800",
    rating: 4.7,
    location: "Chitwan National Park, Nepal",
    category: "Wildlife",
    difficulty: "Easy",
    duration: "2-3 days",
    bestTime: "Oct-Mar",
    description: "Experience Nepal's rich wildlife in Chitwan National Park. Spot one-horned rhinos, Bengal tigers, and diverse bird species on jungle safaris.",
    activities: ["Jungle Safari", "Elephant Rides", "Bird Watching", "Canoeing"],
    highlights: [
      "Jeep safari through the jungle",
      "Elephant breeding center visit",
      "Tharu cultural dance performance",
      "Rapti river canoeing",
    ],
    price: "Rs 35,000",
  },
  {
    id: "5",
    name: "Lumbini Pilgrimage Tour",
    image: "https://images.unsplash.com/photo-1548013146-72479768bada?w=800",
    rating: 4.6,
    location: "Lumbini, Nepal",
    category: "Cultural",
    difficulty: "Easy",
    duration: "2-3 days",
    bestTime: "Oct-Mar",
    description: "Visit the birthplace of Lord Buddha and explore the sacred gardens, ancient ruins, and international monasteries in this UNESCO World Heritage Site.",
    activities: ["Temple Tours", "Meditation", "Historical Sites", "Cultural Experience"],
    highlights: [
      "Maya Devi Temple",
      "Ashoka Pillar",
      "International Monasteries",
      "Sacred Garden",
    ],
    price: "Rs 20,000",
  },
  {
    id: "6",
    name: "Kathmandu Valley Heritage Tour",
    image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800",
    rating: 4.8,
    location: "Kathmandu Valley, Nepal",
    category: "Cultural",
    difficulty: "Easy",
    duration: "3-4 days",
    bestTime: "Year Round",
    description: "Explore the rich cultural heritage of Kathmandu Valley with visits to ancient temples, palaces, and UNESCO World Heritage Sites.",
    activities: ["Temple Tours", "Historical Sites", "Local Markets", "Traditional Crafts"],
    highlights: [
      "Pashupatinath Temple",
      "Boudhanath Stupa",
      "Swayambhunath (Monkey Temple)",
      "Durbar Square complexes",
    ],
    price: "Rs 30,000",
  },
];

export interface Booking {
  id: string;
  type: "guide" | "hotel";
  guideName?: string;
  hotelName?: string;
  date?: string;
  checkIn?: string;
  checkOut?: string;
  duration?: string;
  price: string;
  status: "confirmed" | "pending";
  location?: string;
}

export const mockBookings: Booking[] = [
  {
    id: "1",
    type: "guide",
    guideName: "Pema Sherpa",
    date: "March 20, 2026",
    duration: "3 days",
    price: "Rs 3,600",
    status: "confirmed",
    location: "Everest Region",
  },
  {
    id: "2",
    type: "hotel",
    hotelName: "Hotel Himalaya",
    checkIn: "March 15, 2026",
    checkOut: "March 18, 2026",
    price: "Rs 37,500",
    status: "confirmed",
    location: "Kathmandu",
  },
  {
    id: "3",
    type: "guide",
    guideName: "Alex Shrestha",
    date: "March 25, 2026",
    duration: "2 days",
    price: "Rs 2,000",
    status: "pending",
    location: "Kathmandu",
  },
  {
    id: "4",
    type: "hotel",
    hotelName: "Temple Tree Resort & Spa",
    checkIn: "April 5, 2026",
    checkOut: "April 8, 2026",
    price: "Rs 25,500",
    status: "confirmed",
    location: "Pokhara",
  },
];

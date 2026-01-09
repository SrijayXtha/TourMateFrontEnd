export interface Guide {
  id: string;
  name: string;
  photo: string;
  rating: number;
  experience: string;
  specialties: string[];
  pricePerDay: string;
  verified: boolean;
  bio?: string;
  languages?: string[];
  location?: string;
}

export const mockGuides: Guide[] = [
  {
    id: "1",
    name: "John Smith",
    photo: "https://randomuser.me/api/portraits/men/32.jpg",
    rating: 4.8,
    experience: "8 years",
    specialties: ["Mountain Trekking", "Adventure Sports", "Photography"],
    pricePerDay: "$120",
    verified: true,
    bio: "Experienced mountain guide with a passion for adventure and photography.",
    languages: ["English", "Spanish", "French"],
    location: "Colorado, USA",
  },
  {
    id: "2",
    name: "Maria Garcia",
    photo: "https://randomuser.me/api/portraits/women/44.jpg",
    rating: 4.9,
    experience: "10 years",
    specialties: ["Cultural Tours", "Historical Sites", "Food & Wine"],
    pricePerDay: "$100",
    verified: true,
    bio: "Cultural expert specializing in historical tours and local cuisine.",
    languages: ["English", "Spanish", "Italian"],
    location: "Barcelona, Spain",
  },
  {
    id: "3",
    name: "Ahmed Hassan",
    photo: "https://randomuser.me/api/portraits/men/52.jpg",
    rating: 4.7,
    experience: "6 years",
    specialties: ["Desert Safari", "Wildlife", "Camping"],
    pricePerDay: "$95",
    verified: true,
    bio: "Desert specialist with extensive knowledge of wildlife and ecosystems.",
    languages: ["English", "Arabic"],
    location: "Dubai, UAE",
  },
  {
    id: "4",
    name: "Sarah Johnson",
    photo: "https://randomuser.me/api/portraits/women/65.jpg",
    rating: 4.9,
    experience: "12 years",
    specialties: ["Beach Activities", "Diving", "Marine Biology"],
    pricePerDay: "$110",
    verified: true,
    bio: "Marine biologist and certified dive instructor.",
    languages: ["English", "Portuguese"],
    location: "Hawaii, USA",
  },
  {
    id: "5",
    name: "Chen Wei",
    photo: "https://randomuser.me/api/portraits/men/71.jpg",
    rating: 4.6,
    experience: "7 years",
    specialties: ["City Tours", "Shopping", "Modern Architecture"],
    pricePerDay: "$85",
    verified: false,
    bio: "Urban explorer with deep knowledge of modern Asian cities.",
    languages: ["English", "Mandarin", "Cantonese"],
    location: "Shanghai, China",
  },
  {
    id: "6",
    name: "Emma Wilson",
    photo: "https://randomuser.me/api/portraits/women/29.jpg",
    rating: 4.8,
    experience: "9 years",
    specialties: ["Wildlife Safari", "Photography", "Conservation"],
    pricePerDay: "$130",
    verified: true,
    bio: "Wildlife photographer and conservation advocate.",
    languages: ["English", "Swahili"],
    location: "Nairobi, Kenya",
  },
];

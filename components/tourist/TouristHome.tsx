import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { authAPI, publicAPI, touristAPI } from "../../constants/api";
import { TouristTopBar } from "../common/TouristTopBar";

interface TouristHomeProps {
  onNavigate: (screen: string, data?: any) => void;
}

interface HomeStats {
  activeTrips: number;
  savedPlaces: number;
  reviews: number;
}

interface HomeGuideCard {
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
  destinations?: { destinationId?: number; name: string; location?: string }[];
  location?: string;
  reviews?: { user: string; rating: number; comment: string }[];
  availability?: string[];
  minDurationDays?: number;
  minDurationLabel?: string;
}

interface HomeHotelCard {
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

const GUIDE_FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&q=80",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&q=80",
];

const HOTEL_FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900&q=80",
  "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=900&q=80",
  "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=900&q=80",
];

const formatExperience = (value: unknown) => {
  const years = Number(value);
  if (!Number.isFinite(years) || years <= 0) {
    return "Local expert";
  }

  return `${years} year${years === 1 ? "" : "s"} experience`;
};

const toGuideCard = (guide: any, index: number): HomeGuideCard => {
  const destinations = Array.isArray(guide.destinations) ? guide.destinations : [];
  const languages = Array.isArray(guide.languages) ? guide.languages : ["English", "Nepali"];
  return {
    id: String(guide.guideId ?? guide.id ?? index + 1),
    name: String(guide.name || "Local Guide"),
    photo: guide.photo || GUIDE_FALLBACK_IMAGES[index % GUIDE_FALLBACK_IMAGES.length],
    rating: Number.parseFloat(String(guide.avgRating ?? guide.rating ?? "4.8")) || 4.8,
    experience: formatExperience(guide.experienceYears),
    specialties: [String(guide.specialization || guide.bio || "Custom local tours")],
    pricePerDay: `NPR ${2500 + index * 500}/day`,
    verified: true,
    bio: guide.bio || "Friendly local guide with personalized recommendations.",
    languages,
    destinations,
    location: destinations[0]?.name || guide.location || "Nepal",
    reviews: [],
    availability: ["Available this week"],
    minDurationDays: 1,
    minDurationLabel: "1 day",
  };
};

const toHotelCard = (hotel: any, index: number): HomeHotelCard => ({
  id: String(hotel.hotelId ?? hotel.id ?? index + 1),
  name: String(hotel.name || "Featured Stay"),
  image: hotel.image || HOTEL_FALLBACK_IMAGES[index % HOTEL_FALLBACK_IMAGES.length],
  rating: Number.parseFloat(String(hotel.avgRating ?? hotel.rating ?? "4.6")) || 4.6,
  location: String(hotel.location || "Nepal"),
  pricePerNight: `NPR ${4500 + index * 700}/night`,
  amenities: ["WiFi", "Breakfast", "Great Location"],
  verified: true,
  description: hotel.description || "Comfortable stay with easy access to nearby attractions.",
  roomTypes: ["Standard Room", "Deluxe Room"],
});

export function TouristHome({ onNavigate }: TouristHomeProps) {
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [stats, setStats] = useState<HomeStats>({
    activeTrips: 0,
    savedPlaces: 0,
    reviews: 0,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusText, setStatusText] = useState("");
  const [loadingHome, setLoadingHome] = useState(true);
  const [searching, setSearching] = useState(false);
  const [popularHotels, setPopularHotels] = useState<HomeHotelCard[]>([]);
  const [topGuides, setTopGuides] = useState<HomeGuideCard[]>([]);

  const loadHomeData = useCallback(async () => {
    setLoadingHome(true);

    const results = await Promise.allSettled([
      authAPI.getCurrentUser(),
      touristAPI.getMessages(),
      touristAPI.getDashboard(),
      touristAPI.getSavedPlaces(),
      touristAPI.getReviews(),
      publicAPI.getGuides(1, 6),
      publicAPI.getHotels(1, 6),
    ]);

    const [
      userResult,
      messagesResult,
      dashboardResult,
      savedPlacesResult,
      reviewsResult,
      guidesResult,
      hotelsResult,
    ] = results;

    if (userResult.status === "fulfilled" && messagesResult.status === "fulfilled") {
      const user = userResult.value;
      const messageResponse = messagesResult.value;
      const currentUserId = Number(user?.id || user?.user_id || 0);
      const messages = (messageResponse?.data?.messages || []) as any[];
      const unreadCount = messages.filter((message) => {
        const receiverId = Number(message?.receiver?.user_id || 0);
        return receiverId === currentUserId && !Boolean(message?.isRead);
      }).length;
      setUnreadMessageCount(unreadCount);
    } else {
      setUnreadMessageCount(0);
    }

    const dashboardStats =
      dashboardResult.status === "fulfilled" ? dashboardResult.value?.data?.stats || {} : {};
    const savedPlacesCount =
      savedPlacesResult.status === "fulfilled"
        ? Number(savedPlacesResult.value?.data?.count || 0)
        : 0;
    const reviewCount =
      reviewsResult.status === "fulfilled"
        ? Number(reviewsResult.value?.data?.count || dashboardStats.totalReviews || 0)
        : Number(dashboardStats.totalReviews || 0);

    setStats({
      activeTrips: Number(dashboardStats.activeTrips || 0),
      savedPlaces: savedPlacesCount,
      reviews: reviewCount,
    });

    if (guidesResult.status === "fulfilled") {
      const guideCards = ((guidesResult.value?.data?.guides || []) as any[]).map(toGuideCard);
      setTopGuides(guideCards);
    } else {
      setTopGuides([]);
    }

    if (hotelsResult.status === "fulfilled") {
      const hotelCards = ((hotelsResult.value?.data?.hotels || []) as any[]).map(toHotelCard);
      setPopularHotels(hotelCards);
    } else {
      setPopularHotels([]);
    }

    const failedCount = results.filter((result) => result.status === "rejected").length;
    if (failedCount > 0) {
      setStatusText("Some live sections could not be loaded. Pull to refresh or reopen the page.");
    }

    setLoadingHome(false);
  }, []);

  useEffect(() => {
    void loadHomeData();
  }, [loadHomeData]);

  useEffect(() => {
    if (!statusText) {
      return;
    }

    const timeout = setTimeout(() => setStatusText(""), 2600);
    return () => clearTimeout(timeout);
  }, [statusText]);

  const handleGuidePress = (guide: HomeGuideCard) => {
    onNavigate("guide-profile", guide);
  };

  const handleHotelPress = (hotel: HomeHotelCard) => {
    onNavigate("hotel-details", hotel);
  };

  const handleSearch = async () => {
    const query = searchQuery.trim();
    if (!query) {
      setStatusText("Type a guide, hotel, or place to search.");
      return;
    }

    try {
      setSearching(true);
      const response = await publicAPI.search(query, "all");
      const guides = response?.data?.guides || [];
      const hotels = response?.data?.hotels || [];

      if (guides.length > 0) {
        handleGuidePress(toGuideCard(guides[0], 0));
        return;
      }

      if (hotels.length > 0) {
        handleHotelPress(toHotelCard(hotels[0], 0));
        return;
      }

      setStatusText("No results found");
    } catch (error: any) {
      setStatusText(error?.message || "Search is unavailable right now.");
    } finally {
      setSearching(false);
    }
  };

  const safetyCards = [
    {
      id: "my-bookings",
      title: "My Bookings",
      icon: "briefcase" as const,
      color: "#3B82F6",
      description: "View your trips",
    },
    {
      id: "sos",
      title: "SOS",
      icon: "alert-circle" as const,
      color: "#EF4444",
      description: "Get immediate help",
    },
    {
      id: "report-incident",
      title: "Report Incident",
      icon: "file-document" as const,
      color: "#F97316",
      description: "Report an issue",
    },
    {
      id: "emergency-contacts",
      title: "Emergency Contacts",
      icon: "phone" as const,
      color: "#22C55E",
      description: "Important numbers",
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <TouristTopBar
          title="Welcome, Explorer!"
          subtitle="Ready for your next adventure?"
          showBack={false}
        />

        <View style={styles.statsContainer}>
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.activeTrips}</Text>
              <Text style={styles.statLabel}>Active Trips</Text>
            </View>
            <View style={[styles.statItem, styles.statItemBorder]}>
              <Text style={styles.statNumber}>{stats.savedPlaces}</Text>
              <Text style={styles.statLabel}>Saved Places</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.reviews}</Text>
              <Text style={styles.statLabel}>Reviews</Text>
            </View>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color="#9CA3AF" />
          <TextInput
            placeholder="Search destinations, guides..."
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => void handleSearch()}
          />
          <TouchableOpacity onPress={() => void handleSearch()} activeOpacity={0.85}>
            {searching ? (
              <ActivityIndicator size="small" color="#1B73E8" />
            ) : (
              <Text style={styles.searchAction}>Go</Text>
            )}
          </TouchableOpacity>
        </View>

        {statusText ? (
          <View style={styles.statusBanner}>
            <Text style={styles.statusBannerText}>{statusText}</Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderTitle}>Discover Popular Places</Text>
            <TouchableOpacity onPress={() => onNavigate("explore-hotels")}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {loadingHome ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator size="small" color="#1B73E8" />
              <Text style={styles.loadingText}>Loading live places...</Text>
            </View>
          ) : popularHotels.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalCardsContent}
            >
              {popularHotels.map((hotel) => (
                <TouchableOpacity
                  key={hotel.id}
                  style={styles.placeCard}
                  onPress={() => handleHotelPress(hotel)}
                  activeOpacity={0.88}
                >
                  <Image source={{ uri: hotel.image }} style={styles.placeImage} />
                  <View style={styles.placeInfo}>
                    <Text style={styles.placeName} numberOfLines={1}>
                      {hotel.name}
                    </Text>
                    <Text style={styles.placeCategory} numberOfLines={1}>
                      {hotel.location}
                    </Text>
                    <View style={styles.metaRow}>
                      <Text style={styles.priceText}>{hotel.pricePerNight}</Text>
                      <View style={styles.ratingRow}>
                        <MaterialCommunityIcons name="star" size={14} color="#F59E0B" />
                        <Text style={styles.ratingText}>{hotel.rating.toFixed(1)}</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyCard}>
              <MaterialCommunityIcons name="home-search" size={28} color="#1B73E8" />
              <Text style={styles.emptyCardTitle}>No public hotel listings yet</Text>
              <Text style={styles.emptyCardText}>
                Verified stays will appear here once they are available from the backend.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderTitle}>Connect With Top Guides</Text>
            <TouchableOpacity onPress={() => onNavigate("explore-guides")}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {loadingHome ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator size="small" color="#1B73E8" />
              <Text style={styles.loadingText}>Loading live guides...</Text>
            </View>
          ) : topGuides.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalCardsContent}
            >
              {topGuides.map((guide) => (
                <TouchableOpacity
                  key={guide.id}
                  style={styles.guideCard}
                  onPress={() => handleGuidePress(guide)}
                  activeOpacity={0.88}
                >
                  <Image source={{ uri: guide.photo }} style={styles.guideAvatar} />
                  <Text style={styles.guideName} numberOfLines={1}>
                    {guide.name}
                  </Text>
                  <View style={styles.ratingRow}>
                    <MaterialCommunityIcons name="star" size={14} color="#F59E0B" />
                    <Text style={styles.ratingText}>{guide.rating.toFixed(1)}</Text>
                  </View>
                  <Text style={styles.guideRegion} numberOfLines={2}>
                    {guide.experience}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyCard}>
              <MaterialCommunityIcons name="account-search-outline" size={28} color="#1B73E8" />
              <Text style={styles.emptyCardTitle}>No verified guides published yet</Text>
              <Text style={styles.emptyCardText}>
                Guide discovery will show up here as soon as public verified profiles exist.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Safety Actions</Text>
          <View style={styles.safetyGrid}>
            {safetyCards.map((card) => (
              <TouchableOpacity
                key={card.id}
                style={styles.safetyCard}
                onPress={() => onNavigate(card.id)}
              >
                <View
                  style={[
                    styles.safetyIconContainer,
                    { backgroundColor: card.color },
                  ]}
                >
                  <MaterialCommunityIcons name={card.icon} size={28} color="#FFFFFF" />
                </View>
                <Text style={styles.safetyTitle}>{card.title}</Text>
                <Text style={styles.safetyDescription}>{card.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.floatingMessageButton}
        onPress={() => onNavigate("messages")}
        activeOpacity={0.85}
      >
        <View style={styles.floatingMessageIconWrap}>
          <MaterialCommunityIcons name="navigation-variant-outline" size={30} color="#4B5563" />
          <View style={styles.floatingMessageIconAccent} />
        </View>
        {unreadMessageCount > 0 && (
          <View style={styles.floatingMessageBadge}>
            <Text style={styles.floatingMessageBadgeText}>
              {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  scrollView: {
    flex: 1,
  },
  statsContainer: {
    paddingHorizontal: 24,
    marginTop: -24,
    marginBottom: 24,
  },
  statsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-around",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statItemBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#E5E7EB",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1B73E8",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#4B5563",
    textAlign: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 24,
    marginBottom: 14,
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    height: 48,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    color: "#1F2937",
    fontSize: 14,
  },
  searchAction: {
    color: "#1B73E8",
    fontSize: 14,
    fontWeight: "700",
  },
  statusBanner: {
    marginHorizontal: 24,
    marginBottom: 18,
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: "#111827",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  statusBannerText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 16,
    paddingHorizontal: 24,
  },
  sectionHeaderTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1B73E8",
  },
  horizontalCardsContent: {
    paddingHorizontal: 24,
    paddingRight: 8,
  },
  placeCard: {
    marginRight: 16,
    borderRadius: 18,
    overflow: "hidden",
    width: 220,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  placeImage: {
    width: "100%",
    height: 132,
    backgroundColor: "#E5E7EB",
  },
  placeInfo: {
    padding: 14,
  },
  placeName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
  },
  placeCategory: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  priceText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1B73E8",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
  },
  guideCard: {
    marginRight: 16,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    width: 156,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  guideAvatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    marginBottom: 12,
    backgroundColor: "#E5E7EB",
  },
  guideName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 6,
    textAlign: "center",
  },
  guideRegion: {
    fontSize: 11,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 4,
  },
  loadingCard: {
    marginHorizontal: 24,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    color: "#4B5563",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyCard: {
    marginHorizontal: 24,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    padding: 20,
  },
  emptyCardTitle: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
  },
  emptyCardText: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 20,
    color: "#6B7280",
  },
  safetyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 20,
    paddingHorizontal: 24,
  },
  safetyCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  safetyIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  safetyTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  safetyDescription: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
  },
  floatingMessageButton: {
    position: "absolute",
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#E5E7EB",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 20,
  },
  floatingMessageIconWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  floatingMessageIconAccent: {
    position: "absolute",
    width: 13,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#1B73E8",
    transform: [{ rotate: "-42deg" }],
    top: 20,
    left: 18,
  },
  floatingMessageBadge: {
    position: "absolute",
    top: -3,
    right: -3,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#EF4444",
    borderWidth: 2,
    borderColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  floatingMessageBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
});

import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
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
import { publicAPI } from "../../constants/api";

interface ExploreGuidesTabProps {
  onNavigate: (screen: string, data?: any) => void;
}

interface GuideCard {
  id: string;
  name: string;
  photo: string;
  rating: number;
  experience: string;
  specialties: string[];
  pricePerDay: string;
  verified: boolean;
  bio?: string;
  languages: string[];
  destinations: { destinationId: number; name: string }[];
  location?: string;
  reviews?: { user: string; rating: number; comment: string }[];
  availability?: string[];
  minDurationDays?: number;
  minDurationLabel?: string;
  specialization?: string;
}

const GUIDE_FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&q=80",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&q=80",
];

const toGuideCard = (guide: any, index: number): GuideCard => {
  const years = Number(guide.experienceYears);
  const specialization = String(guide.specialization || guide.bio || "Local expert").trim();
  const destinations = Array.isArray(guide.destinations) ? guide.destinations : [];
  const languages = Array.isArray(guide.languages) ? guide.languages : [];

  return {
    id: String(guide.guideId ?? guide.id ?? index + 1),
    name: String(guide.name || "Local Guide"),
    photo: guide.photo || GUIDE_FALLBACK_IMAGES[index % GUIDE_FALLBACK_IMAGES.length],
    rating: Number.parseFloat(String(guide.avgRating ?? guide.rating ?? "4.8")) || 4.8,
    experience:
      Number.isFinite(years) && years > 0 ? `${years} years experience` : "Local expert",
    specialties: [specialization],
    pricePerDay: `NPR ${2500 + index * 500}/day`,
    verified: true,
    bio: String(
      guide.bio || "Local guide ready to help you plan a memorable experience."
    ),
    languages,
    destinations,
    location: destinations[0]?.name || "Nepal",
    reviews: [],
    availability: ["Available this week"],
    minDurationDays: 1,
    minDurationLabel: "1 day",
    specialization,
  };
};

export function ExploreGuidesTab({ onNavigate }: ExploreGuidesTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("All");
  const [ratingOnly, setRatingOnly] = useState(false);
  const [guides, setGuides] = useState<GuideCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");

  const themeFilters = ["All", "Heritage", "Mountain", "Nature", "Trekking", "Cultural"];

  useEffect(() => {
    const loadGuides = async () => {
      try {
        setLoading(true);
        setErrorText("");
        const guideResponse = await publicAPI.getGuides({ page: 1, limit: 100 });
        const guideItems = ((guideResponse?.data?.guides || []) as any[]).map(toGuideCard);
        setGuides(guideItems);
      } catch (error: any) {
        setGuides([]);
        setErrorText(error?.message || "Unable to load guides right now.");
      } finally {
        setLoading(false);
      }
    };

    void loadGuides();
  }, []);

  const filteredGuides = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return guides.filter((guide) => {
      const destinationNames = guide.destinations.map((destination) => destination.name);
      const themeHaystack = [guide.specialization || "", ...destinationNames].join(" ").toLowerCase();
      const haystack = [
        guide.name,
        guide.bio || "",
        guide.specialization || "",
        ...guide.languages,
        ...destinationNames,
      ]
        .join(" ")
        .toLowerCase();

      const matchesQuery = !normalizedQuery || haystack.includes(normalizedQuery);
      const matchesTheme =
        selectedTheme === "All" ||
        themeHaystack.includes(selectedTheme.toLowerCase());
      const matchesRating = !ratingOnly || guide.rating >= 4.5;

      return matchesQuery && matchesTheme && matchesRating;
    });
  }, [guides, ratingOnly, searchQuery, selectedTheme]);

  const emptyStateText = useMemo(() => {
    if (errorText) {
      return errorText;
    }

    if (/pokhara|kathmandu|lumbini|chitwan|mustang|bandipur|everest/i.test(searchQuery)) {
      return "No guides found for this destination.";
    }

    return "No guides matched your current search.";
  }, [errorText, searchQuery]);

  return (
    <View style={styles.container}>
      <View style={styles.searchSection}>
        <View style={styles.searchInputContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by guide, destination, language, or specialization"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersScroll}
          contentContainerStyle={styles.filtersContent}
        >
          {themeFilters.map((theme) => {
            const selected = selectedTheme === theme;
            return (
              <TouchableOpacity
                key={theme}
                style={[
                  styles.filterChip,
                  selected ? styles.filterChipActive : styles.filterChipMuted,
                ]}
                onPress={() => setSelectedTheme(theme)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selected && styles.filterChipTextActive,
                  ]}
                >
                  {theme}
                </Text>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            style={[styles.filterChip, ratingOnly && styles.filterChipActive]}
            onPress={() => setRatingOnly((prev) => !prev)}
          >
            <Text
              style={[styles.filterChipText, ratingOnly && styles.filterChipTextActive]}
            >
              Rating 4.5+
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView
        style={styles.guidesList}
        contentContainerStyle={styles.guidesContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.noResultsContainer}>
            <ActivityIndicator size="small" color="#1B73E8" />
            <Text style={styles.noResultsText}>Loading guides...</Text>
          </View>
        ) : filteredGuides.length > 0 ? (
          filteredGuides.map((guide) => (
            <TouchableOpacity
              key={guide.id}
              style={styles.guideCard}
              activeOpacity={0.9}
              onPress={() => onNavigate("guide-profile", guide)}
            >
              <View style={styles.guideCardContent}>
                <Image source={{ uri: guide.photo }} style={styles.guidePhoto} />
                <View style={styles.guideInfo}>
                  <View style={styles.guideHeader}>
                    <View style={styles.guideNameContainer}>
                      <Text style={styles.guideName}>{guide.name}</Text>
                      {guide.verified ? (
                        <View style={styles.verifiedBadge}>
                          <MaterialCommunityIcons
                            name="check-decagram"
                            size={14}
                            color="#2BC7B2"
                          />
                          <Text style={styles.verifiedText}>Verified</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>

                  <View style={styles.guideStats}>
                    <View style={styles.statItem}>
                      <MaterialCommunityIcons name="star" size={14} color="#F59E0B" />
                      <Text style={styles.statText}>{guide.rating.toFixed(1)}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <MaterialCommunityIcons
                        name="briefcase-outline"
                        size={14}
                        color="#6B7280"
                      />
                      <Text style={styles.statText}>{guide.experience}</Text>
                    </View>
                  </View>

                  <View style={styles.specialtiesContainer}>
                    <View style={styles.specialtyBadge}>
                      <Text style={styles.specialtyText} numberOfLines={1}>
                        {guide.specialization}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.badgeRow}>
                    {guide.destinations.slice(0, 2).map((destination) => (
                      <View key={destination.destinationId} style={styles.destinationBadge}>
                        <Text style={styles.destinationBadgeText}>{destination.name}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.badgeRow}>
                    {guide.languages.slice(0, 3).map((language) => (
                      <View key={language} style={styles.languageBadge}>
                        <Text style={styles.languageBadgeText}>{language}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.guideFooter}>
                    <View style={styles.priceContainer}>
                      <Text style={styles.priceText}>{guide.pricePerDay}</Text>
                    </View>
                    <View style={styles.viewProfileButton}>
                      <Text style={styles.viewProfileButtonText}>View Profile</Text>
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.noResultsContainer}>
            <MaterialCommunityIcons name="account-search-outline" size={64} color="#9CA3AF" />
            <Text style={styles.noResultsText}>{emptyStateText}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  searchSection: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#1F2937",
  },
  filtersScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  filtersContent: {
    gap: 8,
    paddingBottom: 4,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    backgroundColor: "#EFF6FF",
    marginRight: 8,
  },
  filterChipMuted: {
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  filterChipActive: {
    backgroundColor: "#1B73E8",
    borderColor: "#1B73E8",
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1D4ED8",
  },
  filterChipTextActive: {
    color: "#fff",
  },
  guidesList: {
    flex: 1,
  },
  guidesContent: {
    padding: 16,
    gap: 16,
  },
  guideCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 16,
  },
  guideCardContent: {
    flexDirection: "row",
    padding: 16,
    gap: 16,
  },
  guidePhoto: {
    width: 96,
    height: 96,
    borderRadius: 12,
  },
  guideInfo: {
    flex: 1,
  },
  guideHeader: {
    marginBottom: 8,
  },
  guideNameContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  guideName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    flex: 1,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  verifiedText: {
    fontSize: 11,
    color: "#2BC7B2",
    fontWeight: "600",
  },
  guideStats: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 10,
    flexWrap: "wrap",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 13,
    color: "#6B7280",
  },
  specialtiesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 10,
  },
  specialtyBadge: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    maxWidth: "100%",
  },
  specialtyText: {
    fontSize: 11,
    color: "#374151",
    fontWeight: "500",
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 8,
  },
  destinationBadge: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  destinationBadgeText: {
    color: "#1D4ED8",
    fontSize: 11,
    fontWeight: "700",
  },
  languageBadge: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  languageBadgeText: {
    color: "#475569",
    fontSize: 11,
    fontWeight: "600",
  },
  guideFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  priceText: {
    fontSize: 14,
    color: "#1B73E8",
    fontWeight: "600",
  },
  viewProfileButton: {
    backgroundColor: "#1B73E8",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  viewProfileButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  noResultsContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    gap: 12,
  },
  noResultsText: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 12,
    textAlign: "center",
  },
});

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
import { SAMPLE_PLACES, toDestinationDetails } from "./mapData";

interface ExploreDestinationsTabProps {
  onNavigate: (screen: string, data?: any) => void;
}

interface DestinationRecord {
  destinationId: number;
  name: string;
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  description?: string | null;
  image?: string | null;
  category?: string | null;
  popularityScore?: number | null;
  difficulty?: string | null;
  duration?: string | null;
  bestTime?: string | null;
  pricePerDayNpr?: number | null;
  activities?: string[];
  highlights?: string[];
}

const BASE_FILTERS = ["All", "City", "Heritage", "Landmark"];

const difficultyForCategory = (category: string) => {
  if (category === "Heritage") {
    return "Easy";
  }

  if (category === "Landmark" || category === "Trekking" || category === "Nature") {
    return "Moderate";
  }

  return "Easy";
};

const bestTimeForCategory = (category: string) => {
  if (category === "Heritage") {
    return "Oct - Apr";
  }

  if (category === "Trekking" || category === "Nature") {
    return "Mar - May";
  }

  return "All year";
};

const activitiesForCategory = (category: string) => {
  if (category === "Heritage") {
    return ["Architecture", "Museums", "Walking"];
  }

  if (category === "Trekking" || category === "Nature") {
    return ["Trekking", "Photography", "Adventure"];
  }

  if (category === "Landmark") {
    return ["Sightseeing", "Photography", "Culture"];
  }

  return ["Sightseeing", "Food", "Walking"];
};

const fallbackImageForCategory = (category: string) => {
  const normalized = category.toLowerCase();

  const matchingSample =
    SAMPLE_PLACES.find((place) => place.category?.toLowerCase() === normalized) ||
    SAMPLE_PLACES.find((place) => normalized.includes("trek")) ||
    SAMPLE_PLACES[0];

  return matchingSample?.image || "";
};

export function ExploreDestinationsTab({ onNavigate }: ExploreDestinationsTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [destinations, setDestinations] = useState<DestinationRecord[]>([]);

  useEffect(() => {
    const loadDestinations = async () => {
      try {
        setLoading(true);
        const response = await publicAPI.getDestinations();
        setDestinations((response?.data?.destinations || []) as DestinationRecord[]);
      } catch (error) {
        console.warn("Failed to load public destinations:", error);
        setDestinations([]);
      } finally {
        setLoading(false);
      }
    };

    void loadDestinations();
  }, []);

  const filters = useMemo(() => {
    const dynamicCategories = Array.from(
      new Set(
        destinations
          .map((destination) => String(destination.category || "").trim())
          .filter(Boolean)
      )
    );

    return Array.from(new Set([...BASE_FILTERS, ...dynamicCategories]));
  }, [destinations]);

  const destinationCards = useMemo(
    () =>
      destinations.map((destination) => {
        const category = destination.category || "Destination";
        return {
          id: destination.destinationId,
          name: destination.name,
          image: destination.image || fallbackImageForCategory(category),
          rating: Number(destination.popularityScore || 4.5),
          location: destination.location,
          latitude: destination.latitude || 0,
          longitude: destination.longitude || 0,
          category,
          difficulty: destination.difficulty || difficultyForCategory(category),
          duration: destination.duration || (category === "Trekking" ? "2+ days" : "1 day"),
          bestTime: destination.bestTime || bestTimeForCategory(category),
          description: destination.description || "Official TourMate destination.",
          activities:
            destination.activities && destination.activities.length > 0
              ? destination.activities
              : activitiesForCategory(category),
          highlights:
            destination.highlights && destination.highlights.length > 0
              ? destination.highlights
              : ["Local culture", "Nearby guides", "Nearby hotels"],
          price:
            destination.pricePerDayNpr && destination.pricePerDayNpr > 0
              ? `NPR ${destination.pricePerDayNpr.toLocaleString()}`
              : "Free",
        };
      }),
    [destinations]
  );

  const filteredDestinations = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return destinationCards.filter((destination) => {
      const matchesFilter =
        selectedFilter === "All" || destination.category === selectedFilter;

      const matchesQuery =
        !normalizedQuery ||
        `${destination.name} ${destination.location} ${destination.description} ${destination.category}`
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesFilter && matchesQuery;
    });
  }, [destinationCards, searchQuery, selectedFilter]);

  return (
    <View style={styles.container}>
      <View style={styles.searchSection}>
        <View style={styles.searchInputContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search destinations..."
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
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterChip,
                selectedFilter === filter && styles.filterChipActive,
              ]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedFilter === filter && styles.filterChipTextActive,
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.destinationsList}
        contentContainerStyle={styles.destinationsContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="small" color="#1B73E8" />
            <Text style={styles.loadingText}>Loading destinations...</Text>
          </View>
        ) : filteredDestinations.length > 0 ? (
          filteredDestinations.map((destination) => (
            <TouchableOpacity
              key={destination.id}
              style={styles.destinationCard}
              activeOpacity={0.9}
              onPress={() =>
                onNavigate(
                  "destination-details",
                  toDestinationDetails({
                    id: destination.id,
                    name: destination.name,
                    type: "place",
                    latitude: destination.latitude,
                    longitude: destination.longitude,
                    address: destination.location,
                    image: destination.image,
                    rating: destination.rating,
                    description: destination.description,
                    category: destination.category,
                    difficulty: destination.difficulty,
                    duration: destination.duration,
                    bestTime: destination.bestTime,
                    activities: destination.activities,
                    highlights: destination.highlights,
                    price: destination.price,
                  })
                )
              }
            >
              <View style={styles.imageContainer}>
                <Image source={{ uri: destination.image }} style={styles.destinationImage} />
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>{destination.category}</Text>
                </View>
                <View style={styles.difficultyBadge}>
                  <Text style={styles.difficultyText}>{destination.difficulty}</Text>
                </View>
              </View>

              <View style={styles.cardContent}>
                <View style={styles.titleRow}>
                  <View style={styles.titleContainer}>
                    <Text style={styles.destinationName}>{destination.name}</Text>
                    <View style={styles.locationRow}>
                      <MaterialCommunityIcons name="map-marker-outline" size={14} color="#6B7280" />
                      <Text style={styles.locationText}>{destination.location}</Text>
                    </View>
                  </View>
                  <View style={styles.ratingContainer}>
                    <MaterialCommunityIcons name="star" size={14} color="#F59E0B" />
                    <Text style={styles.ratingText}>{destination.rating.toFixed(1)}</Text>
                  </View>
                </View>

                <Text style={styles.description} numberOfLines={2}>
                  {destination.description}
                </Text>

                <View style={styles.detailsRow}>
                  <View style={styles.detailItem}>
                    <MaterialCommunityIcons name="clock-outline" size={14} color="#6B7280" />
                    <Text style={styles.detailText}>{destination.duration}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <MaterialCommunityIcons name="weather-sunny" size={14} color="#6B7280" />
                    <Text style={styles.detailText}>{destination.bestTime}</Text>
                  </View>
                </View>

                <View style={styles.activitiesRow}>
                  {destination.activities.slice(0, 3).map((activity) => (
                    <View key={activity} style={styles.activityTag}>
                      <Text style={styles.activityTagText}>{activity}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.cardFooter}>
                  <View style={styles.priceContainer}>
                    <Text style={styles.priceValue}>{destination.price}</Text>
                  </View>
                  <View style={styles.viewDetailsButton}>
                    <Text style={styles.viewDetailsButtonText}>View Details</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.noResultsContainer}>
            <MaterialCommunityIcons name="map-search-outline" size={64} color="#9CA3AF" />
            <Text style={styles.noResultsText}>
              No destinations matched your current search.
            </Text>
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
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: "#1B73E8",
    borderColor: "#1B73E8",
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6B7280",
  },
  filterChipTextActive: {
    color: "#fff",
  },
  destinationsList: {
    flex: 1,
  },
  destinationsContent: {
    padding: 16,
    gap: 16,
  },
  loadingState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    color: "#6B7280",
  },
  destinationCard: {
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
  imageContainer: {
    position: "relative",
    width: "100%",
    height: 192,
  },
  destinationImage: {
    width: "100%",
    height: "100%",
  },
  difficultyBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#065F46",
  },
  categoryBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1F2937",
  },
  cardContent: {
    padding: 16,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  destinationName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    fontSize: 13,
    color: "#6B7280",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1F2937",
  },
  description: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
    marginBottom: 12,
  },
  detailsRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailText: {
    fontSize: 13,
    color: "#6B7280",
  },
  activitiesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  activityTag: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activityTagText: {
    fontSize: 11,
    color: "#374151",
    fontWeight: "500",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1B73E8",
  },
  viewDetailsButton: {
    backgroundColor: "#1B73E8",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  viewDetailsButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  noResultsContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  noResultsText: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 12,
    textAlign: "center",
  },
});

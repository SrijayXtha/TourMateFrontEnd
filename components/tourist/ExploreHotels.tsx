import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { mockHotels } from "../../data/mockData";

interface ExploreHotelsProps {
  onNavigate: (screen: string, data?: any) => void;
  onBack: () => void;
}

export function ExploreHotels({ onNavigate, onBack }: ExploreHotelsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All Hotels");

  const filters = ["All Hotels", "Resort", "Boutique", "Budget"];

  const filteredHotels = mockHotels.filter((hotel) => {
    const matchesSearch = hotel.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesFilter =
      selectedFilter === "All Hotels" ||
      hotel.name.toLowerCase().includes(selectedFilter.toLowerCase());
    return matchesSearch && matchesFilter;
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Explore Hotels</Text>
        <Text style={styles.headerSubtitle}>Find your perfect stay</Text>
      </View>

      {/* Search & Filters */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <MaterialCommunityIcons
            name="magnify"
            size={20}
            color="#9CA3AF"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search hotels..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersScroll}
          contentContainerStyle={styles.filtersContainer}
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

      {/* Hotels List */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {filteredHotels.map((hotel) => (
          <View key={hotel.id} style={styles.hotelCard}>
            <Image source={{ uri: hotel.image }} style={styles.hotelImage} />
            <View style={styles.hotelContent}>
              <View style={styles.hotelHeader}>
                <View style={styles.hotelInfo}>
                  <View style={styles.hotelNameContainer}>
                    <Text style={styles.hotelName}>{hotel.name}</Text>
                    {hotel.verified && (
                      <View style={styles.verifiedBadge}>
                        <MaterialCommunityIcons
                          name="check-decagram"
                          size={16}
                          color="#2BC7B2"
                        />
                        <Text style={styles.verifiedText}>Verified</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.locationContainer}>
                    <MaterialCommunityIcons
                      name="map-marker"
                      size={16}
                      color="#6B7280"
                    />
                    <Text style={styles.locationText}>{hotel.location}</Text>
                  </View>
                </View>
                <View style={styles.ratingContainer}>
                  <MaterialCommunityIcons
                    name="star"
                    size={16}
                    color="#FACC15"
                  />
                  <Text style={styles.ratingText}>{hotel.rating}</Text>
                </View>
              </View>

              <View style={styles.amenitiesContainer}>
                {hotel.amenities.slice(0, 3).map((amenity) => (
                  <View key={amenity} style={styles.amenityBadge}>
                    <Text style={styles.amenityText}>{amenity}</Text>
                  </View>
                ))}
                {hotel.amenities.length > 3 && (
                  <View style={styles.amenityBadge}>
                    <Text style={styles.amenityText}>
                      +{hotel.amenities.length - 3} more
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.hotelFooter}>
                <View style={styles.priceContainer}>
                  <MaterialCommunityIcons
                    name="cash"
                    size={16}
                    color="#1B73E8"
                  />
                  <Text style={styles.priceText}>{hotel.pricePerNight}/night</Text>
                </View>
                <TouchableOpacity
                  style={styles.viewButton}
                  onPress={() => onNavigate("hotel-details", hotel)}
                >
                  <Text style={styles.viewButtonText}>View Details</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}

        {filteredHotels.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="home-search"
              size={64}
              color="#9CA3AF"
            />
            <Text style={styles.emptyStateTitle}>No hotels found</Text>
            <Text style={styles.emptyStateSubtitle}>
              Try adjusting your search or filters
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
  header: {
    backgroundColor: "#1B73E8",
    paddingTop: 48,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 8,
  },
  headerSubtitle: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 14,
  },
  searchContainer: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1F2937",
  },
  filtersScroll: {
    marginBottom: 8,
  },
  filtersContainer: {
    flexDirection: "row",
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  filterChipActive: {
    backgroundColor: "#1B73E8",
    borderColor: "#1B73E8",
  },
  filterChipText: {
    fontSize: 14,
    color: "#6B7280",
  },
  filterChipTextActive: {
    color: "#fff",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  hotelCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  hotelImage: {
    width: "100%",
    height: 192,
  },
  hotelContent: {
    padding: 16,
  },
  hotelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  hotelInfo: {
    flex: 1,
  },
  hotelNameContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 4,
  },
  hotelName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  verifiedText: {
    fontSize: 12,
    color: "#2BC7B2",
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: "#6B7280",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    color: "#1F2937",
  },
  amenitiesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginBottom: 12,
  },
  amenityBadge: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  amenityText: {
    fontSize: 12,
    color: "#6B7280",
  },
  hotelFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  priceText: {
    fontSize: 14,
    color: "#1B73E8",
    fontWeight: "600",
  },
  viewButton: {
    backgroundColor: "#1B73E8",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  viewButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: "#6B7280",
  },
});

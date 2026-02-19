import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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
import { mockGuides } from "../../data/mockData";

interface ExploreGuidesProps {
  onNavigate: (screen: string, data?: any) => void;
  onBack: () => void;
}

export function ExploreGuides({ onNavigate, onBack }: ExploreGuidesProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All Guides");

  const filters = ["All Guides", "Mountain", "Cultural", "Adventure"];

  const filteredGuides = mockGuides.filter((guide) => {
    const matchesSearch = guide.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesFilter =
      selectedFilter === "All Guides" ||
      guide.specialties.some((s) =>
        s.toLowerCase().includes(selectedFilter.toLowerCase())
      );
    return matchesSearch && matchesFilter;
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={["#1B73E8", "#2BC7B2"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Explore Guides</Text>
        <Text style={styles.headerSubtitle}>
          Find the perfect guide for your adventure
        </Text>
      </LinearGradient>

      {/* Search & Filters */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#9CA3AF"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search guides..."
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
              onPress={() => setSelectedFilter(filter)}
              style={[
                styles.filterBadge,
                selectedFilter === filter && styles.filterBadgeActive,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedFilter === filter && styles.filterTextActive,
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Guides List */}
      <ScrollView
        style={styles.guidesList}
        contentContainerStyle={styles.guidesContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredGuides.length > 0 ? (
          filteredGuides.map((guide) => (
            <View key={guide.id} style={styles.guideCard}>
              <View style={styles.guideCardContent}>
                <Image
                  source={typeof guide.photo === 'string' ? { uri: guide.photo } : guide.photo}
                  style={styles.guidePhoto}
                  resizeMode="cover"
                />
                <View style={styles.guideInfo}>
                  <View style={styles.guideHeader}>
                    <View style={styles.guideTitleContainer}>
                      <Text style={styles.guideName} numberOfLines={1}>
                        {guide.name}
                      </Text>
                      {guide.verified && (
                        <View style={styles.verifiedBadge}>
                          <Ionicons
                            name="checkmark-circle"
                            size={14}
                            color="#2BC7B2"
                          />
                          <Text style={styles.verifiedText}>Verified</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={styles.guideStats}>
                    <View style={styles.statItem}>
                      <Ionicons name="star" size={14} color="#FBBF24" />
                      <Text style={styles.statText}>{guide.rating}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Ionicons name="location" size={14} color="#6B7280" />
                      <Text style={styles.statText}>{guide.experience}</Text>
                    </View>
                  </View>

                  <View style={styles.specialtiesContainer}>
                    {guide.specialties.slice(0, 2).map((specialty) => (
                      <View key={specialty} style={styles.specialtyBadge}>
                        <Text style={styles.specialtyText}>{specialty}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.guideFooter}>
                    <View style={styles.priceContainer}>
                      <MaterialCommunityIcons
                        name="currency-usd"
                        size={16}
                        color="#1B73E8"
                      />
                      <Text style={styles.priceText}>
                        {guide.pricePerDay}/day
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => onNavigate("guide-profile", guide)}
                      style={styles.viewButton}
                    >
                      <Text style={styles.viewButtonText}>View Profile</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.noResults}>
            <MaterialCommunityIcons
              name="magnify"
              size={64}
              color="#9CA3AF"
            />
            <Text style={styles.noResultsText}>
              No guides found. Try adjusting your filters.
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
  backText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  headerSubtitle: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 15,
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
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
  },
  filtersScroll: {
    marginTop: 12,
  },
  filtersContent: {
    gap: 8,
    paddingBottom: 4,
  },
  filterBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
    marginRight: 8,
  },
  filterBadgeActive: {
    backgroundColor: "#1B73E8",
    borderColor: "#1B73E8",
  },
  filterText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
  filterTextActive: {
    color: "#fff",
  },
  guidesList: {
    flex: 1,
  },
  guidesContent: {
    padding: 24,
    gap: 16,
  },
  guideCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
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
  guideTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  guideName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
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
    fontWeight: "500",
  },
  guideStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
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
    marginBottom: 12,
  },
  specialtyBadge: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  specialtyText: {
    fontSize: 11,
    color: "#4B5563",
    fontWeight: "500",
  },
  guideFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  priceText: {
    fontSize: 13,
    color: "#1B73E8",
    fontWeight: "600",
  },
  viewButton: {
    backgroundColor: "#1B73E8",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  viewButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  noResults: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 48,
  },
  noResultsText: {
    marginTop: 16,
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
  },
});

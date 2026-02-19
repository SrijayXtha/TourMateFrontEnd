import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { mockDestinations, mockGuides } from "../../data/mockData";

const profileImage = require("../../assets/images/profile.png");

interface TouristHomeProps {
  onNavigate: (screen: string, data?: any) => void;
}

export function TouristHome({ onNavigate }: TouristHomeProps) {
  const [activeTab, setActiveTab] = useState("home");

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

  // Use first 5 destinations and guides from mock data
  const places = mockDestinations.slice(0, 5);
  const guides = mockGuides.slice(0, 5);

  const handleLearnMore = () => {
    Alert.alert("Featured Destination", "Swiss Alps Adventure", [
      {
        text: "Learn More",
        onPress: () => {
          Alert.alert(
            "Swiss Alps",
            "Experience breathtaking mountain views and adventure like never before!"
          );
        },
      },
      { text: "Close" },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Welcome, Explorer!</Text>
          <Text style={styles.headerSubtitle}>Ready for your next adventure?</Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>3</Text>
              <Text style={styles.statLabel}>Active Trips</Text>
            </View>
            <View style={[styles.statItem, styles.statItemBorder]}>
              <Text style={styles.statNumber}>12</Text>
              <Text style={styles.statLabel}>Saved Places</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>5</Text>
              <Text style={styles.statLabel}>Reviews</Text>
            </View>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color="#9CA3AF" />
          <TextInput
            placeholder="Search Destinations,guides..."
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
          />
        </View>

        {/* Discover Popular Places */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Discover Popular Places</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.placesScroll}
            contentContainerStyle={styles.scrollContent}
          >
            {places.map((place) => (
              <TouchableOpacity 
                key={place.id} 
                style={styles.placeCard}
                onPress={() => onNavigate("destination-details", place)}
              >
                <Image source={{ uri: place.image }} style={styles.placeImage} />
                <View style={styles.placeInfo}>
                  <Text style={styles.placeName}>{place.name}</Text>
                  <Text style={styles.placeCategory}>{place.category}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Connect With Top Guides */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderTitle}>Connect With Top Guides</Text>
            <TouchableOpacity onPress={() => onNavigate("explore-guides")}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.guidesScroll}
            contentContainerStyle={styles.scrollContent}
          >
            {guides.map((guide) => (
              <TouchableOpacity 
                key={guide.id} 
                style={styles.guideCard}
                onPress={() => onNavigate("guide-profile", guide)}
              >
                <Image source={typeof guide.photo === 'string' ? { uri: guide.photo } : guide.photo} style={styles.guideAvatar} />
                <Text style={styles.guideName}>{guide.name}</Text>
                <View style={styles.ratingContainer}>
                  <MaterialCommunityIcons name="star" size={16} color="#FCD34D" />
                  <Text style={styles.rating}>{guide.rating}</Text>
                </View>
                <Text style={styles.guideRegion}>{guide.location}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Quick Safety Actions */}
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
                  <MaterialCommunityIcons
                    name={card.icon as any}
                    size={28}
                    color="#FFFFFF"
                  />
                </View>
                <Text style={styles.safetyTitle}>{card.title}</Text>
                <Text style={styles.safetyDescription}>{card.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab("home")}
        >
          <MaterialCommunityIcons
            name="home"
            size={24}
            color={activeTab === "home" ? "#1B73E8" : "#9CA3AF"}
          />
          <Text
            style={[
              styles.navLabel,
              activeTab === "home" && styles.navLabelActive,
            ]}
          >
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => onNavigate("explore")}
        >
          <MaterialCommunityIcons
            name="compass"
            size={24}
            color={activeTab === "explore" ? "#1B73E8" : "#9CA3AF"}
          />
          <Text
            style={[
              styles.navLabel,
              activeTab === "explore" && styles.navLabelActive,
            ]}
          >
            Explore
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab("map")}
        >
          <MaterialCommunityIcons
            name="map"
            size={24}
            color={activeTab === "map" ? "#1B73E8" : "#9CA3AF"}
          />
          <Text
            style={[
              styles.navLabel,
              activeTab === "map" && styles.navLabelActive,
            ]}
          >
            Map
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => onNavigate("profile")}
        >
          <MaterialCommunityIcons
            name="account"
            size={24}
            color={activeTab === "profile" ? "#1B73E8" : "#9CA3AF"}
          />
          <Text
            style={[
              styles.navLabel,
              activeTab === "profile" && styles.navLabelActive,
            ]}
          >
            Profile
          </Text>
        </TouchableOpacity>
      </View>
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
  header: {
    backgroundColor: "#1B73E8",
    paddingTop: 48,
    paddingBottom: 32,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
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
    marginBottom: 24,
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
  placesScroll: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingRight: 24,
  },
  placeCard: {
    marginRight: 16,
    borderRadius: 16,
    overflow: "hidden",
    width: 180,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  placeImage: {
    width: "100%",
    height: 120,
    backgroundColor: "#E5E7EB",
  },
  placeInfo: {
    padding: 12,
  },
  placeName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  placeCategory: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  guidesScroll: {
    flexGrow: 0,
  },
  guideCard: {
    marginRight: 20,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    width: 140,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  guideAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  guideName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  rating: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1F2937",
    marginLeft: 4,
  },
  guideRegion: {
    fontSize: 11,
    color: "#9CA3AF",
    textAlign: "center",
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
  bottomNav: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingBottom: 8,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 8,
  },
  navLabel: {
    fontSize: 10,
    color: "#9CA3AF",
    marginTop: 4,
  },
  navLabelActive: {
    color: "#1B73E8",
    fontWeight: "600",
  },
});

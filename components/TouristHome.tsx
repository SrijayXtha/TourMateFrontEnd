import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface TouristHomeProps {
  onNavigate: (screen: string) => void;
}

export function TouristHome({ onNavigate }: TouristHomeProps) {
  const cards = [
    {
      id: "my-bookings",
      title: "My Bookings",
      icon: "briefcase" as const,
      color: "#3B82F6",
      description: "View your trips",
    },
    {
      id: "explore-guides",
      title: "Explore Guides",
      icon: "account-multiple" as const,
      color: "#14B8A6",
      description: "Find local experts",
    },
    {
      id: "explore-hotels",
      title: "Explore Hotels",
      icon: "hotel" as const,
      color: "#6366F1",
      description: "Book accommodations",
    },
    {
      id: "sos",
      title: "SOS Emergency",
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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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

      {/* Feature Cards */}
      <View style={styles.cardsSection}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <View style={styles.cardsGrid}>
          {cards.map((card) => (
            <TouchableOpacity
              key={card.id}
              style={styles.card}
              onPress={() => onNavigate(card.id)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.cardIconContainer,
                  { backgroundColor: card.color },
                ]}
              >
                <MaterialCommunityIcons
                  name={card.icon as any}
                  size={24}
                  color="#FFFFFF"
                />
              </View>
              <Text style={styles.cardTitle}>{card.title}</Text>
              <Text style={styles.cardDescription}>{card.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Featured Destination */}
      <View style={styles.featuredSection}>
        <Text style={styles.sectionTitle}>Featured Destination</Text>
        <View style={styles.featuredCard}>
          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1758919679904-47f070132907?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cmF2ZWwlMjBkZXN0aW5hdGlvbiUyMG5hdHVyZXxlbnwxfHx8fDE3NjM1MTc1MzB8MA&ixlib=rb-4.1.0&q=80&w=1080",
            }}
            style={styles.featuredImage}
          />
          <View style={styles.featuredContent}>
            <Text style={styles.featuredTitle}>Swiss Alps Adventure</Text>
            <Text style={styles.featuredDescription}>
              Experience breathtaking mountain views
            </Text>
            <TouchableOpacity onPress={handleLearnMore}>
              <Text style={styles.learnMoreButton}>Learn more →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  header: {
    backgroundColor: "#1B73E8",
    paddingTop: 48,
    paddingBottom: 32,
    paddingHorizontal: 24,
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
  cardsSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 16,
  },
  cardsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  card: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  featuredSection: {
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  featuredCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  featuredImage: {
    width: "100%",
    height: 192,
    backgroundColor: "#E5E7EB",
  },
  featuredContent: {
    padding: 16,
  },
  featuredTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
  },
  featuredDescription: {
    fontSize: 14,
    color: "#4B5563",
    marginBottom: 12,
  },
  learnMoreButton: {
    color: "#1B73E8",
    fontSize: 14,
    fontWeight: "600",
  },
});

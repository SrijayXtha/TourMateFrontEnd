import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { mockBookings } from "../../data/mockData";

interface MyBookingsProps {
  onBack: () => void;
}

export function MyBookings({ onBack }: MyBookingsProps) {
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <Text style={styles.headerSubtitle}>Manage your trips</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "upcoming" && styles.activeTab]}
            onPress={() => setActiveTab("upcoming")}
          >
            <Text
              style={[styles.tabText, activeTab === "upcoming" && styles.activeTabText]}
            >
              Upcoming
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "past" && styles.activeTab]}
            onPress={() => setActiveTab("past")}
          >
            <Text
              style={[styles.tabText, activeTab === "past" && styles.activeTabText]}
            >
              Past
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Bookings List */}
        <View style={styles.bookingsList}>
          {mockBookings.map((booking) => (
            <View key={booking.id} style={styles.bookingCard}>
              <View style={styles.bookingContent}>
                <View
                  style={[
                    styles.iconContainer,
                    booking.type === "guide" ? styles.guideIcon : styles.hotelIcon,
                  ]}
                >
                  <MaterialCommunityIcons
                    name={booking.type === "guide" ? "account" : "home-city"}
                    size={24}
                    color={booking.type === "guide" ? "#14B8A6" : "#3B82F6"}
                  />
                </View>

                <View style={styles.bookingDetails}>
                  <View style={styles.bookingHeader}>
                    <View style={styles.bookingInfo}>
                      <Text style={styles.bookingName}>
                        {booking.type === "guide"
                          ? booking.guideName
                          : booking.hotelName}
                      </Text>
                      <View style={styles.dateContainer}>
                        <MaterialCommunityIcons
                          name="calendar"
                          size={16}
                          color="#6B7280"
                        />
                        <Text style={styles.dateText}>
                          {booking.type === "guide"
                            ? booking.date
                            : `${booking.checkIn} - ${booking.checkOut}`}
                        </Text>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.badge,
                        booking.status === "confirmed"
                          ? styles.confirmedBadge
                          : styles.pendingBadge,
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={
                          booking.status === "confirmed"
                            ? "check-circle"
                            : "clock-outline"
                        }
                        size={12}
                        color={booking.status === "confirmed" ? "#059669" : "#D97706"}
                      />
                      <Text
                        style={[
                          styles.badgeText,
                          booking.status === "confirmed"
                            ? styles.confirmedBadgeText
                            : styles.pendingBadgeText,
                        ]}
                      >
                        {booking.status}
                      </Text>
                    </View>
                  </View>

                  {booking.type === "guide" && booking.duration && (
                    <Text style={styles.durationText}>
                      Duration: {booking.duration}
                    </Text>
                  )}

                  <View style={styles.bookingFooter}>
                    <Text style={styles.price}>{booking.price}</Text>
                    <TouchableOpacity style={styles.detailsButton}>
                      <Text style={styles.detailsButtonText}>View Details</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Empty State */}
        {mockBookings.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <MaterialCommunityIcons
                name="calendar-blank"
                size={48}
                color="#9CA3AF"
              />
            </View>
            <Text style={styles.emptyTitle}>No bookings yet</Text>
            <Text style={styles.emptyDescription}>
              Start exploring guides and hotels to plan your trip
            </Text>
            <TouchableOpacity style={styles.exploreButton}>
              <Text style={styles.exploreButtonText}>Explore Now</Text>
            </TouchableOpacity>
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
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  backText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
  },
  tabsContainer: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  tabs: {
    flexDirection: "row",
    gap: 16,
  },
  tab: {
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: "#1B73E8",
  },
  tabText: {
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "500",
  },
  activeTabText: {
    color: "#1B73E8",
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  bookingsList: {
    padding: 24,
    gap: 16,
  },
  bookingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  bookingContent: {
    flexDirection: "row",
    gap: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  guideIcon: {
    backgroundColor: "#CCFBF1",
  },
  hotelIcon: {
    backgroundColor: "#DBEAFE",
  },
  bookingDetails: {
    flex: 1,
  },
  bookingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  bookingInfo: {
    flex: 1,
    marginRight: 8,
  },
  bookingName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 8,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateText: {
    fontSize: 14,
    color: "#6B7280",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confirmedBadge: {
    backgroundColor: "#D1FAE5",
  },
  pendingBadge: {
    backgroundColor: "#FEF3C7",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  confirmedBadgeText: {
    color: "#059669",
  },
  pendingBadgeText: {
    color: "#D97706",
  },
  durationText: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 12,
  },
  bookingFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  price: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1B73E8",
  },
  detailsButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  detailsButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
  },
  exploreButton: {
    backgroundColor: "#1B73E8",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  exploreButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});

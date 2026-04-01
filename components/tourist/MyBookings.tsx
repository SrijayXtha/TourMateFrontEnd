import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { touristAPI } from "../../constants/api";

interface MyBookingsProps {
  onBack: () => void;
}

interface BookingCard {
  id: string;
  type: "guide" | "hotel";
  guideName?: string;
  hotelName?: string;
  date?: string;
  checkIn?: string;
  checkOut?: string;
  duration?: string;
  price: string;
  status: string;
  location?: string;
  endDateRaw?: string;
}

const formatDate = (value?: string | null): string => {
  if (!value) return "TBD";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "TBD";
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatPrice = (value: unknown): string => {
  if (value === null || value === undefined || value === "") {
    return "TBD";
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return String(value);
  }

  return `Rs ${parsed.toLocaleString()}`;
};

const calculateDuration = (
  startDate?: string | null,
  endDate?: string | null
): string | undefined => {
  if (!startDate || !endDate) {
    return undefined;
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return undefined;
  }

  const diffMs = end.getTime() - start.getTime();
  const days = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  return `${days} day${days > 1 ? "s" : ""}`;
};

export function MyBookings({ onBack }: MyBookingsProps) {
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [bookings, setBookings] = useState<BookingCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadBookings = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await touristAPI.getBookings();
      const list = (response?.data?.bookings || []) as any[];

      const mapped: BookingCard[] = list.map((booking) => {
        const startDate = booking.startDate ? String(booking.startDate) : null;
        const endDate = booking.endDate ? String(booking.endDate) : null;

        return {
          id: String(booking.id),
          type: booking.type === "guide" ? "guide" : "hotel",
          guideName: booking.guide?.name || undefined,
          hotelName: booking.hotel?.name || undefined,
          date: startDate ? formatDate(startDate) : undefined,
          checkIn: startDate ? formatDate(startDate) : undefined,
          checkOut: endDate ? formatDate(endDate) : undefined,
          duration: calculateDuration(startDate, endDate),
          price: formatPrice(booking.totalPrice),
          status: booking.status || "pending",
          location: booking.hotel?.location || undefined,
          endDateRaw: endDate || undefined,
        };
      });

      setBookings(mapped);
    } catch (error: any) {
      setErrorMessage(error?.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBookings();
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filteredBookings = bookings.filter((booking) => {
    const endDate = booking.endDateRaw ? new Date(booking.endDateRaw) : null;
    const isPast = endDate ? endDate < today : false;
    return activeTab === "past" ? isPast : !isPast;
  });

  const getStatusMeta = (status: string) => {
    const normalized = status.toLowerCase();

    if (normalized === "confirmed") {
      return {
        icon: "check-circle" as const,
        iconColor: "#059669",
        badgeStyle: styles.confirmedBadge,
        textStyle: styles.confirmedBadgeText,
      };
    }

    if (normalized === "rejected") {
      return {
        icon: "close-circle" as const,
        iconColor: "#DC2626",
        badgeStyle: styles.rejectedBadge,
        textStyle: styles.rejectedBadgeText,
      };
    }

    if (normalized === "cancelled") {
      return {
        icon: "close-octagon" as const,
        iconColor: "#4B5563",
        badgeStyle: styles.cancelledBadge,
        textStyle: styles.cancelledBadgeText,
      };
    }

    return {
      icon: "clock-outline" as const,
      iconColor: "#D97706",
      badgeStyle: styles.pendingBadge,
      textStyle: styles.pendingBadgeText,
    };
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <Text style={styles.headerSubtitle}>Manage your trips</Text>
      </View>

      <View style={styles.tabsContainer}>
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "upcoming" && styles.activeTab]}
            onPress={() => setActiveTab("upcoming")}
          >
            <Text style={[styles.tabText, activeTab === "upcoming" && styles.activeTabText]}>
              Upcoming
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "past" && styles.activeTab]}
            onPress={() => setActiveTab("past")}
          >
            <Text style={[styles.tabText, activeTab === "past" && styles.activeTabText]}>
              Past
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1B73E8" />
            <Text style={styles.loadingText}>Loading bookings...</Text>
          </View>
        )}

        {errorMessage && !loading && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Unable to load bookings</Text>
            <Text style={styles.errorText}>{errorMessage}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => void loadBookings()}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !errorMessage && (
          <View style={styles.bookingsList}>
            {filteredBookings.map((booking) => {
              const statusMeta = getStatusMeta(booking.status);

              return (
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
                            {booking.type === "guide" ? booking.guideName : booking.hotelName}
                          </Text>
                          <View style={styles.dateContainer}>
                            <MaterialCommunityIcons name="calendar" size={16} color="#6B7280" />
                            <Text style={styles.dateText}>
                              {booking.type === "guide"
                                ? booking.date
                                : `${booking.checkIn} - ${booking.checkOut}`}
                            </Text>
                          </View>
                        </View>
                        <View style={[styles.badge, statusMeta.badgeStyle]}>
                          <MaterialCommunityIcons
                            name={statusMeta.icon}
                            size={12}
                            color={statusMeta.iconColor}
                          />
                          <Text style={[styles.badgeText, statusMeta.textStyle]}>{booking.status}</Text>
                        </View>
                      </View>

                      {booking.type === "guide" && booking.duration && (
                        <Text style={styles.durationText}>Duration: {booking.duration}</Text>
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
              );
            })}

            {filteredBookings.length === 0 && (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconContainer}>
                  <MaterialCommunityIcons name="calendar-blank" size={48} color="#9CA3AF" />
                </View>
                <Text style={styles.emptyTitle}>
                  {activeTab === "past" ? "No past bookings" : "No upcoming bookings"}
                </Text>
                <Text style={styles.emptyDescription}>
                  Start exploring guides and hotels to plan your trip
                </Text>
                <TouchableOpacity style={styles.exploreButton}>
                  <Text style={styles.exploreButtonText}>Explore Now</Text>
                </TouchableOpacity>
              </View>
            )}
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
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    color: "#4B5563",
    fontSize: 14,
  },
  errorContainer: {
    margin: 24,
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#B91C1C",
  },
  errorText: {
    fontSize: 14,
    color: "#7F1D1D",
  },
  retryButton: {
    alignSelf: "flex-start",
    backgroundColor: "#DC2626",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
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
  rejectedBadge: {
    backgroundColor: "#FEE2E2",
  },
  cancelledBadge: {
    backgroundColor: "#E5E7EB",
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
  rejectedBadgeText: {
    color: "#DC2626",
  },
  cancelledBadgeText: {
    color: "#4B5563",
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

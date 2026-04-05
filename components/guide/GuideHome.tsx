import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { guideAPI } from "../../constants/api";

interface GuideHomeProps {
  onNavigate: (screen: string) => void;
}

interface GuideRequestCard {
  id: number;
  name: string;
  date: string;
  type: string;
  price: string;
}

interface GuideUpcomingCard {
  name: string;
  date: string;
  time: string;
  type: string;
  status: string;
}

const formatDate = (value?: string | null) => {
  if (!value) {
    return "TBD";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "TBD";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const formatCurrency = (value?: number | string | null) => {
  const parsed = Number(value || 0);
  if (!Number.isFinite(parsed)) {
    return "Rs 0";
  }

  return `Rs ${parsed.toLocaleString()}`;
};

export function GuideHome({ onNavigate }: GuideHomeProps) {
  const [isAvailable, setIsAvailable] = useState(true);
  const [guideFirstName, setGuideFirstName] = useState("John");
  const [guideRoleLabel, setGuideRoleLabel] = useState("Mountain Guide Expert");
  const [registeredLocation, setRegisteredLocation] = useState("Not selected");
  const [verificationStatus, setVerificationStatus] = useState<
    "verified" | "pending" | "rejected"
  >("verified");
  const [stats, setStats] = useState({
    pendingRequests: 0,
    confirmedBookings: 0,
    totalBookings: 0,
    totalReviews: 156,
    averageRating: 4.9,
    confirmedRevenue: 12850,
    pendingRevenue: 340,
  });
  const [bookingRequests, setBookingRequests] = useState<GuideRequestCard[]>([
    {
      id: 1,
      name: "Alex Rodriguez",
      date: "Dec 30",
      type: "Mountain Trek",
      price: "Rs 150",
    },
    {
      id: 2,
      name: "Maria Garcia",
      date: "Dec 31",
      type: "Cultural Tour",
      price: "Rs 120",
    },
  ]);
  const [upcomingJobs, setUpcomingJobs] = useState<GuideUpcomingCard[]>([
    {
      name: "Sarah Johnson",
      date: "Dec 28",
      time: "09:00 AM",
      type: "Mountain Trek",
      status: "Confirmed",
    },
    {
      name: "Mike Chen",
      date: "Dec 29",
      time: "02:00 PM",
      type: "City Tour",
      status: "Confirmed",
    },
    {
      name: "Emma Wilson",
      date: "Jan 2",
      time: "10:00 AM",
      type: "Wildlife Safari",
      status: "Confirmed",
    },
  ]);

  const loadGuideDashboard = useCallback(async () => {
    try {
      const [dashboardResponse, profileResponse, upcomingResponse] = await Promise.all([
        guideAPI.getDashboard(),
        guideAPI.getProfile(),
        guideAPI.getUpcomingTours(),
      ]);

      const dashboard = dashboardResponse?.data || {};
      const dashboardStats = dashboard?.stats || {};
      const dashboardGuide = dashboard?.guide || {};
      const pendingBookings = (dashboard?.pendingBookings || []) as any[];
      const profileData = profileResponse?.data || {};
      const profileGuide = profileData?.guide || {};
      const tours = (upcomingResponse?.data?.tours || []) as any[];

      setStats({
        pendingRequests: Number(dashboardStats.pendingRequests || 0),
        confirmedBookings: Number(dashboardStats.confirmedBookings || 0),
        totalBookings: Number(dashboardStats.totalBookings || 0),
        totalReviews: Number(dashboardStats.totalReviews || 0),
        averageRating: Number(dashboardStats.averageRating || 0),
        confirmedRevenue: Number(dashboardStats.confirmedRevenue || 0),
        pendingRevenue: Number(dashboardStats.pendingRevenue || 0),
      });

      const fullName = String(profileData.full_name || "").trim();
      if (fullName) {
        setGuideFirstName(fullName.split(" ")[0] || fullName);
      }

      const experienceYears = Number(
        profileGuide.experienceYears ?? dashboardGuide.experience_years ?? 0
      );
      if (experienceYears > 0) {
        setGuideRoleLabel(`${experienceYears}+ years experience`);
      }

      const profileLocation = String(profileGuide.specialityLocation || "").trim();
      setRegisteredLocation(profileLocation || "Not selected");

      const isVerified =
        profileGuide.verifiedStatus ?? dashboardGuide.verified_status ?? null;
      if (isVerified === true) {
        setVerificationStatus("verified");
      } else if (isVerified === false) {
        setVerificationStatus("pending");
      }

      const availableValue =
        profileGuide.isAvailable ?? dashboardGuide.is_available ?? null;
      if (typeof availableValue === "boolean") {
        setIsAvailable(availableValue);
      }

      if (pendingBookings.length > 0) {
        setBookingRequests(
          pendingBookings.slice(0, 3).map((booking) => ({
            id: Number(booking.id || booking.bookingId || 0),
            name: booking.touristName || "Tourist",
            date: formatDate(booking.startDate),
            type: "Tour Request",
            price: formatCurrency(booking.totalPrice),
          }))
        );
      } else {
        setBookingRequests([]);
      }

      if (tours.length > 0) {
        setUpcomingJobs(
          tours.slice(0, 5).map((tour) => ({
            name: tour.touristName || "Tourist",
            date: formatDate(tour.startDate),
            time: formatDate(tour.endDate),
            type: "Upcoming Tour",
            status: "Confirmed",
          }))
        );
      } else {
        setUpcomingJobs([]);
      }
    } catch (error: any) {
      console.warn("Failed to load guide dashboard:", error?.message || error);
    }
  }, []);

  useEffect(() => {
    void loadGuideDashboard();
  }, [loadGuideDashboard]);

  const handleAvailabilityToggle = async (checked: boolean) => {
    const previousValue = isAvailable;
    setIsAvailable(checked);

    try {
      await guideAPI.updateAvailability(checked);
      Alert.alert(
        "Status Updated",
        checked
          ? "You are now available for bookings"
          : "You are now unavailable for bookings"
      );
    } catch (error: any) {
      setIsAvailable(previousValue);
      Alert.alert(
        "Update Failed",
        error?.message || "Unable to update availability right now."
      );
    }
  };

  const handleAcceptBooking = async (bookingId: number, name: string) => {
    try {
      await guideAPI.acceptBooking(bookingId);
      Alert.alert("Success", `Booking request from ${name} accepted!`);
      await loadGuideDashboard();
    } catch (error: any) {
      Alert.alert(
        "Action Failed",
        error?.message || `Unable to accept booking request from ${name}.`
      );
    }
  };

  const handleRejectBooking = async (bookingId: number, name: string) => {
    try {
      await guideAPI.rejectBooking(bookingId);
      Alert.alert("Rejected", `Booking request from ${name} rejected`);
      await loadGuideDashboard();
    } catch (error: any) {
      Alert.alert(
        "Action Failed",
        error?.message || `Unable to reject booking request from ${name}.`
      );
    }
  };

  const getVerificationBadge = () => {
    switch (verificationStatus) {
      case "verified":
        return (
          <View style={styles.verificationBadge}>
            <View style={[styles.badgeIcon, styles.badgeIconGreen]}>
              <MaterialCommunityIcons
                name="check-circle"
                size={20}
                color="#16a34a"
              />
            </View>
            <View>
              <Text style={styles.badgeTitle}>Verified Guide</Text>
              <Text style={styles.badgeSubtitle}>Your profile is approved</Text>
            </View>
          </View>
        );
      case "pending":
        return (
          <View style={[styles.verificationBadge, styles.badgeYellow]}>
            <View style={[styles.badgeIcon, styles.badgeIconYellow]}>
              <MaterialCommunityIcons
                name="clock"
                size={20}
                color="#ca8a04"
              />
            </View>
            <View>
              <Text style={[styles.badgeTitle, styles.badgeTitleYellow]}>
                Verification Pending
              </Text>
              <Text style={[styles.badgeSubtitle, styles.badgeSubtitleYellow]}>
                Admin review in progress
              </Text>
            </View>
          </View>
        );
      case "rejected":
        return (
          <View style={[styles.verificationBadge, styles.badgeRed]}>
            <View style={[styles.badgeIcon, styles.badgeIconRed]}>
              <MaterialCommunityIcons
                name="close-circle"
                size={20}
                color="#dc2626"
              />
            </View>
            <View>
              <Text style={[styles.badgeTitle, styles.badgeTitleRed]}>
                Verification Rejected
              </Text>
              <Text style={[styles.badgeSubtitle, styles.badgeSubtitleRed]}>
                Please update your documents
              </Text>
            </View>
          </View>
        );
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header with Profile Preview */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.profileSection}>
            <View style={styles.profileAvatar}>
              <MaterialCommunityIcons
                name="account-multiple"
                size={28}
                color="#1B73E8"
              />
            </View>
            <View style={styles.profileText}>
              <Text style={styles.profileGreeting}>Welcome back, {guideFirstName}!</Text>
              <Text style={styles.profileRole}>{guideRoleLabel}</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => onNavigate("guide-profile-edit")}
            style={styles.editButton}
          >
            <MaterialCommunityIcons name="pencil" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.contentContainer}>
        {/* Verification Status */}
        <View style={styles.card}>
          {getVerificationBadge()}
        </View>

        {/* Availability Toggle */}
        <View style={styles.card}>
          <View style={styles.availabilityContainer}>
            <View style={styles.availabilityLeft}>
              <View
                style={[
                  styles.statusIcon,
                  isAvailable
                    ? styles.statusIconGreen
                    : styles.statusIconGray,
                ]}
              >
                <MaterialCommunityIcons
                  name="shield"
                  size={20}
                  color={isAvailable ? "#16a34a" : "#9ca3af"}
                />
              </View>
              <View>
                <Text style={styles.availabilityLabel}>Availability Status</Text>
                <Text style={styles.availabilityStatus}>
                  {isAvailable
                    ? "Tourists can book you"
                    : "Not accepting bookings"}
                </Text>
              </View>
            </View>
            <Switch
              value={isAvailable}
              onValueChange={handleAvailabilityToggle}
              trackColor={{ false: "#e5e7eb", true: "#4ade80" }}
              thumbColor={isAvailable ? "#16a34a" : "#d1d5db"}
            />
          </View>
        </View>

        {/* Registered Location */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <MaterialCommunityIcons
                name="map-marker"
                size={20}
                color="#2563eb"
              />
              <Text style={styles.sectionTitle}>Registered Location</Text>
            </View>
            <TouchableOpacity
              style={styles.manageLocationButton}
              onPress={() => onNavigate("guide-settings")}
            >
              <Text style={styles.manageLocationText}>
                {registeredLocation === "Not selected" ? "Select" : "Change"}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.registeredLocationValue}>{registeredLocation}</Text>
          <Text style={styles.registeredLocationHint}>
            Set your speciality location so tourists can find you by place.
          </Text>
        </View>

        {/* Incoming Booking Requests */}
        {bookingRequests.length > 0 && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <MaterialCommunityIcons
                  name="alert-circle"
                  size={20}
                  color="#ea580c"
                />
                <Text style={styles.sectionTitle}>New Booking Requests</Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{bookingRequests.length}</Text>
              </View>
            </View>
            <View style={styles.spacer} />
            {bookingRequests.map((request) => (
              <View key={request.id} style={styles.bookingRequest}>
                <View style={styles.bookingRequestTop}>
                  <View style={styles.userInfo}>
                    <View style={styles.userAvatar}>
                      <MaterialCommunityIcons
                        name="account-multiple"
                        size={20}
                        color="#FFFFFF"
                      />
                    </View>
                    <View>
                      <Text style={styles.userName}>{request.name}</Text>
                      <Text style={styles.tourType}>{request.type}</Text>
                    </View>
                  </View>
                  <View style={styles.priceInfo}>
                    <Text style={styles.price}>{request.price}</Text>
                    <Text style={styles.date}>{request.date}</Text>
                  </View>
                </View>
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[styles.button, styles.acceptButton]}
                    onPress={() => void handleAcceptBooking(request.id, request.name)}
                  >
                    <MaterialCommunityIcons
                      name="check-circle"
                      size={16}
                      color="#FFFFFF"
                    />
                    <Text style={styles.acceptButtonText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.rejectButton]}
                    onPress={() => void handleRejectBooking(request.id, request.name)}
                  >
                    <MaterialCommunityIcons
                      name="close-circle"
                      size={16}
                      color="#dc2626"
                    />
                    <Text style={styles.rejectButtonText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Earnings Summary */}
        <View style={styles.card}>
          <View style={styles.sectionTitleContainer}>
            <MaterialCommunityIcons
              name="currency-usd"
              size={20}
              color="#16a34a"
            />
            <Text style={styles.sectionTitle}>Earnings Summary</Text>
          </View>
          <View style={styles.earningsGrid}>
            <View style={[styles.earningsCard, styles.earningsCardGreen]}>
              <Text style={styles.earningsLabel}>Pending</Text>
              <Text style={[styles.earningsAmount, styles.earningsAmountGreen]}>
                {formatCurrency(stats.pendingRevenue)}
              </Text>
            </View>
            <View style={[styles.earningsCard, styles.earningsCardBlue]}>
              <Text style={styles.earningsLabel}>Confirmed</Text>
              <Text style={[styles.earningsAmount, styles.earningsAmountBlue]}>
                {formatCurrency(stats.confirmedRevenue)}
              </Text>
            </View>
            <View style={[styles.earningsCard, styles.earningsCardTeal]}>
              <Text style={styles.earningsLabel}>Bookings</Text>
              <Text style={[styles.earningsAmount, styles.earningsAmountTeal]}>
                {stats.totalBookings}
              </Text>
            </View>
          </View>
          <View style={styles.totalEarningsSection}>
            <Text style={styles.totalEarningsLabel}>Total Earnings</Text>
            <Text style={styles.totalEarningsAmount}>
              {formatCurrency(stats.confirmedRevenue + stats.pendingRevenue)}
            </Text>
          </View>
        </View>

        {/* Reviews & Ratings Overview */}
        <View style={styles.card}>
          <View style={styles.reviewsHeader}>
            <View style={styles.sectionTitleContainer}>
              <MaterialCommunityIcons
                name="star"
                size={20}
                color="#fbbf24"
              />
              <Text style={styles.sectionTitle}>Reviews & Ratings</Text>
            </View>
            <TouchableOpacity
              onPress={() => onNavigate("guide-reviews")}
            >
              <Text style={styles.viewAllLink}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.ratingSection}>
            <View style={styles.ratingScore}>
              <Text style={styles.ratingNumber}>{Number(stats.averageRating || 0).toFixed(1)}</Text>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <MaterialCommunityIcons
                    key={star}
                    name={star <= Math.round(Number(stats.averageRating || 0)) ? "star" : "star-outline"}
                    size={16}
                    color="#fbbf24"
                  />
                ))}
              </View>
              <Text style={styles.reviewCount}>{stats.totalReviews} reviews</Text>
            </View>
            <View style={styles.ratingBreakdown}>
              {[
                { stars: 5, count: 128, percentage: 82 },
                { stars: 4, count: 20, percentage: 13 },
                { stars: 3, count: 8, percentage: 5 },
              ].map((item) => (
                <View key={item.stars} style={styles.ratingRow}>
                  <Text style={styles.ratingLabel}>{item.stars}★</Text>
                  <View style={styles.ratingBar}>
                    <View
                      style={[
                        styles.ratingFill,
                        { width: `${item.percentage}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.ratingCount}>{item.count}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Upcoming Tours */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <MaterialCommunityIcons
                name="calendar"
                size={20}
                color="#2563eb"
              />
              <Text style={styles.sectionTitle}>Upcoming Tours</Text>
            </View>
            <View style={styles.upcomingBadge}>
              <Text style={styles.upcomingBadgeText}>
                {upcomingJobs.length}
              </Text>
            </View>
          </View>
          <View style={styles.spacer} />
          {upcomingJobs.length > 0 ? (
            upcomingJobs.map((booking, index) => (
              <View key={index} style={styles.upcomingJob}>
                <View style={styles.jobInfo}>
                  <View style={styles.userAvatar}>
                    <MaterialCommunityIcons
                      name="account-multiple"
                      size={20}
                      color="#FFFFFF"
                    />
                  </View>
                  <View>
                    <Text style={styles.userName}>{booking.name}</Text>
                    <Text style={styles.tourType}>{booking.type}</Text>
                  </View>
                </View>
                <View style={styles.jobTimeInfo}>
                  <Text style={styles.jobDate}>{booking.date}</Text>
                  <Text style={styles.jobTime}>{booking.time}</Text>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>{booking.status}</Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyHint}>No upcoming tours right now.</Text>
          )}
        </View>

        {/* Messages */}
        <View style={styles.card}>
          <View style={styles.sectionTitleContainer}>
            <MaterialCommunityIcons
              name="message-text"
              size={20}
              color="#9333ea"
            />
            <Text style={styles.sectionTitle}>Messages</Text>
          </View>
          <View style={styles.messagesList}>
            {[
              {
                name: "Sarah Johnson",
                message: "What time should we meet?",
                time: "2h ago",
                unread: true,
              },
              {
                name: "Mike Chen",
                message: "Thanks for the great tour!",
                time: "5h ago",
                unread: false,
              },
            ].map((chat, index) => (
              <TouchableOpacity
                key={index}
                style={styles.messageItem}
                onPress={() => onNavigate("guide-messages")}
              >
                <View>
                  <View style={styles.messageHeader}>
                    <Text style={styles.chatName}>{chat.name}</Text>
                    {chat.unread && <View style={styles.unreadDot} />}
                  </View>
                  <Text style={styles.messageText}>{chat.message}</Text>
                </View>
                <Text style={styles.messageTime}>{chat.time}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => onNavigate("guide-messages")}
          >
            <Text style={styles.viewAllButtonText}>View All Messages</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onNavigate("guide-profile-edit")}
            >
              <MaterialCommunityIcons
                name="pencil"
                size={24}
                color="#1B73E8"
              />
              <Text style={styles.actionButtonText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButtonSecondary}
              onPress={() => onNavigate("guide-bookings")}
            >
              <MaterialCommunityIcons
                name="calendar"
                size={24}
                color="#4b5563"
              />
              <Text style={styles.actionButtonTextSecondary}>All Bookings</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButtonSecondary}
              onPress={() => onNavigate("guide-earnings")}
            >
              <MaterialCommunityIcons
                name="trending-up"
                size={24}
                color="#4b5563"
              />
              <Text style={styles.actionButtonTextSecondary}>Analytics</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButtonSecondary}
              onPress={() => onNavigate("guide-settings")}
            >
              <MaterialCommunityIcons
                name="cog"
                size={24}
                color="#4b5563"
              />
              <Text style={styles.actionButtonTextSecondary}>Settings</Text>
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
    backgroundColor: "#f3f4f6",
  },
  header: {
    backgroundColor: "#1B73E8",
    paddingTop: 48,
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  profileText: {
    gap: 2,
  },
  profileGreeting: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  profileRole: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  verificationBadge: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
    backgroundColor: "#dcfce7",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#86efac",
  },
  badgeYellow: {
    backgroundColor: "#fef3c7",
    borderColor: "#fde047",
  },
  badgeRed: {
    backgroundColor: "#fee2e2",
    borderColor: "#fca5a5",
  },
  badgeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeIconGreen: {
    backgroundColor: "rgba(22, 163, 74, 0.1)",
  },
  badgeIconYellow: {
    backgroundColor: "rgba(202, 138, 4, 0.1)",
  },
  badgeIconRed: {
    backgroundColor: "rgba(220, 38, 38, 0.1)",
  },
  badgeTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#166534",
  },
  badgeTitleYellow: {
    color: "#854d0e",
  },
  badgeTitleRed: {
    color: "#7f1d1d",
  },
  badgeSubtitle: {
    fontSize: 12,
    color: "#16a34a",
    marginTop: 2,
  },
  badgeSubtitleYellow: {
    color: "#ca8a04",
  },
  badgeSubtitleRed: {
    color: "#dc2626",
  },
  availabilityContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  availabilityLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  statusIconGreen: {
    backgroundColor: "#dcfce7",
  },
  statusIconGray: {
    backgroundColor: "#f3f4f6",
  },
  availabilityLabel: {
    fontSize: 14,
    color: "#1f2937",
  },
  availabilityStatus: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 2,
  },
  manageLocationButton: {
    borderWidth: 1,
    borderColor: "#dbeafe",
    backgroundColor: "#eff6ff",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  manageLocationText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1d4ed8",
  },
  registeredLocationValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 6,
  },
  registeredLocationHint: {
    fontSize: 12,
    color: "#6b7280",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  badge: {
    backgroundColor: "#ea580c",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  spacer: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginBottom: 12,
  },
  emptyHint: {
    fontSize: 13,
    color: "#6b7280",
  },
  bookingRequest: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  bookingRequestTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1B73E8",
    justifyContent: "center",
    alignItems: "center",
  },
  userName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
  },
  tourType: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  priceInfo: {
    alignItems: "flex-end",
  },
  price: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1B73E8",
  },
  date: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 2,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 8,
  },
  button: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  acceptButton: {
    backgroundColor: "#22c55e",
  },
  acceptButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  rejectButton: {
    backgroundColor: "#fee2e2",
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  rejectButtonText: {
    color: "#dc2626",
    fontSize: 14,
    fontWeight: "600",
  },
  earningsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  earningsCard: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  earningsCardGreen: {
    backgroundColor: "#dcfce7",
  },
  earningsCardBlue: {
    backgroundColor: "#dbeafe",
  },
  earningsCardTeal: {
    backgroundColor: "#ccfbf1",
  },
  earningsLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
  },
  earningsAmount: {
    fontSize: 18,
    fontWeight: "700",
  },
  earningsAmountGreen: {
    color: "#16a34a",
  },
  earningsAmountBlue: {
    color: "#2563eb",
  },
  earningsAmountTeal: {
    color: "#0d9488",
  },
  totalEarningsSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalEarningsLabel: {
    fontSize: 12,
    color: "#6b7280",
  },
  totalEarningsAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1B73E8",
  },
  reviewsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  viewAllLink: {
    fontSize: 12,
    color: "#1B73E8",
    fontWeight: "600",
  },
  ratingSection: {
    flexDirection: "row",
    gap: 24,
  },
  ratingScore: {
    alignItems: "center",
    gap: 4,
  },
  ratingNumber: {
    fontSize: 32,
    fontWeight: "700",
    color: "#1B73E8",
  },
  starsContainer: {
    flexDirection: "row",
    gap: 2,
  },
  reviewCount: {
    fontSize: 12,
    color: "#9ca3af",
  },
  ratingBreakdown: {
    flex: 1,
    gap: 8,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  ratingLabel: {
    fontSize: 12,
    color: "#6b7280",
    width: 20,
  },
  ratingBar: {
    flex: 1,
    height: 8,
    backgroundColor: "#f3f4f6",
    borderRadius: 4,
    overflow: "hidden",
  },
  ratingFill: {
    height: "100%",
    backgroundColor: "#fbbf24",
  },
  ratingCount: {
    fontSize: 12,
    color: "#9ca3af",
    width: 20,
    textAlign: "right",
  },
  upcomingBadge: {
    backgroundColor: "#dbeafe",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  upcomingBadgeText: {
    color: "#2563eb",
    fontSize: 12,
    fontWeight: "600",
  },
  upcomingJob: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  jobInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  jobTimeInfo: {
    alignItems: "flex-end",
    gap: 4,
  },
  jobDate: {
    fontSize: 12,
    color: "#6b7280",
  },
  jobTime: {
    fontSize: 11,
    color: "#9ca3af",
  },
  statusBadge: {
    backgroundColor: "#dcfce7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 2,
  },
  statusText: {
    fontSize: 11,
    color: "#15803d",
    fontWeight: "600",
  },
  messagesList: {
    gap: 8,
    marginVertical: 12,
  },
  messageItem: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  messageHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  chatName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ef4444",
  },
  messageText: {
    fontSize: 12,
    color: "#6b7280",
  },
  messageTime: {
    fontSize: 11,
    color: "#9ca3af",
  },
  viewAllButton: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    marginTop: 8,
  },
  viewAllButtonText: {
    fontSize: 14,
    color: "#4b5563",
    fontWeight: "600",
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 12,
  },
  actionButton: {
    flex: 0.45,
    aspectRatio: 1,
    borderWidth: 2,
    borderColor: "#1B73E8",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(27, 115, 232, 0.05)",
  },
  actionButtonSecondary: {
    flex: 0.45,
    aspectRatio: 1,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f9fafb",
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1B73E8",
  },
  actionButtonTextSecondary: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4b5563",
  },
});

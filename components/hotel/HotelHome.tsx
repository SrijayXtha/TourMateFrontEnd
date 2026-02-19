import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface HotelHomeProps {
  onNavigate: (screen: string) => void;
}

export function HotelHome({ onNavigate }: HotelHomeProps) {
  const [roomsAvailable, setRoomsAvailable] = useState(12);
  const totalRooms = 25;

  // Mock verification status: "verified", "pending", "rejected"
  const verificationStatus = "verified";

  const handleAcceptBooking = (name: string) => {
    Alert.alert("Success", `Booking request from ${name} accepted!`);
  };

  const handleRejectBooking = (name: string) => {
    Alert.alert("Rejected", `Booking request from ${name} rejected`);
  };

  const handleCancelRequest = (name: string) => {
    Alert.alert("Info", `Processing cancellation request from ${name}`);
  };

  const getVerificationBadge = () => {
    const status = verificationStatus as "verified" | "pending" | "rejected";
    switch (status) {
      case "verified":
        return (
          <View style={styles.verificationBadge}>
            <View style={[styles.badgeIcon, styles.badgeIconGreen]}>
              <MaterialCommunityIcons
                name="check-circle"
                size={20}
                color="#16A34A"
              />
            </View>
            <View style={styles.badgeTextContainer}>
              <Text style={styles.badgeTitle}>Verified Hotel</Text>
              <Text style={styles.badgeSubtitle}>Your listing is active</Text>
            </View>
          </View>
        );
      case "pending":
        return (
          <View style={[styles.verificationBadge, styles.verificationBadgePending]}>
            <View style={[styles.badgeIcon, styles.badgeIconYellow]}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={20}
                color="#CA8A04"
              />
            </View>
            <View style={styles.badgeTextContainer}>
              <Text style={styles.badgeTitlePending}>Verification Pending</Text>
              <Text style={styles.badgeSubtitlePending}>Admin review in progress</Text>
            </View>
          </View>
        );
      case "rejected":
        return (
          <View style={[styles.verificationBadge, styles.verificationBadgeRejected]}>
            <View style={[styles.badgeIcon, styles.badgeIconRed]}>
              <MaterialCommunityIcons
                name="close-circle"
                size={20}
                color="#DC2626"
              />
            </View>
            <View style={styles.badgeTextContainer}>
              <Text style={styles.badgeTitleRejected}>Verification Rejected</Text>
              <Text style={styles.badgeSubtitleRejected}>Please update your documents</Text>
            </View>
          </View>
        );
    }
  };

  const bookingRequests = [
    { id: 1, name: "Emily Davis", checkIn: "Jan 5", checkOut: "Jan 8", guests: 2, roomType: "Deluxe Suite", price: "$450" },
    { id: 2, name: "Robert Brown", checkIn: "Jan 7", checkOut: "Jan 10", guests: 4, roomType: "Family Room", price: "$680" },
  ];

  const confirmedBookings = [
    { name: "Sarah Johnson", checkIn: "Dec 29", checkOut: "Dec 31", guests: 2, roomType: "Standard Room", status: "Confirmed" },
    { name: "Mike Chen", checkIn: "Jan 2", checkOut: "Jan 5", guests: 3, roomType: "Deluxe Suite", status: "Confirmed" },
    { name: "Anna Wilson", checkIn: "Jan 4", checkOut: "Jan 7", guests: 2, roomType: "Ocean View", status: "Confirmed" }
  ];

  const cancelRequests = [
    { id: 1, name: "John Smith", checkIn: "Jan 3", roomType: "Standard Room", requestedOn: "2 hours ago" },
  ];

  const notifications = [
    { id: 1, message: "New booking request from Emily Davis", time: "5 min ago", type: "booking", unread: true },
    { id: 2, message: "John Smith requested cancellation", time: "2 hours ago", type: "cancel", unread: true },
    { id: 3, message: "Payment received for booking #1247", time: "5 hours ago", type: "payment", unread: false },
  ];

  const facilities = [
    { icon: "wifi", label: "Free WiFi" },
    { icon: "coffee", label: "Restaurant" },
    { icon: "pool", label: "Swimming Pool" },
    { icon: "phone", label: "24/7 Support" },
  ];

  const ratingData = [
    { stars: 5, count: 278, percentage: 81 },
    { stars: 4, count: 48, percentage: 14 },
    { stars: 3, count: 16, percentage: 5 },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header with Hotel Preview */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.hotelName}>Grand Paradise Resort</Text>
            <View style={styles.locationContainer}>
              <MaterialCommunityIcons name="map-marker" size={16} color="#fff" />
              <Text style={styles.locationText}>Miami Beach, Florida</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => onNavigate("hotel-manage")}
          >
            <MaterialCommunityIcons name="pencil" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        {/* Hotel Image Card */}
        <View style={styles.card}>
          <View style={styles.imageContainer}>
            <MaterialCommunityIcons name="image" size={64} color="#9CA3AF" />
            <TouchableOpacity
              style={styles.updateImageButton}
              onPress={() => onNavigate("hotel-manage")}
            >
              <MaterialCommunityIcons name="pencil" size={16} color="#1B73E8" />
              <Text style={styles.updateImageText}>Update Images</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Verification Status */}
        <View style={styles.card}>{getVerificationBadge()}</View>

        {/* Room Availability */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <MaterialCommunityIcons name="bed" size={20} color="#1B73E8" />
              <Text style={styles.sectionTitle}>Room Availability</Text>
            </View>
            <TouchableOpacity onPress={() => onNavigate("hotel-manage")}>
              <Text style={styles.updateLink}>Update</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.roomStats}>
            <View style={styles.roomStatRow}>
              <Text style={styles.roomStatLabel}>Available Rooms</Text>
              <Text style={styles.roomStatValueLarge}>{roomsAvailable}</Text>
            </View>
            <View style={styles.roomStatRow}>
              <Text style={styles.roomStatLabel}>Total Rooms</Text>
              <Text style={styles.roomStatValue}>{totalRooms}</Text>
            </View>
            <View style={styles.roomStatRow}>
              <Text style={styles.roomStatLabel}>Occupancy Rate</Text>
              <Text style={styles.roomStatValueBlue}>
                {Math.round(((totalRooms - roomsAvailable) / totalRooms) * 100)}%
              </Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${((totalRooms - roomsAvailable) / totalRooms) * 100}%`,
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        </View>

        {/* New Booking Requests */}
        {bookingRequests.length > 0 && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <MaterialCommunityIcons
                  name="alert-circle"
                  size={20}
                  color="#F97316"
                />
                <Text style={styles.sectionTitle}>New Booking Requests</Text>
              </View>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{bookingRequests.length}</Text>
              </View>
            </View>

            <View style={styles.itemsList}>
              {bookingRequests.map((request) => (
                <View key={request.id} style={styles.bookingRequestCard}>
                  <View style={styles.bookingRequestHeader}>
                    <View style={styles.bookingRequestInfo}>
                      <Text style={styles.bookingRequestName}>{request.name}</Text>
                      <Text style={styles.bookingRequestRoomType}>
                        {request.roomType}
                      </Text>
                      <View style={styles.bookingRequestDetails}>
                        <View style={styles.detailItem}>
                          <MaterialCommunityIcons
                            name="calendar"
                            size={12}
                            color="#6B7280"
                          />
                          <Text style={styles.detailText}>
                            {request.checkIn} - {request.checkOut}
                          </Text>
                        </View>
                        <View style={styles.detailItem}>
                          <MaterialCommunityIcons
                            name="account-group"
                            size={12}
                            color="#6B7280"
                          />
                          <Text style={styles.detailText}>{request.guests} guests</Text>
                        </View>
                      </View>
                    </View>
                    <Text style={styles.bookingRequestPrice}>{request.price}</Text>
                  </View>

                  <View style={styles.bookingRequestActions}>
                    <TouchableOpacity
                      style={styles.acceptButton}
                      onPress={() => handleAcceptBooking(request.name)}
                    >
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={16}
                        color="#fff"
                      />
                      <Text style={styles.acceptButtonText}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.declineButton}
                      onPress={() => handleRejectBooking(request.name)}
                    >
                      <MaterialCommunityIcons
                        name="close-circle"
                        size={16}
                        color="#DC2626"
                      />
                      <Text style={styles.declineButtonText}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Cancellation Requests */}
        {cancelRequests.length > 0 && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <MaterialCommunityIcons
                  name="close-circle"
                  size={20}
                  color="#DC2626"
                />
                <Text style={styles.sectionTitle}>Cancellation Requests</Text>
              </View>
              <View style={[styles.countBadge, styles.countBadgeRed]}>
                <Text style={styles.countBadgeText}>{cancelRequests.length}</Text>
              </View>
            </View>

            <View style={styles.itemsList}>
              {cancelRequests.map((request) => (
                <View key={request.id} style={styles.cancelRequestCard}>
                  <View style={styles.cancelRequestHeader}>
                    <View>
                      <Text style={styles.cancelRequestName}>{request.name}</Text>
                      <Text style={styles.cancelRequestRoomType}>
                        {request.roomType}
                      </Text>
                      <Text style={styles.cancelRequestCheckIn}>
                        Check-in: {request.checkIn}
                      </Text>
                    </View>
                    <Text style={styles.cancelRequestTime}>{request.requestedOn}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.processCancelButton}
                    onPress={() => handleCancelRequest(request.name)}
                  >
                    <Text style={styles.processCancelButtonText}>
                      Process Cancellation
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Confirmed Bookings */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <MaterialCommunityIcons name="calendar" size={20} color="#1B73E8" />
              <Text style={styles.sectionTitle}>Confirmed Bookings</Text>
            </View>
            <View style={[styles.countBadge, styles.countBadgeBlue]}>
              <Text style={styles.countBadgeText}>{confirmedBookings.length}</Text>
            </View>
          </View>

          <View style={styles.itemsList}>
            {confirmedBookings.map((booking, index) => (
              <View key={index} style={styles.confirmedBookingCard}>
                <View style={styles.confirmedBookingHeader}>
                  <View style={styles.confirmedBookingInfo}>
                    <Text style={styles.confirmedBookingName}>{booking.name}</Text>
                    <Text style={styles.confirmedBookingRoomType}>
                      {booking.roomType}
                    </Text>
                    <View style={styles.confirmedBookingDetails}>
                      <View style={styles.detailItem}>
                        <MaterialCommunityIcons
                          name="calendar"
                          size={12}
                          color="#6B7280"
                        />
                        <Text style={styles.detailText}>
                          {booking.checkIn} - {booking.checkOut}
                        </Text>
                      </View>
                      <View style={styles.detailItem}>
                        <MaterialCommunityIcons
                          name="account-group"
                          size={12}
                          color="#6B7280"
                        />
                        <Text style={styles.detailText}>{booking.guests} guests</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.confirmedBadge}>
                    <Text style={styles.confirmedBadgeText}>{booking.status}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => onNavigate("hotel-bookings")}
          >
            <Text style={styles.viewAllButtonText}>View All Bookings</Text>
          </TouchableOpacity>
        </View>

        {/* Hotel Rating & Reviews */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <MaterialCommunityIcons name="star" size={20} color="#FACC15" />
              <Text style={styles.sectionTitle}>Ratings & Reviews</Text>
            </View>
            <TouchableOpacity onPress={() => onNavigate("hotel-reviews")}>
              <Text style={styles.updateLink}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.ratingContainer}>
            <View style={styles.ratingOverview}>
              <Text style={styles.ratingScore}>4.8</Text>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <MaterialCommunityIcons
                    key={star}
                    name="star"
                    size={16}
                    color="#FACC15"
                  />
                ))}
              </View>
              <Text style={styles.ratingCount}>342 reviews</Text>
            </View>

            <View style={styles.ratingBreakdown}>
              {ratingData.map((item) => (
                <View key={item.stars} style={styles.ratingRow}>
                  <Text style={styles.ratingStars}>{item.stars}★</Text>
                  <View style={styles.ratingBar}>
                    <View
                      style={[
                        styles.ratingBarFill,
                        { width: `${item.percentage}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.ratingRowCount}>{item.count}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Manage Hotel Info */}
        <View style={styles.card}>
          <View style={styles.sectionTitleContainer}>
            <MaterialCommunityIcons name="cog" size={20} color="#6B7280" />
            <Text style={styles.sectionTitle}>Manage Hotel Information</Text>
          </View>

          <View style={styles.manageGrid}>
            <TouchableOpacity
              style={[styles.manageItem, styles.manageItemPrimary]}
              onPress={() => onNavigate("hotel-manage")}
            >
              <MaterialCommunityIcons
                name="currency-usd"
                size={24}
                color="#1B73E8"
              />
              <Text style={styles.manageItemText}>Update Pricing</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.manageItem}
              onPress={() => onNavigate("hotel-manage")}
            >
              <MaterialCommunityIcons name="image" size={24} color="#6B7280" />
              <Text style={styles.manageItemText}>Update Images</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.manageItem}
              onPress={() => onNavigate("hotel-manage")}
            >
              <MaterialCommunityIcons name="bed" size={24} color="#6B7280" />
              <Text style={styles.manageItemText}>Room Details</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.manageItem}
              onPress={() => onNavigate("hotel-manage")}
            >
              <MaterialCommunityIcons name="wifi" size={24} color="#6B7280" />
              <Text style={styles.manageItemText}>Facilities</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.facilitiesContainer}>
            <Text style={styles.facilitiesTitle}>Current Facilities:</Text>
            <View style={styles.facilitiesList}>
              {facilities.map((facility, index) => (
                <View key={index} style={styles.facilityChip}>
                  <MaterialCommunityIcons
                    name={facility.icon as any}
                    size={14}
                    color="#6B7280"
                  />
                  <Text style={styles.facilityChipText}>{facility.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <MaterialCommunityIcons name="bell" size={20} color="#9333EA" />
              <Text style={styles.sectionTitle}>Notifications</Text>
            </View>
            <View style={[styles.countBadge, styles.countBadgeRed]}>
              <Text style={styles.countBadgeText}>
                {notifications.filter((n) => n.unread).length}
              </Text>
            </View>
          </View>

          <View style={styles.itemsList}>
            {notifications.map((notification) => (
              <View
                key={notification.id}
                style={[
                  styles.notificationCard,
                  notification.unread && styles.notificationCardUnread,
                ]}
              >
                <View style={styles.notificationHeader}>
                  <Text
                    style={[
                      styles.notificationMessage,
                      notification.unread && styles.notificationMessageUnread,
                    ]}
                  >
                    {notification.message}
                  </Text>
                  {notification.unread && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.notificationTime}>{notification.time}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => Alert.alert("Info", "Opening all notifications")}
          >
            <Text style={styles.viewAllButtonText}>View All Notifications</Text>
          </TouchableOpacity>
        </View>

        {/* Support & Contact Info */}
        <View style={styles.card}>
          <View style={styles.sectionTitleContainer}>
            <MaterialCommunityIcons name="phone" size={20} color="#22C55E" />
            <Text style={styles.sectionTitle}>Support & Contact</Text>
          </View>

          <View style={styles.supportList}>
            <View style={styles.supportItem}>
              <View style={[styles.supportIcon, styles.supportIconGreen]}>
                <MaterialCommunityIcons name="phone" size={20} color="#22C55E" />
              </View>
              <View>
                <Text style={styles.supportLabel}>Phone Support</Text>
                <Text style={styles.supportValue}>+1 (800) 555-0123</Text>
              </View>
            </View>

            <View style={styles.supportItem}>
              <View style={[styles.supportIcon, styles.supportIconBlue]}>
                <MaterialCommunityIcons name="email" size={20} color="#1B73E8" />
              </View>
              <View>
                <Text style={styles.supportLabel}>Email Support</Text>
                <Text style={styles.supportValue}>support@grandparadise.com</Text>
              </View>
            </View>

            <View style={styles.supportItem}>
              <View style={[styles.supportIcon, styles.supportIconPurple]}>
                <MaterialCommunityIcons
                  name="message-text"
                  size={20}
                  color="#9333EA"
                />
              </View>
              <View>
                <Text style={styles.supportLabel}>Admin Support</Text>
                <TouchableOpacity
                  onPress={() => Alert.alert("Info", "Opening admin support chat")}
                >
                  <Text style={styles.supportLink}>Contact Admin</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Revenue Summary */}
        <View style={[styles.card, { marginBottom: 24 }]}>
          <View style={styles.sectionTitleContainer}>
            <MaterialCommunityIcons
              name="currency-usd"
              size={20}
              color="#22C55E"
            />
            <Text style={styles.sectionTitle}>Revenue Summary</Text>
          </View>

          <View style={styles.revenueGrid}>
            <View style={[styles.revenueCard, styles.revenueCardGreen]}>
              <Text style={styles.revenueLabel}>Today</Text>
              <Text style={styles.revenueValue}>$890</Text>
            </View>
            <View style={[styles.revenueCard, styles.revenueCardBlue]}>
              <Text style={styles.revenueLabel}>This Week</Text>
              <Text style={styles.revenueValueBlue}>$4,250</Text>
            </View>
            <View style={[styles.revenueCard, styles.revenueCardTeal]}>
              <Text style={styles.revenueLabel}>This Month</Text>
              <Text style={styles.revenueValueTeal}>$18,340</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.analyticsButton}
            onPress={() => onNavigate("hotel-analytics")}
          >
            <MaterialCommunityIcons
              name="chart-line"
              size={16}
              color="#1B73E8"
            />
            <Text style={styles.analyticsButtonText}>View Detailed Analytics</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
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
    paddingBottom: 100,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  hotelName: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  locationText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 14,
  },
  editButton: {
    width: 40,
    height: 40,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    marginTop: -80,
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    height: 192,
    backgroundColor: "#E5E7EB",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  updateImageButton: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  updateImageText: {
    color: "#1B73E8",
    fontSize: 14,
  },
  verificationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    borderRadius: 12,
    padding: 12,
  },
  verificationBadgePending: {
    backgroundColor: "#FEFCE8",
    borderColor: "#FEF08A",
  },
  verificationBadgeRejected: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  badgeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeIconGreen: {
    backgroundColor: "#DCFCE7",
  },
  badgeIconYellow: {
    backgroundColor: "#FEF9C3",
  },
  badgeIconRed: {
    backgroundColor: "#FEE2E2",
  },
  badgeTextContainer: {
    flex: 1,
  },
  badgeTitle: {
    fontSize: 14,
    color: "#166534",
    fontWeight: "600",
  },
  badgeSubtitle: {
    fontSize: 12,
    color: "#16A34A",
  },
  badgeTitlePending: {
    fontSize: 14,
    color: "#854D0E",
    fontWeight: "600",
  },
  badgeSubtitlePending: {
    fontSize: 12,
    color: "#CA8A04",
  },
  badgeTitleRejected: {
    fontSize: 14,
    color: "#991B1B",
    fontWeight: "600",
  },
  badgeSubtitleRejected: {
    fontSize: 12,
    color: "#DC2626",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
  },
  updateLink: {
    fontSize: 14,
    color: "#1B73E8",
  },
  countBadge: {
    backgroundColor: "#F97316",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countBadgeBlue: {
    backgroundColor: "#E0F2FE",
  },
  countBadgeRed: {
    backgroundColor: "#DC2626",
  },
  countBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  roomStats: {
    gap: 12,
  },
  roomStatRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  roomStatLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  roomStatValueLarge: {
    fontSize: 24,
    color: "#22C55E",
    fontWeight: "600",
  },
  roomStatValue: {
    fontSize: 20,
    color: "#1F2937",
    fontWeight: "600",
  },
  roomStatValueBlue: {
    fontSize: 20,
    color: "#1B73E8",
    fontWeight: "600",
  },
  progressBarContainer: {
    marginTop: 8,
  },
  progressBarBackground: {
    height: 12,
    backgroundColor: "#F3F4F6",
    borderRadius: 6,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#1B73E8",
    borderRadius: 6,
  },
  itemsList: {
    gap: 12,
  },
  bookingRequestCard: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 16,
  },
  bookingRequestHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  bookingRequestInfo: {
    flex: 1,
  },
  bookingRequestName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  bookingRequestRoomType: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  bookingRequestDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: "#6B7280",
  },
  bookingRequestPrice: {
    fontSize: 18,
    color: "#1B73E8",
    fontWeight: "600",
  },
  bookingRequestActions: {
    flexDirection: "row",
    gap: 8,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: "#22C55E",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 10,
    borderRadius: 8,
  },
  acceptButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  declineButton: {
    flex: 1,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#FECACA",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 10,
    borderRadius: 8,
  },
  declineButtonText: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "600",
  },
  cancelRequestCard: {
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "rgba(254, 226, 226, 0.5)",
    borderRadius: 12,
    padding: 16,
  },
  cancelRequestHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  cancelRequestName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  cancelRequestRoomType: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  cancelRequestCheckIn: {
    fontSize: 12,
    color: "#6B7280",
  },
  cancelRequestTime: {
    fontSize: 12,
    color: "#6B7280",
  },
  processCancelButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#FECACA",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  processCancelButtonText: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "600",
  },
  confirmedBookingCard: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 16,
  },
  confirmedBookingHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  confirmedBookingInfo: {
    flex: 1,
  },
  confirmedBookingName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  confirmedBookingRoomType: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  confirmedBookingDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  confirmedBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  confirmedBadgeText: {
    color: "#15803D",
    fontSize: 12,
    fontWeight: "600",
  },
  viewAllButton: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  viewAllButtonText: {
    color: "#1F2937",
    fontSize: 14,
    fontWeight: "600",
  },
  ratingContainer: {
    flexDirection: "row",
    gap: 24,
  },
  ratingOverview: {
    alignItems: "center",
    paddingRight: 24,
    borderRightWidth: 1,
    borderRightColor: "#E5E7EB",
  },
  ratingScore: {
    fontSize: 36,
    color: "#1B73E8",
    fontWeight: "bold",
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: "row",
    gap: 4,
    marginBottom: 8,
  },
  ratingCount: {
    fontSize: 12,
    color: "#6B7280",
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
  ratingStars: {
    fontSize: 12,
    color: "#6B7280",
    width: 32,
  },
  ratingBar: {
    flex: 1,
    height: 8,
    backgroundColor: "#F3F4F6",
    borderRadius: 4,
    overflow: "hidden",
  },
  ratingBarFill: {
    height: "100%",
    backgroundColor: "#FACC15",
    borderRadius: 4,
  },
  ratingRowCount: {
    fontSize: 12,
    color: "#6B7280",
    width: 32,
    textAlign: "right",
  },
  manageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 16,
  },
  manageItem: {
    width: "48%",
    alignItems: "center",
    gap: 8,
    padding: 16,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 12,
  },
  manageItemPrimary: {
    borderColor: "#1B73E8",
  },
  manageItemText: {
    fontSize: 14,
    color: "#1F2937",
  },
  facilitiesContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
  },
  facilitiesTitle: {
    fontSize: 14,
    color: "#1F2937",
    marginBottom: 8,
  },
  facilitiesList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  facilityChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  facilityChipText: {
    fontSize: 12,
    color: "#6B7280",
  },
  notificationCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  notificationCardUnread: {
    backgroundColor: "rgba(219, 234, 254, 0.5)",
    borderColor: "#BFDBFE",
  },
  notificationHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: "#1F2937",
    flex: 1,
  },
  notificationMessageUnread: {
    fontWeight: "600",
  },
  unreadDot: {
    width: 8,
    height: 8,
    backgroundColor: "#DC2626",
    borderRadius: 4,
    marginLeft: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: "#6B7280",
  },
  supportList: {
    gap: 12,
    marginTop: 16,
  },
  supportItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
  },
  supportIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  supportIconGreen: {
    backgroundColor: "#DCFCE7",
  },
  supportIconBlue: {
    backgroundColor: "#DBEAFE",
  },
  supportIconPurple: {
    backgroundColor: "#F3E8FF",
  },
  supportLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  supportValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  supportLink: {
    fontSize: 16,
    color: "#1B73E8",
  },
  revenueGrid: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
    marginBottom: 16,
  },
  revenueCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  revenueCardGreen: {
    backgroundColor: "#F0FDF4",
  },
  revenueCardBlue: {
    backgroundColor: "#EFF6FF",
  },
  revenueCardTeal: {
    backgroundColor: "#F0FDFA",
  },
  revenueLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  revenueValue: {
    fontSize: 20,
    fontWeight: "600",
    color: "#22C55E",
  },
  revenueValueBlue: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1B73E8",
  },
  revenueValueTeal: {
    fontSize: 20,
    fontWeight: "600",
    color: "#14B8A6",
  },
  analyticsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingVertical: 12,
    borderRadius: 8,
  },
  analyticsButtonText: {
    color: "#1B73E8",
    fontSize: 14,
    fontWeight: "600",
  },
});

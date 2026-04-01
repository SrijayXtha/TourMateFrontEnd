import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { hotelAPI } from "../../constants/api";

interface HotelBookingsProps {
  onBack: () => void;
}

type BookingTab = "all" | "pending" | "confirmed" | "rejected" | "pending_cancellation";

interface HotelBooking {
  id: number;
  touristName?: string;
  touristEmail?: string;
  touristPhone?: string;
  checkIn?: string;
  checkOut?: string;
  status: string;
  totalPrice?: number;
}

const dateText = (value?: string) => {
  if (!value) return "TBD";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "TBD";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export function HotelBookings({ onBack }: HotelBookingsProps) {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<BookingTab>("all");
  const [bookings, setBookings] = useState<HotelBooking[]>([]);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const response = await hotelAPI.getBookings();
      setBookings((response?.data?.bookings || []) as HotelBooking[]);
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to load hotel bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBookings();
  }, []);

  const acceptBooking = async (bookingId: number) => {
    try {
      await hotelAPI.acceptBooking(bookingId);
      await loadBookings();
    } catch (error: any) {
      Alert.alert("Action Failed", error?.message || "Unable to accept booking");
    }
  };

  const rejectBooking = async (bookingId: number) => {
    try {
      await hotelAPI.rejectBooking(bookingId);
      await loadBookings();
    } catch (error: any) {
      Alert.alert("Action Failed", error?.message || "Unable to reject booking");
    }
  };

  const markCompleted = async (bookingId: number) => {
    try {
      await hotelAPI.updateBookingStatus(bookingId, "completed");
      await loadBookings();
    } catch (error: any) {
      Alert.alert("Action Failed", error?.message || "Unable to update booking status");
    }
  };

  const handleCancellation = async (bookingId: number, approve: boolean) => {
    try {
      await hotelAPI.handleCancelRequest(bookingId, approve);
      await loadBookings();
    } catch (error: any) {
      Alert.alert("Action Failed", error?.message || "Unable to process cancellation request");
    }
  };

  const filtered = bookings.filter((booking) => {
    if (activeTab === "all") return true;
    return booking.status?.toLowerCase() === activeTab;
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Hotel Bookings</Text>
        <Text style={styles.subtitle}>Manage reservation requests</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
        <View style={styles.tabsRow}>
          {(["all", "pending", "confirmed", "rejected", "pending_cancellation"] as BookingTab[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab === "pending_cancellation" ? "Cancel Req" : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1B73E8" />
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {filtered.map((booking) => (
            <View key={booking.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.leftInfo}>
                  <Text style={styles.name}>{booking.touristName || "Tourist"}</Text>
                  <Text style={styles.meta}>{booking.touristEmail || "No email"}</Text>
                  <Text style={styles.meta}>{booking.touristPhone || "No phone"}</Text>
                  <Text style={styles.meta}>
                    {dateText(booking.checkIn)} - {dateText(booking.checkOut)}
                  </Text>
                </View>
                <View>
                  <View style={[styles.statusBadge, booking.status === "confirmed" && styles.confirmedBadge, booking.status === "rejected" && styles.rejectedBadge]}>
                    <Text style={[styles.statusText, booking.status === "confirmed" && styles.confirmedText, booking.status === "rejected" && styles.rejectedText]}>
                      {booking.status}
                    </Text>
                  </View>
                  <Text style={styles.price}>Rs {Number(booking.totalPrice || 0).toLocaleString()}</Text>
                </View>
              </View>

              {booking.status === "pending" && (
                <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.acceptButton} onPress={() => void acceptBooking(booking.id)}>
                    <Text style={styles.acceptText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.rejectButton} onPress={() => void rejectBooking(booking.id)}>
                    <Text style={styles.rejectText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              )}

              {booking.status === "confirmed" && (
                <TouchableOpacity style={styles.completeButton} onPress={() => void markCompleted(booking.id)}>
                  <Text style={styles.completeText}>Mark as Completed</Text>
                </TouchableOpacity>
              )}

              {booking.status === "pending_cancellation" && (
                <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.acceptButton} onPress={() => void handleCancellation(booking.id, true)}>
                    <Text style={styles.acceptText}>Approve Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.rejectButton} onPress={() => void handleCancellation(booking.id, false)}>
                    <Text style={styles.rejectText}>Decline</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}

          {filtered.length === 0 && (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="calendar-blank" size={56} color="#9CA3AF" />
              <Text style={styles.emptyText}>No bookings in this category</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    backgroundColor: "#1B73E8",
    paddingTop: 48,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  backButton: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  backText: { color: "#fff", fontSize: 16, fontWeight: "500" },
  title: { color: "#fff", fontSize: 28, fontWeight: "700" },
  subtitle: { color: "rgba(255,255,255,0.9)", marginTop: 4 },
  tabsScroll: { backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },
  tabsRow: { flexDirection: "row", paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  tab: {
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  activeTab: { backgroundColor: "#1B73E8" },
  tabText: { fontSize: 12, color: "#6B7280", fontWeight: "600" },
  activeTabText: { color: "#fff" },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { flex: 1, padding: 16 },
  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  leftInfo: { flex: 1 },
  name: { fontSize: 15, fontWeight: "700", color: "#111827" },
  meta: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  statusBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    backgroundColor: "#FEF3C7",
  },
  confirmedBadge: { backgroundColor: "#DCFCE7" },
  rejectedBadge: { backgroundColor: "#FEE2E2" },
  statusText: { color: "#B45309", fontSize: 11, fontWeight: "700", textTransform: "capitalize" },
  confirmedText: { color: "#15803D" },
  rejectedText: { color: "#DC2626" },
  price: { marginTop: 8, color: "#1B73E8", fontWeight: "700", fontSize: 13 },
  actionRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  acceptButton: {
    flex: 1,
    backgroundColor: "#16A34A",
    borderRadius: 8,
    alignItems: "center",
    paddingVertical: 10,
  },
  acceptText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  rejectButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 8,
    alignItems: "center",
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  rejectText: { color: "#DC2626", fontSize: 13, fontWeight: "700" },
  completeButton: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#93C5FD",
    backgroundColor: "#EFF6FF",
    borderRadius: 8,
    alignItems: "center",
    paddingVertical: 10,
  },
  completeText: { color: "#1D4ED8", fontSize: 13, fontWeight: "700" },
  emptyState: { alignItems: "center", marginTop: 100 },
  emptyText: { marginTop: 8, color: "#6B7280" },
});

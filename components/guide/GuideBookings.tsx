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
import { guideAPI } from "../../constants/api";

interface GuideBookingsProps {
  onBack: () => void;
}

type BookingTab = "all" | "pending" | "confirmed" | "rejected";

interface GuideBooking {
  id: number;
  touristName?: string;
  touristPhone?: string;
  startDate?: string;
  endDate?: string;
  status: string;
  totalPrice?: number;
}

const toDateText = (value?: string) => {
  if (!value) return "TBD";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "TBD";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export function GuideBookings({ onBack }: GuideBookingsProps) {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<BookingTab>("all");
  const [bookings, setBookings] = useState<GuideBooking[]>([]);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const response = await guideAPI.getBookings();
      setBookings((response?.data?.bookings || []) as GuideBooking[]);
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBookings();
  }, []);

  const handleAccept = async (bookingId: number) => {
    try {
      await guideAPI.acceptBooking(bookingId);
      await loadBookings();
    } catch (error: any) {
      Alert.alert("Action Failed", error?.message || "Unable to accept booking");
    }
  };

  const handleReject = async (bookingId: number) => {
    try {
      await guideAPI.rejectBooking(bookingId);
      await loadBookings();
    } catch (error: any) {
      Alert.alert("Action Failed", error?.message || "Unable to reject booking");
    }
  };

  const filteredBookings = bookings.filter((booking) => {
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
        <Text style={styles.title}>Guide Bookings</Text>
        <Text style={styles.subtitle}>Manage incoming tour requests</Text>
      </View>

      <View style={styles.tabsRow}>
        {(["all", "pending", "confirmed", "rejected"] as BookingTab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1B73E8" />
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {filteredBookings.map((booking) => (
            <View key={booking.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View>
                  <Text style={styles.name}>{booking.touristName || "Tourist"}</Text>
                  <Text style={styles.meta}>Phone: {booking.touristPhone || "N/A"}</Text>
                  <Text style={styles.meta}>
                    {toDateText(booking.startDate)} - {toDateText(booking.endDate)}
                  </Text>
                </View>
                <View style={[styles.statusBadge, booking.status === "confirmed" && styles.confirmedBadge, booking.status === "rejected" && styles.rejectedBadge]}>
                  <Text style={[styles.statusText, booking.status === "confirmed" && styles.confirmedText, booking.status === "rejected" && styles.rejectedText]}>
                    {booking.status}
                  </Text>
                </View>
              </View>

              <Text style={styles.priceText}>Price: Rs {Number(booking.totalPrice || 0).toLocaleString()}</Text>

              {booking.status === "pending" && (
                <View style={styles.actionsRow}>
                  <TouchableOpacity style={styles.acceptButton} onPress={() => void handleAccept(booking.id)}>
                    <MaterialCommunityIcons name="check" size={16} color="#fff" />
                    <Text style={styles.acceptText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.rejectButton} onPress={() => void handleReject(booking.id)}>
                    <MaterialCommunityIcons name="close" size={16} color="#DC2626" />
                    <Text style={styles.rejectActionText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}

          {filteredBookings.length === 0 && (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="calendar-blank" size={56} color="#9CA3AF" />
              <Text style={styles.emptyText}>No bookings found for this filter</Text>
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
  subtitle: { color: "rgba(255, 255, 255, 0.9)", marginTop: 4 },
  tabsRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    gap: 8,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  activeTab: { backgroundColor: "#1B73E8" },
  tabText: { color: "#6B7280", fontSize: 12, fontWeight: "600" },
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
  cardTop: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  name: { fontSize: 16, fontWeight: "700", color: "#111827" },
  meta: { fontSize: 12, color: "#6B7280", marginTop: 3 },
  statusBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#FEF3C7",
  },
  confirmedBadge: { backgroundColor: "#DCFCE7" },
  rejectedBadge: { backgroundColor: "#FEE2E2" },
  statusText: { fontSize: 11, fontWeight: "700", color: "#D97706", textTransform: "capitalize" },
  confirmedText: { color: "#15803D" },
  rejectedText: { color: "#DC2626" },
  priceText: { fontSize: 13, color: "#374151", marginTop: 10, fontWeight: "600" },
  actionsRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  acceptButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#16A34A",
    borderRadius: 8,
    paddingVertical: 10,
  },
  acceptText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  rejectButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 8,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  rejectActionText: { color: "#DC2626", fontWeight: "700", fontSize: 13 },
  emptyState: { alignItems: "center", marginTop: 100 },
  emptyText: { marginTop: 8, color: "#6B7280" },
});

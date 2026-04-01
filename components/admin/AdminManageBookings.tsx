import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { adminAPI } from "../../constants/api";

interface AdminManageBookingsProps {
  onBack: () => void;
}

type BookingFilter = "all" | "pending" | "confirmed" | "rejected" | "cancelled";

interface BookingItem {
  bookingId: number;
  status?: string;
  startDate?: string;
  endDate?: string;
  totalPrice?: number;
  tourist?: { id: number; name?: string; email?: string } | null;
  guide?: { id: number; name?: string; email?: string } | null;
  hotel?: { id: number; name?: string; email?: string } | null;
}

const dateText = (value?: string) => {
  if (!value) return "TBD";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "TBD";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export function AdminManageBookings({ onBack }: AdminManageBookingsProps) {
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<BookingFilter>("all");
  const [bookings, setBookings] = useState<BookingItem[]>([]);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params = statusFilter === "all" ? undefined : { status: statusFilter };
      const response = await adminAPI.getBookings(params);
      setBookings((response?.data?.bookings || []) as BookingItem[]);
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Manage Bookings</Text>
        <Text style={styles.subtitle}>Platform-wide booking records</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        <View style={styles.filterRow}>
          {(["all", "pending", "confirmed", "rejected", "cancelled"] as BookingFilter[]).map((status) => (
            <TouchableOpacity
              key={status}
              style={[styles.filterChip, statusFilter === status && styles.filterChipActive]}
              onPress={() => setStatusFilter(status)}
            >
              <Text style={[styles.filterText, statusFilter === status && styles.filterTextActive]}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#9333EA" />
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {bookings.map((booking) => (
            <View key={booking.bookingId} style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.bookingId}>Booking #{booking.bookingId}</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{booking.status || "pending"}</Text>
                </View>
              </View>

              <Text style={styles.meta}>Dates: {dateText(booking.startDate)} - {dateText(booking.endDate)}</Text>
              <Text style={styles.meta}>Total: Rs {Number(booking.totalPrice || 0).toLocaleString()}</Text>
              <Text style={styles.meta}>Tourist: {booking.tourist?.name || "N/A"}</Text>
              <Text style={styles.meta}>Guide: {booking.guide?.name || "N/A"}</Text>
              <Text style={styles.meta}>Hotel: {booking.hotel?.name || "N/A"}</Text>
            </View>
          ))}

          {bookings.length === 0 && (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="calendar-remove" size={56} color="#9CA3AF" />
              <Text style={styles.emptyText}>No bookings for this filter</Text>
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
    backgroundColor: "#9333EA",
    paddingTop: 48,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  backButton: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  backText: { color: "#fff", fontSize: 16, fontWeight: "500" },
  title: { color: "#fff", fontSize: 28, fontWeight: "700" },
  subtitle: { color: "rgba(255,255,255,0.9)", marginTop: 4 },
  filterScroll: { backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },
  filterRow: { flexDirection: "row", paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
  },
  filterChipActive: { backgroundColor: "#9333EA" },
  filterText: { color: "#6B7280", fontSize: 12, fontWeight: "600" },
  filterTextActive: { color: "#fff" },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { flex: 1, padding: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 14,
    marginBottom: 10,
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  bookingId: { fontSize: 14, fontWeight: "700", color: "#111827" },
  statusBadge: {
    borderRadius: 999,
    backgroundColor: "#F3E8FF",
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  statusText: { color: "#7E22CE", fontSize: 11, fontWeight: "700", textTransform: "capitalize" },
  meta: { fontSize: 12, color: "#6B7280", marginTop: 4 },
  emptyState: { alignItems: "center", marginTop: 90 },
  emptyText: { marginTop: 8, color: "#6B7280" },
});

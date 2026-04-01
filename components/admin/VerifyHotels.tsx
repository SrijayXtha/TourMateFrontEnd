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
import { adminAPI } from "../../constants/api";

interface VerifyHotelsProps {
  onBack: () => void;
}

type HotelsTab = "pending" | "verified";

interface HotelVerificationItem {
  hotelId: number;
  name?: string;
  ownerName?: string;
  email?: string;
  phone?: string;
  location?: string;
  description?: string;
  verifiedStatus?: boolean;
}

export function VerifyHotels({ onBack }: VerifyHotelsProps) {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<HotelsTab>("pending");
  const [pendingHotels, setPendingHotels] = useState<HotelVerificationItem[]>([]);
  const [verifiedHotels, setVerifiedHotels] = useState<HotelVerificationItem[]>([]);

  const loadHotels = async () => {
    setLoading(true);
    try {
      const [pendingRes, verifiedRes] = await Promise.all([
        adminAPI.getPendingHotels(),
        adminAPI.getHotels({ verified: true, page: 1, limit: 100 }),
      ]);

      setPendingHotels((pendingRes?.data?.hotels || []) as HotelVerificationItem[]);
      setVerifiedHotels((verifiedRes?.data?.hotels || []) as HotelVerificationItem[]);
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to load hotel verification data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadHotels();
  }, []);

  const approveHotel = async (hotelId: number) => {
    try {
      await adminAPI.verifyHotel(hotelId);
      await loadHotels();
    } catch (error: any) {
      Alert.alert("Action Failed", error?.message || "Unable to verify hotel");
    }
  };

  const rejectHotel = async (hotelId: number) => {
    try {
      await adminAPI.rejectHotel(hotelId, "Documents or profile details require updates");
      await loadHotels();
    } catch (error: any) {
      Alert.alert("Action Failed", error?.message || "Unable to reject hotel");
    }
  };

  const list = activeTab === "pending" ? pendingHotels : verifiedHotels;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Verify Hotels</Text>
        <Text style={styles.subtitle}>Approve or reject hotel applications</Text>
      </View>

      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "pending" && styles.activeTab]}
          onPress={() => setActiveTab("pending")}
        >
          <Text style={[styles.tabText, activeTab === "pending" && styles.activeTabText]}>
            Pending ({pendingHotels.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "verified" && styles.activeTab]}
          onPress={() => setActiveTab("verified")}
        >
          <Text style={[styles.tabText, activeTab === "verified" && styles.activeTabText]}>
            Verified ({verifiedHotels.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#9333EA" />
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {list.map((hotel) => (
            <View key={hotel.hotelId} style={styles.card}>
              <Text style={styles.name}>{hotel.name || "Hotel"}</Text>
              <Text style={styles.meta}>Owner: {hotel.ownerName || "N/A"}</Text>
              <Text style={styles.meta}>Email: {hotel.email || "N/A"}</Text>
              <Text style={styles.meta}>Phone: {hotel.phone || "N/A"}</Text>
              <Text style={styles.meta}>Location: {hotel.location || "N/A"}</Text>
              <Text style={styles.description}>{hotel.description || "No description provided"}</Text>

              {activeTab === "pending" ? (
                <View style={styles.actionsRow}>
                  <TouchableOpacity style={styles.approveButton} onPress={() => void approveHotel(hotel.hotelId)}>
                    <Text style={styles.approveText}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.rejectButton} onPress={() => void rejectHotel(hotel.hotelId)}>
                    <Text style={styles.rejectText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.verifiedBadge}>
                  <MaterialCommunityIcons name="check-decagram" size={16} color="#16A34A" />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              )}
            </View>
          ))}

          {list.length === 0 && (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="office-building-remove" size={56} color="#9CA3AF" />
              <Text style={styles.emptyText}>No hotels in this category</Text>
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
  subtitle: { color: "rgba(255, 255, 255, 0.9)", marginTop: 4 },
  tabsRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingHorizontal: 16,
  },
  tab: { paddingVertical: 14, marginRight: 16 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: "#9333EA" },
  tabText: { color: "#6B7280", fontSize: 14 },
  activeTabText: { color: "#9333EA", fontWeight: "700" },
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
  name: { fontSize: 16, fontWeight: "700", color: "#111827" },
  meta: { fontSize: 12, color: "#6B7280", marginTop: 3 },
  description: { marginTop: 8, color: "#374151", fontSize: 13 },
  actionsRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  approveButton: {
    flex: 1,
    backgroundColor: "#16A34A",
    borderRadius: 8,
    alignItems: "center",
    paddingVertical: 10,
  },
  approveText: { color: "#fff", fontSize: 13, fontWeight: "700" },
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
  verifiedBadge: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F0FDF4",
    borderColor: "#BBF7D0",
    borderWidth: 1,
    borderRadius: 999,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  verifiedText: { color: "#15803D", fontSize: 12, fontWeight: "700" },
  emptyState: { alignItems: "center", marginTop: 90 },
  emptyText: { marginTop: 8, color: "#6B7280" },
});

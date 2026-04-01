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

interface AdminAnalyticsProps {
  onBack: () => void;
}

export function AdminAnalytics({ onBack }: AdminAnalyticsProps) {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<any>(null);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getDashboard();
      setDashboard(response?.data || null);
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to load admin analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#9333EA" />
      </View>
    );
  }

  const usersByRole = dashboard?.overview?.usersByRole || {};
  const bookings = dashboard?.bookings || {};
  const verifications = dashboard?.verifications || {};
  const incidents = dashboard?.incidents || {};

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Admin Analytics</Text>
        <Text style={styles.subtitle}>Platform overview metrics</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.metricsGrid}>
          <View style={[styles.metricCard, styles.blueCard]}>
            <Text style={styles.metricLabel}>Total Users</Text>
            <Text style={[styles.metricValue, styles.blueText]}>
              {Number(dashboard?.overview?.totalUsers || 0).toLocaleString()}
            </Text>
          </View>
          <View style={[styles.metricCard, styles.tealCard]}>
            <Text style={styles.metricLabel}>Total Bookings</Text>
            <Text style={[styles.metricValue, styles.tealText]}>
              {Number(bookings.total || 0).toLocaleString()}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Users By Role</Text>
          <Text style={styles.meta}>Tourists: {usersByRole.tourists || 0}</Text>
          <Text style={styles.meta}>Guides: {usersByRole.guides || 0}</Text>
          <Text style={styles.meta}>Hotels: {usersByRole.hotels || 0}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Booking Status</Text>
          <Text style={styles.meta}>Pending: {bookings.pending || 0}</Text>
          <Text style={styles.meta}>Confirmed: {bookings.confirmed || 0}</Text>
          <Text style={styles.meta}>Cancelled: {bookings.cancelled || 0}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Verification Queue</Text>
          <Text style={styles.meta}>Pending Guides: {verifications.pendingGuideVerifications || 0}</Text>
          <Text style={styles.meta}>Pending Hotels: {verifications.pendingHotelVerifications || 0}</Text>
          <Text style={styles.meta}>Verified Guides: {verifications.verifiedGuides || 0}</Text>
          <Text style={styles.meta}>Verified Hotels: {verifications.verifiedHotels || 0}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Incident Monitoring</Text>
          <Text style={styles.meta}>Active Incidents: {incidents.activeIncidents || 0}</Text>
          <Text style={styles.meta}>Active SOS Reports: {incidents.activeSOSReports || 0}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
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
  content: { flex: 1, padding: 16 },
  metricsGrid: { gap: 10, marginBottom: 12 },
  metricCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  blueCard: { backgroundColor: "#EFF6FF", borderColor: "#BFDBFE" },
  tealCard: { backgroundColor: "#F0FDFA", borderColor: "#99F6E4" },
  metricLabel: { color: "#4B5563", fontSize: 12 },
  metricValue: { marginTop: 6, fontSize: 24, fontWeight: "700" },
  blueText: { color: "#1D4ED8" },
  tealText: { color: "#0F766E" },
  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 8 },
  meta: { fontSize: 13, color: "#4B5563", marginTop: 4 },
});

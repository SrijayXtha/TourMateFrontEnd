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

interface GuideAnalyticsProps {
  onBack: () => void;
}

interface TrendItem {
  month: string;
  bookings: number;
  revenue: number;
}

interface UpcomingTour {
  bookingId: number;
  touristName?: string;
  startDate?: string;
  endDate?: string;
  totalPrice?: number;
}

const dateText = (value?: string) => {
  if (!value) return "TBD";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "TBD";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export function GuideAnalytics({ onBack }: GuideAnalyticsProps) {
  const [loading, setLoading] = useState(true);
  const [confirmedRevenue, setConfirmedRevenue] = useState(0);
  const [pendingRevenue, setPendingRevenue] = useState(0);
  const [totalBookings, setTotalBookings] = useState(0);
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [upcomingTours, setUpcomingTours] = useState<UpcomingTour[]>([]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [analyticsRes, upcomingRes] = await Promise.all([
        guideAPI.getAnalytics(),
        guideAPI.getUpcomingTours(),
      ]);

      const analytics = analyticsRes?.data || {};
      setConfirmedRevenue(Number(analytics?.earnings?.confirmedRevenue || 0));
      setPendingRevenue(Number(analytics?.earnings?.pendingRevenue || 0));
      setTotalBookings(Number(analytics?.totalBookings || 0));
      setTrends((analytics?.trends || []) as TrendItem[]);

      setUpcomingTours((upcomingRes?.data?.tours || []) as UpcomingTour[]);
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAnalytics();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1B73E8" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Guide Analytics</Text>
        <Text style={styles.subtitle}>Revenue and booking performance</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.metricsGrid}>
          <View style={[styles.metricCard, styles.greenCard]}>
            <Text style={styles.metricLabel}>Confirmed Revenue</Text>
            <Text style={[styles.metricValue, styles.greenText]}>
              Rs {confirmedRevenue.toLocaleString()}
            </Text>
          </View>
          <View style={[styles.metricCard, styles.orangeCard]}>
            <Text style={styles.metricLabel}>Pending Revenue</Text>
            <Text style={[styles.metricValue, styles.orangeText]}>
              Rs {pendingRevenue.toLocaleString()}
            </Text>
          </View>
          <View style={[styles.metricCard, styles.blueCard]}>
            <Text style={styles.metricLabel}>Total Bookings</Text>
            <Text style={[styles.metricValue, styles.blueText]}>{totalBookings}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Monthly Trends</Text>
          {trends.map((trend) => (
            <View key={trend.month} style={styles.rowItem}>
              <Text style={styles.rowTitle}>{trend.month}</Text>
              <Text style={styles.rowSub}>Bookings: {trend.bookings}</Text>
              <Text style={styles.rowAmount}>Rs {Number(trend.revenue || 0).toLocaleString()}</Text>
            </View>
          ))}
          {trends.length === 0 && <Text style={styles.emptyText}>No trend data available</Text>}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Upcoming Tours</Text>
          {upcomingTours.map((tour) => (
            <View key={tour.bookingId} style={styles.rowItem}>
              <Text style={styles.rowTitle}>{tour.touristName || "Tourist"}</Text>
              <Text style={styles.rowSub}>
                {dateText(tour.startDate)} - {dateText(tour.endDate)}
              </Text>
              <Text style={styles.rowAmount}>Rs {Number(tour.totalPrice || 0).toLocaleString()}</Text>
            </View>
          ))}
          {upcomingTours.length === 0 && <Text style={styles.emptyText}>No upcoming tours</Text>}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
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
  content: { flex: 1, padding: 16 },
  metricsGrid: { gap: 10, marginBottom: 12 },
  metricCard: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
  },
  greenCard: { backgroundColor: "#F0FDF4", borderColor: "#BBF7D0" },
  orangeCard: { backgroundColor: "#FFFBEB", borderColor: "#FDE68A" },
  blueCard: { backgroundColor: "#EFF6FF", borderColor: "#BFDBFE" },
  metricLabel: { color: "#4B5563", fontSize: 12 },
  metricValue: { fontSize: 24, fontWeight: "700", marginTop: 6 },
  greenText: { color: "#15803D" },
  orangeText: { color: "#B45309" },
  blueText: { color: "#1D4ED8" },
  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 10 },
  rowItem: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  rowTitle: { fontSize: 14, fontWeight: "700", color: "#111827" },
  rowSub: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  rowAmount: { fontSize: 13, fontWeight: "700", color: "#1B73E8", marginTop: 6 },
  emptyText: { color: "#6B7280", fontSize: 13 },
});

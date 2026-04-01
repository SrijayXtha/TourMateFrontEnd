import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { adminAPI } from "../../constants/api";

const parseGrowthNumber = (value: unknown): number => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

interface AdminPanelProps {
  onNavigate: (screen: string) => void;
}

export function AdminPanel({ onNavigate }: AdminPanelProps) {
  const [analytics, setAnalytics] = useState({
    totalUsers: 1247,
    userGrowth: 12.5,
    totalBookings: 845,
    bookingGrowth: 18.3,
    totalGuides: 156,
    totalHotels: 89,
    pendingGuideVerifications: 8,
    pendingHotelVerifications: 4,
    activeIncidents: 3,
    activeSOSReports: 0,
  });

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const response = await adminAPI.getDashboard();
        const data = response?.data || {};
        const overview = data?.overview || {};
        const usersByRole = overview?.usersByRole || {};
        const bookings = data?.bookings || {};
        const verifications = data?.verifications || {};
        const incidents = data?.incidents || {};
        const growth = data?.growth || {};

        setAnalytics({
          totalUsers: Number(overview?.totalUsers || 0),
          userGrowth: parseGrowthNumber(growth?.userGrowthWeek),
          totalBookings: Number(bookings?.total || 0),
          bookingGrowth: parseGrowthNumber(growth?.bookingGrowthWeek),
          totalGuides: Number(usersByRole?.guides || 0),
          totalHotels: Number(usersByRole?.hotels || 0),
          pendingGuideVerifications: Number(verifications?.pendingGuideVerifications || 0),
          pendingHotelVerifications: Number(verifications?.pendingHotelVerifications || 0),
          activeIncidents: Number(incidents?.activeIncidents || 0),
          activeSOSReports: Number(incidents?.activeSOSReports || 0),
        });
      } catch (error: any) {
        console.warn("Failed to load admin dashboard:", error?.message || error);
      }
    };

    void loadDashboard();
  }, []);

  const pendingVerifications =
    analytics.pendingGuideVerifications + analytics.pendingHotelVerifications;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <Text style={styles.headerSubtitle}>Manage TourMate platform</Text>
      </View>

      {/* Key Metrics */}
      <View style={styles.section}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Platform Overview</Text>
          <View style={styles.metricsGrid}>
            {/* Total Users */}
            <View style={[styles.metricCard, styles.metricCardBlue]}>
              <View style={styles.metricHeader}>
                <MaterialCommunityIcons
                  name="account-group"
                  size={20}
                  color="#2563EB"
                />
                <Text style={styles.metricLabel}>Total Users</Text>
              </View>
              <Text style={[styles.metricValue, styles.metricValueBlue]}>
                {analytics.totalUsers.toLocaleString()}
              </Text>
              <View style={styles.growthBadge}>
                <MaterialCommunityIcons
                  name="trending-up"
                  size={12}
                  color="#10B981"
                />
                <Text style={styles.growthText}>
                  +{analytics.userGrowth}% this month
                </Text>
              </View>
            </View>

            {/* Bookings */}
            <View style={[styles.metricCard, styles.metricCardTeal]}>
              <View style={styles.metricHeader}>
                <MaterialCommunityIcons
                  name="chart-bar"
                  size={20}
                  color="#0D9488"
                />
                <Text style={styles.metricLabel}>Bookings</Text>
              </View>
              <Text style={[styles.metricValue, styles.metricValueTeal]}>
                {analytics.totalBookings.toLocaleString()}
              </Text>
              <View style={styles.growthBadge}>
                <MaterialCommunityIcons
                  name="trending-up"
                  size={12}
                  color="#10B981"
                />
                <Text style={styles.growthText}>
                  +{analytics.bookingGrowth}% this month
                </Text>
              </View>
            </View>

            {/* Guides */}
            <View style={[styles.metricCard, styles.metricCardPurple]}>
              <View style={styles.metricHeader}>
                <MaterialCommunityIcons
                  name="account-tie"
                  size={20}
                  color="#9333EA"
                />
                <Text style={styles.metricLabel}>Guides</Text>
              </View>
              <Text style={[styles.metricValue, styles.metricValuePurple]}>
                {analytics.totalGuides}
              </Text>
              <Text style={styles.metricSubtext}>Active providers</Text>
            </View>

            {/* Hotels */}
            <View style={[styles.metricCard, styles.metricCardIndigo]}>
              <View style={styles.metricHeader}>
                <MaterialCommunityIcons
                  name="office-building"
                  size={20}
                  color="#4F46E5"
                />
                <Text style={styles.metricLabel}>Hotels</Text>
              </View>
              <Text style={[styles.metricValue, styles.metricValueIndigo]}>
                {analytics.totalHotels}
              </Text>
              <Text style={styles.metricSubtext}>Listed properties</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Pending Actions */}
      <View style={styles.section}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.sectionTitle}>Pending Actions</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {pendingVerifications}
              </Text>
            </View>
          </View>

          <View style={styles.actionsList}>
            {/* Verify Guides */}
            <TouchableOpacity
              style={[styles.actionCard, styles.actionCardOrange]}
              onPress={() => onNavigate("verify-guides")}
            >
              <View style={styles.actionLeft}>
                <MaterialCommunityIcons
                  name="alert-circle"
                  size={20}
                  color="#F97316"
                />
                <View style={styles.actionInfo}>
                  <Text style={styles.actionTitle}>Verify Guides</Text>
                  <Text style={styles.actionSubtitle}>
                    {analytics.pendingGuideVerifications} pending verifications
                  </Text>
                </View>
              </View>
              <View style={[styles.actionBadge, styles.actionBadgeOrange]}>
                <Text style={styles.actionBadgeText}>{analytics.pendingGuideVerifications}</Text>
              </View>
            </TouchableOpacity>

            {/* Verify Hotels */}
            <TouchableOpacity
              style={[styles.actionCard, styles.actionCardBlue]}
              onPress={() => onNavigate("verify-hotels")}
            >
              <View style={styles.actionLeft}>
                <MaterialCommunityIcons
                  name="alert-circle"
                  size={20}
                  color="#3B82F6"
                />
                <View style={styles.actionInfo}>
                  <Text style={styles.actionTitle}>Verify Hotels</Text>
                  <Text style={styles.actionSubtitle}>
                    {analytics.pendingHotelVerifications} pending verifications
                  </Text>
                </View>
              </View>
              <View style={[styles.actionBadge, styles.actionBadgeBlue]}>
                <Text style={styles.actionBadgeText}>{analytics.pendingHotelVerifications}</Text>
              </View>
            </TouchableOpacity>

            {/* Incident Reports */}
            <TouchableOpacity
              style={[styles.actionCard, styles.actionCardRed]}
              onPress={() => onNavigate("incident-reports")}
            >
              <View style={styles.actionLeft}>
                <MaterialCommunityIcons
                  name="file-document"
                  size={20}
                  color="#EF4444"
                />
                <View style={styles.actionInfo}>
                  <Text style={styles.actionTitle}>Incident Reports</Text>
                  <Text style={styles.actionSubtitle}>
                    {analytics.activeIncidents} incidents, {analytics.activeSOSReports} SOS
                  </Text>
                </View>
              </View>
              <View style={[styles.actionBadge, styles.actionBadgeRed]}>
                <Text style={styles.actionBadgeText}>
                  {analytics.activeIncidents + analytics.activeSOSReports}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Management Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Management</Text>
        <View style={styles.managementGrid}>
          {/* Users */}
          <TouchableOpacity
            style={styles.managementCard}
            onPress={() => onNavigate("manage-users")}
          >
            <View style={[styles.managementIcon, styles.managementIconBlue]}>
              <MaterialCommunityIcons
                name="account-group"
                size={24}
                color="#FFFFFF"
              />
            </View>
            <Text style={styles.managementTitle}>Users</Text>
            <Text style={styles.managementSubtitle}>Manage all users</Text>
          </TouchableOpacity>

          {/* Bookings */}
          <TouchableOpacity
            style={styles.managementCard}
            onPress={() => onNavigate("manage-bookings")}
          >
            <View style={[styles.managementIcon, styles.managementIconTeal]}>
              <MaterialCommunityIcons
                name="chart-bar"
                size={24}
                color="#FFFFFF"
              />
            </View>
            <Text style={styles.managementTitle}>Bookings</Text>
            <Text style={styles.managementSubtitle}>View all bookings</Text>
          </TouchableOpacity>

          {/* Analytics */}
          <TouchableOpacity
            style={styles.managementCard}
            onPress={() => onNavigate("analytics")}
          >
            <View style={[styles.managementIcon, styles.managementIconPurple]}>
              <MaterialCommunityIcons
                name="trending-up"
                size={24}
                color="#FFFFFF"
              />
            </View>
            <Text style={styles.managementTitle}>Analytics</Text>
            <Text style={styles.managementSubtitle}>View insights</Text>
          </TouchableOpacity>

          {/* Reports */}
          <TouchableOpacity
            style={styles.managementCard}
            onPress={() => onNavigate("activity-logs")}
          >
            <View style={[styles.managementIcon, styles.managementIconIndigo]}>
              <MaterialCommunityIcons
                name="file-document"
                size={24}
                color="#FFFFFF"
              />
            </View>
            <Text style={styles.managementTitle}>Reports</Text>
            <Text style={styles.managementSubtitle}>Export data</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Recent Activity</Text>
        <View style={styles.card}>
          <View style={styles.activityList}>
            {[
              {
                action: "New guide registered",
                user: "David Chen",
                time: "5 min ago",
                type: "guide",
              },
              {
                action: "Hotel verified",
                user: "Seaside Paradise",
                time: "1 hour ago",
                type: "hotel",
              },
              {
                action: "Incident resolved",
                user: "Report #1287",
                time: "2 hours ago",
                type: "incident",
              },
              {
                action: "New booking",
                user: "Sarah Johnson",
                time: "3 hours ago",
                type: "booking",
              },
            ].map((activity, index) => (
              <View
                key={index}
                style={[
                  styles.activityItem,
                  index < 3 && styles.activityItemBorder,
                ]}
              >
                <View
                  style={[
                    styles.activityDot,
                    activity.type === "guide" && styles.activityDotTeal,
                    activity.type === "hotel" && styles.activityDotBlue,
                    activity.type === "incident" && styles.activityDotRed,
                    activity.type === "booking" && styles.activityDotGreen,
                  ]}
                />
                <View style={styles.activityContent}>
                  <Text style={styles.activityAction}>{activity.action}</Text>
                  <Text style={styles.activityUser}>{activity.user}</Text>
                </View>
                <Text style={styles.activityTime}>{activity.time}</Text>
              </View>
            ))}
          </View>
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
    backgroundColor: "#9333EA",
    paddingTop: 48,
    paddingBottom: 32,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
  },
  headerSubtitle: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 16,
  },
  section: {
    paddingHorizontal: 24,
    marginTop: 24,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
    color: "#111827",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    color: "#111827",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -8,
  },
  metricCard: {
    width: "50%",
    padding: 8,
  },
  metricCardBlue: {
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    padding: 16,
  },
  metricCardTeal: {
    backgroundColor: "#F0FDFA",
    borderRadius: 12,
    padding: 16,
  },
  metricCardPurple: {
    backgroundColor: "#FAF5FF",
    borderRadius: 12,
    padding: 16,
  },
  metricCardIndigo: {
    backgroundColor: "#EEF2FF",
    borderRadius: 12,
    padding: 16,
  },
  metricHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  metricValue: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  metricValueBlue: {
    color: "#2563EB",
  },
  metricValueTeal: {
    color: "#0D9488",
  },
  metricValuePurple: {
    color: "#9333EA",
  },
  metricValueIndigo: {
    color: "#4F46E5",
  },
  metricSubtext: {
    fontSize: 10,
    color: "#6B7280",
  },
  growthBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  growthText: {
    fontSize: 10,
    color: "#10B981",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  badge: {
    backgroundColor: "#EF4444",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  actionsList: {
    gap: 12,
  },
  actionCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  actionCardOrange: {
    backgroundColor: "#FFF7ED",
    borderColor: "#FDBA74",
  },
  actionCardBlue: {
    backgroundColor: "#EFF6FF",
    borderColor: "#93C5FD",
  },
  actionCardRed: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FCA5A5",
  },
  actionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
    color: "#111827",
  },
  actionSubtitle: {
    fontSize: 12,
    color: "#6B7280",
  },
  actionBadge: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  actionBadgeOrange: {
    backgroundColor: "#FED7AA",
  },
  actionBadgeBlue: {
    backgroundColor: "#BFDBFE",
  },
  actionBadgeRed: {
    backgroundColor: "#FECACA",
  },
  actionBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  managementGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  managementCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    width: "47%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  managementIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  managementIconBlue: {
    backgroundColor: "#3B82F6",
  },
  managementIconTeal: {
    backgroundColor: "#14B8A6",
  },
  managementIconPurple: {
    backgroundColor: "#A855F7",
  },
  managementIconIndigo: {
    backgroundColor: "#6366F1",
  },
  managementTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
    color: "#111827",
  },
  managementSubtitle: {
    fontSize: 11,
    color: "#6B7280",
  },
  activityList: {
    gap: 16,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingBottom: 16,
  },
  activityItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activityDotTeal: {
    backgroundColor: "#14B8A6",
  },
  activityDotBlue: {
    backgroundColor: "#3B82F6",
  },
  activityDotRed: {
    backgroundColor: "#EF4444",
  },
  activityDotGreen: {
    backgroundColor: "#22C55E",
  },
  activityContent: {
    flex: 1,
  },
  activityAction: {
    fontSize: 14,
    marginBottom: 4,
    color: "#111827",
  },
  activityUser: {
    fontSize: 12,
    color: "#6B7280",
  },
  activityTime: {
    fontSize: 12,
    color: "#9CA3AF",
  },
});

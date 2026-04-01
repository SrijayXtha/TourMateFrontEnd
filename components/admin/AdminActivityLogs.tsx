import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { adminAPI } from "../../constants/api";

interface AdminActivityLogsProps {
  onBack: () => void;
}

interface ActivityLog {
  id: number;
  type?: string;
  description?: string;
  adminName?: string;
  targetName?: string;
  timestamp?: string;
}

const dateText = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
};

export function AdminActivityLogs({ onBack }: AdminActivityLogsProps) {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getActivityLogs();
      setLogs((response?.data?.logs || []) as ActivityLog[]);
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to load activity logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadLogs();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Activity Logs</Text>
        <Text style={styles.subtitle}>Audit trail for admin actions</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#9333EA" />
        </View>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.typeText}>{item.type || "activity"}</Text>
                <Text style={styles.timeText}>{dateText(item.timestamp)}</Text>
              </View>
              <Text style={styles.description}>{item.description || "No description"}</Text>
              <Text style={styles.meta}>Admin: {item.adminName || "System"}</Text>
              <Text style={styles.meta}>Target: {item.targetName || "N/A"}</Text>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="clipboard-text-clock" size={56} color="#9CA3AF" />
              <Text style={styles.emptyText}>No activity logs available</Text>
            </View>
          }
        />
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
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  listContent: { padding: 16, gap: 10 },
  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 14,
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  typeText: { color: "#7E22CE", fontWeight: "700", fontSize: 12, textTransform: "capitalize" },
  timeText: { color: "#6B7280", fontSize: 11 },
  description: { marginTop: 8, color: "#111827", fontSize: 13 },
  meta: { marginTop: 4, color: "#6B7280", fontSize: 12 },
  emptyState: { alignItems: "center", marginTop: 90 },
  emptyText: { marginTop: 8, color: "#6B7280" },
});

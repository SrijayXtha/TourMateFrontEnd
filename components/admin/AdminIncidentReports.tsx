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

interface AdminIncidentReportsProps {
  onBack: () => void;
}

type IncidentTab = "incidents" | "sos";

interface IncidentItem {
  id: number;
  type?: string;
  touristName?: string;
  details?: string;
  location?: string;
  createdAt?: string;
}

interface SOSItem {
  id: number;
  touristName?: string;
  location?: string;
  status?: string;
  description?: string;
  timestamp?: string;
}

const dateText = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
};

export function AdminIncidentReports({ onBack }: AdminIncidentReportsProps) {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<IncidentTab>("incidents");
  const [incidents, setIncidents] = useState<IncidentItem[]>([]);
  const [sosReports, setSosReports] = useState<SOSItem[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getIncidents();
      setIncidents((response?.data?.incidents?.data || []) as IncidentItem[]);
      setSosReports((response?.data?.sosReports?.data || []) as SOSItem[]);
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to load incidents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const resolveIncident = async (incidentId: number) => {
    try {
      await adminAPI.resolveIncident(incidentId, "Reviewed and marked resolved by admin");
      Alert.alert("Success", "Incident marked as resolved");
      await loadData();
    } catch (error: any) {
      Alert.alert("Action Failed", error?.message || "Unable to resolve incident");
    }
  };

  const currentList = activeTab === "incidents" ? incidents : sosReports;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Incident Center</Text>
        <Text style={styles.subtitle}>Track incident and SOS reports</Text>
      </View>

      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "incidents" && styles.activeTab]}
          onPress={() => setActiveTab("incidents")}
        >
          <Text style={[styles.tabText, activeTab === "incidents" && styles.activeTabText]}>
            Incidents ({incidents.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "sos" && styles.activeTab]}
          onPress={() => setActiveTab("sos")}
        >
          <Text style={[styles.tabText, activeTab === "sos" && styles.activeTabText]}>
            SOS ({sosReports.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#9333EA" />
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {activeTab === "incidents" &&
            (currentList as IncidentItem[]).map((item) => (
              <View key={item.id} style={styles.card}>
                <Text style={styles.titleText}>{item.type || "incident"}</Text>
                <Text style={styles.meta}>Tourist: {item.touristName || "N/A"}</Text>
                <Text style={styles.meta}>Location: {item.location || "N/A"}</Text>
                <Text style={styles.details}>{item.details || "No details provided"}</Text>
                <Text style={styles.time}>{dateText(item.createdAt)}</Text>

                <TouchableOpacity style={styles.resolveButton} onPress={() => void resolveIncident(item.id)}>
                  <Text style={styles.resolveText}>Mark Resolved</Text>
                </TouchableOpacity>
              </View>
            ))}

          {activeTab === "sos" &&
            (currentList as SOSItem[]).map((item) => (
              <View key={item.id} style={styles.card}>
                <Text style={styles.titleText}>SOS Alert</Text>
                <Text style={styles.meta}>Tourist: {item.touristName || "N/A"}</Text>
                <Text style={styles.meta}>Location: {item.location || "N/A"}</Text>
                <Text style={styles.meta}>Status: {item.status || "active"}</Text>
                <Text style={styles.details}>{item.description || "No description provided"}</Text>
                <Text style={styles.time}>{dateText(item.timestamp)}</Text>
              </View>
            ))}

          {currentList.length === 0 && (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="file-document-outline" size={56} color="#9CA3AF" />
              <Text style={styles.emptyText}>No records found in this tab</Text>
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
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  titleText: { fontSize: 15, fontWeight: "700", color: "#111827" },
  meta: { fontSize: 12, color: "#6B7280", marginTop: 4 },
  details: { fontSize: 13, color: "#374151", marginTop: 8 },
  time: { fontSize: 11, color: "#9CA3AF", marginTop: 8 },
  resolveButton: {
    marginTop: 10,
    borderRadius: 8,
    backgroundColor: "#9333EA",
    alignItems: "center",
    paddingVertical: 10,
  },
  resolveText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  emptyState: { alignItems: "center", marginTop: 90 },
  emptyText: { marginTop: 8, color: "#6B7280" },
});

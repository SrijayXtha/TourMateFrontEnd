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
import { guideAPI } from "../../constants/api";

interface GuideNotificationsProps {
  onBack: () => void;
}

interface NotificationItem {
  notification_id: number;
  title: string;
  message: string;
  type?: string;
  is_read?: boolean;
}

export function GuideNotifications({ onBack }: GuideNotificationsProps) {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const response = await guideAPI.getNotifications();
      setNotifications((response?.data?.notifications || []) as NotificationItem[]);
      setUnreadCount(Number(response?.data?.unreadCount || 0));
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadNotifications();
  }, []);

  const markAsRead = async (id: number) => {
    try {
      await guideAPI.markNotificationRead(id);
      await loadNotifications();
    } catch (error: any) {
      Alert.alert("Update Failed", error?.message || "Unable to update notification");
    }
  };

  const deleteNotification = async (id: number) => {
    try {
      await guideAPI.deleteNotification(id);
      await loadNotifications();
    } catch (error: any) {
      Alert.alert("Delete Failed", error?.message || "Unable to delete notification");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Guide Notifications</Text>
        <Text style={styles.subtitle}>Unread: {unreadCount}</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1B73E8" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => String(item.notification_id)}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={[styles.card, !item.is_read && styles.unreadCard]}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                {!item.is_read && <View style={styles.unreadDot} />}
              </View>
              <Text style={styles.cardMessage}>{item.message}</Text>
              <View style={styles.cardFooter}>
                <Text style={styles.cardMeta}>{item.type || "general"}</Text>
                <View style={styles.actionsRow}>
                  {!item.is_read && (
                    <TouchableOpacity onPress={() => void markAsRead(item.notification_id)}>
                      <Text style={styles.readText}>Mark read</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => void deleteNotification(item.notification_id)}>
                    <Text style={styles.deleteText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="bell-off" size={56} color="#9CA3AF" />
              <Text style={styles.emptyText}>No notifications</Text>
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
    backgroundColor: "#1B73E8",
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
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 14,
  },
  unreadCard: { borderColor: "#93C5FD", backgroundColor: "#F8FBFF" },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { fontSize: 14, fontWeight: "700", color: "#111827", flex: 1, marginRight: 8 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#1B73E8" },
  cardMessage: { fontSize: 13, color: "#4B5563", marginTop: 6 },
  cardFooter: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardMeta: { fontSize: 12, color: "#6B7280", textTransform: "capitalize" },
  actionsRow: { flexDirection: "row", gap: 12 },
  readText: { fontSize: 12, fontWeight: "700", color: "#1B73E8" },
  deleteText: { fontSize: 12, fontWeight: "700", color: "#DC2626" },
  emptyState: { alignItems: "center", marginTop: 80 },
  emptyText: { color: "#6B7280", marginTop: 8 },
});

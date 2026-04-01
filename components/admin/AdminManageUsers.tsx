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

interface AdminManageUsersProps {
  onBack: () => void;
}

type RoleFilter = "all" | "tourist" | "guide" | "hotel" | "admin";

interface UserItem {
  user_id: number;
  full_name?: string;
  email?: string;
  phone?: string;
  role?: string;
  created_at?: string;
}

const dateText = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString();
};

export function AdminManageUsers({ onBack }: AdminManageUsersProps) {
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [users, setUsers] = useState<UserItem[]>([]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getUsers(roleFilter === "all" ? undefined : { role: roleFilter });
      setUsers((response?.data?.users || []) as UserItem[]);
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [roleFilter]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const deleteUser = async (userId: number, name: string) => {
    Alert.alert("Delete User", `Remove ${name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await adminAPI.deleteUser(userId, "Removed by admin from manage users");
            await loadUsers();
          } catch (error: any) {
            Alert.alert("Delete Failed", error?.message || "Unable to delete user");
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Manage Users</Text>
        <Text style={styles.subtitle}>Filter and moderate platform accounts</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        <View style={styles.filterRow}>
          {(["all", "tourist", "guide", "hotel", "admin"] as RoleFilter[]).map((role) => (
            <TouchableOpacity
              key={role}
              style={[styles.filterChip, roleFilter === role && styles.filterChipActive]}
              onPress={() => setRoleFilter(role)}
            >
              <Text style={[styles.filterText, roleFilter === role && styles.filterTextActive]}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
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
          {users.map((user) => (
            <View key={user.user_id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.leftInfo}>
                  <Text style={styles.name}>{user.full_name || "User"}</Text>
                  <Text style={styles.meta}>{user.email || "No email"}</Text>
                  <Text style={styles.meta}>{user.phone || "No phone"}</Text>
                  <Text style={styles.meta}>Joined: {dateText(user.created_at)}</Text>
                </View>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleText}>{user.role || "unknown"}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => void deleteUser(user.user_id, user.full_name || "this user")}
              >
                <MaterialCommunityIcons name="delete" size={16} color="#DC2626" />
                <Text style={styles.deleteText}>Delete User</Text>
              </TouchableOpacity>
            </View>
          ))}

          {users.length === 0 && (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="account-search" size={56} color="#9CA3AF" />
              <Text style={styles.emptyText}>No users found for this filter</Text>
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
  filterScroll: { backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },
  filterRow: { flexDirection: "row", paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
  },
  filterChipActive: { backgroundColor: "#9333EA" },
  filterText: { fontSize: 12, fontWeight: "600", color: "#6B7280" },
  filterTextActive: { color: "#fff" },
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
  meta: { fontSize: 12, color: "#6B7280", marginTop: 3 },
  roleBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#F3E8FF",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  roleText: { color: "#7E22CE", fontWeight: "700", fontSize: 11, textTransform: "capitalize" },
  deleteButton: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  deleteText: { color: "#DC2626", fontSize: 13, fontWeight: "700" },
  emptyState: { alignItems: "center", marginTop: 90 },
  emptyText: { marginTop: 8, color: "#6B7280" },
});

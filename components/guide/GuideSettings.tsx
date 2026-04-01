import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { guideAPI } from "../../constants/api";

interface GuideSettingsProps {
  onBack: () => void;
  onLogout: () => void;
}

export function GuideSettings({ onBack, onLogout }: GuideSettingsProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bio, setBio] = useState("");
  const [experienceYears, setExperienceYears] = useState("0");
  const [isAvailable, setIsAvailable] = useState(true);
  const [verifiedStatus, setVerifiedStatus] = useState(false);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const response = await guideAPI.getProfile();
      const profile = response?.data?.guide || {};
      setBio(profile.bio || "");
      setExperienceYears(String(profile.experienceYears || 0));
      setIsAvailable(Boolean(profile.isAvailable ?? true));
      setVerifiedStatus(Boolean(profile.verifiedStatus));
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to load guide profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProfile();
  }, []);

  const saveProfile = async () => {
    const parsedExperience = Number.parseInt(experienceYears || "0", 10);
    if (!Number.isInteger(parsedExperience) || parsedExperience < 0) {
      Alert.alert("Validation", "Experience years must be a valid number");
      return;
    }

    setSaving(true);
    try {
      await guideAPI.updateProfile({
        bio: bio.trim() || undefined,
        experienceYears: parsedExperience,
        isAvailable,
      });
      await guideAPI.updateAvailability(isAvailable);
      Alert.alert("Success", "Guide profile updated");
    } catch (error: any) {
      Alert.alert("Update Failed", error?.message || "Unable to update guide profile");
    } finally {
      setSaving(false);
    }
  };

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
        <Text style={styles.title}>Guide Settings</Text>
        <Text style={styles.subtitle}>Manage profile and account status</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Verification</Text>
          <View style={styles.row}>
            <MaterialCommunityIcons
              name={verifiedStatus ? "check-decagram" : "clock-outline"}
              size={20}
              color={verifiedStatus ? "#16A34A" : "#D97706"}
            />
            <Text style={styles.rowText}>
              {verifiedStatus ? "Verified Guide" : "Pending Verification"}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            value={bio}
            onChangeText={setBio}
            multiline
            placeholder="Professional bio"
          />
          <TextInput
            style={styles.input}
            value={experienceYears}
            onChangeText={setExperienceYears}
            keyboardType="number-pad"
            placeholder="Experience years"
          />

          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.toggleTitle}>Available For Bookings</Text>
              <Text style={styles.toggleSubtitle}>Tourists can send you booking requests</Text>
            </View>
            <Switch value={isAvailable} onValueChange={setIsAvailable} />
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, saving && styles.disabledButton]}
            onPress={() => void saveProfile()}
            disabled={saving}
          >
            <Text style={styles.primaryButtonText}>{saving ? "Saving..." : "Save Changes"}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Session</Text>
          <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
            <MaterialCommunityIcons name="logout" size={16} color="#DC2626" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
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
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  backButton: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  backText: { color: "#fff", fontSize: 16, fontWeight: "500" },
  title: { color: "#fff", fontSize: 28, fontWeight: "700", marginBottom: 4 },
  subtitle: { color: "rgba(255, 255, 255, 0.9)", fontSize: 14 },
  content: { flex: 1, padding: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  rowText: { color: "#374151", fontSize: 14, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  multilineInput: { minHeight: 90, textAlignVertical: "top" },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  toggleTitle: { fontSize: 14, fontWeight: "600", color: "#111827" },
  toggleSubtitle: { fontSize: 12, color: "#6B7280", marginTop: 2, maxWidth: 220 },
  primaryButton: {
    backgroundColor: "#1B73E8",
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 12,
  },
  disabledButton: { opacity: 0.6 },
  primaryButtonText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 10,
    paddingVertical: 12,
  },
  logoutText: { color: "#DC2626", fontSize: 14, fontWeight: "700" },
});

import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
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

interface GuideDestinationRequestItem {
  requestId: number;
  destinationName: string;
  location: string;
  reason: string;
  status: string;
  rejectionReason?: string | null;
  approvedDestinationName?: string | null;
}

export function GuideSettings({ onBack, onLogout }: GuideSettingsProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bio, setBio] = useState("");
  const [displayPhoto, setDisplayPhoto] = useState("");
  const [experienceYears, setExperienceYears] = useState("0");
  const [specialityLocation, setSpecialityLocation] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);
  const [verifiedStatus, setVerifiedStatus] = useState(false);
  const [languages, setLanguages] = useState<string[]>([]);
  const [destinations, setDestinations] = useState<{ destinationId: number; name: string }[]>([]);
  const [destinationRequests, setDestinationRequests] = useState<GuideDestinationRequestItem[]>([]);
  const [requestName, setRequestName] = useState("");
  const [requestLocation, setRequestLocation] = useState("");
  const [requestReason, setRequestReason] = useState("");
  const [requestSubmitting, setRequestSubmitting] = useState(false);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const [response, requestResponse] = await Promise.all([
        guideAPI.getProfile(),
        guideAPI.getDestinationRequests(),
      ]);
      const profile = response?.data?.guide || {};
      const userProfilePhoto = String(response?.data?.profile_photo || "").trim();
      setBio(profile.bio || "");
      setDisplayPhoto(profile.photo || userProfilePhoto || "");
      setExperienceYears(String(profile.experienceYears || 0));
      setSpecialityLocation(profile.specialityLocation || "");
      setIsAvailable(Boolean(profile.isAvailable ?? true));
      setVerifiedStatus(Boolean(profile.verifiedStatus));
      setLanguages((profile.languages || []) as string[]);
      setDestinations((profile.destinations || []) as { destinationId: number; name: string }[]);
      setDestinationRequests((requestResponse?.data?.requests || []) as GuideDestinationRequestItem[]);
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to load guide profile");
    } finally {
      setLoading(false);
    }
  };

  const pickDisplayPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      setDisplayPhoto(result.assets[0].uri);
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

    const normalizedLocation = specialityLocation.trim();
    if (!normalizedLocation) {
      Alert.alert("Validation", "Please select your registered speciality location");
      return;
    }

    setSaving(true);
    try {
      await guideAPI.updateProfile({
        bio: bio.trim() || undefined,
        experienceYears: parsedExperience,
        isAvailable,
        specialityLocation: normalizedLocation,
      });
      await guideAPI.updateAvailability(isAvailable);
      await loadProfile();
      Alert.alert("Changes Saved", "Your profile changes have been saved.");
    } catch (error: any) {
      Alert.alert("Update Failed", error?.message || "Unable to update guide profile");
    } finally {
      setSaving(false);
    }
  };

  const submitDestinationRequest = async () => {
    if (!requestName.trim() || !requestLocation.trim() || !requestReason.trim()) {
      Alert.alert("Validation", "Destination name, location, and reason are required.");
      return;
    }

    setRequestSubmitting(true);
    try {
      await guideAPI.createDestinationRequest({
        destinationName: requestName.trim(),
        location: requestLocation.trim(),
        reason: requestReason.trim(),
      });
      setRequestName("");
      setRequestLocation("");
      setRequestReason("");
      await loadProfile();
      Alert.alert("Request Sent", "Your destination request has been submitted for admin review.");
    } catch (error: any) {
      Alert.alert("Request Failed", error?.message || "Unable to submit destination request.");
    } finally {
      setRequestSubmitting(false);
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
          <View style={styles.avatarRow}>
            <Image
              source={{
                uri:
                  displayPhoto || "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=300&q=80",
              }}
              style={styles.avatar}
            />
            <TouchableOpacity style={styles.photoButton} onPress={() => void pickDisplayPhoto()}>
              <Text style={styles.photoButtonText}>Change Display Picture</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.inputLabel}>Professional Bio</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            value={bio}
            onChangeText={setBio}
            multiline
            placeholder="Professional bio"
          />
          <Text style={styles.inputLabel}>Experience Years</Text>
          <TextInput
            style={styles.input}
            value={experienceYears}
            onChangeText={setExperienceYears}
            keyboardType="number-pad"
            placeholder="Experience years"
          />

          <Text style={styles.inputLabel}>Registered Speciality Location</Text>
          <View style={styles.locationChipsContainer}>
            {REGISTERED_GUIDE_LOCATIONS.map((location) => {
              const selected = specialityLocation === location;
              return (
                <TouchableOpacity
                  key={location}
                  style={[styles.locationChip, selected && styles.locationChipActive]}
                  onPress={() => setSpecialityLocation(location)}
                >
                  <MaterialCommunityIcons
                    name={selected ? "check-circle" : "map-marker-outline"}
                    size={14}
                    color={selected ? "#1B73E8" : "#6B7280"}
                  />
                  <Text
                    style={[styles.locationChipText, selected && styles.locationChipTextActive]}
                  >
                    {location}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.locationHint}>
            {specialityLocation
              ? `Selected location: ${specialityLocation}`
              : "Choose your main service location so tourists can find you by place."}
          </Text>

          <Text style={styles.inputLabel}>Registered Destinations</Text>
          <View style={styles.locationChipsContainer}>
            {destinations.length > 0 ? (
              destinations.map((destination) => (
                <View key={destination.destinationId} style={styles.locationChipActive}>
                  <Text style={styles.locationChipTextActive}>{destination.name}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.locationHint}>No destinations registered yet.</Text>
            )}
          </View>

          <Text style={styles.inputLabel}>Languages I Speak</Text>
          <View style={styles.locationChipsContainer}>
            {languages.length > 0 ? (
              languages.map((language) => (
                <View key={language} style={styles.languageChip}>
                  <Text style={styles.languageChipText}>{language}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.locationHint}>No languages saved yet.</Text>
            )}
          </View>

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
          <Text style={styles.sectionTitle}>Request New Destination</Text>
          <Text style={styles.locationHint}>
            Can&apos;t find a place you guide for? Send a destination request to admin.
          </Text>
          <Text style={styles.inputLabel}>Destination Name</Text>
          <TextInput
            style={styles.input}
            value={requestName}
            onChangeText={setRequestName}
            placeholder="e.g. Bandipur"
          />
          <Text style={styles.inputLabel}>Location / Address</Text>
          <TextInput
            style={styles.input}
            value={requestLocation}
            onChangeText={setRequestLocation}
            placeholder="District or full location"
          />
          <Text style={styles.inputLabel}>Reason</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            value={requestReason}
            onChangeText={setRequestReason}
            placeholder="Why should this destination be added?"
            multiline
          />
          <TouchableOpacity
            style={[styles.primaryButton, requestSubmitting && styles.disabledButton]}
            onPress={() => void submitDestinationRequest()}
            disabled={requestSubmitting}
          >
            <Text style={styles.primaryButtonText}>
              {requestSubmitting ? "Submitting..." : "Submit Destination Request"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Destination Request Status</Text>
          {destinationRequests.length > 0 ? (
            destinationRequests.map((request) => (
              <View key={request.requestId} style={styles.requestCard}>
                <View style={styles.requestHeader}>
                  <Text style={styles.requestName}>{request.destinationName}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      request.status === "approved" && styles.statusBadgeApproved,
                      request.status === "rejected" && styles.statusBadgeRejected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        request.status === "approved" && styles.statusTextApproved,
                        request.status === "rejected" && styles.statusTextRejected,
                      ]}
                    >
                      {request.status}
                    </Text>
                  </View>
                </View>
                <Text style={styles.requestMeta}>{request.location}</Text>
                <Text style={styles.requestMeta}>{request.reason}</Text>
                {request.approvedDestinationName ? (
                  <Text style={styles.approvedText}>
                    Added as official destination: {request.approvedDestinationName}
                  </Text>
                ) : null}
                {request.rejectionReason ? (
                  <Text style={styles.rejectedText}>
                    Rejection reason: {request.rejectionReason}
                  </Text>
                ) : null}
              </View>
            ))
          ) : (
            <Text style={styles.locationHint}>No destination requests submitted yet.</Text>
          )}
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
  inputLabel: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 4,
  },
  avatarRow: { alignItems: "center", marginBottom: 12 },
  avatar: { width: 92, height: 92, borderRadius: 46, marginBottom: 8, backgroundColor: "#E5E7EB" },
  photoButton: {
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: "#EFF6FF",
  },
  photoButtonText: { color: "#1D4ED8", fontSize: 13, fontWeight: "600" },
  multilineInput: { minHeight: 90, textAlignVertical: "top" },
  locationChipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  locationChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#F9FAFB",
  },
  locationChipActive: {
    borderColor: "#BFDBFE",
    backgroundColor: "#EFF6FF",
  },
  locationChipText: {
    fontSize: 12,
    color: "#4B5563",
    fontWeight: "500",
  },
  locationChipTextActive: {
    color: "#1E40AF",
  },
  locationHint: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 12,
  },
  languageChip: {
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#EFF6FF",
  },
  languageChipText: {
    fontSize: 12,
    color: "#1E40AF",
    fontWeight: "600",
  },
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
  requestCard: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  requestHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  requestName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  requestMeta: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 6,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "#FEF3C7",
  },
  statusBadgeApproved: {
    backgroundColor: "#DCFCE7",
  },
  statusBadgeRejected: {
    backgroundColor: "#FEE2E2",
  },
  statusText: {
    color: "#92400E",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  statusTextApproved: {
    color: "#166534",
  },
  statusTextRejected: {
    color: "#B91C1C",
  },
  approvedText: {
    fontSize: 12,
    color: "#166534",
    marginTop: 8,
    fontWeight: "600",
  },
  rejectedText: {
    fontSize: 12,
    color: "#B91C1C",
    marginTop: 8,
    fontWeight: "600",
  },
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

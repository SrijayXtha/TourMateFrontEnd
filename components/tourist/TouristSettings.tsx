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
import { touristAPI } from "../../constants/api";
import { TouristTopBar } from "../common/TouristTopBar";

interface TouristSettingsProps {
  onBack: () => void;
}

type SettingsTab = "profile" | "payment" | "saved" | "privacy";

interface PaymentMethod {
  id: string;
  label: string;
  brand?: string;
  last4: string;
  expiryMonth?: string;
  expiryYear?: string;
  isDefault: boolean;
}

interface SavedPlace {
  id: string;
  name: string;
  location?: string;
  notes?: string;
}

export function TouristSettings({ onBack }: TouristSettingsProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [loading, setLoading] = useState(true);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [preferencesText, setPreferencesText] = useState("");

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);

  const [paymentLabel, setPaymentLabel] = useState("");
  const [paymentLast4, setPaymentLast4] = useState("");
  const [paymentBrand, setPaymentBrand] = useState("");

  const [savedPlaceName, setSavedPlaceName] = useState("");
  const [savedPlaceLocation, setSavedPlaceLocation] = useState("");

  const [profileVisibility, setProfileVisibility] = useState<"public" | "private">("public");
  const [shareLocation, setShareLocation] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [profileRes, paymentRes, savedRes] = await Promise.all([
        touristAPI.getProfile(),
        touristAPI.getPaymentMethods(),
        touristAPI.getSavedPlaces(),
      ]);

      const profile = profileRes?.data;
      setFullName(profile?.full_name || "");
      setPhone(profile?.phone || "");
      setEmergencyContact(profile?.emergencyContact || "");
      setPreferencesText(Array.isArray(profile?.preferences) ? profile.preferences.join(", ") : "");

      const privacy = profile?.privacySettings;
      if (privacy) {
        setProfileVisibility(privacy.profileVisibility === "private" ? "private" : "public");
        setShareLocation(Boolean(privacy.shareLocation));
        setTwoFactorEnabled(Boolean(privacy.twoFactorEnabled));
      }

      setPaymentMethods((paymentRes?.data?.methods || []) as PaymentMethod[]);
      setSavedPlaces((savedRes?.data?.places || []) as SavedPlace[]);
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const saveProfile = async () => {
    try {
      const preferences = preferencesText
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);

      await touristAPI.updateProfile({
        fullName,
        phone,
        emergencyContact,
        preferences,
      });

      Alert.alert("Success", "Profile updated successfully");
    } catch (error: any) {
      Alert.alert("Update Failed", error?.message || "Unable to update profile");
    }
  };

  const addPaymentMethod = async () => {
    if (!paymentLabel || !paymentLast4) {
      Alert.alert("Required", "Payment label and last 4 digits are required");
      return;
    }

    try {
      await touristAPI.addPaymentMethod({
        label: paymentLabel,
        last4: paymentLast4,
        brand: paymentBrand || undefined,
        isDefault: paymentMethods.length === 0,
      });
      setPaymentLabel("");
      setPaymentLast4("");
      setPaymentBrand("");
      await loadData();
    } catch (error: any) {
      Alert.alert("Add Failed", error?.message || "Unable to add payment method");
    }
  };

  const deletePaymentMethod = async (methodId: string) => {
    try {
      await touristAPI.removePaymentMethod(methodId);
      await loadData();
    } catch (error: any) {
      Alert.alert("Delete Failed", error?.message || "Unable to delete payment method");
    }
  };

  const addSavedPlace = async () => {
    if (!savedPlaceName.trim()) {
      Alert.alert("Required", "Place name is required");
      return;
    }

    try {
      await touristAPI.addSavedPlace({
        name: savedPlaceName,
        location: savedPlaceLocation || undefined,
      });
      setSavedPlaceName("");
      setSavedPlaceLocation("");
      await loadData();
    } catch (error: any) {
      Alert.alert("Add Failed", error?.message || "Unable to save place");
    }
  };

  const removeSavedPlace = async (placeId: string) => {
    try {
      await touristAPI.removeSavedPlace(placeId);
      await loadData();
    } catch (error: any) {
      Alert.alert("Delete Failed", error?.message || "Unable to remove saved place");
    }
  };

  const savePrivacy = async () => {
    try {
      await touristAPI.updatePrivacySettings({
        profileVisibility,
        shareLocation,
        twoFactorEnabled,
      });
      Alert.alert("Success", "Privacy and security settings updated");
    } catch (error: any) {
      Alert.alert("Update Failed", error?.message || "Unable to update privacy settings");
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
      <TouristTopBar
        title="Profile Settings"
        subtitle="Manage your account preferences"
        onBack={onBack}
      />

      <View style={styles.tabsRow}>
        {[
          { key: "profile", label: "Profile" },
          { key: "payment", label: "Payment" },
          { key: "saved", label: "Saved" },
          { key: "privacy", label: "Privacy" },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key as SettingsTab)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === "profile" && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Edit Profile</Text>
            <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Full name" />
            <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Phone" />
            <TextInput
              style={styles.input}
              value={emergencyContact}
              onChangeText={setEmergencyContact}
              placeholder="Emergency contact"
            />
            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={preferencesText}
              onChangeText={setPreferencesText}
              placeholder="Preferences (comma separated)"
              multiline
            />
            <TouchableOpacity style={styles.primaryButton} onPress={saveProfile}>
              <Text style={styles.primaryButtonText}>Save Profile</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === "payment" && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Payment Methods</Text>
            {paymentMethods.map((method) => (
              <View key={method.id} style={styles.listItem}>
                <View>
                  <Text style={styles.itemTitle}>{method.label}</Text>
                  <Text style={styles.itemSubtitle}>
                    {method.brand || "Card"} •••• {method.last4} {method.isDefault ? "(Default)" : ""}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => void deletePaymentMethod(method.id)}>
                  <MaterialCommunityIcons name="delete" size={20} color="#DC2626" />
                </TouchableOpacity>
              </View>
            ))}

            <Text style={styles.formTitle}>Add Payment Method</Text>
            <TextInput style={styles.input} value={paymentLabel} onChangeText={setPaymentLabel} placeholder="Label (e.g. Personal Visa)" />
            <TextInput style={styles.input} value={paymentBrand} onChangeText={setPaymentBrand} placeholder="Brand" />
            <TextInput
              style={styles.input}
              value={paymentLast4}
              onChangeText={setPaymentLast4}
              keyboardType="number-pad"
              maxLength={4}
              placeholder="Last 4 digits"
            />
            <TouchableOpacity style={styles.primaryButton} onPress={() => void addPaymentMethod()}>
              <Text style={styles.primaryButtonText}>Add Method</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === "saved" && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Saved Places</Text>
            {savedPlaces.map((place) => (
              <View key={place.id} style={styles.listItem}>
                <View>
                  <Text style={styles.itemTitle}>{place.name}</Text>
                  <Text style={styles.itemSubtitle}>{place.location || "No location"}</Text>
                </View>
                <TouchableOpacity onPress={() => void removeSavedPlace(place.id)}>
                  <MaterialCommunityIcons name="delete" size={20} color="#DC2626" />
                </TouchableOpacity>
              </View>
            ))}

            <Text style={styles.formTitle}>Add New Place</Text>
            <TextInput style={styles.input} value={savedPlaceName} onChangeText={setSavedPlaceName} placeholder="Place name" />
            <TextInput style={styles.input} value={savedPlaceLocation} onChangeText={setSavedPlaceLocation} placeholder="Location" />
            <TouchableOpacity style={styles.primaryButton} onPress={() => void addSavedPlace()}>
              <Text style={styles.primaryButtonText}>Save Place</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === "privacy" && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Privacy & Security</Text>

            <View style={styles.toggleRow}>
              <View>
                <Text style={styles.itemTitle}>Private Profile</Text>
                <Text style={styles.itemSubtitle}>Hide your profile from public discovery</Text>
              </View>
              <Switch
                value={profileVisibility === "private"}
                onValueChange={(value) => setProfileVisibility(value ? "private" : "public")}
              />
            </View>

            <View style={styles.toggleRow}>
              <View>
                <Text style={styles.itemTitle}>Share Location</Text>
                <Text style={styles.itemSubtitle}>Allow location to improve recommendations</Text>
              </View>
              <Switch value={shareLocation} onValueChange={setShareLocation} />
            </View>

            <View style={styles.toggleRow}>
              <View>
                <Text style={styles.itemTitle}>Two-Factor Authentication</Text>
                <Text style={styles.itemSubtitle}>Add extra sign-in security</Text>
              </View>
              <Switch value={twoFactorEnabled} onValueChange={setTwoFactorEnabled} />
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={savePrivacy}>
              <Text style={styles.primaryButtonText}>Save Privacy Settings</Text>
            </TouchableOpacity>
          </View>
        )}
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
  headerTitle: { color: "#fff", fontSize: 28, fontWeight: "700", marginBottom: 6 },
  headerSubtitle: { color: "rgba(255, 255, 255, 0.9)", fontSize: 14 },
  tabsRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#F3F4F6",
  },
  activeTab: { backgroundColor: "#1B73E8" },
  tabText: { color: "#6B7280", fontSize: 13, fontWeight: "600" },
  activeTabText: { color: "#fff" },
  content: { flex: 1, padding: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#111827", marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    color: "#111827",
    backgroundColor: "#fff",
  },
  multilineInput: { minHeight: 84, textAlignVertical: "top" },
  primaryButton: {
    marginTop: 8,
    backgroundColor: "#1B73E8",
    borderRadius: 12,
    alignItems: "center",
    paddingVertical: 12,
  },
  primaryButtonText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  listItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  itemTitle: { fontSize: 14, fontWeight: "600", color: "#111827" },
  itemSubtitle: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  formTitle: { fontSize: 14, fontWeight: "700", color: "#111827", marginTop: 14, marginBottom: 8 },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
});

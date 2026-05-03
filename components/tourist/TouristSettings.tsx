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
import { touristAPI } from "../../constants/api";
import { TouristTopBar } from "../common/TouristTopBar";

interface TouristSettingsProps {
  onBack: () => void;
  initialTab?: SettingsTab;
}

type SettingsTab = "profile" | "payment" | "saved" | "privacy";

interface PaymentMethod {
  id: string;
  label: string;
}

interface SavedPlace {
  id: string;
  name: string;
  location?: string;
  notes?: string;
}

interface SavedCollection {
  id: string;
  title: string;
  image: string;
}

export function TouristSettings({ onBack, initialTab = "profile" }: TouristSettingsProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const [loading, setLoading] = useState(true);
  const tabTitles: Record<SettingsTab, string> = {
    profile: "Profile Settings",
    payment: "Payment Methods",
    saved: "Saved Places",
    privacy: "Privacy & Security",
  };

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [preferencesText, setPreferencesText] = useState("");
  const [displayPhoto, setDisplayPhoto] = useState("");

  const [paymentMethods] = useState<PaymentMethod[]>([
    { id: "cash", label: "Cash" },
    { id: "qr", label: "QR Scan" },
  ]);

  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [savedCollections, setSavedCollections] = useState<SavedCollection[]>([
    {
      id: "dogs",
      title: "Dogs",
      image: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=500&q=80",
    },
    {
      id: "coffee",
      title: "Coffee Spots",
      image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500&q=80",
    },
  ]);

  const [savedPlaceName, setSavedPlaceName] = useState("");
  const [savedPlaceLocation, setSavedPlaceLocation] = useState("");
  const [collectionTitle, setCollectionTitle] = useState("");
  const [collectionImage, setCollectionImage] = useState("");

  const [profileVisibility, setProfileVisibility] = useState<"public" | "private">("public");
  const [shareLocation, setShareLocation] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [profileRes, savedRes] = await Promise.all([
        touristAPI.getProfile(),
        touristAPI.getSavedPlaces(),
      ]);

      const profile = profileRes?.data;
      setFullName(profile?.full_name || "");
      setPhone(profile?.phone || "");
      setEmergencyContact(profile?.emergencyContact || "");
      setPreferencesText(Array.isArray(profile?.preferences) ? profile.preferences.join(", ") : "");
      setDisplayPhoto(profile?.photo || "");

      const privacy = profile?.privacySettings;
      if (privacy) {
        setProfileVisibility(privacy.profileVisibility === "private" ? "private" : "public");
        setShareLocation(Boolean(privacy.shareLocation));
        setTwoFactorEnabled(Boolean(privacy.twoFactorEnabled));
      }

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

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

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

  const pickProfilePhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      setDisplayPhoto(result.assets[0].uri);
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

  const createCollection = () => {
    if (!collectionTitle.trim() || !collectionImage.trim()) {
      Alert.alert("Required", "Collection title and image URL are required.");
      return;
    }

    setSavedCollections((current) => [
      {
        id: `collection-${Date.now()}`,
        title: collectionTitle.trim(),
        image: collectionImage.trim(),
      },
      ...current,
    ]);
    setCollectionTitle("");
    setCollectionImage("");
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
        title={tabTitles[activeTab]}
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
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === "profile" && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Edit Profile</Text>
            <View style={styles.avatarRow}>
              <Image
                source={{
                  uri:
                    displayPhoto ||
                    "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=300&q=80",
                }}
                style={styles.avatar}
              />
              <TouchableOpacity style={styles.secondaryButton} onPress={() => void pickProfilePhoto()}>
                <Text style={styles.secondaryButtonText}>Change Display Picture</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Full name" />
            <Text style={styles.inputLabel}>Phone</Text>
            <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Phone" />
            <Text style={styles.inputLabel}>Emergency Contact</Text>
            <TextInput style={styles.input} value={emergencyContact} onChangeText={setEmergencyContact} placeholder="Emergency contact" />
            <Text style={styles.inputLabel}>Preferences</Text>
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
                  <Text style={styles.itemSubtitle}>Enabled</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === "saved" && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Saved Places</Text>
            {savedPlaces.map((place) => (
              <View key={place.id} style={styles.listItem}>
                <Image
                  source={{ uri: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=300&q=80" }}
                  style={styles.savedImage}
                />
                <View style={styles.savedPlaceInfo}>
                  <Text style={styles.itemTitle}>{place.name}</Text>
                  <Text style={styles.itemSubtitle}>{place.location || "No location"}</Text>
                </View>
                <TouchableOpacity onPress={() => void removeSavedPlace(place.id)}>
                  <MaterialCommunityIcons name="delete" size={20} color="#DC2626" />
                </TouchableOpacity>
              </View>
            ))}

            <Text style={styles.formTitle}>Add New Place</Text>
            <Text style={styles.inputLabel}>Place Name</Text>
            <TextInput style={styles.input} value={savedPlaceName} onChangeText={setSavedPlaceName} placeholder="Place name" />
            <Text style={styles.inputLabel}>Location</Text>
            <TextInput style={styles.input} value={savedPlaceLocation} onChangeText={setSavedPlaceLocation} placeholder="Location" />
            <TouchableOpacity style={styles.primaryButton} onPress={() => void addSavedPlace()}>
              <Text style={styles.primaryButtonText}>Save Place</Text>
            </TouchableOpacity>

            <Text style={styles.formTitle}>Collections</Text>
            <View style={styles.collectionsGrid}>
              {savedCollections.map((collection) => (
                <View key={collection.id} style={styles.collectionTile}>
                  <Image source={{ uri: collection.image }} style={styles.collectionImage} />
                  <View style={styles.collectionOverlay}>
                    <Text style={styles.collectionTitle}>{collection.title}</Text>
                  </View>
                </View>
              ))}
            </View>

            <Text style={styles.inputLabel}>Collection Title</Text>
            <TextInput style={styles.input} value={collectionTitle} onChangeText={setCollectionTitle} placeholder="e.g. Day Trips" />
            <Text style={styles.inputLabel}>Collection Cover Image URL</Text>
            <TextInput style={styles.input} value={collectionImage} onChangeText={setCollectionImage} placeholder="https://..." />
            <TouchableOpacity style={styles.primaryButton} onPress={createCollection}>
              <Text style={styles.primaryButtonText}>Create Collection</Text>
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
              <Switch value={profileVisibility === "private"} onValueChange={(value) => setProfileVisibility(value ? "private" : "public")} />
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
  avatarRow: { alignItems: "center", marginBottom: 14 },
  avatar: { width: 96, height: 96, borderRadius: 48, marginBottom: 10, backgroundColor: "#E5E7EB" },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#EFF6FF",
  },
  secondaryButtonText: { color: "#1D4ED8", fontSize: 13, fontWeight: "600" },
  inputLabel: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6, marginTop: 2 },
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
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  savedImage: { width: 52, height: 52, borderRadius: 10, marginRight: 10 },
  savedPlaceInfo: { flex: 1 },
  itemTitle: { fontSize: 14, fontWeight: "600", color: "#111827" },
  itemSubtitle: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  formTitle: { fontSize: 14, fontWeight: "700", color: "#111827", marginTop: 14, marginBottom: 8 },
  collectionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 10 },
  collectionTile: {
    width: "48%",
    aspectRatio: 1,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#E5E7EB",
  },
  collectionImage: { width: "100%", height: "100%" },
  collectionOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 8,
    backgroundColor: "rgba(0,0,0,0.32)",
  },
  collectionTitle: { color: "#fff", fontSize: 15, fontWeight: "700" },
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

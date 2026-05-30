import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { authAPI, touristAPI } from "../../constants/api";
import { TouristTopBar } from "../common/TouristTopBar";

interface TouristSettingsProps {
  onBack: () => void;
  initialTab?: SettingsTab;
}

type SettingsTab = "profile" | "payment" | "saved" | "privacy";

interface PaymentMethodRecord {
  id: string;
  label: string;
  brand?: string;
  last4?: string;
  isDefault?: boolean;
}

interface SavedPlace {
  id: string;
  name: string;
  location?: string;
}

interface SavedCollection {
  id: string;
  title: string;
  itemsCount: number;
  createdAt: string;
}

type ProfileFieldKey = "fullName" | "username" | "phone" | "emergencyContact" | "preferences";

const PAYMENT_OPTIONS = [
  { key: "cash", label: "Cash", helper: "Pay directly during booking or arrival." },
  { key: "qr_scan", label: "QR Scan", helper: "Use QR-based payment when supported." },
];

const TOURIST_PREFERENCES = [
  "Adventure",
  "Cultural",
  "Nature",
  "Historical",
  "Beach",
  "Mountain",
];

const COLLECTION_STORAGE_PREFIX = "tourist_saved_collections";
const PHOTO_STORAGE_PREFIX = "tourist_profile_photo";

const getCollectionsStorageKey = (userId: number | null) =>
  `${COLLECTION_STORAGE_PREFIX}_${userId ?? "guest"}`;

const getPhotoStorageKey = (userId: number | null) =>
  `${PHOTO_STORAGE_PREFIX}_${userId ?? "guest"}`;

const getWebStorage = () =>
  typeof window !== "undefined" && window.localStorage ? window.localStorage : null;

const parseSavedCollections = (value: string | null): SavedCollection[] => {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const showSuccessMessage = (title: string, message: string) => {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.alert(`${title}\n\n${message}`);
    return;
  }

  Alert.alert(title, message);
};

export function TouristSettings({ onBack, initialTab = "profile" }: TouristSettingsProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [processingPaymentId, setProcessingPaymentId] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [preferences, setPreferences] = useState<string[]>([]);
  const [displayPhoto, setDisplayPhoto] = useState("");
  const [editingFields, setEditingFields] = useState<Record<ProfileFieldKey, boolean>>({
    fullName: false,
    username: false,
    phone: false,
    emergencyContact: false,
    preferences: false,
  });

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodRecord[]>([]);
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [savedCollections, setSavedCollections] = useState<SavedCollection[]>([]);
  const [collectionName, setCollectionName] = useState("");
  const [showCollectionCreator, setShowCollectionCreator] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);

  const [profileVisibility, setProfileVisibility] = useState<"public" | "private">("public");
  const [shareLocation, setShareLocation] = useState(true);

  const tabTitles: Record<SettingsTab, string> = {
    profile: "Profile Settings",
    payment: "Payment Methods",
    saved: "Saved Collections",
    privacy: "Privacy & Security",
  };

  const collectionStorageKey = useMemo(() => getCollectionsStorageKey(userId), [userId]);
  const photoStorageKey = useMemo(() => getPhotoStorageKey(userId), [userId]);

  const readCollections = async (storageKey: string) => {
    try {
      const storedValue = await AsyncStorage.getItem(storageKey);
      if (storedValue) {
        return parseSavedCollections(storedValue);
      }
    } catch {
      // Fall through to web storage fallback.
    }

    return parseSavedCollections(getWebStorage()?.getItem(storageKey) ?? null);
  };

  const persistCollections = async (storageKey: string, collections: SavedCollection[]) => {
    const serialized = JSON.stringify(collections);

    try {
      await AsyncStorage.setItem(storageKey, serialized);
    } catch {
      getWebStorage()?.setItem(storageKey, serialized);
    }
  };

  const readPhoto = async (storageKey: string) => {
    try {
      const storedValue = await AsyncStorage.getItem(storageKey);
      if (storedValue) {
        return storedValue;
      }
    } catch {
      // Fall through to web storage fallback.
    }

    return getWebStorage()?.getItem(storageKey) ?? "";
  };

  const persistPhoto = async (storageKey: string, photoUri: string) => {
    try {
      await AsyncStorage.setItem(storageKey, photoUri);
    } catch {
      getWebStorage()?.setItem(storageKey, photoUri);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const currentUser = await authAPI.getCurrentUser();
      const [profileResult, paymentResult, savedResult] = await Promise.allSettled([
        touristAPI.getProfile(),
        touristAPI.getPaymentMethods(),
        touristAPI.getSavedPlaces(),
      ]);

      const profileRes = profileResult.status === "fulfilled" ? profileResult.value : null;
      const paymentRes = paymentResult.status === "fulfilled" ? paymentResult.value : null;
      const savedRes = savedResult.status === "fulfilled" ? savedResult.value : null;

      const profile = profileRes?.data || {};
      const paymentData = paymentRes?.data || {};
      const savedData = savedRes?.data || {};
      const resolvedUserId = Number(currentUser?.user_id || currentUser?.id || profile?.user_id || 0) || null;
      const collections = await readCollections(getCollectionsStorageKey(resolvedUserId));
      const backendPhoto = String(profile?.profile_photo || currentUser?.profile_photo || "").trim();
      const photoUri = (await readPhoto(getPhotoStorageKey(resolvedUserId))) || backendPhoto;

      setUserId(resolvedUserId);
      setFullName(String(profile?.full_name || currentUser?.fullName || currentUser?.full_name || "").trim());
      setUsername(String(profile?.username || currentUser?.username || "").trim());
      setEmail(String(profile?.email || currentUser?.email || "").trim());
      setPhone(String(profile?.phone || currentUser?.phone || "").trim());
      setEmergencyContact(String(profile?.emergencyContact || "").trim());
      setPreferences(Array.isArray(profile?.preferences) ? profile.preferences : []);
      setDisplayPhoto(photoUri);
      setEditingFields({
        fullName: false,
        username: false,
        phone: false,
        emergencyContact: false,
        preferences: false,
      });

      const privacy = profile?.privacySettings || {};
      setProfileVisibility(privacy?.profileVisibility === "private" ? "private" : "public");
      setShareLocation(Boolean(privacy?.shareLocation ?? true));

      setPaymentMethods(Array.isArray(paymentData?.methods) ? paymentData.methods : []);
      setSavedPlaces(Array.isArray(savedData?.places) ? savedData.places : []);
      setSavedCollections(collections);

      if (profileResult.status === "rejected") {
        console.error("Tourist settings profile load failed:", profileResult.reason);
      }
      if (paymentResult.status === "rejected") {
        console.error("Tourist settings payment load failed:", paymentResult.reason);
      }
      if (savedResult.status === "rejected") {
        console.error("Tourist settings saved places load failed:", savedResult.reason);
      }
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    // `loadData` reads current auth state and is intentionally run on mount for this screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const response = await touristAPI.updateProfile({
        fullName: fullName.trim(),
        username: username.trim(),
        phone: phone.trim(),
        emergencyContact: emergencyContact.trim(),
        preferences,
      });

      const updatedProfile = response?.data || {};
      setFullName(String(updatedProfile?.full_name || fullName).trim());
      setUsername(String(updatedProfile?.username || username).trim());
      setPhone(String(updatedProfile?.phone || phone).trim());
      setEmergencyContact(String(updatedProfile?.emergencyContact || emergencyContact).trim());
      setPreferences(Array.isArray(updatedProfile?.preferences) ? updatedProfile.preferences : preferences);
      setEditingFields({
        fullName: false,
        username: false,
        phone: false,
        emergencyContact: false,
        preferences: false,
      });

      showSuccessMessage("Changes Saved", "Your profile changes have been saved.");
    } catch (error: any) {
      Alert.alert("Update Failed", error?.message || "Unable to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const startEditingField = (field: ProfileFieldKey) => {
    setEditingFields((current) => ({ ...current, [field]: true }));
  };

  const stopEditingField = (field: ProfileFieldKey) => {
    setEditingFields((current) => ({ ...current, [field]: false }));
  };

  const togglePreference = (preference: string) => {
    setPreferences((current) =>
      current.includes(preference)
        ? current.filter((item) => item !== preference)
        : [...current, preference]
    );
  };

  const pickProfilePhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: Platform.OS === "web",
    });

    if (!result.canceled && result.assets.length > 0) {
      const selectedAsset = result.assets[0];
      const photoUri =
        Platform.OS === "web" && selectedAsset.base64
          ? `data:${selectedAsset.mimeType || "image/jpeg"};base64,${selectedAsset.base64}`
          : selectedAsset.uri;
      setDisplayPhoto(photoUri);
      await persistPhoto(photoStorageKey, photoUri);
    }
  };

  const removeSavedPlace = async (placeId: string) => {
    try {
      await touristAPI.removeSavedPlace(placeId);
      await loadData();
      showSuccessMessage("Changes Saved", "The saved place has been removed.");
    } catch (error: any) {
      Alert.alert("Delete Failed", error?.message || "Unable to remove saved place.");
    }
  };

  const createCollection = async () => {
    const title = collectionName.trim();
    if (!title) {
      Alert.alert("Required", "Please name your collection.");
      return;
    }

    const nextCollections = [
      {
        id: `collection_${Date.now()}`,
        title,
        itemsCount: 0,
        createdAt: new Date().toISOString(),
      },
      ...savedCollections,
    ];

    setSavedCollections(nextCollections);
    setSelectedCollectionId(nextCollections[0].id);
    setCollectionName("");
    setShowCollectionCreator(false);
    await persistCollections(collectionStorageKey, nextCollections);
    showSuccessMessage("Changes Saved", "Your new collection has been created.");
  };

  const selectedCollection =
    savedCollections.find((collection) => collection.id === selectedCollectionId) || null;

  const togglePaymentMethod = async (optionLabel: string) => {
    const existingMethod = paymentMethods.find(
      (method) => String(method.label || "").toLowerCase() === optionLabel.toLowerCase()
    );

    setProcessingPaymentId(optionLabel);
    try {
      if (existingMethod?.id) {
        await touristAPI.removePaymentMethod(existingMethod.id);
      } else {
        await touristAPI.addPaymentMethod({
          label: optionLabel,
          brand: "TourMate",
          last4: "0000",
          isDefault: paymentMethods.length === 0,
        });
      }

      await loadData();
      showSuccessMessage(
        "Changes Saved",
        existingMethod
          ? `${optionLabel} has been disabled.`
          : `${optionLabel} has been enabled.`
      );
    } catch (error: any) {
      Alert.alert(
        "Payment Update Failed",
        error?.message || "Unable to update this payment option."
      );
    } finally {
      setProcessingPaymentId(null);
    }
  };

  const savePrivacy = async () => {
    setSavingPrivacy(true);
    try {
      const response = await touristAPI.updatePrivacySettings({
        profileVisibility,
        shareLocation,
      });
      const updatedPrivacy = response?.data?.privacySettings || response?.privacySettings;
      if (updatedPrivacy) {
        setProfileVisibility(
          updatedPrivacy.profileVisibility === "private" ? "private" : "public"
        );
        setShareLocation(Boolean(updatedPrivacy.shareLocation ?? true));
      }
      showSuccessMessage("Changes Saved", "Your privacy settings have been saved.");
    } catch (error: any) {
      Alert.alert("Update Failed", error?.message || "Unable to update privacy settings.");
    } finally {
      setSavingPrivacy(false);
    }
  };

  const handleShareLocationToggle = (nextValue: boolean) => {
    if (nextValue) {
      setShareLocation(true);
      return;
    }

    if (Platform.OS === "web") {
      const confirmed =
        typeof window !== "undefined"
          ? window.confirm(
              "Turning off location sharing can reduce nearby recommendations and location-based safety features. Disable it?"
            )
          : false;

      if (confirmed) {
        setShareLocation(false);
      }
      return;
    }

    Alert.alert(
      "Disable Location Sharing?",
      "Turning this off can reduce nearby recommendations and location-based safety features. Are you sure?",
      [
        { text: "Keep Enabled", style: "cancel" },
        {
          text: "Disable",
          style: "destructive",
          onPress: () => setShareLocation(false),
        },
      ]
    );
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

            <View style={styles.avatarRow}>
              {displayPhoto ? (
                <Image source={{ uri: displayPhoto }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <MaterialCommunityIcons name="account" size={42} color="#94A3B8" />
                </View>
              )}
              <TouchableOpacity style={styles.secondaryButton} onPress={() => void pickProfilePhoto()}>
                <Text style={styles.secondaryButtonText}>Change Display Picture</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.helperText}>
              Your registered profile photo appears here automatically. Changes made from this settings screen still stay on this device for now.
            </Text>

            <Text style={styles.inputLabel}>Email</Text>
            <View style={styles.readonlyInput}>
              <Text style={styles.readonlyInputText}>{email || "Email not available"}</Text>
            </View>

            <Text style={styles.inputLabel}>Full Name</Text>
            <View style={styles.fieldCard}>
              <View style={styles.fieldCardHeader}>
                <Text style={styles.fieldValue}>{fullName || "Full name not set"}</Text>
                <TouchableOpacity style={styles.fieldEditButton} onPress={() => startEditingField("fullName")}>
                  <MaterialCommunityIcons name="pencil-outline" size={16} color="#1B73E8" />
                </TouchableOpacity>
              </View>
              {editingFields.fullName ? (
                <View style={styles.fieldEditor}>
                  <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Full name" />
                  <TouchableOpacity style={styles.inlineDoneButton} onPress={() => stopEditingField("fullName")}>
                    <Text style={styles.inlineDoneText}>Done</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>

            <Text style={styles.inputLabel}>Username</Text>
            <View style={styles.fieldCard}>
              <View style={styles.fieldCardHeader}>
                <Text style={styles.fieldValue}>{username || "Username not set"}</Text>
                <TouchableOpacity style={styles.fieldEditButton} onPress={() => startEditingField("username")}>
                  <MaterialCommunityIcons name="pencil-outline" size={16} color="#1B73E8" />
                </TouchableOpacity>
              </View>
              {editingFields.username ? (
                <View style={styles.fieldEditor}>
                  <TextInput
                    style={styles.input}
                    value={username}
                    onChangeText={setUsername}
                    placeholder="Username"
                    autoCapitalize="none"
                  />
                  <TouchableOpacity style={styles.inlineDoneButton} onPress={() => stopEditingField("username")}>
                    <Text style={styles.inlineDoneText}>Done</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>

            <Text style={styles.inputLabel}>Phone</Text>
            <View style={styles.fieldCard}>
              <View style={styles.fieldCardHeader}>
                <Text style={styles.fieldValue}>{phone || "Phone not set"}</Text>
                <TouchableOpacity style={styles.fieldEditButton} onPress={() => startEditingField("phone")}>
                  <MaterialCommunityIcons name="pencil-outline" size={16} color="#1B73E8" />
                </TouchableOpacity>
              </View>
              {editingFields.phone ? (
                <View style={styles.fieldEditor}>
                  <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Phone" keyboardType="phone-pad" />
                  <TouchableOpacity style={styles.inlineDoneButton} onPress={() => stopEditingField("phone")}>
                    <Text style={styles.inlineDoneText}>Done</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>

            <Text style={styles.inputLabel}>Emergency Contact</Text>
            <View style={styles.fieldCard}>
              <View style={styles.fieldCardHeader}>
                <Text style={styles.fieldValue}>{emergencyContact || "Emergency contact not set"}</Text>
                <TouchableOpacity style={styles.fieldEditButton} onPress={() => startEditingField("emergencyContact")}>
                  <MaterialCommunityIcons name="pencil-outline" size={16} color="#1B73E8" />
                </TouchableOpacity>
              </View>
              {editingFields.emergencyContact ? (
                <View style={styles.fieldEditor}>
                  <TextInput
                    style={styles.input}
                    value={emergencyContact}
                    onChangeText={setEmergencyContact}
                    placeholder="Emergency contact"
                    keyboardType="phone-pad"
                  />
                  <TouchableOpacity style={styles.inlineDoneButton} onPress={() => stopEditingField("emergencyContact")}>
                    <Text style={styles.inlineDoneText}>Done</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>

            <Text style={styles.inputLabel}>Preferences</Text>
            <View style={styles.fieldCard}>
              <View style={styles.fieldCardHeader}>
                <Text style={styles.fieldValue}>
                  {preferences.length > 0 ? preferences.join(", ") : "No travel preferences selected"}
                </Text>
                <TouchableOpacity style={styles.fieldEditButton} onPress={() => startEditingField("preferences")}>
                  <MaterialCommunityIcons name="pencil-outline" size={16} color="#1B73E8" />
                </TouchableOpacity>
              </View>
              {editingFields.preferences ? (
                <View style={styles.fieldEditor}>
                  <View style={styles.preferencePillsWrap}>
                    {TOURIST_PREFERENCES.map((preference) => {
                      const selected = preferences.includes(preference);
                      return (
                        <TouchableOpacity
                          key={preference}
                          style={[styles.preferencePill, selected && styles.preferencePillSelected]}
                          onPress={() => togglePreference(preference)}
                        >
                          <Text
                            style={[
                              styles.preferencePillText,
                              selected && styles.preferencePillTextSelected,
                            ]}
                          >
                            {preference}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <TouchableOpacity style={styles.inlineDoneButton} onPress={() => stopEditingField("preferences")}>
                    <Text style={styles.inlineDoneText}>Done</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, savingProfile && styles.buttonDisabled]}
              onPress={() => void saveProfile()}
              disabled={savingProfile}
            >
              {savingProfile ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Save Profile</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {activeTab === "payment" && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Payment Methods</Text>
            {PAYMENT_OPTIONS.map((option) => {
              const enabledMethod = paymentMethods.find(
                (method) => String(method.label || "").toLowerCase() === option.label.toLowerCase()
              );
              const isProcessing = processingPaymentId === option.label;

              return (
                <View key={option.key} style={styles.listItem}>
                  <View style={styles.listItemContent}>
                    <Text style={styles.itemTitle}>{option.label}</Text>
                    <Text style={styles.itemSubtitle}>
                      {enabledMethod ? "Enabled for your tourist account" : option.helper}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      enabledMethod ? styles.disableButton : styles.enableButton,
                    ]}
                    onPress={() => void togglePaymentMethod(option.label)}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <ActivityIndicator
                        size="small"
                        color={enabledMethod ? "#DC2626" : "#1B73E8"}
                      />
                    ) : (
                      <Text
                        style={[
                          styles.actionButtonText,
                          enabledMethod ? styles.disableButtonText : styles.enableButtonText,
                        ]}
                      >
                        {enabledMethod ? "Disable" : "Enable"}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {activeTab === "saved" && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Saved Collections</Text>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => setShowCollectionCreator((current) => !current)}
              >
                <MaterialCommunityIcons name="plus" size={18} color="#1B73E8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.helperTextLeft}>
              Create folders for favorite destinations or guides so you can organize them later.
            </Text>

            {showCollectionCreator ? (
              <View style={styles.collectionCreator}>
                <Text style={styles.inputLabel}>Collection Name</Text>
                <TextInput
                  style={styles.input}
                  value={collectionName}
                  onChangeText={setCollectionName}
                  placeholder="e.g. Pokhara Trip Ideas"
                />
                <TouchableOpacity style={styles.primaryButton} onPress={() => void createCollection()}>
                  <Text style={styles.primaryButtonText}>Create Collection</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <View style={styles.collectionsGrid}>
              {savedCollections.map((collection) => (
                <TouchableOpacity
                  key={collection.id}
                  style={[
                    styles.collectionTile,
                    selectedCollectionId === collection.id && styles.collectionTileActive,
                  ]}
                  onPress={() => setSelectedCollectionId(collection.id)}
                  activeOpacity={0.85}
                >
                  <View style={styles.collectionIconWrap}>
                    <MaterialCommunityIcons name="folder" size={26} color="#1B73E8" />
                  </View>
                  <Text style={styles.collectionTitle}>{collection.title}</Text>
                  <Text style={styles.collectionMeta}>{collection.itemsCount} saved items</Text>
                </TouchableOpacity>
              ))}
              {savedCollections.length === 0 ? (
                <View style={styles.emptyStateCard}>
                  <MaterialCommunityIcons name="folder-open-outline" size={28} color="#94A3B8" />
                  <Text style={styles.emptyStateTitle}>No collections yet</Text>
                  <Text style={styles.emptyStateText}>
                    Use the plus button to create your first folder.
                  </Text>
                </View>
              ) : null}
            </View>

            {selectedCollection ? (
              <View style={styles.collectionDetailCard}>
                <View style={styles.sectionHeader}>
                  <View>
                    <Text style={styles.formTitle}>{selectedCollection.title}</Text>
                    <Text style={styles.helperTextLeft}>
                      Created on {new Date(selectedCollection.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedCollectionId(null)}>
                    <MaterialCommunityIcons name="close" size={20} color="#6B7280" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.itemSubtitle}>
                  {selectedCollection.itemsCount > 0
                    ? `${selectedCollection.itemsCount} saved items in this collection.`
                    : "This collection is empty for now. You can start organizing saved places and guides here next."}
                </Text>
              </View>
            ) : null}

            <Text style={styles.formTitle}>Saved Places</Text>
            {savedPlaces.length === 0 ? (
              <Text style={styles.helperTextLeft}>
                You haven&apos;t saved any places yet.
              </Text>
            ) : null}
            {savedPlaces.map((place) => (
              <View key={place.id} style={styles.listItem}>
                <View style={styles.listItemContent}>
                  <Text style={styles.itemTitle}>{place.name}</Text>
                  <Text style={styles.itemSubtitle}>{place.location || "Location not set"}</Text>
                </View>
                <TouchableOpacity onPress={() => void removeSavedPlace(place.id)}>
                  <MaterialCommunityIcons name="delete-outline" size={22} color="#DC2626" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {activeTab === "privacy" && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Privacy & Security</Text>

            <View style={styles.toggleRow}>
              <View style={styles.toggleTextWrap}>
                <Text style={styles.itemTitle}>Private Profile</Text>
                <Text style={styles.itemSubtitle}>Hide your profile from public discovery</Text>
              </View>
              <Switch
                value={profileVisibility === "private"}
                onValueChange={(value) => setProfileVisibility(value ? "private" : "public")}
              />
            </View>

            <View style={styles.toggleRow}>
              <View style={styles.toggleTextWrap}>
                <Text style={styles.itemTitle}>Share Location</Text>
                <Text style={styles.itemSubtitle}>Allow location to improve recommendations</Text>
              </View>
              <Switch value={shareLocation} onValueChange={handleShareLocationToggle} />
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, savingPrivacy && styles.buttonDisabled]}
              onPress={() => void savePrivacy()}
              disabled={savingPrivacy}
            >
              {savingPrivacy ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Save Privacy Settings</Text>
              )}
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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#111827", marginBottom: 12 },
  avatarRow: { alignItems: "center", marginBottom: 14 },
  avatar: { width: 96, height: 96, borderRadius: 48, marginBottom: 10, backgroundColor: "#E5E7EB" },
  avatarPlaceholder: { alignItems: "center", justifyContent: "center" },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#EFF6FF",
  },
  secondaryButtonText: { color: "#1D4ED8", fontSize: 13, fontWeight: "600" },
  helperText: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 12,
  },
  helperTextLeft: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 12,
  },
  fieldCard: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "#FFFFFF",
  },
  fieldCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  fieldValue: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: "#111827",
  },
  fieldEditButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFF6FF",
  },
  fieldEditor: {
    marginTop: 12,
  },
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
  readonlyInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 10,
    backgroundColor: "#F8FAFC",
  },
  readonlyInputText: {
    color: "#64748B",
    fontSize: 14,
  },
  multilineInput: { minHeight: 84, textAlignVertical: "top" },
  inlineDoneButton: {
    alignSelf: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
  },
  inlineDoneText: {
    color: "#1D4ED8",
    fontSize: 12,
    fontWeight: "700",
  },
  primaryButton: {
    marginTop: 8,
    backgroundColor: "#1B73E8",
    borderRadius: 12,
    alignItems: "center",
    paddingVertical: 12,
  },
  buttonDisabled: {
    opacity: 0.7,
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
    gap: 12,
  },
  listItemContent: {
    flex: 1,
  },
  itemTitle: { fontSize: 14, fontWeight: "600", color: "#111827" },
  itemSubtitle: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  actionButton: {
    minWidth: 84,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  enableButton: {
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
  },
  disableButton: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: "700",
  },
  enableButtonText: {
    color: "#1D4ED8",
  },
  disableButtonText: {
    color: "#DC2626",
  },
  formTitle: { fontSize: 14, fontWeight: "700", color: "#111827", marginTop: 14, marginBottom: 8 },
  collectionCreator: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    backgroundColor: "#F8FAFC",
  },
  collectionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 10,
  },
  collectionTile: {
    width: "48%",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 14,
    backgroundColor: "#FFFFFF",
  },
  collectionTileActive: {
    borderColor: "#1B73E8",
    backgroundColor: "#EFF6FF",
  },
  collectionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFF6FF",
    marginBottom: 10,
  },
  collectionTitle: { color: "#111827", fontSize: 15, fontWeight: "700", marginBottom: 4 },
  collectionMeta: { color: "#6B7280", fontSize: 12 },
  collectionDetailCard: {
    marginBottom: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#DBEAFE",
    backgroundColor: "#F8FAFC",
    padding: 14,
  },
  emptyStateCard: {
    width: "100%",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
    padding: 20,
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  emptyStateTitle: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  emptyStateText: {
    marginTop: 4,
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
  },
  preferencePillsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  preferencePill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#FFFFFF",
  },
  preferencePillSelected: {
    borderColor: "#1B73E8",
    backgroundColor: "#DBEAFE",
  },
  preferencePillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4B5563",
  },
  preferencePillTextSelected: {
    color: "#1D4ED8",
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    gap: 12,
  },
  toggleTextWrap: {
    flex: 1,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFF6FF",
  },
});

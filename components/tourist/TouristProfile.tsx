import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { authAPI, touristAPI } from "../../constants/api";
import { TouristTopBar } from "../common/TouristTopBar";

interface TouristProfileProps {
  onLogout: () => void;
  onBack: () => void;
  onNavigate?: (screen: string, data?: any) => void;
}

interface TouristProfileState {
  fullName: string;
  email: string;
  phone: string;
  role: string;
  location: string;
  isVerified: boolean;
  membershipLabel: string;
}

interface TouristStatsState {
  trips: number;
  reviews: number;
  saved: number;
}

const DEFAULT_PROFILE: TouristProfileState = {
  fullName: "TourMate User",
  email: "Email not available",
  phone: "Phone not set",
  role: "Tourist",
  location: "Location not set",
  isVerified: true,
  membershipLabel: "",
};

const PHOTO_STORAGE_PREFIX = "tourist_profile_photo";

const getPhotoStorageKey = (userId: number | null) =>
  `${PHOTO_STORAGE_PREFIX}_${userId ?? "guest"}`;

const getWebStorage = () =>
  typeof window !== "undefined" && window.localStorage ? window.localStorage : null;

export function TouristProfile({ onLogout, onBack, onNavigate }: TouristProfileProps) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<TouristProfileState>(DEFAULT_PROFILE);
  const [displayPhoto, setDisplayPhoto] = useState("");
  const [stats, setStats] = useState<TouristStatsState>({
    trips: 0,
    reviews: 0,
    saved: 0,
  });

  const menuItems = [
    { icon: "cog", label: "Account Settings", color: "#6B7280", screen: "settings-profile" },
    { icon: "bell", label: "Notifications", color: "#6B7280", screen: "notifications" },
    { icon: "credit-card", label: "Payment Methods", color: "#6B7280", screen: "settings-payment" },
    { icon: "heart", label: "Saved Places", color: "#6B7280", screen: "settings-saved" },
    { icon: "shield-check", label: "Privacy & Security", color: "#6B7280", screen: "settings-privacy" },
  ];

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const [currentUser, touristProfileRes, bookingsRes, savedPlacesRes, reviewsRes] =
          await Promise.all([
            authAPI.getCurrentUser(),
            touristAPI.getProfile(),
            touristAPI.getBookings(),
            touristAPI.getSavedPlaces(),
            touristAPI.getReviews(),
          ]);

        const profileData = touristProfileRes?.data || {};
        const resolvedUserId =
          Number(currentUser?.user_id || currentUser?.id || profileData?.user_id || 0) || null;
        const bookings = Array.isArray(bookingsRes?.data?.bookings) ? bookingsRes.data.bookings : [];
        const savedPlaces = Array.isArray(savedPlacesRes?.data?.places)
          ? savedPlacesRes.data.places
          : [];
        const reviews = Array.isArray(reviewsRes?.data?.reviews) ? reviewsRes.data.reviews : [];
        const preferences = Array.isArray(profileData?.preferences) ? profileData.preferences : [];

        const fullName = String(
          profileData?.full_name || currentUser?.fullName || currentUser?.full_name || ""
        ).trim();
        const email = String(currentUser?.email || profileData?.email || "").trim();
        const phone = String(profileData?.phone || currentUser?.phone || "").trim();
        const storedPhoto = await (async () => {
          try {
            const nativeValue = await AsyncStorage.getItem(getPhotoStorageKey(resolvedUserId));
            if (nativeValue) {
              return nativeValue;
            }
          } catch {
            // Fall through to web storage.
          }

          return (
            getWebStorage()?.getItem(getPhotoStorageKey(resolvedUserId)) ??
            String(profileData?.profile_photo || currentUser?.profile_photo || "")
          );
        })();
        const location =
          preferences.length > 0
            ? preferences.join(", ")
            : String(profileData?.location || "").trim() || "Location not set";

        setProfile({
          fullName: fullName || DEFAULT_PROFILE.fullName,
          email: email || DEFAULT_PROFILE.email,
          phone: phone || DEFAULT_PROFILE.phone,
          role: "Tourist",
          location,
          isVerified: true,
          membershipLabel:
            bookings.length >= 10 ? "Gold Member" : bookings.length >= 3 ? "Active Traveler" : "",
        });

        setStats({
          trips: bookings.length,
          reviews: reviews.length,
          saved: savedPlaces.length,
        });
        setDisplayPhoto(storedPhoto);
      } catch (error: any) {
        console.warn("Failed to load tourist profile:", error?.message || error);
        try {
          const currentUser = await authAPI.getCurrentUser();
          const resolvedUserId = Number(currentUser?.user_id || currentUser?.id || 0) || null;
          const storedPhoto = await (async () => {
            try {
              const nativeValue = await AsyncStorage.getItem(getPhotoStorageKey(resolvedUserId));
              if (nativeValue) {
                return nativeValue;
              }
            } catch {
              // Fall through to web storage.
            }

            return (
              getWebStorage()?.getItem(getPhotoStorageKey(resolvedUserId)) ??
              String(currentUser?.profile_photo || "")
            );
          })();
          setProfile({
            fullName: String(currentUser?.fullName || currentUser?.full_name || DEFAULT_PROFILE.fullName),
            email: String(currentUser?.email || DEFAULT_PROFILE.email),
            phone: String(currentUser?.phone || DEFAULT_PROFILE.phone),
            role: "Tourist",
            location: DEFAULT_PROFILE.location,
            isVerified: true,
            membershipLabel: "",
          });
          setDisplayPhoto(storedPhoto);
        } catch {
          setProfile(DEFAULT_PROFILE);
          setDisplayPhoto("");
        }
        setStats({ trips: 0, reviews: 0, saved: 0 });
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, []);

  const handleMenuClick = (label: string, screen: string) => {
    if (onNavigate) {
      onNavigate(screen);
      return;
    }

    Alert.alert("Info", `Opening ${label}...`);
  };

  const handleEditProfile = () => {
    if (onNavigate) {
      onNavigate("settings");
      return;
    }

    Alert.alert("Info", "Opening profile editor...");
  };

  const handleHelpClick = (item: string) => {
    Alert.alert("Info", `Opening ${item}...`);
  };

  const handleLogout = () => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      if (window.confirm("Are you sure you want to logout?")) {
        onLogout();
      }
      return;
    }

    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", onPress: onLogout, style: "destructive" },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1B73E8" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <TouristTopBar
        title="Profile"
        subtitle="Manage your account"
        onBack={onBack}
        containerStyle={{ paddingBottom: 64 }}
      />

      <View style={styles.profileCardContainer}>
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            {displayPhoto ? (
              <Image source={{ uri: displayPhoto }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarContainer}>
                <MaterialCommunityIcons name="account" size={40} color="#fff" />
              </View>
            )}
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{profile.fullName}</Text>
              <Text style={styles.profileRole}>{profile.role}</Text>
              <View style={styles.badgesContainer}>
                {profile.isVerified ? (
                  <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedBadgeText}>Verified</Text>
                  </View>
                ) : null}
                {profile.membershipLabel ? (
                  <View style={styles.goldBadge}>
                    <Text style={styles.goldBadgeText}>{profile.membershipLabel}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>

          <View style={styles.contactInfo}>
            <View style={styles.contactItem}>
              <MaterialCommunityIcons name="email" size={16} color="#6B7280" />
              <Text style={styles.contactText}>{profile.email}</Text>
            </View>
            <View style={styles.contactItem}>
              <MaterialCommunityIcons name="phone" size={16} color="#6B7280" />
              <Text style={styles.contactText}>{profile.phone}</Text>
            </View>
            <View style={styles.contactItem}>
              <MaterialCommunityIcons name="map-marker" size={16} color="#6B7280" />
              <Text style={styles.contactText}>{profile.location}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.trips}</Text>
            <Text style={styles.statLabel}>Trips</Text>
          </View>
          <View style={[styles.statItem, styles.statItemBorder]}>
            <Text style={styles.statValueGreen}>{stats.reviews}</Text>
            <Text style={styles.statLabel}>Reviews</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.saved}</Text>
            <Text style={styles.statLabel}>Saved</Text>
          </View>
        </View>
      </View>

      <View style={styles.menuContainer}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.label}
            style={styles.menuItem}
            onPress={() => handleMenuClick(item.label, item.screen)}
          >
            <View style={styles.menuItemLeft}>
              <MaterialCommunityIcons name={item.icon as any} size={20} color={item.color} />
              <Text style={styles.menuItemText}>{item.label}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.helpContainer}>
        <View style={styles.helpCard}>
          <Text style={styles.helpTitle}>Help & Support</Text>
          <View style={styles.helpLinks}>
            <TouchableOpacity onPress={() => handleHelpClick("Help Center")} style={styles.helpLink}>
              <Text style={styles.helpLinkText}>Help Center</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleHelpClick("Terms of Service")}
              style={styles.helpLink}
            >
              <Text style={styles.helpLinkText}>Terms of Service</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleHelpClick("Privacy Policy")}
              style={styles.helpLink}
            >
              <Text style={styles.helpLinkText}>Privacy Policy</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleHelpClick("Contact Us")} style={styles.helpLink}>
              <Text style={styles.helpLinkText}>Contact Us</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.logoutContainer}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={16} color="#EF4444" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>TourMate v1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
  },
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  profileCardContainer: {
    paddingHorizontal: 24,
    marginTop: -48,
  },
  profileCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  profileHeader: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: "#1B73E8",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: "#E5E7EB",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
  },
  badgesContainer: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  verifiedBadge: {
    backgroundColor: "rgba(27, 115, 232, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedBadgeText: {
    color: "#1B73E8",
    fontSize: 12,
  },
  goldBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  goldBadgeText: {
    color: "#B45309",
    fontSize: 12,
  },
  contactInfo: {
    gap: 12,
    marginBottom: 16,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  contactText: {
    fontSize: 14,
    color: "#6B7280",
    flex: 1,
  },
  editButton: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  editButtonText: {
    fontSize: 14,
    color: "#1F2937",
    fontWeight: "600",
  },
  statsContainer: {
    paddingHorizontal: 24,
    marginTop: 24,
  },
  statsCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statItemBorder: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#E5E7EB",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1B73E8",
    marginBottom: 4,
  },
  statValueGreen: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2BC7B2",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  menuContainer: {
    paddingHorizontal: 24,
    marginTop: 24,
    gap: 8,
  },
  menuItem: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: "#1F2937",
  },
  helpContainer: {
    paddingHorizontal: 24,
    marginTop: 24,
  },
  helpCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 16,
  },
  helpLinks: {
    gap: 12,
  },
  helpLink: {
    paddingVertical: 4,
  },
  helpLinkText: {
    fontSize: 14,
    color: "#6B7280",
  },
  logoutContainer: {
    paddingHorizontal: 24,
    marginTop: 24,
    marginBottom: 16,
  },
  logoutButton: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  logoutButtonText: {
    fontSize: 16,
    color: "#EF4444",
    fontWeight: "600",
  },
  versionContainer: {
    alignItems: "center",
    paddingBottom: 32,
  },
  versionText: {
    color: "#9CA3AF",
    fontSize: 12,
  },
});

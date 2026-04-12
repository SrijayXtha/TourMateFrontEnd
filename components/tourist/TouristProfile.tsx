import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { TouristTopBar } from "../common/TouristTopBar";

interface TouristProfileProps {
  onLogout: () => void;
  onBack: () => void;
  onNavigate?: (screen: string) => void;
}

export function TouristProfile({ onLogout, onBack, onNavigate }: TouristProfileProps) {
  const menuItems = [
    { icon: "cog", label: "Account Settings", color: "#6B7280", screen: "settings" },
    { icon: "bell", label: "Notifications", color: "#6B7280", screen: "notifications" },
    { icon: "credit-card", label: "Payment Methods", color: "#6B7280", screen: "settings" },
    { icon: "heart", label: "Saved Places", color: "#6B7280", screen: "settings" },
    { icon: "shield-check", label: "Privacy & Security", color: "#6B7280", screen: "settings" },
  ];

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
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Logout", onPress: onLogout, style: "destructive" },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <TouristTopBar
        title="Profile"
        subtitle="Manage your account"
        onBack={onBack}
        containerStyle={{ paddingBottom: 64 }}
      />

      {/* Profile Card */}
      <View style={styles.profileCardContainer}>
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <MaterialCommunityIcons name="account" size={40} color="#fff" />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>John Explorer</Text>
              <Text style={styles.profileRole}>Tourist</Text>
              <View style={styles.badgesContainer}>
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedBadgeText}>Verified</Text>
                </View>
                <View style={styles.goldBadge}>
                  <Text style={styles.goldBadgeText}>⭐ Gold Member</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.contactInfo}>
            <View style={styles.contactItem}>
              <MaterialCommunityIcons name="email" size={16} color="#6B7280" />
              <Text style={styles.contactText}>john.explorer@email.com</Text>
            </View>
            <View style={styles.contactItem}>
              <MaterialCommunityIcons name="phone" size={16} color="#6B7280" />
              <Text style={styles.contactText}>+1 (555) 123-4567</Text>
            </View>
            <View style={styles.contactItem}>
              <MaterialCommunityIcons
                name="map-marker"
                size={16}
                color="#6B7280"
              />
              <Text style={styles.contactText}>New York, USA</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEditProfile}
          >
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>15</Text>
            <Text style={styles.statLabel}>Trips</Text>
          </View>
          <View style={[styles.statItem, styles.statItemBorder]}>
            <Text style={styles.statValueGreen}>8</Text>
            <Text style={styles.statLabel}>Reviews</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>23</Text>
            <Text style={styles.statLabel}>Saved</Text>
          </View>
        </View>
      </View>

      {/* Menu Items */}
      <View style={styles.menuContainer}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.label}
            style={styles.menuItem}
            onPress={() => handleMenuClick(item.label, item.screen)}
          >
            <View style={styles.menuItemLeft}>
              <MaterialCommunityIcons
                name={item.icon as any}
                size={20}
                color={item.color}
              />
              <Text style={styles.menuItemText}>{item.label}</Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color="#9CA3AF"
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* Help & Support */}
      <View style={styles.helpContainer}>
        <View style={styles.helpCard}>
          <Text style={styles.helpTitle}>Help & Support</Text>
          <View style={styles.helpLinks}>
            <TouchableOpacity
              onPress={() => handleHelpClick("Help Center")}
              style={styles.helpLink}
            >
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
            <TouchableOpacity
              onPress={() => handleHelpClick("Contact Us")}
              style={styles.helpLink}
            >
              <Text style={styles.helpLinkText}>Contact Us</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Logout */}
      <View style={styles.logoutContainer}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={16} color="#EF4444" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* App Version */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>TourMate v1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    backgroundColor: "#1B73E8",
    paddingTop: 48,
    paddingBottom: 64,
    paddingHorizontal: 24,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  backText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 8,
  },
  headerSubtitle: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 14,
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
    marginBottom: 24,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 12,
    paddingVertical: 12,
  },
  logoutButtonText: {
    fontSize: 14,
    color: "#EF4444",
    fontWeight: "600",
  },
  versionContainer: {
    alignItems: "center",
    paddingBottom: 16,
  },
  versionText: {
    fontSize: 12,
    color: "#9CA3AF",
  },
});

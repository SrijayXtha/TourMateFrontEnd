import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export type TouristBottomTab = "home" | "explore" | "map" | "profile";

interface TouristBottomBarProps {
  activeTab: TouristBottomTab;
  onNavigate: (tab: TouristBottomTab) => void;
}

export function TouristBottomBar({ activeTab, onNavigate }: TouristBottomBarProps) {
  return (
    <View style={styles.bottomNav}>
      <TouchableOpacity style={styles.navItem} onPress={() => onNavigate("home")} activeOpacity={0.85}>
        <MaterialCommunityIcons
          name="home"
          size={24}
          color={activeTab === "home" ? "#1B73E8" : "#9CA3AF"}
        />
        <Text style={[styles.navLabel, activeTab === "home" && styles.navLabelActive]}>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.navItem} onPress={() => onNavigate("explore")} activeOpacity={0.85}>
        <MaterialCommunityIcons
          name="compass"
          size={24}
          color={activeTab === "explore" ? "#1B73E8" : "#9CA3AF"}
        />
        <Text style={[styles.navLabel, activeTab === "explore" && styles.navLabelActive]}>Explore</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.navItem} onPress={() => onNavigate("map")} activeOpacity={0.85}>
        <MaterialCommunityIcons
          name="map"
          size={24}
          color={activeTab === "map" ? "#1B73E8" : "#9CA3AF"}
        />
        <Text style={[styles.navLabel, activeTab === "map" && styles.navLabelActive]}>Map</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.navItem} onPress={() => onNavigate("profile")} activeOpacity={0.85}>
        <MaterialCommunityIcons
          name="account"
          size={24}
          color={activeTab === "profile" ? "#1B73E8" : "#9CA3AF"}
        />
        <Text style={[styles.navLabel, activeTab === "profile" && styles.navLabelActive]}>Profile</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 18 : 8,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 2,
  },
  navLabel: {
    fontSize: 10,
    color: "#9CA3AF",
    marginTop: 4,
  },
  navLabelActive: {
    color: "#1B73E8",
    fontWeight: "600",
  },
});

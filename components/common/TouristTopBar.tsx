import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import {
    Alert,
    StyleProp,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewStyle,
} from "react-native";

interface TouristTopBarProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onMenuPress?: () => void;
  showBack?: boolean;
  showMenu?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}

export function TouristTopBar({
  title,
  subtitle,
  onBack,
  onMenuPress,
  showBack = Boolean(onBack),
  showMenu = true,
  containerStyle,
}: TouristTopBarProps) {
  const handleMenuPress = () => {
    if (onMenuPress) {
      onMenuPress();
      return;
    }

    Alert.alert("Menu", "Menu options will be available soon.");
  };

  return (
    <View style={[styles.header, containerStyle]}>
      <View style={styles.actionsRow}>
        {showBack ? (
          <TouchableOpacity onPress={onBack} style={styles.iconButton} activeOpacity={0.8}>
            <MaterialCommunityIcons name="arrow-left" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <View style={styles.iconButtonPlaceholder} />
        )}

        {showMenu ? (
          <TouchableOpacity onPress={handleMenuPress} style={styles.iconButton} activeOpacity={0.8}>
            <MaterialCommunityIcons name="menu" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <View style={styles.iconButtonPlaceholder} />
        )}
      </View>

      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#1B73E8",
    paddingTop: 48,
    paddingBottom: 32,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  iconButtonPlaceholder: {
    width: 36,
    height: 36,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
  },
});
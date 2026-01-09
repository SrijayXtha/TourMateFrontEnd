import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import {
    Animated,
    Easing,
    StyleSheet,
    Text,
    View
} from "react-native";

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const bounceValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Bounce animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceValue, {
          toValue: 1,
          duration: 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bounceValue, {
          toValue: 0,
          duration: 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Auto-navigate after 2 seconds
    const timer = setTimeout(onComplete, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const translateY = bounceValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -15],
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.bounceContainer, { transform: [{ translateY }] }]}>
        <View style={styles.iconBox}>
          <MaterialCommunityIcons name="compass" size={96} color="#1B73E8" />
        </View>
      </Animated.View>

      <Text style={styles.title}>TourMate</Text>
      <Text style={styles.subtitle}>Safe. Smart. Travel.</Text>

      <View style={styles.dotsContainer}>
        <Animated.View style={styles.dot} />
        <Animated.View style={styles.dot} />
        <Animated.View style={styles.dot} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: "#1B73E8",
  },
  bounceContainer: {
    marginBottom: 32,
  },
  iconBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 100,
    padding: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 15,
  },
  title: {
    fontSize: 48,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 1.5,
    marginTop: 32,
  },
  subtitle: {
    fontSize: 20,
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 16,
  },
  dotsContainer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 64,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
});

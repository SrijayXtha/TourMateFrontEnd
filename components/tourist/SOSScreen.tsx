import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    Alert,
    Animated,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface SOSScreenProps {
  onBack: () => void;
  onSendSOS: (payload: { location: string; description?: string }) => Promise<void> | void;
}

export function SOSScreen({ onBack, onSendSOS }: SOSScreenProps) {
  const [sosActivated, setSosActivated] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [isSending, setIsSending] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const resetSOSState = useCallback(() => {
    setSosActivated(false);
    setCountdown(3);
    pulseAnim.setValue(1);
  }, [pulseAnim]);

  const submitSOS = useCallback(async () => {
    if (isSending) {
      return;
    }

    setIsSending(true);
    try {
      await onSendSOS({
        location: "46.5197°N, 6.6323°E",
        description: "SOS triggered from TourMate mobile app",
      });

      Alert.alert("SOS Sent", "Emergency alert has been sent successfully.");
    } catch (error: any) {
      Alert.alert(
        "SOS Failed",
        error?.message || "Unable to send emergency alert. Please try again."
      );
    } finally {
      setIsSending(false);
      resetSOSState();
    }
  }, [isSending, onSendSOS, resetSOSState]);

  useEffect(() => {
    if (sosActivated) {
      // Start pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Start countdown
      let count = 3;
      const interval = setInterval(() => {
        count--;
        setCountdown(count);
        if (count === 0) {
          clearInterval(interval);
          void submitSOS();
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [sosActivated, pulseAnim, submitSOS]);

  const handleSOSPress = () => {
    if (!sosActivated) {
      setSosActivated(true);
    }
  };

  const handleCancel = () => {
    resetSOSState();
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>SOS Emergency</Text>
          <Text style={styles.headerSubtitle}>Get immediate help</Text>
        </View>

        {/* SOS Button */}
        <View style={styles.sosSection}>
          <View style={styles.sosCard}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons
                name="alert-circle"
                size={64}
                color="#EF4444"
                style={styles.alertIcon}
              />
              <Text style={styles.cardTitle}>Emergency Assistance</Text>
              <Text style={styles.cardDescription}>
                {isSending
                  ? 'Sending emergency alert...'
                  : sosActivated
                  ? `Sending SOS in ${countdown}...`
                  : "Press and hold the button below to send an emergency alert"}
              </Text>
            </View>

            {!sosActivated ? (
              <TouchableOpacity
                onPress={handleSOSPress}
                style={styles.sosButton}
                activeOpacity={0.8}
                disabled={isSending}
              >
                <MaterialCommunityIcons
                  name="alert-circle"
                  size={96}
                  color="#FFFFFF"
                />
                <Text style={styles.sosButtonText}>SOS</Text>
                <Text style={styles.sosButtonSubtext}>Tap to activate</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.countdownContainer}>
                <Animated.View
                  style={[
                    styles.countdownButton,
                    { transform: [{ scale: pulseAnim }] },
                  ]}
                >
                  <Text style={styles.countdownText}>{countdown}</Text>
                </Animated.View>
                <TouchableOpacity
                  onPress={handleCancel}
                  style={styles.cancelButton}
                  disabled={isSending}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* What Happens */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>What happens when you activate SOS?</Text>
            <View style={styles.infoList}>
              <View style={styles.infoItem}>
                <View style={styles.infoIconContainer}>
                  <MaterialCommunityIcons
                    name="map-marker"
                    size={16}
                    color="#EF4444"
                  />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoItemTitle}>Location Shared</Text>
                  <Text style={styles.infoItemDescription}>
                    Your live location is sent to emergency services
                  </Text>
                </View>
              </View>

              <View style={styles.infoItem}>
                <View style={styles.infoIconContainer}>
                  <MaterialCommunityIcons name="phone" size={16} color="#EF4444" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoItemTitle}>Emergency Contacts Notified</Text>
                  <Text style={styles.infoItemDescription}>
                    Your emergency contacts receive an alert
                  </Text>
                </View>
              </View>

              <View style={styles.infoItem}>
                <View style={styles.infoIconContainer}>
                  <MaterialCommunityIcons
                    name="account-group"
                    size={16}
                    color="#EF4444"
                  />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoItemTitle}>Authorities Dispatched</Text>
                  <Text style={styles.infoItemDescription}>
                    Local emergency services are alerted
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Current Location Preview */}
        <View style={styles.locationSection}>
          <View style={styles.locationCard}>
            <View style={styles.locationHeader}>
              <MaterialCommunityIcons
                name="map-marker"
                size={20}
                color="#1B73E8"
              />
              <Text style={styles.locationTitle}>Current Location</Text>
            </View>
            <View style={styles.mapPreview}>
              <MaterialCommunityIcons
                name="map-marker"
                size={48}
                color="#9CA3AF"
              />
              <Text style={styles.mapPreviewText}>Map Preview</Text>
              <Text style={styles.mapCoordinates}>46.5197°N, 6.6323°E</Text>
            </View>
            <Text style={styles.locationAccuracy}>Location accuracy: High</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: "#EF4444",
    paddingTop: 48,
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  backText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
  },
  sosSection: {
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  sosCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  cardHeader: {
    alignItems: "center",
    marginBottom: 32,
  },
  alertIcon: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
    textAlign: "center",
  },
  cardDescription: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
  },
  sosButton: {
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  sosButtonText: {
    fontSize: 48,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 8,
  },
  sosButtonSubtext: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 8,
  },
  countdownContainer: {
    alignItems: "center",
  },
  countdownButton: {
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  countdownText: {
    fontSize: 96,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  cancelButton: {
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  infoSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 16,
  },
  infoList: {
    gap: 12,
  },
  infoItem: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  infoIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  infoContent: {
    flex: 1,
  },
  infoItemTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  infoItemDescription: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 18,
  },
  locationSection: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  locationCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  locationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  locationTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  mapPreview: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    height: 192,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  mapPreviewText: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
  },
  mapCoordinates: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 4,
  },
  locationAccuracy: {
    fontSize: 12,
    color: "#6B7280",
  },
});

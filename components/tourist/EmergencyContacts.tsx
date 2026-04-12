import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import {
    Alert,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { mockEmergencyContacts } from "../../data/mockData";
import { TouristTopBar } from "../common/TouristTopBar";

interface EmergencyContactsProps {
  onBack: () => void;
}

export function EmergencyContacts({ onBack }: EmergencyContactsProps) {
  const handleCall = (name: string, number: string) => {
    Alert.alert(
      `Call ${name}?`,
      `Do you want to call ${number}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Call",
          onPress: () => {
            Linking.openURL(`tel:${number}`);
          },
        },
      ]
    );
  };

  const handleAddContact = () => {
    Alert.alert("Add Contact", "Custom contact feature coming soon!");
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <TouristTopBar
        title="Emergency Contacts"
        subtitle="Important numbers you should know"
        onBack={onBack}
      />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Warning Banner */}
        <View style={styles.warningBanner}>
          <MaterialCommunityIcons
            name="shield-alert"
            size={20}
            color="#DC2626"
            style={styles.warningIcon}
          />
          <View style={styles.warningContent}>
            <Text style={styles.warningTitle}>In case of emergency</Text>
            <Text style={styles.warningSubtitle}>
              Use the SOS button for immediate assistance. These numbers are for
              additional support.
            </Text>
          </View>
        </View>

        {/* Emergency Numbers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>EMERGENCY SERVICES</Text>
          {mockEmergencyContacts
            .filter((contact) => contact.type === "emergency")
            .map((contact, index) => (
              <View key={index} style={styles.contactCard}>
                <View style={styles.contactLeft}>
                  <View style={styles.emergencyIconContainer}>
                    <MaterialCommunityIcons
                      name="phone"
                      size={24}
                      color="#DC2626"
                    />
                  </View>
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactName}>{contact.name}</Text>
                    <Text style={styles.contactNumber}>{contact.number}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.callButton}
                  onPress={() => handleCall(contact.name, contact.number)}
                >
                  <Text style={styles.callButtonText}>Call</Text>
                </TouchableOpacity>
              </View>
            ))}
        </View>

        {/* Support Numbers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SUPPORT SERVICES</Text>
          {mockEmergencyContacts
            .filter((contact) => contact.type === "support")
            .map((contact, index) => (
              <View key={index} style={styles.contactCard}>
                <View style={styles.contactLeft}>
                  <View style={styles.supportIconContainer}>
                    <MaterialCommunityIcons
                      name="help-circle"
                      size={24}
                      color="#2563EB"
                    />
                  </View>
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactName}>{contact.name}</Text>
                    <Text style={styles.contactNumber}>{contact.number}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.callButtonOutline}
                  onPress={() => handleCall(contact.name, contact.number)}
                >
                  <Text style={styles.callButtonOutlineText}>Call</Text>
                </TouchableOpacity>
              </View>
            ))}
        </View>

        {/* Add Custom Contact */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.addContactButton}
            onPress={handleAddContact}
          >
            <MaterialCommunityIcons name="phone-plus" size={20} color="#6B7280" />
            <Text style={styles.addContactButtonText}>Add Custom Contact</Text>
          </TouchableOpacity>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Safety Tips</Text>
          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <Text style={styles.tipBullet}>•</Text>
              <Text style={styles.tipText}>
                Save these numbers in your phone for quick access
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipBullet}>•</Text>
              <Text style={styles.tipText}>
                Emergency numbers work even without mobile credit
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipBullet}>•</Text>
              <Text style={styles.tipText}>
                Share your location with emergency contacts when traveling
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipBullet}>•</Text>
              <Text style={styles.tipText}>
                Keep your embassy contact information handy
              </Text>
            </View>
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
  header: {
    backgroundColor: "#22C55E",
    paddingTop: 48,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
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
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  warningBanner: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  warningIcon: {
    marginTop: 2,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 14,
    color: "#991B1B",
    fontWeight: "600",
    marginBottom: 4,
  },
  warningSubtitle: {
    fontSize: 12,
    color: "#991B1B",
    lineHeight: 18,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  contactCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  contactLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    flex: 1,
  },
  emergencyIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  supportIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: "#DBEAFE",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  contactNumber: {
    fontSize: 14,
    color: "#6B7280",
  },
  callButton: {
    backgroundColor: "#DC2626",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  callButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  callButtonOutline: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  callButtonOutlineText: {
    color: "#1F2937",
    fontSize: 14,
    fontWeight: "600",
  },
  addContactButton: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  addContactButtonText: {
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "600",
  },
  infoSection: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 16,
  },
  tipsList: {
    gap: 12,
  },
  tipItem: {
    flexDirection: "row",
    gap: 12,
  },
  tipBullet: {
    fontSize: 14,
    color: "#1B73E8",
    fontWeight: "bold",
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
});

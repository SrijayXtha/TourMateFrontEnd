import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { mockGuides } from "../../data/mockData";

interface VerifyGuidesProps {
  onBack: () => void;
}

export function VerifyGuides({ onBack }: VerifyGuidesProps) {
  const [activeTab, setActiveTab] = useState<"pending" | "verified">("pending");
  const unverifiedGuides = mockGuides.filter((g) => !g.verified);
  const verifiedGuides = mockGuides.filter((g) => g.verified);

  const handleApprove = (guideName: string) => {
    Alert.alert("Success", `${guideName} has been approved successfully!`, [
      { text: "OK" },
    ]);
  };

  const handleReject = (guideName: string) => {
    Alert.alert(
      "Reject Guide",
      `Are you sure you want to reject ${guideName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: () => Alert.alert("Rejected", `${guideName} has been rejected`),
        },
      ]
    );
  };

  const handleViewDetails = (guideName: string) => {
    Alert.alert("Guide Details", `Viewing details for ${guideName}`);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          <Text style={styles.backButtonText}>Back to Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verify Guides</Text>
        <Text style={styles.headerSubtitle}>
          Review and approve guide applications
        </Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "pending" && styles.tabActive]}
          onPress={() => setActiveTab("pending")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "pending" && styles.tabTextActive,
            ]}
          >
            Pending ({unverifiedGuides.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "verified" && styles.tabActive]}
          onPress={() => setActiveTab("verified")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "verified" && styles.tabTextActive,
            ]}
          >
            Verified ({verifiedGuides.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Guide List */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "pending" ? (
          <>
            {unverifiedGuides.map((guide) => (
              <View key={guide.id} style={styles.guideCard}>
                {/* Guide Header */}
                <View style={styles.guideHeader}>
                  <Image
                    source={{ uri: guide.photo }}
                    style={styles.guidePhoto}
                  />
                  <View style={styles.guideInfo}>
                    <Text style={styles.guideName}>{guide.name}</Text>
                    <Text style={styles.guideExperience}>
                      {guide.experience} experience
                    </Text>
                    <View style={styles.specialtiesContainer}>
                      {guide.specialties.slice(0, 2).map((specialty) => (
                        <View key={specialty} style={styles.specialtyBadge}>
                          <Text style={styles.specialtyText}>{specialty}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>

                {/* Guide Details */}
                <View style={styles.detailsContainer}>
                  <View style={styles.detailRow}>
                    <MaterialCommunityIcons
                      name="trophy"
                      size={16}
                      color="#6B7280"
                    />
                    <Text style={styles.detailLabel}>Rating:</Text>
                    <Text style={styles.detailValue}>
                      {guide.rating} ⭐
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <MaterialCommunityIcons
                      name="shield-check"
                      size={16}
                      color="#6B7280"
                    />
                    <Text style={styles.detailLabel}>Languages:</Text>
                    <Text style={styles.detailValue}>
                      {guide.languages?.join(", ") || "Not specified"}
                    </Text>
                  </View>
                </View>

                {/* License Info */}
                <View style={styles.licenseContainer}>
                  <View style={styles.licenseHeader}>
                    <MaterialCommunityIcons
                      name="shield-check"
                      size={16}
                      color="#D97706"
                    />
                    <Text style={styles.licenseTitle}>License Uploaded</Text>
                  </View>
                  <Text style={styles.licenseNumber}>
                    Tour Guide License #TG-2024-{guide.id}567
                  </Text>
                </View>

                {/* Actions */}
                <View style={styles.actionsContainer}>
                  <TouchableOpacity
                    style={styles.viewButton}
                    onPress={() => handleViewDetails(guide.name)}
                  >
                    <MaterialCommunityIcons
                      name="eye"
                      size={16}
                      color="#6B7280"
                    />
                    <Text style={styles.viewButtonText}>View Details</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.approveButton}
                    onPress={() => handleApprove(guide.name)}
                  >
                    <MaterialCommunityIcons
                      name="check-circle"
                      size={16}
                      color="#fff"
                    />
                    <Text style={styles.approveButtonText}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.rejectButton}
                    onPress={() => handleReject(guide.name)}
                  >
                    <MaterialCommunityIcons
                      name="close-circle"
                      size={16}
                      color="#fff"
                    />
                    <Text style={styles.rejectButtonText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {unverifiedGuides.length === 0 && (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons
                  name="check-circle"
                  size={64}
                  color="#22C55E"
                />
                <Text style={styles.emptyStateTitle}>All caught up!</Text>
                <Text style={styles.emptyStateSubtitle}>
                  No pending guide verifications
                </Text>
              </View>
            )}
          </>
        ) : (
          <>
            {verifiedGuides.map((guide) => (
              <View key={guide.id} style={styles.guideCard}>
                {/* Guide Header */}
                <View style={styles.guideHeader}>
                  <Image
                    source={{ uri: guide.photo }}
                    style={styles.guidePhoto}
                  />
                  <View style={styles.guideInfo}>
                    <View style={styles.verifiedNameContainer}>
                      <Text style={styles.guideName}>{guide.name}</Text>
                      <MaterialCommunityIcons
                        name="check-decagram"
                        size={20}
                        color="#22C55E"
                      />
                    </View>
                    <Text style={styles.guideExperience}>
                      {guide.experience} experience
                    </Text>
                    <View style={styles.specialtiesContainer}>
                      {guide.specialties.slice(0, 2).map((specialty) => (
                        <View key={specialty} style={styles.specialtyBadge}>
                          <Text style={styles.specialtyText}>{specialty}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>

                {/* Guide Details */}
                <View style={styles.detailsContainer}>
                  <View style={styles.detailRow}>
                    <MaterialCommunityIcons
                      name="trophy"
                      size={16}
                      color="#6B7280"
                    />
                    <Text style={styles.detailLabel}>Rating:</Text>
                    <Text style={styles.detailValue}>
                      {guide.rating} ⭐
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <MaterialCommunityIcons
                      name="shield-check"
                      size={16}
                      color="#6B7280"
                    />
                    <Text style={styles.detailLabel}>Languages:</Text>
                    <Text style={styles.detailValue}>
                      {guide.languages?.join(", ") || "Not specified"}
                    </Text>
                  </View>
                </View>

                {/* Verified Badge */}
                <View style={styles.verifiedBadge}>
                  <MaterialCommunityIcons
                    name="shield-check"
                    size={16}
                    color="#16A34A"
                  />
                  <Text style={styles.verifiedText}>Verified Guide</Text>
                </View>
              </View>
            ))}

            {verifiedGuides.length === 0 && (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons
                  name="shield-alert"
                  size={64}
                  color="#9CA3AF"
                />
                <Text style={styles.emptyStateTitle}>No verified guides</Text>
                <Text style={styles.emptyStateSubtitle}>
                  Approved guides will appear here
                </Text>
              </View>
            )}
          </>
        )}
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
    backgroundColor: "#9333EA",
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
  tabsContainer: {
    backgroundColor: "#fff",
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingHorizontal: 24,
  },
  tab: {
    paddingVertical: 16,
    marginRight: 16,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: "#9333EA",
  },
  tabText: {
    fontSize: 14,
    color: "#6B7280",
  },
  tabTextActive: {
    color: "#9333EA",
    fontWeight: "600",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  guideCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  guideHeader: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  guidePhoto: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  guideInfo: {
    flex: 1,
  },
  guideName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  verifiedNameContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  guideExperience: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
  },
  specialtiesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  specialtyBadge: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  specialtyText: {
    fontSize: 12,
    color: "#6B7280",
  },
  detailsContainer: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  detailValue: {
    fontSize: 14,
    color: "#1F2937",
  },
  licenseContainer: {
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  licenseHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  licenseTitle: {
    fontSize: 14,
    color: "#92400E",
  },
  licenseNumber: {
    fontSize: 12,
    color: "#B45309",
  },
  verifiedBadge: {
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  verifiedText: {
    fontSize: 14,
    color: "#16A34A",
    fontWeight: "600",
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 8,
  },
  viewButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingVertical: 10,
    borderRadius: 12,
  },
  viewButtonText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "600",
  },
  approveButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: "#16A34A",
    paddingVertical: 10,
    borderRadius: 12,
  },
  approveButtonText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "600",
  },
  rejectButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: "#DC2626",
    paddingVertical: 10,
    borderRadius: 12,
  },
  rejectButtonText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: "#6B7280",
  },
});

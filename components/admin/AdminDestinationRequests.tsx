import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { adminAPI } from "../../constants/api";

interface AdminDestinationRequestsProps {
  onBack: () => void;
}

interface DestinationRequestItem {
  requestId: number;
  guideName?: string;
  guideEmail?: string | null;
  destinationName: string;
  location: string;
  reason: string;
  status: string;
  rejectionReason?: string | null;
  approvedDestinationName?: string | null;
  createdAt?: string;
}

export function AdminDestinationRequests({ onBack }: AdminDestinationRequestsProps) {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<DestinationRequestItem[]>([]);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const loadRequests = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getDestinationRequests();
      setRequests((response?.data?.requests || []) as DestinationRequestItem[]);
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to load destination requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRequests();
  }, []);

  const approveRequest = async (requestId: number) => {
    try {
      await adminAPI.approveDestinationRequest(requestId);
      await loadRequests();
      Alert.alert("Approved", "Destination request approved and added to the official list.");
    } catch (error: any) {
      Alert.alert("Approve Failed", error?.message || "Unable to approve destination request.");
    }
  };

  const submitReject = async () => {
    if (!rejectingId) {
      return;
    }

    try {
      await adminAPI.rejectDestinationRequest(
        rejectingId,
        rejectReason.trim() || "Request rejected by admin."
      );
      setRejectingId(null);
      setRejectReason("");
      await loadRequests();
      Alert.alert("Rejected", "Destination request has been rejected.");
    } catch (error: any) {
      Alert.alert("Reject Failed", error?.message || "Unable to reject destination request.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Destination Requests</Text>
        <Text style={styles.subtitle}>Approve or reject guide destination requests</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#9333EA" />
          </View>
        ) : requests.length > 0 ? (
          requests.map((request) => {
            const isPending = request.status === "pending";
            return (
              <View key={request.requestId} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.destinationName}>{request.destinationName}</Text>
                    <Text style={styles.meta}>
                      {request.guideName || "Guide"} {request.guideEmail ? `• ${request.guideEmail}` : ""}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      request.status === "approved" && styles.approvedBadge,
                      request.status === "rejected" && styles.rejectedBadge,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        request.status === "approved" && styles.approvedText,
                        request.status === "rejected" && styles.rejectedText,
                      ]}
                    >
                      {request.status}
                    </Text>
                  </View>
                </View>

                <Text style={styles.meta}>Location: {request.location}</Text>
                <Text style={styles.reason}>{request.reason}</Text>

                {request.approvedDestinationName ? (
                  <Text style={styles.successText}>
                    Added as: {request.approvedDestinationName}
                  </Text>
                ) : null}

                {request.rejectionReason ? (
                  <Text style={styles.rejectionText}>
                    Rejection reason: {request.rejectionReason}
                  </Text>
                ) : null}

                {isPending ? (
                  <>
                    <View style={styles.actionsRow}>
                      <TouchableOpacity
                        style={styles.approveButton}
                        onPress={() => void approveRequest(request.requestId)}
                      >
                        <Text style={styles.approveText}>Approve</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.rejectButton}
                        onPress={() => {
                          setRejectingId(request.requestId);
                          setRejectReason("");
                        }}
                      >
                        <Text style={styles.rejectText}>Reject</Text>
                      </TouchableOpacity>
                    </View>

                    {rejectingId === request.requestId ? (
                      <View style={styles.rejectPanel}>
                        <Text style={styles.label}>Reason for Rejection</Text>
                        <TextInput
                          style={[styles.input, styles.multiline]}
                          value={rejectReason}
                          onChangeText={setRejectReason}
                          placeholder="Explain why this request is being rejected."
                          placeholderTextColor="#9CA3AF"
                          multiline
                        />
                        <View style={styles.actionsRow}>
                          <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => {
                              setRejectingId(null);
                              setRejectReason("");
                            }}
                          >
                            <Text style={styles.cancelText}>Cancel</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.rejectButton} onPress={() => void submitReject()}>
                            <Text style={styles.rejectText}>Confirm Reject</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : null}
                  </>
                ) : null}
              </View>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="map-marker-question" size={56} color="#9CA3AF" />
            <Text style={styles.emptyText}>No destination requests yet.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    backgroundColor: "#9333EA",
    paddingTop: 48,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  backButton: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  backText: { color: "#fff", fontSize: 16, fontWeight: "500" },
  title: { color: "#fff", fontSize: 28, fontWeight: "700" },
  subtitle: { color: "rgba(255,255,255,0.9)", marginTop: 4 },
  content: { flex: 1, padding: 16 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", gap: 8, marginBottom: 8 },
  destinationName: { fontSize: 16, fontWeight: "700", color: "#111827" },
  meta: { fontSize: 12, color: "#6B7280", marginTop: 3 },
  reason: { fontSize: 13, color: "#374151", lineHeight: 18, marginTop: 10 },
  statusBadge: {
    backgroundColor: "#FEF3C7",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: "flex-start",
  },
  approvedBadge: { backgroundColor: "#DCFCE7" },
  rejectedBadge: { backgroundColor: "#FEE2E2" },
  statusText: { color: "#92400E", fontWeight: "700", fontSize: 12, textTransform: "capitalize" },
  approvedText: { color: "#166534" },
  rejectedText: { color: "#B91C1C" },
  successText: { marginTop: 10, color: "#166534", fontSize: 12, fontWeight: "600" },
  rejectionText: { marginTop: 10, color: "#B91C1C", fontSize: 12, fontWeight: "600" },
  actionsRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  approveButton: {
    flex: 1,
    backgroundColor: "#16A34A",
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 11,
  },
  approveText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  rejectButton: {
    flex: 1,
    backgroundColor: "#FEE2E2",
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 11,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#E5E7EB",
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 11,
  },
  cancelText: { color: "#374151", fontWeight: "700", fontSize: 13 },
  rejectPanel: {
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    marginTop: 12,
    paddingTop: 12,
  },
  label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: "#111827",
    backgroundColor: "#fff",
  },
  multiline: { minHeight: 90, textAlignVertical: "top" },
  emptyState: { alignItems: "center", marginTop: 90 },
  emptyText: { marginTop: 8, color: "#6B7280" },
});

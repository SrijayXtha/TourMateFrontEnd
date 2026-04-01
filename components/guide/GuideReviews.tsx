import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { guideAPI } from "../../constants/api";

interface GuideReviewsProps {
  onBack: () => void;
}

interface ReviewItem {
  id: number;
  rating?: number;
  comment?: string;
  touristName?: string;
  createdAt?: string;
}

const dateText = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString();
};

export function GuideReviews({ onBack }: GuideReviewsProps) {
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState("0");
  const [reviews, setReviews] = useState<ReviewItem[]>([]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const response = await guideAPI.getReviews();
      setAverageRating(String(response?.data?.averageRating || "0"));
      setReviews((response?.data?.reviews || []) as ReviewItem[]);
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadReviews();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Guide Reviews</Text>
        <Text style={styles.subtitle}>Average rating: {averageRating}</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1B73E8" />
        </View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.name}>{item.touristName || "Tourist"}</Text>
                <Text style={styles.date}>{dateText(item.createdAt)}</Text>
              </View>
              <View style={styles.ratingRow}>
                <MaterialCommunityIcons name="star" size={16} color="#FACC15" />
                <Text style={styles.ratingText}>{item.rating || 0}/5</Text>
              </View>
              <Text style={styles.comment}>{item.comment || "No comment provided"}</Text>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="star-outline" size={56} color="#9CA3AF" />
              <Text style={styles.emptyText}>No reviews yet</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    backgroundColor: "#1B73E8",
    paddingTop: 48,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  backButton: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  backText: { color: "#fff", fontSize: 16, fontWeight: "500" },
  title: { color: "#fff", fontSize: 28, fontWeight: "700" },
  subtitle: { color: "rgba(255, 255, 255, 0.9)", marginTop: 4 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  listContent: { padding: 16, gap: 10 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 14,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  name: { fontSize: 14, fontWeight: "700", color: "#111827" },
  date: { fontSize: 12, color: "#6B7280" },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  ratingText: { color: "#111827", fontWeight: "700", fontSize: 13 },
  comment: { marginTop: 8, color: "#4B5563", fontSize: 13 },
  emptyState: { alignItems: "center", marginTop: 90 },
  emptyText: { marginTop: 8, color: "#6B7280" },
});

import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { adminAPI } from "../../constants/api";
import {
  HotelLocationPicker,
  HotelLocationValue,
} from "../auth/HotelLocationPicker";

interface AdminDestinationManagementProps {
  onBack: () => void;
}

interface DestinationItem {
  destinationId: number;
  name: string;
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  description?: string | null;
  image?: string | null;
  category?: string | null;
  popularityScore?: number | null;
  difficulty?: string | null;
  duration?: string | null;
  bestTime?: string | null;
  pricePerDayNpr?: number | null;
  activities?: string[];
  highlights?: string[];
}

const emptyForm = {
  name: "",
  description: "",
  image: "",
  category: "",
  popularityScore: "",
  difficulty: "",
  duration: "",
  bestTime: "",
  pricePerDayNpr: "",
  activities: "",
  highlights: "",
};

const MAX_DESTINATION_IMAGE_BYTES = 1.5 * 1024 * 1024;

const showDialog = (title: string, message: string) => {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.alert(`${title}\n\n${message}`);
    return;
  }

  Alert.alert(title, message);
};

const estimateDataUrlBytes = (value: string): number => {
  if (!value.startsWith("data:")) {
    return 0;
  }

  const base64 = value.split(",")[1] || "";
  return Math.floor((base64.length * 3) / 4);
};

export function AdminDestinationManagement({ onBack }: AdminDestinationManagementProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [destinations, setDestinations] = useState<DestinationItem[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [selectedLocation, setSelectedLocation] = useState<HotelLocationValue | null>(null);

  const loadDestinations = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getDestinations();
      setDestinations((response?.data?.destinations || []) as DestinationItem[]);
    } catch (error: any) {
      showDialog("Error", error?.message || "Failed to load destinations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDestinations();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setSelectedLocation(null);
    setEditingId(null);
  };

  const pickDestinationImage = async (mode: "camera" | "gallery") => {
    try {
      if (mode === "camera") {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          showDialog("Permission Required", "Camera permission is required to take a photo.");
          return;
        }

        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.15,
          base64: true,
        });

        if (!result.canceled && result.assets.length > 0) {
          const asset = result.assets[0];
          const imageValue = asset.base64
            ? `data:${asset.mimeType || "image/jpeg"};base64,${asset.base64}`
            : asset.uri;

          if (
            imageValue.startsWith("data:") &&
            estimateDataUrlBytes(imageValue) > MAX_DESTINATION_IMAGE_BYTES
          ) {
            showDialog(
              "Image Too Large",
              "Please choose a smaller or more tightly cropped image for this destination."
            );
            return;
          }

          setForm((prev) => ({ ...prev, image: imageValue }));
        }
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.15,
        base64: true,
      });

      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        const imageValue = asset.base64
          ? `data:${asset.mimeType || "image/jpeg"};base64,${asset.base64}`
          : asset.uri;

        if (
          imageValue.startsWith("data:") &&
          estimateDataUrlBytes(imageValue) > MAX_DESTINATION_IMAGE_BYTES
        ) {
          showDialog(
            "Image Too Large",
            "Please choose a smaller or more tightly cropped image for this destination."
          );
          return;
        }

        setForm((prev) => ({ ...prev, image: imageValue }));
      }
    } catch (error: any) {
      showDialog("Image Error", error?.message || "Unable to select an image right now.");
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      showDialog("Validation", "Destination name is required.");
      return;
    }

    if (!selectedLocation) {
      showDialog("Validation", "Please pin the destination location on the map.");
      return;
    }

    if (
      form.image.trim().startsWith("data:") &&
      estimateDataUrlBytes(form.image.trim()) > MAX_DESTINATION_IMAGE_BYTES
    ) {
      showDialog(
        "Image Too Large",
        "Please choose a smaller or more tightly cropped image for this destination."
      );
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        location: selectedLocation.address.trim(),
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        description: form.description.trim() || undefined,
        image: form.image.trim() || undefined,
        category: form.category.trim() || undefined,
        popularityScore: form.popularityScore.trim()
          ? Number(form.popularityScore)
          : undefined,
        difficulty: form.difficulty.trim() || undefined,
        duration: form.duration.trim() || undefined,
        bestTime: form.bestTime.trim() || undefined,
        pricePerDayNpr: form.pricePerDayNpr.trim()
          ? Number(form.pricePerDayNpr)
          : undefined,
        activities: form.activities
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        highlights: form.highlights
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      };

      if (editingId) {
        await adminAPI.updateDestination(editingId, payload);
      } else {
        await adminAPI.createDestination(payload);
      }

      resetForm();
      await loadDestinations();
      showDialog("Changes Saved", "Destination list has been updated.");
    } catch (error: any) {
      showDialog("Save Failed", error?.message || "Unable to save destination.");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (destination: DestinationItem) => {
    setEditingId(destination.destinationId);
    setForm({
      name: destination.name || "",
      description: destination.description || "",
      image: destination.image || "",
      category: destination.category || "",
      popularityScore:
        destination.popularityScore === null || destination.popularityScore === undefined
          ? ""
          : String(destination.popularityScore),
      difficulty: destination.difficulty || "",
      duration: destination.duration || "",
      bestTime: destination.bestTime || "",
      pricePerDayNpr:
        destination.pricePerDayNpr === null || destination.pricePerDayNpr === undefined
          ? ""
          : String(destination.pricePerDayNpr),
      activities: (destination.activities || []).join(", "),
      highlights: (destination.highlights || []).join(", "),
    });

    setSelectedLocation(
      destination.latitude !== null &&
        destination.latitude !== undefined &&
        destination.longitude !== null &&
        destination.longitude !== undefined
        ? {
            latitude: destination.latitude,
            longitude: destination.longitude,
            address: destination.location || "",
          }
        : null
    );
  };

  const removeDestination = async (destination: DestinationItem) => {
    Alert.alert(
      "Delete Destination",
      `Remove ${destination.name} from the official destination list?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await adminAPI.deleteDestination(destination.destinationId);
              await loadDestinations();
              showDialog("Deleted", `${destination.name} has been removed.`);
            } catch (error: any) {
              showDialog("Delete Failed", error?.message || "Unable to delete destination.");
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Destination Management</Text>
        <Text style={styles.subtitle}>Add, edit, and remove official destinations</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            {editingId ? "Edit Destination" : "Add Destination"}
          </Text>

          {[["name", "Destination Name *", "e.g. Pokhara"], ["category", "Category / Type", "Heritage, Trekking, City, Nature"], ["popularityScore", "Popularity / Safety Score", "4.8"], ["difficulty", "Difficulty", "Easy, Moderate, Challenging"], ["duration", "Duration", "14 days"], ["bestTime", "Best Time", "Mar - May, Sep - Nov"], ["pricePerDayNpr", "Price Per Day (NPR)", "18000"]].map(
            ([key, label, placeholder]) => (
              <View key={key} style={styles.inputGroup}>
                <Text style={styles.label}>{label}</Text>
                <TextInput
                  style={styles.input}
                  value={(form as Record<string, string>)[key]}
                  onChangeText={(value) => setForm((prev) => ({ ...prev, [key]: value }))}
                  placeholder={placeholder}
                  keyboardType={key === "popularityScore" || key === "pricePerDayNpr" ? "decimal-pad" : "default"}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            )
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Destination Image</Text>
            <View style={styles.imageActionsRow}>
              <TouchableOpacity
                style={styles.imageActionButton}
                onPress={() => void pickDestinationImage("gallery")}
              >
                <MaterialCommunityIcons name="image-multiple" size={18} color="#1B73E8" />
                <Text style={styles.imageActionText}>Choose From Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.imageActionButton}
                onPress={() => void pickDestinationImage("camera")}
              >
                <MaterialCommunityIcons name="camera" size={18} color="#1B73E8" />
                <Text style={styles.imageActionText}>Use Camera</Text>
              </TouchableOpacity>
            </View>
            {form.image ? (
              <Image source={{ uri: form.image }} style={styles.previewImage} />
            ) : (
              <View style={styles.previewPlaceholder}>
                <MaterialCommunityIcons name="image-outline" size={24} color="#94A3B8" />
                <Text style={styles.previewPlaceholderText}>No image selected yet</Text>
              </View>
            )}
          </View>

          <HotelLocationPicker
            value={selectedLocation}
            onChange={setSelectedLocation}
            label="Destination Location *"
            searchPlaceholder="Search destination name, address, or place"
            helperText="Search first, then tap the map or drag the marker to pin the destination."
            selectionTitle="Pinned Destination"
            emptySelectionText="No destination pinned yet."
            searchValidationMessage="Enter a destination name, address, or place to search."
          />

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              value={form.description}
              onChangeText={(value) => setForm((prev) => ({ ...prev, description: value }))}
              placeholder="Describe the destination for tourists and guides."
              placeholderTextColor="#9CA3AF"
              multiline
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Activities & Experiences</Text>
            <TextInput
              style={[styles.input, styles.multilineCompact]}
              value={form.activities}
              onChangeText={(value) => setForm((prev) => ({ ...prev, activities: value }))}
              placeholder="Trekking, Photography, Sherpa culture, Camping"
              placeholderTextColor="#9CA3AF"
              multiline
            />
            <Text style={styles.helperText}>Separate each activity with a comma.</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Top Highlights</Text>
            <TextInput
              style={[styles.input, styles.multilineCompact]}
              value={form.highlights}
              onChangeText={(value) => setForm((prev) => ({ ...prev, highlights: value }))}
              placeholder="Summit views, Khumbu Glacier, Everest Base Camp"
              placeholderTextColor="#9CA3AF"
              multiline
            />
            <Text style={styles.helperText}>Separate each highlight with a comma.</Text>
          </View>

          <View style={styles.actionsRow}>
            {editingId ? (
              <TouchableOpacity style={styles.secondaryButton} onPress={resetForm}>
                <Text style={styles.secondaryButtonText}>Cancel Edit</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={[styles.primaryButton, saving && styles.disabledButton]}
              onPress={() => void handleSave()}
              disabled={saving}
            >
              <Text style={styles.primaryButtonText}>
                {saving ? "Saving..." : editingId ? "Update Destination" : "Add Destination"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Destination List</Text>
          {loading ? (
            <View style={styles.loadingBlock}>
              <ActivityIndicator size="small" color="#1B73E8" />
            </View>
          ) : destinations.length > 0 ? (
            destinations.map((destination) => (
              <View key={destination.destinationId} style={styles.destinationCard}>
                <View style={styles.destinationTop}>
                  <View style={styles.destinationInfo}>
                    {destination.image ? (
                      <Image source={{ uri: destination.image }} style={styles.thumbnail} />
                    ) : (
                      <View style={styles.thumbnailPlaceholder}>
                        <MaterialCommunityIcons name="map-marker" size={20} color="#1B73E8" />
                      </View>
                    )}
                    <View style={styles.destinationText}>
                      <Text style={styles.destinationName}>{destination.name}</Text>
                      <Text style={styles.destinationMeta}>{destination.location}</Text>
                      {destination.category ? (
                        <Text style={styles.destinationMeta}>{destination.category}</Text>
                      ) : null}
                    </View>
                  </View>
                </View>

                {destination.description ? (
                  <Text style={styles.description}>{destination.description}</Text>
                ) : null}

                <View style={styles.destinationActions}>
                  <TouchableOpacity style={styles.smallAction} onPress={() => startEdit(destination)}>
                    <MaterialCommunityIcons name="pencil" size={15} color="#1D4ED8" />
                    <Text style={styles.smallActionText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.smallAction, styles.smallActionDanger]}
                    onPress={() => void removeDestination(destination)}
                  >
                    <MaterialCommunityIcons name="delete-outline" size={15} color="#DC2626" />
                    <Text style={[styles.smallActionText, styles.smallActionTextDanger]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No destinations added yet.</Text>
          )}
        </View>
      </ScrollView>
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
  subtitle: { color: "rgba(255,255,255,0.9)", marginTop: 4 },
  content: { flex: 1, padding: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 14,
  },
  inputGroup: { marginBottom: 12 },
  label: { fontSize: 13, color: "#374151", fontWeight: "600", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    backgroundColor: "#fff",
    color: "#111827",
  },
  multiline: { minHeight: 88, textAlignVertical: "top" },
  multilineCompact: { minHeight: 64, textAlignVertical: "top" },
  helperText: { fontSize: 12, color: "#6B7280", marginTop: 6 },
  actionsRow: { flexDirection: "row", gap: 10, marginTop: 8 },
  imageActionsRow: { flexDirection: "row", gap: 10, flexWrap: "wrap", marginBottom: 12 },
  imageActionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  imageActionText: { color: "#1D4ED8", fontSize: 13, fontWeight: "700" },
  previewImage: {
    width: "100%",
    height: 180,
    borderRadius: 14,
    backgroundColor: "#E5E7EB",
  },
  previewPlaceholder: {
    height: 120,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  previewPlaceholderText: { color: "#64748B", fontSize: 13, fontWeight: "500" },
  primaryButton: {
    flex: 1,
    backgroundColor: "#1D4ED8",
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 12,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  primaryButtonText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  secondaryButtonText: { color: "#475569", fontWeight: "700", fontSize: 14 },
  disabledButton: { opacity: 0.7 },
  loadingBlock: { paddingVertical: 20, alignItems: "center" },
  destinationCard: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  destinationTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  destinationInfo: { flexDirection: "row", gap: 10, flex: 1 },
  thumbnail: { width: 54, height: 54, borderRadius: 10, backgroundColor: "#E5E7EB" },
  thumbnailPlaceholder: {
    width: 54,
    height: 54,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFF6FF",
  },
  destinationText: { flex: 1 },
  destinationName: { fontSize: 15, fontWeight: "700", color: "#111827" },
  destinationMeta: { fontSize: 12, color: "#6B7280", marginTop: 3 },
  description: { color: "#374151", fontSize: 13, marginTop: 10, lineHeight: 18 },
  destinationActions: { flexDirection: "row", gap: 10, marginTop: 12 },
  smallAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#EFF6FF",
  },
  smallActionDanger: {
    backgroundColor: "#FEF2F2",
  },
  smallActionText: { color: "#1D4ED8", fontSize: 12, fontWeight: "700" },
  smallActionTextDanger: { color: "#DC2626" },
  emptyText: { color: "#6B7280", fontSize: 14 },
});

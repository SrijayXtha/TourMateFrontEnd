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
import { hotelAPI } from "../../constants/api";

interface HotelManageProps {
  onBack: () => void;
}

export function HotelManage({ onBack }: HotelManageProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [hotelName, setHotelName] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [facilitiesText, setFacilitiesText] = useState("");
  const [imagesText, setImagesText] = useState("");
  const [totalRooms, setTotalRooms] = useState("");
  const [roomsAvailable, setRoomsAvailable] = useState("");

  const loadProfile = async () => {
    setLoading(true);
    try {
      const response = await hotelAPI.getProfile();
      const hotel = response?.data?.hotel || {};
      setHotelName(hotel.hotelName || "");
      setLocation(hotel.location || "");
      setDescription(hotel.description || "");
      setBasePrice(hotel.basePrice !== null && hotel.basePrice !== undefined ? String(hotel.basePrice) : "");
      setFacilitiesText(Array.isArray(hotel.facilities) ? hotel.facilities.join(", ") : "");
      setImagesText(Array.isArray(hotel.images) ? hotel.images.join(", ") : "");
      setTotalRooms(String(hotel?.roomDetails?.totalRooms ?? ""));
      setRoomsAvailable(String(hotel?.roomDetails?.roomsAvailable ?? ""));
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to load hotel profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProfile();
  }, []);

  const saveHotelProfile = async () => {
    const parsedBasePrice = basePrice ? Number.parseFloat(basePrice) : undefined;
    if (parsedBasePrice !== undefined && (!Number.isFinite(parsedBasePrice) || parsedBasePrice < 0)) {
      Alert.alert("Validation", "Base price must be a valid positive number");
      return;
    }

    const parsedTotalRooms = totalRooms ? Number.parseInt(totalRooms, 10) : undefined;
    const parsedRoomsAvailable = roomsAvailable ? Number.parseInt(roomsAvailable, 10) : undefined;

    if (parsedTotalRooms !== undefined && (!Number.isInteger(parsedTotalRooms) || parsedTotalRooms < 0)) {
      Alert.alert("Validation", "Total rooms must be a valid number");
      return;
    }

    if (
      parsedRoomsAvailable !== undefined &&
      (!Number.isInteger(parsedRoomsAvailable) || parsedRoomsAvailable < 0)
    ) {
      Alert.alert("Validation", "Available rooms must be a valid number");
      return;
    }

    setSaving(true);
    try {
      await hotelAPI.updateProfile({
        hotelName: hotelName.trim() || undefined,
        location: location.trim() || undefined,
        description: description.trim() || undefined,
        basePrice: parsedBasePrice,
        facilities: facilitiesText
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        images: imagesText
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        roomDetails: {
          totalRooms: parsedTotalRooms,
          roomsAvailable: parsedRoomsAvailable,
        },
      });

      Alert.alert("Success", "Hotel profile updated");
    } catch (error: any) {
      Alert.alert("Update Failed", error?.message || "Unable to update hotel profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1B73E8" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Manage Hotel</Text>
        <Text style={styles.subtitle}>Update property information and inventory</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Basic Details</Text>
          <TextInput style={styles.input} value={hotelName} onChangeText={setHotelName} placeholder="Hotel name" />
          <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="Location" />
          <TextInput
            style={[styles.input, styles.multilineInput]}
            value={description}
            onChangeText={setDescription}
            placeholder="Hotel description"
            multiline
          />
          <TextInput
            style={styles.input}
            value={basePrice}
            onChangeText={setBasePrice}
            keyboardType="decimal-pad"
            placeholder="Base price"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Rooms</Text>
          <TextInput
            style={styles.input}
            value={totalRooms}
            onChangeText={setTotalRooms}
            keyboardType="number-pad"
            placeholder="Total rooms"
          />
          <TextInput
            style={styles.input}
            value={roomsAvailable}
            onChangeText={setRoomsAvailable}
            keyboardType="number-pad"
            placeholder="Rooms available"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Facilities and Media</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            value={facilitiesText}
            onChangeText={setFacilitiesText}
            multiline
            placeholder="Facilities (comma separated)"
          />
          <TextInput
            style={[styles.input, styles.multilineInput]}
            value={imagesText}
            onChangeText={setImagesText}
            multiline
            placeholder="Image URLs (comma separated)"
          />
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, saving && styles.disabledButton]}
          onPress={() => void saveHotelProfile()}
          disabled={saving}
        >
          <Text style={styles.primaryButtonText}>{saving ? "Saving..." : "Save Hotel Profile"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
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
  content: { flex: 1, padding: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 14,
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  multilineInput: { minHeight: 70, textAlignVertical: "top" },
  primaryButton: {
    backgroundColor: "#1B73E8",
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 12,
    marginBottom: 20,
  },
  disabledButton: { opacity: 0.6 },
  primaryButtonText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});

import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
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
  const [displayPhoto, setDisplayPhoto] = useState("");
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
      setDisplayPhoto(Array.isArray(hotel.images) && hotel.images[0] ? hotel.images[0] : "");
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

  const pickDisplayPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      setDisplayPhoto(result.assets[0].uri);
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
          <View style={styles.avatarRow}>
            <Image
              source={{
                uri:
                  displayPhoto || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=300&q=80",
              }}
              style={styles.avatar}
            />
            <TouchableOpacity style={styles.photoButton} onPress={() => void pickDisplayPhoto()}>
              <Text style={styles.photoButtonText}>Change Display Picture</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.inputLabel}>Hotel Name</Text>
          <TextInput style={styles.input} value={hotelName} onChangeText={setHotelName} placeholder="Hotel name" />
          <Text style={styles.inputLabel}>Location</Text>
          <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="Location" />
          <Text style={styles.inputLabel}>Description</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            value={description}
            onChangeText={setDescription}
            placeholder="Hotel description"
            multiline
          />
          <Text style={styles.inputLabel}>Base Price</Text>
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
          <Text style={styles.inputLabel}>Total Rooms</Text>
          <TextInput
            style={styles.input}
            value={totalRooms}
            onChangeText={setTotalRooms}
            keyboardType="number-pad"
            placeholder="Total rooms"
          />
          <Text style={styles.inputLabel}>Rooms Available</Text>
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
          <Text style={styles.inputLabel}>Facilities</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            value={facilitiesText}
            onChangeText={setFacilitiesText}
            multiline
            placeholder="Facilities (comma separated)"
          />
          <Text style={styles.inputLabel}>Image URLs</Text>
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
  avatarRow: { alignItems: "center", marginBottom: 12 },
  avatar: { width: 96, height: 96, borderRadius: 48, marginBottom: 8, backgroundColor: "#E5E7EB" },
  photoButton: {
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#EFF6FF",
    marginBottom: 8,
  },
  photoButtonText: { color: "#1D4ED8", fontSize: 13, fontWeight: "600" },
  inputLabel: { fontSize: 13, color: "#374151", fontWeight: "600", marginBottom: 6 },
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

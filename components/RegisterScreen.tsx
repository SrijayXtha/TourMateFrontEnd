import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import React, { useState } from "react";
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
import { authAPI } from "../constants/api";

interface RegisterScreenProps {
  onRegister: (role: string) => void;
  onNavigateToLogin: () => void;
}

export function RegisterScreen({
  onRegister,
  onNavigateToLogin,
}: RegisterScreenProps) {
  // Common fields
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedRole, setSelectedRole] = useState<"tourist" | "guide" | "hotel">(
    "tourist"
  );

  // Tourist-specific fields
  const [emergencyContact, setEmergencyContact] = useState("");
  const [travelPreferences, setTravelPreferences] = useState<string[]>([]);

  // Guide-specific fields
  const [guideLicense, setGuideLicense] = useState<{
    name: string;
    uri: string;
  } | null>(null);
  const [specialization, setSpecialization] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [showExperienceDropdown, setShowExperienceDropdown] = useState(false);

  // Hotel-specific fields
  const [businessName, setBusinessName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [hotelAddress, setHotelAddress] = useState("");
  const [hotelLicense, setHotelLicense] = useState<{
    name: string;
    uri: string;
  } | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const roles = [
    { id: "tourist", label: "Tourist", image: require("../assets/images/tourist.png"), desc: "Explore and book tours" },
    { id: "guide", label: "Guide", image: require("../assets/images/guide.png"), desc: "Offer tour services" },
    { id: "hotel", label: "Hotel", image: require("../assets/images/hotel.png"), desc: "List accommodations" },
  ];

  const preferences = [
    "Adventure",
    "Cultural",
    "Nature",
    "Historical",
    "Beach",
    "Mountain",
  ];

  const experienceOptions = [
    { label: "Less than 1 year", value: "0-1" },
    { label: "1-3 years", value: "1-3" },
    { label: "3-5 years", value: "3-5" },
    { label: "5-10 years", value: "5-10" },
    { label: "10+ years", value: "10+" },
  ];

  const handleVerifyOtp = () => {
    // OTP verification not needed
  };

  const handleResendOtp = () => {
    // Not needed
  };

  const handleRegister = async () => {
    // Validate common fields
    if (!fullName || !username || !email || !password || !confirmPassword || !phone) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    // Role-specific validation
    if (selectedRole === "tourist" && !emergencyContact) {
      Alert.alert("Error", "Please provide an emergency contact number");
      return;
    }

    if (selectedRole === "guide") {
      if (!guideLicense || !specialization || !experienceYears) {
        Alert.alert("Error", "Please complete all guide credentials");
        return;
      }
    }

    if (selectedRole === "hotel") {
      if (!businessName || !registrationNumber || !hotelAddress || !hotelLicense) {
        Alert.alert("Error", "Please complete all hotel business details");
        return;
      }
    }

    setIsLoading(true);
    try {
      // Call the backend API
      const response = await authAPI.register({
        full_name: fullName,
        email: email,
        password: password,
        phone: phone,
        role: selectedRole,
      });

      // Success message based on role
      let message = response.message || "Account created successfully!";
      if (selectedRole === "guide") {
        message = "Guide account created! Pending admin verification.";
      } else if (selectedRole === "hotel") {
        message = "Hotel account created! Pending admin verification.";
      }
      
      Alert.alert("Success", message, [
        { 
          text: "OK", 
          onPress: () => onRegister(selectedRole) 
        }
      ]);
      console.log("Registration response:", response);
    } catch (error: any) {
      // Handle errors from backend
      Alert.alert(
        "Registration Failed",
        error.message || "Unable to register. Please try again."
      );
      console.error("Registration error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (type: "guide" | "hotel") => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
      });

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        const fileData = { name: file.name, uri: file.uri };

        if (type === "guide") {
          setGuideLicense(fileData);
        } else {
          setHotelLicense(fileData);
        }

        Alert.alert("Success", `${file.name} uploaded successfully`);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to upload file");
    }
  };

  const togglePreference = (pref: string) => {
    setTravelPreferences((prev) =>
      prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <Image
              source={require("../assets/images/logo_white.png")}
              style={styles.logoImage}
            />
            <Text style={styles.logoText}>TourMate</Text>
          </View>
          <Text style={styles.headerSubtitle}>Create your account</Text>
        </View>
      </View>

      {/* Register Form */}
      <View style={styles.formContainer}>
        <View style={styles.formCard}>
          <Text style={styles.title}>Register</Text>
          <Text style={styles.subtitle}>
            Enter your details to get started
          </Text>

          {/* Role Selection */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionLabel}>Select Role *</Text>
            <View style={styles.rolesContainer}>
              {roles.map((role) => (
                <TouchableOpacity
                  key={role.id}
                  style={[
                    styles.roleButton,
                    selectedRole === role.id && styles.roleButtonSelected,
                  ]}
                  onPress={() =>
                    setSelectedRole(role.id as "tourist" | "guide" | "hotel")
                  }
                >
                  <Image
                    source={role.image}
                    style={styles.roleImage}
                  />
                  <Text style={styles.roleLabel}>{role.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.roleDesc}>
              {roles.find((r) => r.id === selectedRole)?.desc}
            </Text>
          </View>

          {/* Common Fields */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionLabel}>Account Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons
                  name="account"
                  size={20}
                  color="#9CA3AF"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="John Doe"
                  placeholderTextColor="#9CA3AF"
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username *</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons
                  name="account"
                  size={20}
                  color="#9CA3AF"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="johndoe123"
                  placeholderTextColor="#9CA3AF"
                  value={username}
                  onChangeText={setUsername}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address *</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons
                  name="email"
                  size={20}
                  color="#9CA3AF"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="example@example.com"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number *</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons
                  name="phone"
                  size={20}
                  color="#9CA3AF"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="+1 (555) 123-4567"
                  placeholderTextColor="#9CA3AF"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>
              <Text style={styles.helperText}>
                Required for SOS emergency features
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password *</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons
                  name="lock"
                  size={20}
                  color="#9CA3AF"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <MaterialCommunityIcons
                    name={showPassword ? "eye-off" : "eye"}
                    size={20}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password *</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons
                  name="lock"
                  size={20}
                  color="#9CA3AF"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#9CA3AF"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeIcon}
                >
                  <MaterialCommunityIcons
                    name={showConfirmPassword ? "eye-off" : "eye"}
                    size={20}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Tourist-Specific Fields */}
          {selectedRole === "tourist" && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionLabel}>Tourist Details</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Emergency Contact Number *
                </Text>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons
                    name="phone"
                    size={20}
                    color="#9CA3AF"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="+1 (555) 987-6543"
                    placeholderTextColor="#9CA3AF"
                    value={emergencyContact}
                    onChangeText={setEmergencyContact}
                    keyboardType="phone-pad"
                  />
                </View>
                <Text style={styles.helperText}>
                  Secondary contact for SOS emergencies
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Travel Preferences (Optional)</Text>
                <View style={styles.preferencesContainer}>
                  {preferences.map((pref) => (
                    <TouchableOpacity
                      key={pref}
                      style={[
                        styles.preferenceButton,
                        travelPreferences.includes(pref) &&
                          styles.preferenceButtonSelected,
                      ]}
                      onPress={() => togglePreference(pref)}
                    >
                      <Text
                        style={[
                          styles.preferenceButtonText,
                          travelPreferences.includes(pref) &&
                            styles.preferenceButtonTextSelected,
                        ]}
                      >
                        {pref}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.helperText}>
                  Helps us recommend relevant tours
                </Text>
              </View>
            </View>
          )}

          {/* Guide-Specific Fields */}
          {selectedRole === "guide" && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionLabel}>Professional Credentials</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Guide License/Certification *
                </Text>
                <TouchableOpacity
                  style={styles.fileUploadButton}
                  onPress={() => handleFileUpload("guide")}
                >
                  <MaterialCommunityIcons
                    name="cloud-upload"
                    size={24}
                    color="#1B73E8"
                  />
                  <Text style={styles.fileUploadText}>
                    {guideLicense
                      ? guideLicense.name
                      : "Upload license document"}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Area of Specialization *</Text>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons
                    name="map-marker"
                    size={20}
                    color="#9CA3AF"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., Mountain trekking, Cultural tours"
                    placeholderTextColor="#9CA3AF"
                    value={specialization}
                    onChangeText={setSpecialization}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Experience Level *</Text>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() =>
                    setShowExperienceDropdown(!showExperienceDropdown)
                  }
                >
                  <Text
                    style={[
                      styles.dropdownButtonText,
                      !experienceYears && styles.placeholderText,
                    ]}
                  >
                    {experienceYears
                      ? experienceOptions.find((x) => x.value === experienceYears)
                          ?.label
                      : "Select years of experience"}
                  </Text>
                  <MaterialCommunityIcons
                    name={
                      showExperienceDropdown
                        ? "chevron-up"
                        : "chevron-down"
                    }
                    size={20}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>

                {showExperienceDropdown && (
                  <View style={styles.dropdownContent}>
                    {experienceOptions.map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setExperienceYears(option.value);
                          setShowExperienceDropdown(false);
                        }}
                      >
                        <Text style={styles.dropdownItemText}>
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.warningBox}>
                <Text style={styles.warningText}>
                  ⚠️ Your account will be pending admin verification. You'll
                  be notified once approved.
                </Text>
              </View>
            </View>
          )}

          {/* Hotel-Specific Fields */}
          {selectedRole === "hotel" && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionLabel}>Business Information</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Legal Business Name *</Text>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons
                    name="briefcase"
                    size={20}
                    color="#9CA3AF"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Grand Hotel & Resort"
                    placeholderTextColor="#9CA3AF"
                    value={businessName}
                    onChangeText={setBusinessName}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Business Registration Number *
                </Text>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons
                    name="file-document"
                    size={20}
                    color="#9CA3AF"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="BRN-123456789"
                    placeholderTextColor="#9CA3AF"
                    value={registrationNumber}
                    onChangeText={setRegistrationNumber}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Hotel Address *</Text>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons
                    name="map-marker"
                    size={20}
                    color="#9CA3AF"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, styles.multilineInput]}
                    placeholder="123 Main Street, City, State, ZIP"
                    placeholderTextColor="#9CA3AF"
                    value={hotelAddress}
                    onChangeText={setHotelAddress}
                    multiline
                    numberOfLines={3}
                  />
                </View>
                <Text style={styles.helperText}>
                  Physical address for mapping services
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Hotel Operating License *</Text>
                <TouchableOpacity
                  style={styles.fileUploadButton}
                  onPress={() => handleFileUpload("hotel")}
                >
                  <MaterialCommunityIcons
                    name="cloud-upload"
                    size={24}
                    color="#1B73E8"
                  />
                  <Text style={styles.fileUploadText}>
                    {hotelLicense
                      ? hotelLicense.name
                      : "Upload license document"}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.warningBox}>
                <Text style={styles.warningText}>
                  ⚠️ Your account will be pending admin verification. You'll
                  be notified once approved.
                </Text>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={onNavigateToLogin}>
              <Text style={styles.loginLink}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    backgroundColor: "#1B73E8",
    paddingTop: 48,
    paddingBottom: 96,
    paddingHorizontal: 24,
  },
  headerContent: {
    gap: 8,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  logoImage: {
    width: 40,
    height: 40,
    resizeMode: "contain",
  },
  logoText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
  },
  formContainer: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    marginTop: -64,
    paddingBottom: 40,
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#9CA3AF",
    marginBottom: 24,
  },
  sectionContainer: {
    marginBottom: 24,
    paddingBottom: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4B5563",
    marginBottom: 12,
  },
  rolesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 12,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  roleButtonSelected: {
    borderColor: "#1B73E8",
    backgroundColor: "rgba(27, 115, 232, 0.05)",
  },
  roleImage: {
    width: 48,
    height: 48,
    resizeMode: "contain",
    marginBottom: 8,
  },
  roleLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1F2937",
  },
  roleDesc: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: "#9CA3AF",
    marginBottom: 8,
    fontWeight: "500",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: "#1F2937",
  },
  multilineInput: {
    minHeight: 80,
    paddingTop: 12,
    textAlignVertical: "top",
  },
  eyeIcon: {
    padding: 8,
  },
  otpInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 24,
    fontWeight: "600",
    letterSpacing: 4,
    color: "#1F2937",
    textAlign: "center",
  },
  helperText: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 6,
  },
  preferencesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  preferenceButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
  },
  preferenceButtonSelected: {
    borderColor: "#1B73E8",
    backgroundColor: "rgba(27, 115, 232, 0.1)",
  },
  preferenceButtonText: {
    fontSize: 12,
    color: "#4B5563",
    fontWeight: "500",
  },
  preferenceButtonTextSelected: {
    color: "#1B73E8",
  },
  fileUploadButton: {
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: "#FFFFFF",
  },
  fileUploadText: {
    fontSize: 14,
    color: "#4B5563",
    fontWeight: "500",
  },
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
  },
  dropdownButtonText: {
    fontSize: 16,
    color: "#1F2937",
    fontWeight: "500",
  },
  placeholderText: {
    color: "#9CA3AF",
  },
  dropdownContent: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    marginTop: -1,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  dropdownItemText: {
    fontSize: 14,
    color: "#1F2937",
  },
  warningBox: {
    backgroundColor: "#FFFAED",
    borderWidth: 1,
    borderColor: "#FCD34D",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 16,
  },
  warningText: {
    fontSize: 12,
    color: "#78350F",
  },
  submitButton: {
    backgroundColor: "#1B73E8",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 24,
  },
  submitButtonDisabled: {
    backgroundColor: "#9CA3AF",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 14,
    color: "#4B5563",
    fontWeight: "500",
  },
  resendContainer: {
    alignItems: "center",
    marginTop: 16,
  },
  resendText: {
    color: "#1B73E8",
    fontSize: 14,
    fontWeight: "600",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  loginText: {
    color: "#9CA3AF",
    fontSize: 14,
  },
  loginLink: {
    color: "#1B73E8",
    fontSize: 14,
    fontWeight: "600",
  },
});

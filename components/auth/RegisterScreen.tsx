import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useMemo, useState } from "react";
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
import { authAPI, publicAPI } from "../../constants/api";
import {
  HotelLocationPicker,
  HotelLocationValue,
} from "./HotelLocationPicker";

interface RegisterScreenProps {
  onRegister: (role: string) => void;
  onNavigateToLogin: () => void;
}

type UserRole = "tourist" | "guide" | "hotel";
type FieldErrors = Record<string, string>;
type DestinationOption = {
  destinationId: number;
  name: string;
  location: string;
  category?: string | null;
};

const showDialog = (
  title: string,
  message: string,
  onConfirm?: () => void
) => {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.alert(`${title}\n\n${message}`);
    onConfirm?.();
    return;
  }

  Alert.alert(title, message, onConfirm ? [{ text: "OK", onPress: onConfirm }] : [{ text: "OK" }]);
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function RegisterScreen({
  onRegister,
  onNavigateToLogin,
}: RegisterScreenProps) {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [profilePhoto, setProfilePhoto] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("tourist");

  const [emergencyContact, setEmergencyContact] = useState("");
  const [travelPreferences, setTravelPreferences] = useState<string[]>([]);

  const [guideLicense, setGuideLicense] = useState<{
    name: string;
    uri: string;
  } | null>(null);
  const [specialization, setSpecialization] = useState("");
  const [selectedDestinations, setSelectedDestinations] = useState<number[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [experienceYears, setExperienceYears] = useState("");
  const [showExperienceDropdown, setShowExperienceDropdown] = useState(false);
  const [destinationOptions, setDestinationOptions] = useState<DestinationOption[]>([]);
  const [destinationsLoading, setDestinationsLoading] = useState(true);
  const [showDestinationRequestForm, setShowDestinationRequestForm] = useState(false);
  const [requestDestinationName, setRequestDestinationName] = useState("");
  const [requestDestinationLocation, setRequestDestinationLocation] = useState("");
  const [requestDestinationReason, setRequestDestinationReason] = useState("");
  const [requestDestinationImage, setRequestDestinationImage] = useState("");
  const [requestLatitude, setRequestLatitude] = useState("");
  const [requestLongitude, setRequestLongitude] = useState("");
  const [requestSubmitting, setRequestSubmitting] = useState(false);

  const [businessName, setBusinessName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [hotelLocation, setHotelLocation] = useState<HotelLocationValue | null>(null);
  const [hotelLicense, setHotelLicense] = useState<{
    name: string;
    uri: string;
  } | null>(null);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const roles = [
    {
      id: "tourist",
      label: "Tourist",
      image: require("../../assets/images/tourist.png"),
      desc: "Explore and book tours",
    },
    {
      id: "guide",
      label: "Guide",
      image: require("../../assets/images/guide.png"),
      desc: "Offer tour services",
    },
    {
      id: "hotel",
      label: "Hotel",
      image: require("../../assets/images/hotel.png"),
      desc: "List accommodations",
    },
  ];

  const preferences = [
    "Adventure",
    "Cultural",
    "Nature",
    "Historical",
    "Beach",
    "Mountain",
  ];

  const languageOptions = [
    "English",
    "Nepali",
    "Hindi",
    "Newari",
    "Chinese",
    "French",
    "Spanish",
    "Japanese",
  ];

  const experienceOptions = [
    { label: "Less than 1 year", value: "0-1" },
    { label: "1-3 years", value: "1-3" },
    { label: "3-5 years", value: "3-5" },
    { label: "5-10 years", value: "5-10" },
    { label: "10+ years", value: "10+" },
  ];

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      if (!prev[field]) {
        return prev;
      }

      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const setValue =
    (field: string, setter: (value: string) => void) => (value: string) => {
      setter(value);
      clearFieldError(field);
    };

  useEffect(() => {
    const loadDestinations = async () => {
      try {
        setDestinationsLoading(true);
        const response = await publicAPI.getDestinations();
        setDestinationOptions((response?.data?.destinations || []) as DestinationOption[]);
      } catch {
        setDestinationOptions([]);
      } finally {
        setDestinationsLoading(false);
      }
    };

    void loadDestinations();
  }, []);

  const toggleGuideDestination = (destinationId: number) => {
    setSelectedDestinations((prev) =>
      prev.includes(destinationId)
        ? prev.filter((item) => item !== destinationId)
        : [...prev, destinationId]
    );
    clearFieldError("destinations");
  };

  const toggleGuideLanguage = (language: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(language)
        ? prev.filter((item) => item !== language)
        : [...prev, language]
    );
    clearFieldError("languages");
  };

  const roleIsReady = useMemo(() => {
    const commonReady =
      fullName.trim() &&
      username.trim() &&
      EMAIL_REGEX.test(email.trim()) &&
      phone.trim() &&
      password.length >= 6 &&
      confirmPassword &&
      password === confirmPassword;

    if (!commonReady) {
      return false;
    }

    if (selectedRole === "tourist") {
      return Boolean(emergencyContact.trim());
    }

    if (selectedRole === "guide") {
      return Boolean(
        guideLicense &&
          specialization.trim() &&
          experienceYears &&
          selectedDestinations.length > 0 &&
          selectedLanguages.length > 0
      );
    }

    return Boolean(
      businessName.trim() &&
        registrationNumber.trim() &&
        hotelLicense &&
        hotelLocation
    );
  }, [
    businessName,
    confirmPassword,
    email,
    emergencyContact,
    experienceYears,
    fullName,
    guideLicense,
    hotelLicense,
    hotelLocation,
    password,
    phone,
    registrationNumber,
    selectedRole,
    selectedDestinations.length,
    selectedLanguages.length,
    specialization,
    username,
  ]);

  const validateForm = (): FieldErrors => {
    const errors: FieldErrors = {};
    const normalizedEmail = email.trim().toLowerCase();

    if (!fullName.trim()) {
      errors.fullName = "Full name is required.";
    }

    if (!username.trim()) {
      errors.username = "Username is required.";
    }

    if (!normalizedEmail) {
      errors.email = "Email address is required.";
    } else if (!EMAIL_REGEX.test(normalizedEmail)) {
      errors.email = "Please enter a valid email address.";
    }

    if (!phone.trim()) {
      errors.phone = "Phone number is required.";
    }

    if (!password) {
      errors.password = "Password is required.";
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters.";
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your password.";
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }

    if (selectedRole === "tourist" && !emergencyContact.trim()) {
      errors.emergencyContact = "Emergency contact number is required.";
    }

    if (selectedRole === "guide") {
      if (!guideLicense) {
        errors.guideLicense = "Guide license upload is required.";
      }

      if (!specialization.trim()) {
        errors.specialization = "Area of specialization is required.";
      }

      if (!experienceYears) {
        errors.experienceYears = "Please select your experience level.";
      }

      if (selectedDestinations.length === 0) {
        errors.destinations = "Please select at least one destination you guide for.";
      }

      if (selectedLanguages.length === 0) {
        errors.languages = "Please select at least one language.";
      }
    }

    if (selectedRole === "hotel") {
      if (!businessName.trim()) {
        errors.businessName = "Legal business name is required.";
      }

      if (!registrationNumber.trim()) {
        errors.registrationNumber = "Business registration number is required.";
      }

      if (!hotelLicense) {
        errors.hotelLicense = "Hotel operating license upload is required.";
      }

      if (!hotelLocation) {
        errors.hotelLocation = "Please select your hotel location on the map.";
      }
    }

    return errors;
  };

  const applyBackendErrors = (error: any) => {
    const backendErrors = error?.errors;
    if (!backendErrors || typeof backendErrors !== "object") {
      return false;
    }

    const mapped: FieldErrors = {};
    Object.entries(backendErrors).forEach(([field, message]) => {
      mapped[field] = String(message);
    });
    setFieldErrors(mapped);
    return true;
  };

  const handleRegister = async () => {
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      showDialog("Registration Incomplete", "Please fix the highlighted fields and try again.");
      return;
    }

    if (isLoading) {
      return;
    }

    setIsLoading(true);
    setFieldErrors({});

    try {
      const response = await authAPI.register({
        fullName: fullName.trim(),
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password,
        profilePhoto:
          selectedRole === "tourist" || selectedRole === "guide"
            ? profilePhoto || undefined
            : undefined,
        phone: phone.trim(),
        role: selectedRole,
        emergencyContact:
          selectedRole === "tourist" ? emergencyContact.trim() : undefined,
        preferences:
          selectedRole === "tourist" ? travelPreferences : undefined,
        licenseDocument:
          selectedRole === "guide" ? guideLicense ?? undefined : undefined,
        specialization:
          selectedRole === "guide" ? specialization.trim() : undefined,
        destinations:
          selectedRole === "guide" ? selectedDestinations : undefined,
        languages:
          selectedRole === "guide" ? selectedLanguages : undefined,
        experienceYears:
          selectedRole === "guide" ? experienceYears : undefined,
        businessName:
          selectedRole === "hotel" ? businessName.trim() : undefined,
        registrationNumber:
          selectedRole === "hotel" ? registrationNumber.trim() : undefined,
        hotelLicense:
          selectedRole === "hotel" ? hotelLicense ?? undefined : undefined,
        hotelLocation:
          selectedRole === "hotel" ? hotelLocation ?? undefined : undefined,
      });

      let message = response.message || "Account created successfully!";
      if (selectedRole === "guide") {
        message = "Guide account created! Pending admin verification.";
      } else if (selectedRole === "hotel") {
        message = "Hotel account created! Pending admin verification.";
      }

      showDialog("Success", message, () => {
        onRegister(selectedRole);
        onNavigateToLogin();
      });
    } catch (error: any) {
      const handled = applyBackendErrors(error);
      const errorMessage =
        error?.message || "Unable to register. Please try again.";
      showDialog(
        "Registration Failed",
        handled ? "Please fix the highlighted fields and try again." : errorMessage
      );
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
          clearFieldError("guideLicense");
        } else {
          setHotelLicense(fileData);
          clearFieldError("hotelLicense");
        }

        showDialog("File Selected", `${file.name} attached successfully.`);
      }
    } catch (uploadError: any) {
      showDialog("Upload Failed", uploadError?.message || "Failed to upload file.");
    }
  };

  const togglePreference = (pref: string) => {
    setTravelPreferences((prev) =>
      prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref]
    );
  };

  const pickProfilePhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const nextPhoto = asset.base64
          ? `data:${asset.mimeType || "image/jpeg"};base64,${asset.base64}`
          : asset.uri;
        setProfilePhoto(nextPhoto);
      }
    } catch (error: any) {
      showDialog("Error", error?.message || "Unable to select profile picture");
    }
  };

  const pickRequestImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setRequestDestinationImage(
          asset.base64
            ? `data:${asset.mimeType || "image/jpeg"};base64,${asset.base64}`
            : asset.uri
        );
      }
    } catch (error: any) {
      showDialog("Image Error", error?.message || "Unable to select destination image.");
    }
  };

  const submitDestinationRequest = async () => {
    const requesterName = fullName.trim();
    const requesterEmail = email.trim().toLowerCase();
    const destinationName = requestDestinationName.trim();
    const location = requestDestinationLocation.trim();
    const reason = requestDestinationReason.trim();

    if (!requesterName || !requesterEmail || !destinationName || !location || !reason) {
      showDialog(
        "Request Incomplete",
        "Please complete your name, email, destination name, location, and reason before submitting."
      );
      return;
    }

    setRequestSubmitting(true);
    try {
      await authAPI.createGuideDestinationRequest({
        requesterName,
        requesterEmail,
        destinationName,
        location,
        reason,
        image: requestDestinationImage || undefined,
        latitude: requestLatitude.trim() ? Number(requestLatitude) : undefined,
        longitude: requestLongitude.trim() ? Number(requestLongitude) : undefined,
      });

      setShowDestinationRequestForm(false);
      setRequestDestinationName("");
      setRequestDestinationLocation("");
      setRequestDestinationReason("");
      setRequestDestinationImage("");
      setRequestLatitude("");
      setRequestLongitude("");
      showDialog(
        "Request Sent",
        "Your destination request was sent to admin. Once it is approved, it will appear in the destination list."
      );
    } catch (error: any) {
      showDialog(
        "Request Failed",
        error?.message || "Unable to submit the destination request right now."
      );
    } finally {
      setRequestSubmitting(false);
    }
  };

  const renderFieldError = (field: string) =>
    fieldErrors[field] ? <Text style={styles.errorText}>{fieldErrors[field]}</Text> : null;

  const getInputWrapperStyle = (field: string, multiline = false) => [
    styles.inputWrapper,
    multiline && styles.inputWrapperMultiline,
    fieldErrors[field] && styles.inputWrapperError,
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <Image
              source={require("../../assets/images/logo_white.png")}
              style={styles.logoImage}
            />
            <Text style={styles.logoText}>TourMate</Text>
          </View>
          <Text style={styles.headerSubtitle}>Create your account</Text>
        </View>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.formCard}>
          <Text style={styles.title}>Register</Text>
          <Text style={styles.subtitle}>Enter your details to get started</Text>

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
                  onPress={() => {
                    setSelectedRole(role.id as UserRole);
                    setFieldErrors({});
                  }}
                >
                  <Image source={role.image} style={styles.roleImage} />
                  <Text style={styles.roleLabel}>{role.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.roleDesc}>
              {roles.find((role) => role.id === selectedRole)?.desc}
            </Text>
          </View>

          <View style={styles.sectionContainer}>
            <Text style={styles.sectionLabel}>Account Information</Text>

            {(selectedRole === "tourist" || selectedRole === "guide") && (
              <View style={styles.profilePhotoSection}>
                <Text style={styles.label}>Profile Picture</Text>
                <View style={styles.profilePhotoRow}>
                  {profilePhoto ? (
                    <Image source={{ uri: profilePhoto }} style={styles.profilePhotoPreview} />
                  ) : (
                    <View style={styles.profilePhotoPlaceholder}>
                      <MaterialCommunityIcons name="account" size={34} color="#94A3B8" />
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.photoPickerButton}
                    onPress={() => void pickProfilePhoto()}
                  >
                    <Text style={styles.photoPickerText}>
                      {profilePhoto ? "Change Profile Picture" : "Set Profile Picture"}
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.helperText}>
                  Tourist and guide profile photos are saved with registration and used in profile screens after signup.
                </Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <View style={getInputWrapperStyle("fullName")}>
                <MaterialCommunityIcons name="account" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  placeholderTextColor="#9CA3AF"
                  value={fullName}
                  onChangeText={setValue("fullName", setFullName)}
                />
              </View>
              {renderFieldError("fullName")}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username *</Text>
              <View style={getInputWrapperStyle("username")}>
                <MaterialCommunityIcons name="account" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your username"
                  placeholderTextColor="#9CA3AF"
                  value={username}
                  onChangeText={setValue("username", setUsername)}
                />
              </View>
              {renderFieldError("username")}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address *</Text>
              <View style={getInputWrapperStyle("email")}>
                <MaterialCommunityIcons name="email" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email address"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setValue("email", setEmail)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              {renderFieldError("email")}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number *</Text>
              <View style={getInputWrapperStyle("phone")}>
                <MaterialCommunityIcons name="phone" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your phone number"
                  placeholderTextColor="#9CA3AF"
                  value={phone}
                  onChangeText={setValue("phone", setPhone)}
                  keyboardType="phone-pad"
                />
              </View>
              <Text style={styles.helperText}>Required for SOS emergency features</Text>
              {renderFieldError("phone")}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password *</Text>
              <View style={getInputWrapperStyle("password")}>
                <MaterialCommunityIcons name="lock" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setValue("password", setPassword)}
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
              {renderFieldError("password")}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password *</Text>
              <View style={getInputWrapperStyle("confirmPassword")}>
                <MaterialCommunityIcons name="lock" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm your password"
                  placeholderTextColor="#9CA3AF"
                  value={confirmPassword}
                  onChangeText={setValue("confirmPassword", setConfirmPassword)}
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
              {renderFieldError("confirmPassword")}
            </View>
          </View>

          {selectedRole === "tourist" && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionLabel}>Tourist Details</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Emergency Contact Number *</Text>
                <View style={getInputWrapperStyle("emergencyContact")}>
                  <MaterialCommunityIcons name="phone" size={20} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter emergency contact number"
                    placeholderTextColor="#9CA3AF"
                    value={emergencyContact}
                    onChangeText={setValue("emergencyContact", setEmergencyContact)}
                    keyboardType="phone-pad"
                  />
                </View>
                <Text style={styles.helperText}>Secondary contact for SOS emergencies</Text>
                {renderFieldError("emergencyContact")}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Travel Preferences (Optional)</Text>
                <View style={styles.preferencesContainer}>
                  {preferences.map((pref) => (
                    <TouchableOpacity
                      key={pref}
                      style={[
                        styles.preferenceButton,
                        travelPreferences.includes(pref) && styles.preferenceButtonSelected,
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
                <Text style={styles.helperText}>Helps us recommend relevant tours</Text>
              </View>
            </View>
          )}

          {selectedRole === "guide" && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionLabel}>Professional Credentials</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Guide License/Certification *</Text>
                <TouchableOpacity
                  style={[
                    styles.fileUploadButton,
                    fieldErrors.guideLicense && styles.fileUploadButtonError,
                  ]}
                  onPress={() => void handleFileUpload("guide")}
                >
                  <MaterialCommunityIcons name="cloud-upload" size={24} color="#1B73E8" />
                  <Text style={styles.fileUploadText}>
                    {guideLicense ? guideLicense.name : "Upload license document"}
                  </Text>
                </TouchableOpacity>
                {renderFieldError("guideLicense")}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Area of Specialization *</Text>
                <View style={getInputWrapperStyle("specialization")}>
                  <MaterialCommunityIcons name="map-marker" size={20} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your specialization"
                    placeholderTextColor="#9CA3AF"
                    value={specialization}
                    onChangeText={setValue("specialization", setSpecialization)}
                  />
                </View>
                {renderFieldError("specialization")}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Experience Level *</Text>
                <TouchableOpacity
                  style={[
                    styles.dropdownButton,
                    fieldErrors.experienceYears && styles.inputWrapperError,
                  ]}
                  onPress={() => setShowExperienceDropdown(!showExperienceDropdown)}
                >
                  <Text
                    style={[
                      styles.dropdownButtonText,
                      !experienceYears && styles.placeholderText,
                    ]}
                  >
                    {experienceYears
                      ? experienceOptions.find((option) => option.value === experienceYears)?.label
                      : "Select years of experience"}
                  </Text>
                  <MaterialCommunityIcons
                    name={showExperienceDropdown ? "chevron-up" : "chevron-down"}
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
                          clearFieldError("experienceYears");
                        }}
                      >
                        <Text style={styles.dropdownItemText}>{option.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                {renderFieldError("experienceYears")}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Destinations I Guide For *</Text>
                {destinationsLoading ? (
                  <View style={styles.inlineLoadingRow}>
                    <ActivityIndicator size="small" color="#1B73E8" />
                    <Text style={styles.helperText}>Loading official destinations...</Text>
                  </View>
                ) : destinationOptions.length > 0 ? (
                  <View style={styles.preferencesContainer}>
                    {destinationOptions.map((destination) => {
                      const selected = selectedDestinations.includes(destination.destinationId);
                      return (
                        <TouchableOpacity
                          key={destination.destinationId}
                          style={[
                            styles.preferenceButton,
                            selected && styles.preferenceButtonSelected,
                          ]}
                          onPress={() => toggleGuideDestination(destination.destinationId)}
                        >
                          <Text
                            style={[
                              styles.preferenceButtonText,
                              selected && styles.preferenceButtonTextSelected,
                            ]}
                          >
                            {destination.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : (
                  <Text style={styles.helperText}>
                    No admin-approved destinations are available yet.
                  </Text>
                )}
                <Text style={styles.helperText}>
                  Select every registered destination where you provide guide services.
                </Text>
                {renderFieldError("destinations")}
                <TouchableOpacity
                  style={styles.linkButton}
                  onPress={() => setShowDestinationRequestForm((prev) => !prev)}
                >
                  <Text style={styles.linkButtonText}>
                    Can&apos;t find your destination? Request new destination
                  </Text>
                </TouchableOpacity>
              </View>

              {showDestinationRequestForm && (
                <View style={styles.requestCard}>
                  <Text style={styles.requestTitle}>Request New Destination</Text>
                  <Text style={styles.helperText}>
                    Send the admin the destination details you want added to the official list.
                  </Text>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Destination Name *</Text>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. Bandipur"
                        placeholderTextColor="#9CA3AF"
                        value={requestDestinationName}
                        onChangeText={setRequestDestinationName}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Location / Address *</Text>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={styles.input}
                        placeholder="District, municipality, or full address"
                        placeholderTextColor="#9CA3AF"
                        value={requestDestinationLocation}
                        onChangeText={setRequestDestinationLocation}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Reason for Request *</Text>
                    <View style={getInputWrapperStyle("requestReason", true)}>
                      <TextInput
                        style={[styles.input, styles.multilineTextInput]}
                        placeholder="Explain why this destination should be available for guides and tourists."
                        placeholderTextColor="#9CA3AF"
                        value={requestDestinationReason}
                        onChangeText={setRequestDestinationReason}
                        multiline
                      />
                    </View>
                  </View>

                  <View style={styles.coordinatesRow}>
                    <View style={styles.coordinatesColumn}>
                      <Text style={styles.label}>Latitude (Optional)</Text>
                      <View style={styles.inputWrapper}>
                        <TextInput
                          style={styles.input}
                          placeholder="27.7172"
                          placeholderTextColor="#9CA3AF"
                          value={requestLatitude}
                          onChangeText={setRequestLatitude}
                          keyboardType="decimal-pad"
                        />
                      </View>
                    </View>
                    <View style={styles.coordinatesColumn}>
                      <Text style={styles.label}>Longitude (Optional)</Text>
                      <View style={styles.inputWrapper}>
                        <TextInput
                          style={styles.input}
                          placeholder="85.3240"
                          placeholderTextColor="#9CA3AF"
                          value={requestLongitude}
                          onChangeText={setRequestLongitude}
                          keyboardType="decimal-pad"
                        />
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity style={styles.secondaryFileButton} onPress={() => void pickRequestImage()}>
                    <MaterialCommunityIcons name="image-plus" size={18} color="#1D4ED8" />
                    <Text style={styles.secondaryFileButtonText}>
                      {requestDestinationImage ? "Change Optional Image" : "Add Optional Image"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.secondarySubmitButton, requestSubmitting && styles.submitButtonDisabled]}
                    onPress={() => void submitDestinationRequest()}
                    disabled={requestSubmitting}
                  >
                    <Text style={styles.secondarySubmitButtonText}>
                      {requestSubmitting ? "Sending..." : "Submit Destination Request"}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Languages I Speak *</Text>
                <View style={styles.preferencesContainer}>
                  {languageOptions.map((language) => {
                    const selected = selectedLanguages.includes(language);
                    return (
                      <TouchableOpacity
                        key={language}
                        style={[
                          styles.preferenceButton,
                          selected && styles.preferenceButtonSelected,
                        ]}
                        onPress={() => toggleGuideLanguage(language)}
                      >
                        <Text
                          style={[
                            styles.preferenceButtonText,
                            selected && styles.preferenceButtonTextSelected,
                          ]}
                        >
                          {language}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <Text style={styles.helperText}>
                  Select every language you can guide tourists in.
                </Text>
                {renderFieldError("languages")}
              </View>

              <View style={styles.warningBox}>
                <Text style={styles.warningText}>
                  Your account will be pending admin verification. You will be notified once approved.
                </Text>
              </View>
            </View>
          )}

          {selectedRole === "hotel" && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionLabel}>Business Information</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Legal Business Name *</Text>
                <View style={getInputWrapperStyle("businessName")}>
                  <MaterialCommunityIcons name="briefcase" size={20} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your business name"
                    placeholderTextColor="#9CA3AF"
                    value={businessName}
                    onChangeText={setValue("businessName", setBusinessName)}
                  />
                </View>
                {renderFieldError("businessName")}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Business Registration Number *</Text>
                <View style={getInputWrapperStyle("registrationNumber")}>
                  <MaterialCommunityIcons name="file-document" size={20} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your business registration number"
                    placeholderTextColor="#9CA3AF"
                    value={registrationNumber}
                    onChangeText={setValue("registrationNumber", setRegistrationNumber)}
                  />
                </View>
                {renderFieldError("registrationNumber")}
              </View>

              <View style={styles.inputGroup}>
                <HotelLocationPicker
                  value={hotelLocation}
                  onChange={(value) => {
                    setHotelLocation(value);
                    clearFieldError("hotelLocation");
                  }}
                  error={fieldErrors.hotelLocation}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Hotel Operating License *</Text>
                <TouchableOpacity
                  style={[
                    styles.fileUploadButton,
                    fieldErrors.hotelLicense && styles.fileUploadButtonError,
                  ]}
                  onPress={() => void handleFileUpload("hotel")}
                >
                  <MaterialCommunityIcons name="cloud-upload" size={24} color="#1B73E8" />
                  <Text style={styles.fileUploadText}>
                    {hotelLicense ? hotelLicense.name : "Upload license document"}
                  </Text>
                </TouchableOpacity>
                {renderFieldError("hotelLicense")}
              </View>

              <View style={styles.warningBox}>
                <Text style={styles.warningText}>
                  Your account will be pending admin verification. You will be notified once approved.
                </Text>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.submitButton,
              (!roleIsReady || isLoading) && styles.submitButtonDisabled,
            ]}
            onPress={() => void handleRegister()}
            disabled={!roleIsReady || isLoading}
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
  profilePhotoSection: {
    marginBottom: 16,
  },
  profilePhotoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  profilePhotoPreview: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: "#E5E7EB",
  },
  profilePhotoPlaceholder: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  photoPickerButton: {
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#EFF6FF",
  },
  photoPickerText: {
    color: "#1D4ED8",
    fontSize: 13,
    fontWeight: "600",
  },
  linkButton: {
    marginTop: 8,
    alignSelf: "flex-start",
  },
  linkButtonText: {
    color: "#1D4ED8",
    fontSize: 13,
    fontWeight: "600",
  },
  requestCard: {
    borderWidth: 1,
    borderColor: "#DBEAFE",
    backgroundColor: "#F8FBFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  requestTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E3A8A",
    marginBottom: 6,
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
  inputWrapperMultiline: {
    alignItems: "flex-start",
  },
  inputWrapperError: {
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
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
  multilineTextInput: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  eyeIcon: {
    padding: 8,
  },
  helperText: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 6,
    lineHeight: 18,
  },
  inlineLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    color: "#DC2626",
    marginTop: 6,
    lineHeight: 18,
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
  fileUploadButtonError: {
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
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
  coordinatesRow: {
    flexDirection: "row",
    gap: 10,
  },
  coordinatesColumn: {
    flex: 1,
  },
  secondaryFileButton: {
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#EFF6FF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 10,
  },
  secondaryFileButtonText: {
    color: "#1D4ED8",
    fontSize: 13,
    fontWeight: "600",
  },
  secondarySubmitButton: {
    backgroundColor: "#1E40AF",
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 12,
  },
  secondarySubmitButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
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
    lineHeight: 18,
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

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { makeRedirectUri, ResponseType } from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";
import Constants from "expo-constants";
import React, { useEffect, useRef, useState } from "react";
import * as WebBrowser from "expo-web-browser";

import {
    ActivityIndicator,

    Alert,

    Image,

    Pressable,

    ScrollView,

    StyleSheet,

    Text,

    TextInput,

    TouchableOpacity,

    View,
    Platform,
} from "react-native";

import { authAPI } from "../../constants/api";

import {
  GOOGLE_ANDROID_CLIENT_ID,
  GOOGLE_AUTH_IS_CONFIGURED,
  GOOGLE_IOS_CLIENT_ID,
  GOOGLE_WEB_CLIENT_ID,
} from "../../constants/googleAuth";

WebBrowser.maybeCompleteAuthSession();



const GOOGLE_REDIRECT_URI = makeRedirectUri({
  scheme: "com.srijay.tourmate",
  native: "com.srijay.tourmate:/oauthredirect",
  path: "oauthredirect",
});



interface LoginScreenProps {

  onLogin: (role: string) => void;

  onNavigateToRegister: () => void;

}



export function LoginScreen({

  onLogin,

  onNavigateToRegister,

}: LoginScreenProps) {

  const [username, setUsername] = useState("");

  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [showGoogleOnboarding, setShowGoogleOnboarding] = useState(false);
  const [googleEmail, setGoogleEmail] = useState("");
  const [onboardingFullName, setOnboardingFullName] = useState("");
  const [onboardingUsername, setOnboardingUsername] = useState("");
  const [onboardingPhone, setOnboardingPhone] = useState("");
  const [onboardingPassword, setOnboardingPassword] = useState("");
  const [onboardingConfirmPassword, setOnboardingConfirmPassword] = useState("");
  const [onboardingEmergencyContact, setOnboardingEmergencyContact] = useState("");
  const [onboardingPreferences, setOnboardingPreferences] = useState<string[]>([]);

  const processedGoogleTokenRef = useRef<string | null>(null);
  const isExpoGo = Constants.executionEnvironment === "storeClient";
  const touristPreferences = ["Adventure", "Cultural", "Nature", "Historical", "Beach", "Mountain"];

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID || undefined,
    iosClientId: GOOGLE_IOS_CLIENT_ID || undefined,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID || undefined,

    redirectUri: GOOGLE_REDIRECT_URI,

    responseType: ResponseType.IdToken,

    scopes: ["openid", "profile", "email"],

    selectAccount: true,

  });



  const getIdToken = (authResult: any): string | undefined => {

    const responseIdToken = authResult?.authentication?.idToken;

    const paramsIdToken = authResult?.params?.id_token;

    return responseIdToken || (typeof paramsIdToken === "string" ? paramsIdToken : undefined);

  };



  const completeGoogleLogin = async (idToken: string) => {

    if (processedGoogleTokenRef.current === idToken) {

      setIsLoading(false);

      return;

    }



    processedGoogleTokenRef.current = idToken;



    try {

      console.log("Google login: Sending idToken to backend...", idToken);

      const apiResponse = await authAPI.googleLogin({

        idToken,

        role: "tourist",

      });



      console.log("Google login: Success", apiResponse);

      Alert.alert("Success", apiResponse.message || "Google login successful");

      if (typeof window !== "undefined" && window.alert) {

        window.alert(apiResponse.message || "✓ Google login successful!");

      }

      const authenticatedUser = apiResponse?.data?.user || apiResponse?.user;
      if (!authenticatedUser?.role) {
        throw new Error("Google login succeeded but no user role was returned by the backend.");
      }

      if (authenticatedUser.role === "tourist" && apiResponse?.needsOnboarding) {
        setGoogleEmail(String(authenticatedUser.email || ""));
        setOnboardingFullName(String(authenticatedUser.full_name || authenticatedUser.fullName || ""));
        setOnboardingUsername(String(authenticatedUser.username || ""));
        setOnboardingPhone(String(authenticatedUser.phone || ""));
        setOnboardingEmergencyContact(String(authenticatedUser.phone || ""));
        setShowGoogleOnboarding(true);
        return;
      }

      onLogin(authenticatedUser.role);

    } catch (error: any) {

      console.error("Google login: Backend error", error);

      const errorMsg = error.message || "Unable to sign in with Google. Please try again.";

      Alert.alert("Google Login Failed", errorMsg);

      if (typeof window !== "undefined" && window.alert) {

        window.alert(`✗ ${errorMsg}`);

      }

    } finally {

      setIsLoading(false);

    }

  };



  useEffect(() => {

    const processGoogleLogin = async () => {

      const hasStorage =
        typeof window !== 'undefined' &&
        typeof window.sessionStorage !== 'undefined' &&
        window.sessionStorage !== null;
      const storedToken = hasStorage ? window.sessionStorage.getItem('google_id_token') : null;

      if (storedToken) {

        window.sessionStorage.removeItem('google_id_token');

        await completeGoogleLogin(storedToken);

        return;

      }

      if (response?.type === "error") {

        setIsLoading(false);

        const providerError =

          (typeof response.error?.message === "string" && response.error.message) ||

          (typeof response.params?.error_description === "string" && response.params.error_description) ||

          (typeof response.params?.error === "string" && response.params.error) ||

          "Google sign-in could not be completed.";

        console.error("Google OAuth error:", providerError, response);

        Alert.alert(

          "Google Login Failed",

          `${providerError}\n\nIf needed, add this redirect URI in Google Console:\n${GOOGLE_REDIRECT_URI}`

        );

        if (typeof window !== "undefined" && window.alert) {

          window.alert(`✗ ${providerError}\n\nRedirect URI:\n${GOOGLE_REDIRECT_URI}`);

        }

        return;

      }

      if (response?.type === "dismiss" || response?.type === "cancel") {

        setIsLoading(false);

        console.log("Google OAuth: User canceled");

        return;

      }

      if (response?.type !== "success") {

        console.log("Google OAuth: Waiting for user action...", response?.type);

        return;

      }

      const idToken = getIdToken(response);

      console.log("Google OAuth success: idToken extracted =", !!idToken);

      if (!idToken) {

        setIsLoading(false);

        const providerError =

          (typeof response.params?.error_description === "string" && response.params.error_description) ||

          (typeof response.params?.error === "string" && response.params.error) ||

          "Google did not return an ID token.";

        console.error("Google OAuth: No idToken in response", response);

        Alert.alert("Google Login Failed", providerError);

        if (typeof window !== "undefined" && window.alert) {

          window.alert(`✗ ${providerError}`);

        }

        return;

      }

      await completeGoogleLogin(idToken);

    };

    processGoogleLogin();
    // `completeGoogleLogin` intentionally stays out of deps to avoid reprocessing the same token.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onLogin, response]);



  const handleLogin = async () => {

    if (!username || !password) {

      Alert.alert("Error", "Please fill in all fields");

      return;

    }



    try {
      const response = await authAPI.login({
        email: username.trim(),
        password,
      });
      Alert.alert("Success", response.message || "Login successful!");
      const authenticatedUser = response?.data?.user || response?.user;
      if (!authenticatedUser?.role) {
        throw new Error("Login succeeded but no user role was returned by the backend.");
      }

      onLogin(authenticatedUser.role);
    } catch (error: any) {
      Alert.alert(
        "Login Failed",
        error.message || "Unable to login. Please try again."
      );
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };



  const handleForgotPassword = () => {

    Alert.alert(

      "Password Reset",

      "Password reset link sent to your email. Check your inbox for instructions"

    );

  };

  const toggleOnboardingPreference = (preference: string) => {
    setOnboardingPreferences((current) =>
      current.includes(preference)
        ? current.filter((item) => item !== preference)
        : [...current, preference]
    );
  };

  const handleGoogleOnboardingSubmit = async () => {
    if (
      !onboardingFullName.trim() ||
      !onboardingUsername.trim() ||
      !onboardingPhone.trim() ||
      !onboardingEmergencyContact.trim() ||
      !onboardingPassword
    ) {
      Alert.alert("Missing Details", "Please complete all required tourist account details.");
      return;
    }

    if (onboardingPassword.length < 6) {
      Alert.alert("Weak Password", "Password must be at least 6 characters long.");
      return;
    }

    if (onboardingPassword !== onboardingConfirmPassword) {
      Alert.alert("Password Mismatch", "Password and confirm password do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await authAPI.completeGoogleOnboarding({
        fullName: onboardingFullName.trim(),
        username: onboardingUsername.trim(),
        phone: onboardingPhone.trim(),
        password: onboardingPassword,
        emergencyContact: onboardingEmergencyContact.trim(),
        preferences: onboardingPreferences,
      });

      setShowGoogleOnboarding(false);
      Alert.alert("Success", response.message || "Tourist account setup complete.");
      onLogin("tourist");
    } catch (error: any) {
      Alert.alert(
        "Setup Failed",
        error?.message || "Unable to finish your Google tourist account setup."
      );
    } finally {
      setIsLoading(false);
    }
  };



  const handleGoogleLogin = async () => {
    if (isExpoGo) {
      Alert.alert(
        "Google Sign-In Needs A Dev Build",
        "Google OAuth cannot be tested inside Expo Go. Use a development build or a simulator build so the app can redirect back with the native scheme com.srijay.tourmate:/oauthredirect."
      );
      return;
    }

    if (!GOOGLE_AUTH_IS_CONFIGURED) {
      Alert.alert(
        "Google Sign-In Not Configured",
        `Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID, EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID, and EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID before using Google sign-in.\n\nCurrent platform: ${Platform.OS}\nRedirect URI: ${GOOGLE_REDIRECT_URI}`
      );
      return;
    }

    if (isLoading || !request) {
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await promptAsync();
      
      if (result.type === "success") {
        const idToken = getIdToken(result);
        console.log("Google login: success, idToken =", !!idToken);

        if (!idToken) {
          setIsLoading(false);
          const providerError =
            (typeof result.params?.error_description === "string" && result.params.error_description) ||
            (typeof result.params?.error === "string" && result.params.error) ||
            "Google did not return an ID token.";
          console.error("promptAsync: No idToken in result", result);
          Alert.alert("Google Login Failed", providerError);
          if (typeof window !== "undefined" && window.alert) {
            window.alert(`✗ ${providerError}`);
          }
          return;
        }

        await completeGoogleLogin(idToken);
      } else {
        setIsLoading(false);
        console.log("promptAsync result: not success, type =", result.type);
        if (result.type === "error") {
          const providerError =
            (typeof result.error?.message === "string" && result.error.message) ||
            (typeof result.params?.error_description === "string" && result.params.error_description) ||
            (typeof result.params?.error === "string" && result.params.error) ||
            "Could not complete Google sign-in.";
          console.error("promptAsync error:", result);
          Alert.alert("Google Login Failed", providerError);
          if (typeof window !== "undefined" && window.alert) {
            window.alert(`✗ ${providerError}`);
          }
        }
      }
    } catch (error) {
      setIsLoading(false);
      console.error("Google login error:", error);
      Alert.alert("Google Login Failed", "An unexpected error occurred during Google sign-in.");
    }
  };



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

          <Text style={styles.headerSubtitle}>

            Welcome back! Login to continue

          </Text>

        </View>

      </View>



      <View style={styles.formContainer}>

        <View style={styles.formCard}>

          <Text style={styles.title}>Login</Text>

          <Text style={styles.subtitle}>

            {showGoogleOnboarding
              ? "Complete your tourist account before entering TourMate"
              : "Enter your credentials to continue"}

          </Text>

          {showGoogleOnboarding ? (
            <>
              <View style={styles.googleInfoBox}>
                <Text style={styles.googleInfoTitle}>Google sign-in is for tourists only</Text>
                <Text style={styles.googleInfoText}>
                  We&apos;ve created your tourist account. Finish the details below so your profile,
                  safety contacts, and future settings match your registration info.
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.readonlyInputWrapper}>
                  <Text style={styles.readonlyInputText}>{googleEmail}</Text>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons name="account" size={20} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your full name"
                    placeholderTextColor="#9CA3AF"
                    value={onboardingFullName}
                    onChangeText={setOnboardingFullName}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Username</Text>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons name="at" size={20} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Choose a username"
                    placeholderTextColor="#9CA3AF"
                    value={onboardingUsername}
                    onChangeText={setOnboardingUsername}
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons name="phone" size={20} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your phone number"
                    placeholderTextColor="#9CA3AF"
                    value={onboardingPhone}
                    onChangeText={setOnboardingPhone}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Emergency Contact Number</Text>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons name="phone-alert" size={20} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your emergency contact"
                    placeholderTextColor="#9CA3AF"
                    value={onboardingEmergencyContact}
                    onChangeText={setOnboardingEmergencyContact}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Set Password</Text>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons name="lock" size={20} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Create a password"
                    placeholderTextColor="#9CA3AF"
                    value={onboardingPassword}
                    onChangeText={setOnboardingPassword}
                    secureTextEntry
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons name="lock-check" size={20} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm your password"
                    placeholderTextColor="#9CA3AF"
                    value={onboardingConfirmPassword}
                    onChangeText={setOnboardingConfirmPassword}
                    secureTextEntry
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Travel Preferences</Text>
                <View style={styles.preferencePills}>
                  {touristPreferences.map((preference) => {
                    const selected = onboardingPreferences.includes(preference);
                    return (
                      <TouchableOpacity
                        key={preference}
                        style={[styles.preferencePill, selected && styles.preferencePillSelected]}
                        onPress={() => toggleOnboardingPreference(preference)}
                      >
                        <Text
                          style={[
                            styles.preferencePillText,
                            selected && styles.preferencePillTextSelected,
                          ]}
                        >
                          {preference}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <TouchableOpacity
                style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                onPress={handleGoogleOnboardingSubmit}
                activeOpacity={0.8}
                disabled={isLoading}
              >
                {isLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.loginButtonText}>Complete Tourist Setup</Text>}
              </TouchableOpacity>
            </>
          ) : (
            <>
          <View style={styles.inputGroup}>

            <Text style={styles.label}>Email</Text>

            <View style={styles.inputWrapper}>

              <MaterialCommunityIcons

                name="account"

                size={20}

                color="#9CA3AF"

                style={styles.inputIcon}

              />

              <TextInput

                style={styles.input}

                placeholder="Enter your email"

                placeholderTextColor="#9CA3AF"

                value={username}

                onChangeText={setUsername}

              />

            </View>

          </View>



          <View style={styles.inputGroup}>

            <Text style={styles.label}>Password</Text>

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

              <Pressable

                onPress={() => setShowPassword(!showPassword)}

                style={styles.eyeIcon}

              >

                <MaterialCommunityIcons

                  name={showPassword ? "eye" : "eye-off"}

                  size={20}

                  color="#9CA3AF"

                />

              </Pressable>

            </View>

          </View>



          <TouchableOpacity onPress={handleForgotPassword}>

            <Text style={styles.forgotPasswordText}>Forgot password?</Text>

          </TouchableOpacity>



          <TouchableOpacity

            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}

            onPress={handleLogin}

            activeOpacity={0.8}

            disabled={isLoading}

          >

            {isLoading ? (

              <ActivityIndicator color="#FFFFFF" />

            ) : (

              <Text style={styles.loginButtonText}>Login</Text>

            )}

          </TouchableOpacity>



          <View style={styles.dividerContainer}>

            <View style={styles.dividerLine} />

            <Text style={styles.dividerText}>Or continue with</Text>

            <View style={styles.dividerLine} />

          </View>



          <TouchableOpacity

            style={[styles.googleButton, (isLoading || !request) && styles.googleButtonDisabled]}

            onPress={handleGoogleLogin}

            activeOpacity={0.8}

            disabled={isLoading || !request}

          >

            <Image

              source={require("../../assets/images/googlelogo.png")}

              style={styles.googleLogoImage}

            />

            <Text style={styles.googleButtonText}>Continue with Google</Text>

          </TouchableOpacity>

          <Text style={styles.googleHelperText}>
            Google sign-in is available for tourist accounts only.
          </Text>



          <View style={styles.registerContainer}>

            <Text style={styles.registerText}>Don&apos;t have an account? </Text>

            <TouchableOpacity onPress={onNavigateToRegister}>

              <Text style={styles.registerLink}>Register</Text>

            </TouchableOpacity>

          </View>
            </>
          )}

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

    borderBottomLeftRadius: 32,

    borderBottomRightRadius: 32,

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

  inputGroup: {

    marginBottom: 20,

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

  eyeIcon: {

    padding: 8,

  },

  forgotPasswordText: {

    color: "#1B73E8",

    fontSize: 14,

    marginBottom: 20,

    fontWeight: "500",

  },

  loginButton: {

    backgroundColor: "#1B73E8",

    paddingVertical: 14,

    borderRadius: 12,

    alignItems: "center",

    marginBottom: 24,

  },

  loginButtonDisabled: {

    backgroundColor: "#9CA3AF",

  },

  loginButtonText: {

    color: "#FFFFFF",

    fontSize: 16,

    fontWeight: "600",

  },

  dividerContainer: {

    flexDirection: "row",

    alignItems: "center",

    marginVertical: 24,

  },

  dividerLine: {

    flex: 1,

    height: 1,

    backgroundColor: "#E5E7EB",

  },

  dividerText: {

    paddingHorizontal: 16,

    color: "#9CA3AF",

    fontSize: 14,

  },

  googleButton: {

    borderWidth: 1,

    borderColor: "#E5E7EB",

    paddingVertical: 14,

    borderRadius: 12,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    marginBottom: 24,

    backgroundColor: "#FFFFFF",

  },

  googleButtonDisabled: {

    opacity: 0.6,

  },

  googleLogoImage: {

    width: 20,

    height: 20,

    marginRight: 8,

    resizeMode: "contain",

  },

  googleButtonText: {

    color: "#1F2937",

    fontSize: 16,

    fontWeight: "600",

  },

  googleHelperText: {
    marginTop: -12,
    marginBottom: 24,
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
  },

  googleInfoBox: {
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
  },

  googleInfoTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1D4ED8",
    marginBottom: 6,
  },

  googleInfoText: {
    fontSize: 13,
    lineHeight: 18,
    color: "#1F2937",
  },

  readonlyInputWrapper: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: "#F8FAFC",
  },

  readonlyInputText: {
    fontSize: 16,
    color: "#475569",
  },

  preferencePills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  preferencePill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#FFFFFF",
  },

  preferencePillSelected: {
    borderColor: "#1B73E8",
    backgroundColor: "#DBEAFE",
  },

  preferencePillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4B5563",
  },

  preferencePillTextSelected: {
    color: "#1D4ED8",
  },

  registerContainer: {

    flexDirection: "row",

    justifyContent: "center",

    alignItems: "center",

  },

  registerText: {

    color: "#9CA3AF",

    fontSize: 14,

  },

  registerLink: {

    color: "#1B73E8",

    fontSize: 14,

    fontWeight: "600",

  },

});


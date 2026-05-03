import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export default function OAuthRedirectScreen() {
  const [statusText, setStatusText] = useState("Completing Google sign-in...");
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    const completeAuth = async () => {
      try {
        // Extract the ID token from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const idToken = urlParams.get('id_token') || params.id_token as string;
        const error = urlParams.get('error') || params.error as string;

        if (error) {
          console.error("OAuth error:", error);
          setStatusText("Authentication failed. Please try again.");
          setTimeout(() => {
            router.replace('/login');
          }, 2000);
          return;
        }

        if (idToken) {
          // Store the token temporarily for the login screen to process
          sessionStorage.setItem('google_id_token', idToken);
          setStatusText("Authentication successful! Redirecting...");
          
          // Redirect back to login screen
          setTimeout(() => {
            router.replace('/login');
          }, 1000);
        } else {
          console.error("No ID token found in redirect");
          setStatusText("Authentication failed. No token received.");
          setTimeout(() => {
            router.replace('/login');
          }, 2000);
        }
      } catch (error) {
        console.error("OAuth redirect error:", error);
        setStatusText("An error occurred. Please try again.");
        setTimeout(() => {
          router.replace('/login');
        }, 2000);
      }
    };

    completeAuth();
  }, [router, params]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#2563EB" />
      <Text style={styles.text}>{statusText}</Text>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {

    flex: 1,

    alignItems: "center",

    justifyContent: "center",

    backgroundColor: "#F8FAFC",

    gap: 12,

  },

  text: {

    fontSize: 16,

    color: "#111827",

  },

});


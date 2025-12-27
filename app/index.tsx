import { LoginScreen } from "@/components/LoginScreen";
import { SplashScreen } from "@/components/SplashScreen";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

export default function Index() {
  const [showSplash, setShowSplash] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  if (!isLoggedIn) {
    return (
      <LoginScreen
        onLogin={(role) => {
          setIsLoggedIn(true);
          // Handle role: tourist, guide, admin
        }}
        onNavigateToRegister={() => {
          // Handle navigation to register
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.Text}>TourMate</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1B73E8",
    alignItems: "center",
    justifyContent: "center",
  },
  Text: {
    color: "#FFFFFF",
    fontSize: 48,
    fontStyle: "normal",
  },
});

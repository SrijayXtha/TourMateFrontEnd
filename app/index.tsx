import { LoginScreen } from "@/components/LoginScreen";
import { RegisterScreen } from "@/components/RegisterScreen";
import { SplashScreen } from "@/components/SplashScreen";
import { TouristHome } from "@/components/TouristHome";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

type AuthScreen = "login" | "register";
type UserRole = "tourist" | "guide" | "hotel" | null;

export default function Index() {
  const [showSplash, setShowSplash] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authScreen, setAuthScreen] = useState<AuthScreen>("login");
  const [userRole, setUserRole] = useState<UserRole>(null);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  if (!isLoggedIn) {
    if (authScreen === "register") {
      return (
        <RegisterScreen
          onRegister={(role) => {
            setIsLoggedIn(true);
            setUserRole(role as UserRole);
            // Handle role: tourist, guide, hotel
          }}
          onNavigateToLogin={() => {
            setAuthScreen("login");
          }}
        />
      );
    }

    return (
      <LoginScreen
        onLogin={(role) => {
          setIsLoggedIn(true);
          setUserRole(role as UserRole);
          // Handle role: tourist, guide, admin
        }}
        onNavigateToRegister={() => {
          setAuthScreen("register");
        }}
      />
    );
  }

  if (userRole === "tourist") {
    return (
      <TouristHome
        onNavigate={(screen) => {
          // Handle navigation to different screens
          console.log("Navigating to:", screen);
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

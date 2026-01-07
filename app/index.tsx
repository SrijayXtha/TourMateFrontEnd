import { GuideHome } from "@/components/GuideHome";
import { LoginScreen } from "@/components/LoginScreen";
import { RegisterScreen } from "@/components/RegisterScreen";
import { TouristHome } from "@/components/TouristHome";
import { useState } from "react";

type AuthScreen = "login" | "register";
type UserRole = "tourist" | "guide" | "hotel" | null;

export default function Index() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authScreen, setAuthScreen] = useState<AuthScreen>("login");
  const [userRole, setUserRole] = useState<UserRole>(null);

  if (!isLoggedIn) {
    if (authScreen === "register") {
      return (
        <RegisterScreen
          onRegister={(role) => {
            setUserRole(role as UserRole);
            setIsLoggedIn(true);
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
          setUserRole(role as UserRole);
          setIsLoggedIn(true);
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

  if (userRole === "guide") {
    return (
      <GuideHome
        onNavigate={(screen) => {
          // Handle navigation to different screens
          console.log("Navigating to:", screen);
        }}
      />
    );
  }
}


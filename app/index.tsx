import { LoginScreen } from "@/components/auth/LoginScreen";
import { RegisterScreen } from "@/components/auth/RegisterScreen";
import { SplashScreen } from "@/components/auth/SplashScreen";
import { GuideHome } from "@/components/guide/GuideHome";
import { ExploreGuides } from "@/components/tourist/ExploreGuides";
import { TouristHome } from "@/components/tourist/TouristHome";
import { useEffect, useState } from "react";

type AuthScreen = "login" | "register";
type UserRole = "tourist" | "guide" | "hotel" | null;
type TouristScreen = "home" | "explore-guides";

export default function Index() {
  const [showSplash, setShowSplash] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authScreen, setAuthScreen] = useState<AuthScreen>("login");
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [touristScreen, setTouristScreen] = useState<TouristScreen>("home");

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

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
    if (touristScreen === "explore-guides") {
      return (
        <ExploreGuides
          onNavigate={(screen, data) => {
            console.log("Navigating to:", screen, data);
            // Handle guide profile navigation here
          }}
          onBack={() => setTouristScreen("home")}
        />
      );
    }

    return (
      <TouristHome
        onNavigate={(screen) => {
          console.log("Navigating to:", screen);
          if (screen === "explore-guides") {
            setTouristScreen("explore-guides");
          }
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


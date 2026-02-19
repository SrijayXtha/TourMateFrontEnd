import { AdminPanel } from "@/components/admin/AdminPanel";
import { VerifyGuides } from "@/components/admin/VerifyGuides";
import { LoginScreen } from "@/components/auth/LoginScreen";
import { RegisterScreen } from "@/components/auth/RegisterScreen";
import { SplashScreen } from "@/components/auth/SplashScreen";
import { GuideHome } from "@/components/guide/GuideHome";
import { HotelHome } from "@/components/hotel/HotelHome";
import { DestinationDetails } from "@/components/tourist/DestinationDetails";
import { EmergencyContacts } from "@/components/tourist/EmergencyContacts";
import { Explore } from "@/components/tourist/Explore";
import { ExploreGuides } from "@/components/tourist/ExploreGuides";
import { ExploreHotels } from "@/components/tourist/ExploreHotels";
import { GuideProfile } from "@/components/tourist/GuideProfile";
import { HotelDetails } from "@/components/tourist/HotelDetails";
import { IncidentReport } from "@/components/tourist/IncidentReport";
import { MyBookings } from "@/components/tourist/MyBookings";
import { SOSScreen } from "@/components/tourist/SOSScreen";
import { TouristHome } from "@/components/tourist/TouristHome";
import { TouristProfile } from "@/components/tourist/TouristProfile";
import { useEffect, useState } from "react";

type AuthScreen = "login" | "register";
type UserRole = "tourist" | "guide" | "hotel" | "admin" | null;
type TouristScreen = "home" | "explore" | "explore-guides" | "explore-hotels" | "profile" | "emergency-contacts" | "guide-profile" | "report-incident" | "destination-details" | "hotel-details" | "my-bookings" | "sos";
type AdminScreen = "dashboard" | "verify-guides";

export default function Index() {
  const [showSplash, setShowSplash] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authScreen, setAuthScreen] = useState<AuthScreen>("login");
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [touristScreen, setTouristScreen] = useState<TouristScreen>("home");
  const [adminScreen, setAdminScreen] = useState<AdminScreen>("dashboard");
  const [selectedGuide, setSelectedGuide] = useState<any>(null);
  const [selectedDestination, setSelectedDestination] = useState<any>(null);
  const [selectedHotel, setSelectedHotel] = useState<any>(null);
  const [previousScreen, setPreviousScreen] = useState<TouristScreen>("home");

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
    if (touristScreen === "explore") {
      return (
        <Explore
          onNavigate={(screen, data) => {
            if (screen === "destination-details") {
              setSelectedDestination(data);
              setPreviousScreen("explore");
              setTouristScreen("destination-details");
            } else if (screen === "guide-profile") {
              setSelectedGuide(data);
              setPreviousScreen("explore");
              setTouristScreen("guide-profile");
            } else if (screen === "hotel-details") {
              setSelectedHotel(data);
              setPreviousScreen("explore");
              setTouristScreen("hotel-details");
            }
          }}
          onBack={() => setTouristScreen("home")}
        />
      );
    }

    if (touristScreen === "destination-details" && selectedDestination) {
      return (
        <DestinationDetails
          destination={selectedDestination}
          onBack={() => setTouristScreen("explore")}
          onNavigate={(screen, data) => {
            if (screen === "guide-profile") {
              setSelectedGuide(data);
              setPreviousScreen("destination-details");
              setTouristScreen("guide-profile");
            } else if (screen === "hotel-details") {
              setSelectedHotel(data);
              setPreviousScreen("destination-details");
              setTouristScreen("hotel-details");
            }
          }}
        />
      );
    }

    if (touristScreen === "hotel-details" && selectedHotel) {
      return (
        <HotelDetails
          hotel={selectedHotel}
          onBack={() => setTouristScreen(previousScreen)}
          onNavigate={(screen, data) => {
            if (screen === "guide-profile") {
              setSelectedGuide(data);
              setPreviousScreen("hotel-details");
              setTouristScreen("guide-profile");
            }
          }}
        />
      );
    }

    if (touristScreen === "explore-guides") {
      return (
        <ExploreGuides
          onNavigate={(screen, data) => {
            if (screen === "guide-profile") {
              setSelectedGuide(data);
              setPreviousScreen("explore-guides");
              setTouristScreen("guide-profile");
            }
          }}
          onBack={() => setTouristScreen("home")}
        />
      );
    }

    if (touristScreen === "guide-profile" && selectedGuide) {
      return (
        <GuideProfile
          guide={selectedGuide}
          onBack={() => setTouristScreen(previousScreen)}
          onBook={(date) => {
            console.log("Booking guide for:", date);
            // TODO: Handle booking logic
          }}
        />
      );
    }
if (touristScreen === "explore-hotels") {
      return (
        <ExploreHotels
          onNavigate={(screen, data) => {
            if (screen === "hotel-details") {
              setSelectedHotel(data);
              setPreviousScreen("explore-hotels");
              setTouristScreen("hotel-details");
            }
          }}
          onBack={() => setTouristScreen("home")}
        />
      );
    }

    if (touristScreen === "profile") {
      return (
        <TouristProfile
          onLogout={() => {
            setIsLoggedIn(false);
            setUserRole(null);
            setTouristScreen("home");
          }}
          onBack={() => setTouristScreen("home")}
        />
      );
    }

    if (touristScreen === "emergency-contacts") {
      return (
        <EmergencyContacts
          onBack={() => setTouristScreen("home")}
        />
      );
    }

    if (touristScreen === "report-incident") {
      return (
        <IncidentReport
          onBack={() => setTouristScreen("home")}
          onSubmit={() => {
            setTouristScreen("home");
            // TODO: Handle incident report submission
          }}
        />
      );
    }

    if (touristScreen === "my-bookings") {
      return (
        <MyBookings
          onBack={() => setTouristScreen("home")}
        />
      );
    }

    if (touristScreen === "sos") {
      return (
        <SOSScreen
          onBack={() => setTouristScreen("home")}
        />
      );
    }

    return (
      <TouristHome
        onNavigate={(screen, data) => {
          console.log("Navigating to:", screen);
          if (screen === "explore" || screen === "explore-guides") {
            setTouristScreen("explore");
          } else if (screen === "explore-hotels") {
            setTouristScreen("explore-hotels");
          } else if (screen === "profile") {
            setTouristScreen("profile");
          } else if (screen === "emergency-contacts") {
            setTouristScreen("emergency-contacts");
          } else if (screen === "report-incident") {
            setTouristScreen("report-incident");
          } else if (screen === "destination-details") {
            setSelectedDestination(data);
            setPreviousScreen("home");
            setTouristScreen("destination-details");
          } else if (screen === "guide-profile") {
            setSelectedGuide(data);
            setPreviousScreen("home");
            setTouristScreen("guide-profile");
          } else if (screen === "my-bookings") {
            setTouristScreen("my-bookings");
          } else if (screen === "sos") {
            setTouristScreen("sos");
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

  if (userRole === "hotel") {
    return (
      <HotelHome
        onNavigate={(screen) => {
          // Handle navigation to different screens
          console.log("Navigating to:", screen);
        }}
      />
    );
  }

  if (userRole === "admin") {
    if (adminScreen === "verify-guides") {
      return (
        <VerifyGuides
          onBack={() => setAdminScreen("dashboard")}
        />
      );
    }

    return (
      <AdminPanel
        onNavigate={(screen) => {
          console.log("Navigating to:", screen);
          if (screen === "verify-guides") {
            setAdminScreen("verify-guides");
          }ens
          console.log("Navigating to:", screen);
        }}
      />
    );
  }
}


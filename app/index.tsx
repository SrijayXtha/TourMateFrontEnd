import { AdminActivityLogs } from "@/components/admin/AdminActivityLogs";
import { AdminAnalytics } from "@/components/admin/AdminAnalytics";
import { AdminIncidentReports } from "@/components/admin/AdminIncidentReports";
import { AdminManageBookings } from "@/components/admin/AdminManageBookings";
import { AdminManageUsers } from "@/components/admin/AdminManageUsers";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { VerifyGuides } from "@/components/admin/VerifyGuides";
import { VerifyHotels } from "@/components/admin/VerifyHotels";
import { LoginScreen } from "@/components/auth/LoginScreen";
import { RegisterScreen } from "@/components/auth/RegisterScreen";
import { SplashScreen } from "@/components/auth/SplashScreen";
import { GuideAnalytics } from "@/components/guide/GuideAnalytics";
import { GuideBookings } from "@/components/guide/GuideBookings";
import { GuideHome } from "@/components/guide/GuideHome";
import { GuideMessages } from "@/components/guide/GuideMessages";
import { GuideNotifications } from "@/components/guide/GuideNotifications";
import { GuideReviews } from "@/components/guide/GuideReviews";
import { GuideSettings } from "@/components/guide/GuideSettings";
import { HotelAnalytics } from "@/components/hotel/HotelAnalytics";
import { HotelBookings } from "@/components/hotel/HotelBookings";
import { HotelHome } from "@/components/hotel/HotelHome";
import { HotelManage } from "@/components/hotel/HotelManage";
import { HotelNotifications } from "@/components/hotel/HotelNotifications";
import { HotelReviews } from "@/components/hotel/HotelReviews";
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
import { TouristNotifications } from "@/components/tourist/TouristNotifications";
import { TouristProfile } from "@/components/tourist/TouristProfile";
import { TouristSettings } from "@/components/tourist/TouristSettings";
import { authAPI, touristAPI } from "@/constants/api";
import { useEffect, useState } from "react";
import { Alert } from "react-native";

type AuthScreen = "login" | "register";
type UserRole = "tourist" | "guide" | "hotel" | "admin" | null;
type TouristScreen =
  | "home"
  | "explore"
  | "explore-guides"
  | "explore-hotels"
  | "profile"
  | "settings"
  | "notifications"
  | "emergency-contacts"
  | "guide-profile"
  | "report-incident"
  | "destination-details"
  | "hotel-details"
  | "my-bookings"
  | "sos";
type GuideScreen =
  | "home"
  | "settings"
  | "bookings"
  | "analytics"
  | "notifications"
  | "messages"
  | "reviews";
type HotelScreen = "home" | "manage" | "bookings" | "reviews" | "analytics" | "notifications";
type AdminScreen =
  | "dashboard"
  | "verify-guides"
  | "verify-hotels"
  | "incident-reports"
  | "manage-users"
  | "manage-bookings"
  | "analytics"
  | "activity-logs";

export default function Index() {
  const [showSplash, setShowSplash] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authScreen, setAuthScreen] = useState<AuthScreen>("login");
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [touristScreen, setTouristScreen] = useState<TouristScreen>("home");
  const [guideScreen, setGuideScreen] = useState<GuideScreen>("home");
  const [hotelScreen, setHotelScreen] = useState<HotelScreen>("home");
  const [adminScreen, setAdminScreen] = useState<AdminScreen>("dashboard");
  const [selectedGuide, setSelectedGuide] = useState<any>(null);
  const [selectedDestination, setSelectedDestination] = useState<any>(null);
  const [selectedHotel, setSelectedHotel] = useState<any>(null);
  const [previousScreen, setPreviousScreen] = useState<TouristScreen>("home");

  const parseEntityId = (value: unknown): number | null => {
    const parsed = Number.parseInt(String(value ?? ""), 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  };

  const parsePrice = (value: unknown): number | undefined => {
    if (value === undefined || value === null || value === "") {
      return undefined;
    }

    const normalized = String(value).replace(/[^0-9.]/g, "");
    if (!normalized) {
      return undefined;
    }

    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  const handleLogout = async () => {
    await authAPI.logout();
    setIsLoggedIn(false);
    setUserRole(null);
    setTouristScreen("home");
    setGuideScreen("home");
    setHotelScreen("home");
    setAdminScreen("dashboard");
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Check for existing session on app load
  useEffect(() => {
    const checkExistingSession = async () => {
      if (!showSplash) {  // Only check after splash screen
        const user = await authAPI.getCurrentUser();
        if (user && user.role) {
          setUserRole(user.role as UserRole);
          setIsLoggedIn(true);
        }
      }
    };
    checkExistingSession();
  }, [showSplash]);

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
          onBook={async (startDate, endDate) => {
            const hotelId = parseEntityId(selectedHotel?.id);
            if (!hotelId) {
              Alert.alert("Booking Failed", "Invalid hotel selected.");
              return;
            }

            try {
              const response = await touristAPI.createBooking({
                hotelId,
                startDate,
                endDate,
                totalPrice: parsePrice(selectedHotel?.pricePerNight),
              });

              Alert.alert("Success", response.message || "Hotel booking request submitted.");
              setTouristScreen("my-bookings");
            } catch (error: any) {
              Alert.alert(
                "Booking Failed",
                error?.message || "Unable to submit booking request."
              );
            }
          }}
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
          onBook={async (startDate, endDate) => {
            const guideId = parseEntityId(selectedGuide?.id);
            if (!guideId) {
              Alert.alert("Booking Failed", "Invalid guide selected.");
              return;
            }

            try {
              const response = await touristAPI.createBooking({
                guideId,
                startDate,
                endDate,
                totalPrice: parsePrice(selectedGuide?.pricePerDay),
              });

              Alert.alert("Success", response.message || "Guide booking request submitted.");
              setTouristScreen("my-bookings");
            } catch (error: any) {
              Alert.alert(
                "Booking Failed",
                error?.message || "Unable to submit booking request."
              );
            }
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
          onLogout={() => void handleLogout()}
          onBack={() => setTouristScreen("home")}
          onNavigate={(screen) => {
            if (screen === "settings") {
              setTouristScreen("settings");
            }

            if (screen === "notifications") {
              setTouristScreen("notifications");
            }
          }}
        />
      );
    }

    if (touristScreen === "settings") {
      return <TouristSettings onBack={() => setTouristScreen("profile")} />;
    }

    if (touristScreen === "notifications") {
      return <TouristNotifications onBack={() => setTouristScreen("profile")} />;
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
          onSubmit={async (payload) => {
            try {
              const response = await touristAPI.reportIncident(payload);
              Alert.alert("Success", response.message || "Incident reported successfully.");
              setTouristScreen("home");
            } catch (error: any) {
              Alert.alert(
                "Report Failed",
                error?.message || "Unable to submit incident report."
              );
            }
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
          onSendSOS={async (payload) => {
            await touristAPI.reportSOS(payload);
          }}
        />
      );
    }

    return (
      <TouristHome
        onNavigate={(screen, data) => {
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
    if (guideScreen === "settings") {
      return <GuideSettings onBack={() => setGuideScreen("home")} onLogout={() => void handleLogout()} />;
    }

    if (guideScreen === "bookings") {
      return <GuideBookings onBack={() => setGuideScreen("home")} />;
    }

    if (guideScreen === "analytics") {
      return <GuideAnalytics onBack={() => setGuideScreen("home")} />;
    }

    if (guideScreen === "notifications") {
      return <GuideNotifications onBack={() => setGuideScreen("home")} />;
    }

    if (guideScreen === "messages") {
      return <GuideMessages onBack={() => setGuideScreen("home")} />;
    }

    if (guideScreen === "reviews") {
      return <GuideReviews onBack={() => setGuideScreen("home")} />;
    }

    return (
      <GuideHome
        onNavigate={(screen) => {
          if (screen === "guide-profile-edit" || screen === "guide-settings") {
            setGuideScreen("settings");
          } else if (screen === "guide-bookings") {
            setGuideScreen("bookings");
          } else if (screen === "guide-earnings") {
            setGuideScreen("analytics");
          } else if (screen === "guide-reviews") {
            setGuideScreen("reviews");
          } else if (screen === "guide-messages") {
            setGuideScreen("messages");
          } else if (screen === "guide-notifications") {
            setGuideScreen("notifications");
          }
        }}
      />
    );
  }

  if (userRole === "hotel") {
    if (hotelScreen === "manage") {
      return <HotelManage onBack={() => setHotelScreen("home")} />;
    }

    if (hotelScreen === "bookings") {
      return <HotelBookings onBack={() => setHotelScreen("home")} />;
    }

    if (hotelScreen === "reviews") {
      return <HotelReviews onBack={() => setHotelScreen("home")} />;
    }

    if (hotelScreen === "analytics") {
      return <HotelAnalytics onBack={() => setHotelScreen("home")} />;
    }

    if (hotelScreen === "notifications") {
      return <HotelNotifications onBack={() => setHotelScreen("home")} />;
    }

    return (
      <HotelHome
        onNavigate={(screen) => {
          if (screen === "hotel-manage") {
            setHotelScreen("manage");
          } else if (screen === "hotel-bookings") {
            setHotelScreen("bookings");
          } else if (screen === "hotel-reviews") {
            setHotelScreen("reviews");
          } else if (screen === "hotel-analytics") {
            setHotelScreen("analytics");
          } else if (screen === "hotel-notifications") {
            setHotelScreen("notifications");
          }
        }}
      />
    );
  }

  if (userRole === "admin") {
    if (adminScreen === "verify-guides") {
      return <VerifyGuides onBack={() => setAdminScreen("dashboard")} />;
    }

    if (adminScreen === "verify-hotels") {
      return <VerifyHotels onBack={() => setAdminScreen("dashboard")} />;
    }

    if (adminScreen === "incident-reports") {
      return <AdminIncidentReports onBack={() => setAdminScreen("dashboard")} />;
    }

    if (adminScreen === "manage-users") {
      return <AdminManageUsers onBack={() => setAdminScreen("dashboard")} />;
    }

    if (adminScreen === "manage-bookings") {
      return <AdminManageBookings onBack={() => setAdminScreen("dashboard")} />;
    }

    if (adminScreen === "analytics") {
      return <AdminAnalytics onBack={() => setAdminScreen("dashboard")} />;
    }

    if (adminScreen === "activity-logs") {
      return <AdminActivityLogs onBack={() => setAdminScreen("dashboard")} />;
    }

    return (
      <AdminPanel
        onNavigate={(screen) => {
          if (
            screen === "verify-guides" ||
            screen === "verify-hotels" ||
            screen === "incident-reports" ||
            screen === "manage-users" ||
            screen === "manage-bookings" ||
            screen === "analytics" ||
            screen === "activity-logs"
          ) {
            setAdminScreen(screen as AdminScreen);
          }
        }}
      />
    );
  }

  return null;
}


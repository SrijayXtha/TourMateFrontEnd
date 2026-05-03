import { Alert } from "react-native";

export const openAppMenu = () => {
  Alert.alert("Menu", "Choose an option", [
    { text: "Home" },
    { text: "Explore" },
    { text: "Map" },
    { text: "Profile" },
    { text: "Close", style: "cancel" },
  ]);
};


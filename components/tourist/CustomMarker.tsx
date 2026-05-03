import React from "react";
import { StyleSheet, View } from "react-native";
import { LatLng, Marker } from "react-native-maps";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface CustomMarkerProps {
  coordinate: LatLng;
  onPress?: () => void;
}

function CustomMarker({ coordinate, onPress }: CustomMarkerProps) {
  return (
    <Marker
      coordinate={coordinate}
      onPress={onPress ? () => onPress() : undefined}
      tracksViewChanges={false}
    >
      <View style={styles.pin}>
        <MaterialCommunityIcons name="map-marker" size={16} color="#FFFFFF" />
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  pin: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#8B5CF6",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
});

export default CustomMarker;

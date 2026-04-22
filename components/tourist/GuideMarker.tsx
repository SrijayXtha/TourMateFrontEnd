import React from "react";
import { StyleSheet, View } from "react-native";
import { LatLng, Marker } from "react-native-maps";
import { Circle, Path, Svg } from "react-native-svg";

interface GuideMarkerProps {
  coordinate: LatLng;
  onPress?: () => void;
  available?: boolean;
}

function GuideMarker({ coordinate, onPress, available = true }: GuideMarkerProps) {
  return (
    <Marker
      coordinate={coordinate}
      onPress={onPress ? () => onPress() : undefined}
      tracksViewChanges={false}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <View style={styles.wrapper}>
        <View
          style={[
            styles.pin,
            { backgroundColor: available ? "#10B981" : "#9CA3AF" },
          ]}
        >
          <Svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <Circle cx="12" cy="8" r="4" />
            <Path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
          </Svg>
        </View>
        <View
          style={[
            styles.badge,
            { backgroundColor: available ? "#22C55E" : "#6B7280" },
          ]}
        />
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  pin: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  badge: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
});

export default GuideMarker;

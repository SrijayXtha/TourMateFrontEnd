import React from "react";
import { StyleSheet, View } from "react-native";
import { LatLng, Marker } from "react-native-maps";
import { Path, Rect, Svg } from "react-native-svg";

interface HotelMarkerProps {
  coordinate: LatLng;
  onPress?: () => void;
}

function HotelMarker({ coordinate, onPress }: HotelMarkerProps) {
  return (
    <Marker
      coordinate={coordinate}
      onPress={onPress ? () => onPress() : undefined}
      tracksViewChanges={false}
      anchor={{ x: 0.5, y: 1 }}
    >
      <View style={styles.wrapper}>
        <View style={styles.pin}>
          <View style={styles.iconWrapper}>
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
              <Rect x="3" y="3" width="18" height="18" rx="2" />
              <Path d="M9 22V12h6v10" />
              <Path d="M9 7h1m4 0h1M9 11h1m4 0h1" />
            </Svg>
          </View>
        </View>
        <View style={styles.pointer} />
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
    backgroundColor: "#F59E0B",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  iconWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  pointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#F59E0B",
    alignSelf: "center",
    marginTop: -1,
  },
});

export default HotelMarker;

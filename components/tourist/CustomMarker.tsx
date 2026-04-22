import React from "react";
import { StyleSheet, View } from "react-native";
import { LatLng, Marker } from "react-native-maps";

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
      <View style={styles.outerRing}>
        <View style={styles.innerDot} />
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  outerRing: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#5B9BD5",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#5B9BD5",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  innerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
  },
});

export default CustomMarker;

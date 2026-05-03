import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { LatLng, Marker } from "react-native-maps";

interface LiveLocationMarkerProps {
  coordinate: LatLng;
}

function LiveLocationMarker({ coordinate }: LiveLocationMarkerProps) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.18,
          duration: 850,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 850,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [scale]);

  return (
    <Marker
      coordinate={coordinate}
      tracksViewChanges={false}
      zIndex={9999}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <Animated.View style={[styles.pulse, { transform: [{ scale }] }]}>
        <View style={styles.outerRing}>
          <View style={styles.innerDot} />
        </View>
      </Animated.View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  pulse: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(91,155,213,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  outerRing: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#5B9BD5",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#5B9BD5",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  innerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
  },
});

export default LiveLocationMarker;

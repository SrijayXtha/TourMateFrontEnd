import * as Location from "expo-location";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";
import { mockGuides, mockHotels } from "../../data/mockData";
import { TouristTopBar } from "../common/TouristTopBar";

interface TouristMapProps {
  onBack: () => void;
  onNavigate: (screen: string, data?: any) => void;
}

interface Coordinate {
  latitude: number;
  longitude: number;
}

interface MapMarker extends Coordinate {
  id: string;
  name: string;
  kind: "guide" | "hotel";
  location: string;
  rating?: number;
  price?: string;
  distanceKm?: number;
}

const DEFAULT_CENTER: Coordinate = { latitude: 28.416, longitude: 82.211 };
const NEARBY_RADIUS_KM = 220;
const MIN_VISIBLE_MARKERS = 6;
const MAX_VISIBLE_MARKERS = 12;

const LOCATION_COORDINATES: (Coordinate & { key: string })[] = [
  { key: "lalitpur", latitude: 27.6644, longitude: 85.3188 },
  { key: "kathmandu", latitude: 27.7172, longitude: 85.324 },
  { key: "boudha", latitude: 27.7215, longitude: 85.362 },
  { key: "battisputali", latitude: 27.7069, longitude: 85.3449 },
  { key: "lakeside", latitude: 28.2101, longitude: 83.9591 },
  { key: "pokhara", latitude: 28.2096, longitude: 83.9856 },
  { key: "chitwan", latitude: 27.5291, longitude: 84.3542 },
  { key: "goa", latitude: 15.2993, longitude: 74.124 },
  { key: "jaipur", latitude: 26.9124, longitude: 75.7873 },
  { key: "jaisalmer", latitude: 26.9157, longitude: 70.9083 },
  { key: "rishikesh", latitude: 30.0869, longitude: 78.2676 },
];

const normalize = (value: string): string =>
  String(value || "")
    .trim()
    .toLowerCase();

const toSeed = (value: string): number => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isFinite(parsed)) {
    return parsed;
  }

  return value
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
};

const jitterCoordinate = (coordinate: Coordinate, seed: number): Coordinate => {
  const latOffset = ((seed % 5) - 2) * 0.012;
  const lonOffset = (((seed * 7) % 5) - 2) * 0.012;

  return {
    latitude: coordinate.latitude + latOffset,
    longitude: coordinate.longitude + lonOffset,
  };
};

const resolveCoordinates = (location: string): Coordinate | null => {
  const normalizedLocation = normalize(location);

  for (const entry of LOCATION_COORDINATES) {
    if (normalizedLocation.includes(entry.key)) {
      return { latitude: entry.latitude, longitude: entry.longitude };
    }
  }

  return null;
};

const toRadians = (value: number) => (value * Math.PI) / 180;

const haversineDistanceKm = (from: Coordinate, to: Coordinate): number => {
  const earthRadiusKm = 6371;
  const latDelta = toRadians(to.latitude - from.latitude);
  const lonDelta = toRadians(to.longitude - from.longitude);
  const fromLat = toRadians(from.latitude);
  const toLat = toRadians(to.latitude);

  const a =
    Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
    Math.cos(fromLat) * Math.cos(toLat) * Math.sin(lonDelta / 2) * Math.sin(lonDelta / 2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const selectNearbyMarkers = (markers: MapMarker[], origin: Coordinate): MapMarker[] => {
  const ranked = markers
    .map((marker) => {
      const distanceKm = Number.parseFloat(
        haversineDistanceKm(origin, {
          latitude: marker.latitude,
          longitude: marker.longitude,
        }).toFixed(1)
      );

      return {
        ...marker,
        distanceKm,
      };
    })
    .sort((first, second) => first.distanceKm - second.distanceKm);

  return ranked
    .filter((marker, index) => marker.distanceKm <= NEARBY_RADIUS_KM || index < MIN_VISIBLE_MARKERS)
    .slice(0, MAX_VISIBLE_MARKERS);
};

const buildMapHtml = (initialPayload: {
  userLocation: Coordinate | null;
  guides: MapMarker[];
  hotels: MapMarker[];
}) => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link
      rel="stylesheet"
      href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
      crossorigin=""
    />
    <style>
      html,
      body,
      #map {
        width: 100%;
        height: 100%;
        margin: 0;
        padding: 0;
        background: #ffffff;
      }
      .marker-shell {
        background: transparent;
        border: none;
      }
      .marker-dot {
        width: 24px;
        height: 24px;
        border-radius: 999px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ffffff;
        font-size: 11px;
        font-weight: 700;
        border: 2px solid #ffffff;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.28);
      }
      .marker-guide {
        background: #0ea5e9;
      }
      .marker-hotel {
        background: #16a34a;
      }
      .popup-title {
        color: #111827;
        font-weight: 700;
        font-size: 13px;
        margin-bottom: 3px;
      }
      .popup-subtitle {
        color: #4b5563;
        font-size: 11px;
        margin-bottom: 2px;
      }
      .popup-meta {
        color: #1f2937;
        font-size: 11px;
      }
      .legend {
        position: absolute;
        right: 10px;
        bottom: 10px;
        z-index: 999;
        background: rgba(255, 255, 255, 0.92);
        border-radius: 8px;
        padding: 8px 10px;
        color: #374151;
        box-shadow: 0 2px 7px rgba(0, 0, 0, 0.2);
        font-family: Arial, sans-serif;
        font-size: 11px;
      }
      .legend-row {
        display: flex;
        align-items: center;
        gap: 6px;
        margin: 2px 0;
      }
      .legend-bullet {
        width: 10px;
        height: 10px;
        border-radius: 999px;
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <div class="legend">
      <div class="legend-row"><span class="legend-bullet" style="background:#0ea5e9;"></span>Guides</div>
      <div class="legend-row"><span class="legend-bullet" style="background:#16a34a;"></span>Hotels</div>
      <div class="legend-row"><span class="legend-bullet" style="background:#1b73e8;"></span>Your Location</div>
    </div>

    <script
      src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
      integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
      crossorigin=""
    ></script>
    <script>
      const initialPayload = ${JSON.stringify(initialPayload)};
      const defaultCenter = [${DEFAULT_CENTER.latitude}, ${DEFAULT_CENTER.longitude}];

      const state = {
        map: null,
        guideLayer: null,
        hotelLayer: null,
        userMarker: null,
        hasFittedOnce: false,
      };

      const guideIcon = L.divIcon({
        className: "marker-shell",
        html: '<div class="marker-dot marker-guide">G</div>',
        iconSize: [24, 24],
        iconAnchor: [12, 22],
        popupAnchor: [0, -18],
      });

      const hotelIcon = L.divIcon({
        className: "marker-shell",
        html: '<div class="marker-dot marker-hotel">H</div>',
        iconSize: [24, 24],
        iconAnchor: [12, 22],
        popupAnchor: [0, -18],
      });

      function ensureMap() {
        if (state.map) {
          return;
        }

        state.map = L.map("map", {
          zoomControl: true,
          attributionControl: true,
        }).setView(defaultCenter, 7);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "&copy; OpenStreetMap contributors",
        }).addTo(state.map);

        state.guideLayer = L.layerGroup().addTo(state.map);
        state.hotelLayer = L.layerGroup().addTo(state.map);
      }

      function popupContent(marker, label) {
        const rating = marker.rating ? 'Rating: ' + marker.rating : '';
        const price = marker.price ? 'Price: ' + marker.price : '';
        const distance =
          typeof marker.distanceKm === "number" ? 'Distance: ' + marker.distanceKm + ' km' : '';

        return [
          '<div class="popup-title">' + marker.name + '</div>',
          '<div class="popup-subtitle">' + label + ' · ' + marker.location + '</div>',
          rating ? '<div class="popup-meta">' + rating + '</div>' : '',
          price ? '<div class="popup-meta">' + price + '</div>' : '',
          distance ? '<div class="popup-meta">' + distance + '</div>' : '',
        ].join('');
      }

      function drawMarkerLayer(layer, markers, icon, label) {
        layer.clearLayers();

        markers.forEach((marker) => {
          L.marker([marker.latitude, marker.longitude], { icon })
            .bindPopup(popupContent(marker, label))
            .on("click", () => {
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(
                  JSON.stringify({
                    type: "MARKER_TAP",
                    marker,
                  })
                );
              }
            })
            .addTo(layer);
        });
      }

      function drawUserMarker(location) {
        if (!location) {
          return;
        }

        const latLng = [location.latitude, location.longitude];

        if (!state.userMarker) {
          state.userMarker = L.circleMarker(latLng, {
            radius: 10,
            fillColor: "#1B73E8",
            color: "#FFFFFF",
            weight: 3,
            fillOpacity: 0.95,
          })
            .addTo(state.map)
            .bindPopup('<div class="popup-title">Your Live Location</div>');

          return;
        }

        state.userMarker.setLatLng(latLng);
      }

      function fitMapToPayload(payload) {
        if (state.hasFittedOnce) {
          return;
        }

        const points = [];

        payload.guides.forEach((marker) => points.push([marker.latitude, marker.longitude]));
        payload.hotels.forEach((marker) => points.push([marker.latitude, marker.longitude]));

        if (payload.userLocation) {
          points.push([payload.userLocation.latitude, payload.userLocation.longitude]);
        }

        if (points.length > 1) {
          state.map.fitBounds(points, { padding: [30, 30], maxZoom: 10 });
        } else if (payload.userLocation) {
          state.map.setView([payload.userLocation.latitude, payload.userLocation.longitude], 10);
        }

        state.hasFittedOnce = true;
      }

      window.__updateMap = function (payload) {
        ensureMap();

        drawMarkerLayer(state.guideLayer, payload.guides || [], guideIcon, "Guide");
        drawMarkerLayer(state.hotelLayer, payload.hotels || [], hotelIcon, "Hotel");
        drawUserMarker(payload.userLocation || null);
        fitMapToPayload(payload);
      };

      window.__updateMap(initialPayload);

      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: "MAP_READY" }));
      }
    </script>
  </body>
</html>
`;

export function TouristMap({ onBack, onNavigate }: TouristMapProps) {
  const webViewRef = useRef<WebView>(null);
  const [mapReady, setMapReady] = useState(false);
  const [userLocation, setUserLocation] = useState<Coordinate | null>(null);
  const [locationState, setLocationState] = useState<"pending" | "granted" | "denied">("pending");

  const guideMarkers = useMemo<MapMarker[]>(() => {
    return mockGuides.reduce<MapMarker[]>((markers, guide, index) => {
      const baseCoordinate = resolveCoordinates(guide.location || "");
      if (!baseCoordinate) {
        return markers;
      }

      const coordinate = jitterCoordinate(baseCoordinate, toSeed(guide.id) + index);

      markers.push({
        id: `guide-${guide.id}`,
        name: guide.name,
        kind: "guide",
        location: guide.location || "Unknown",
        rating: guide.rating,
        price: guide.pricePerDay,
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
      });

      return markers;
    }, []);
  }, []);

  const hotelMarkers = useMemo<MapMarker[]>(() => {
    return mockHotels.reduce<MapMarker[]>((markers, hotel, index) => {
      const baseCoordinate = resolveCoordinates(hotel.location || "");
      if (!baseCoordinate) {
        return markers;
      }

      const coordinate = jitterCoordinate(baseCoordinate, toSeed(hotel.id) + index + 21);

      markers.push({
        id: `hotel-${hotel.id}`,
        name: hotel.name,
        kind: "hotel",
        location: hotel.location || "Unknown",
        rating: hotel.rating,
        price: hotel.pricePerNight,
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
      });

      return markers;
    }, []);
  }, []);

  const initialPayload = useMemo(() => {
    return {
      userLocation: null,
      guides: selectNearbyMarkers(guideMarkers, DEFAULT_CENTER),
      hotels: selectNearbyMarkers(hotelMarkers, DEFAULT_CENTER),
    };
  }, [guideMarkers, hotelMarkers]);

  const mapHtml = useMemo(() => buildMapHtml(initialPayload), [initialPayload]);

  const mapPayload = useMemo(() => {
    const origin = userLocation || DEFAULT_CENTER;

    return {
      userLocation,
      guides: selectNearbyMarkers(guideMarkers, origin),
      hotels: selectNearbyMarkers(hotelMarkers, origin),
    };
  }, [guideMarkers, hotelMarkers, userLocation]);

  useEffect(() => {
    let isMounted = true;
    let locationSubscription: Location.LocationSubscription | null = null;

    const startLiveLocation = async () => {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (!isMounted) {
          return;
        }

        if (permission.status !== "granted") {
          setLocationState("denied");
          return;
        }

        setLocationState("granted");

        try {
          const currentPosition = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });

          if (isMounted) {
            setUserLocation({
              latitude: currentPosition.coords.latitude,
              longitude: currentPosition.coords.longitude,
            });
          }
        } catch {
          // Keep watching even if first fetch fails.
        }

        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 6000,
            distanceInterval: 25,
          },
          (position) => {
            if (!isMounted) {
              return;
            }

            setUserLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          }
        );
      } catch {
        if (isMounted) {
          setLocationState("denied");
        }
      }
    };

    void startLiveLocation();

    return () => {
      isMounted = false;
      locationSubscription?.remove();
    };
  }, []);

  useEffect(() => {
    if (!mapReady || !webViewRef.current) {
      return;
    }

    const script = `window.__updateMap && window.__updateMap(${JSON.stringify(mapPayload)}); true;`;
    webViewRef.current.injectJavaScript(script);
  }, [mapPayload, mapReady]);

  const statusMessage =
    locationState === "pending"
      ? "Requesting location permission for live tracking..."
      : locationState === "granted"
      ? "Live location enabled. Nearby guides and hotels are pinned."
      : "Location permission denied. Showing nearby pins around Nepal region.";

  return (
    <View style={styles.container}>
      <TouristTopBar
        title="OpenStreetMap"
        subtitle="28.416, 82.211"
        onBack={onBack}
      />

      <View style={styles.statusBanner}>
        <Text style={styles.statusText}>{statusMessage}</Text>
      </View>

      <WebView
        ref={webViewRef}
        source={{ html: mapHtml }}
        originWhitelist={["*"]}
        style={styles.webView}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        onMessage={(event) => {
          try {
            const payload = JSON.parse(event.nativeEvent.data || "{}");
            if (payload.type === "MAP_READY") {
              setMapReady(true);
              return;
            }

            if (payload.type === "MARKER_TAP" && payload.marker) {
              const markerId = String(payload.marker.id || "");

              if (markerId.startsWith("guide-")) {
                const guideId = markerId.replace("guide-", "");
                const selectedGuide = mockGuides.find((guide) => String(guide.id) === guideId);
                if (selectedGuide) {
                  onNavigate("guide-profile", selectedGuide);
                }
              }

              if (markerId.startsWith("hotel-")) {
                const hotelId = markerId.replace("hotel-", "");
                const selectedHotel = mockHotels.find((hotel) => String(hotel.id) === hotelId);
                if (selectedHotel) {
                  onNavigate("hotel-details", selectedHotel);
                }
              }
            }
          } catch {
            // Ignore non-JSON events from web content.
          }
        }}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1B73E8" />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  statusBanner: {
    backgroundColor: "#DBEAFE",
    borderBottomWidth: 1,
    borderBottomColor: "#BFDBFE",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  statusText: {
    color: "#1E3A8A",
    fontSize: 12,
    fontWeight: "600",
  },
  webView: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
});
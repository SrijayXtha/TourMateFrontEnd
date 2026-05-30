import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

let NativeWebView: any = null;
if (Platform.OS !== "web") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  NativeWebView = require("react-native-webview").WebView;
}

export interface HotelLocationValue {
  latitude: number;
  longitude: number;
  address: string;
}

interface HotelLocationPickerProps {
  value: HotelLocationValue | null;
  onChange: (value: HotelLocationValue) => void;
  error?: string;
  label?: string;
  searchPlaceholder?: string;
  helperText?: string;
  selectionTitle?: string;
  emptySelectionText?: string;
  searchValidationMessage?: string;
}

const MAP_EVENT_SOURCE = "tourmate-hotel-location-picker";
const DEFAULT_CENTER = {
  latitude: 27.6644,
  longitude: 85.3188,
};

const buildMapDocument = (initialValue: HotelLocationValue | null) => {
  const initialLatitude = initialValue?.latitude ?? DEFAULT_CENTER.latitude;
  const initialLongitude = initialValue?.longitude ?? DEFAULT_CENTER.longitude;
  const initialAddress = JSON.stringify(initialValue?.address ?? "");

  return `
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
          html, body, #map {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            overflow: hidden;
            font-family: Arial, sans-serif;
          }

          body {
            background: #f8fafc;
          }

          .leaflet-control-zoom {
            display: none;
          }

          .leaflet-control-attribution {
            background: rgba(255,255,255,0.86);
            border-radius: 8px;
            margin: 0 0 8px 8px;
            padding: 4px 6px;
            font-size: 10px;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script
          src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
          integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
          crossorigin=""
        ></script>
        <script>
          const SOURCE = "${MAP_EVENT_SOURCE}";
          const initialAddress = ${initialAddress};
          let marker = null;

          const postToParent = (payload) => {
            const message = JSON.stringify({ source: SOURCE, ...payload });
            if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
              window.ReactNativeWebView.postMessage(message);
              return;
            }

            if (window.parent) {
              window.parent.postMessage(JSON.parse(message), "*");
            }
          };

          const map = L.map("map", {
            zoomControl: false,
            attributionControl: true,
          }).setView([${initialLatitude}, ${initialLongitude}], ${initialValue ? 15 : 12});

          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: "&copy; OpenStreetMap contributors"
          }).addTo(map);

          const reverseGeocode = async (latitude, longitude) => {
            const response = await fetch(
              "https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=" +
                encodeURIComponent(latitude) +
                "&lon=" +
                encodeURIComponent(longitude)
            );

            if (!response.ok) {
              throw new Error("Unable to reverse geocode location");
            }

            const payload = await response.json();
            return String(payload.display_name || "").trim();
          };

          const geocodeAddress = async (query) => {
            const response = await fetch(
              "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=" +
                encodeURIComponent(query)
            );

            if (!response.ok) {
              throw new Error("Unable to geocode search query");
            }

            const payload = await response.json();
            if (!Array.isArray(payload) || payload.length === 0) {
              throw new Error("No matching location found");
            }

            return payload[0];
          };

          const attachMarkerEvents = () => {
            if (!marker) {
              return;
            }

            marker.on("dragend", async function(event) {
              const position = event.target.getLatLng();
              try {
                postToParent({ type: "loading", loading: true });
                const address = await reverseGeocode(position.lat, position.lng);
                marker.bindPopup(address || "Selected hotel location").openPopup();
                postToParent({
                  type: "location-selected",
                  value: {
                    latitude: position.lat,
                    longitude: position.lng,
                    address
                  }
                });
              } catch (error) {
                postToParent({
                  type: "error",
                  message: error?.message || "Unable to update the selected location."
                });
              } finally {
                postToParent({ type: "loading", loading: false });
              }
            });
          };

          const setMarkerLocation = async (latitude, longitude, address) => {
            if (!marker) {
              marker = L.marker([latitude, longitude], { draggable: true }).addTo(map);
              attachMarkerEvents();
            } else {
              marker.setLatLng([latitude, longitude]);
            }

            const label = String(address || "").trim() || "Selected hotel location";
            marker.bindPopup(label).openPopup();
            map.setView([latitude, longitude], 15);
            postToParent({
              type: "location-selected",
              value: {
                latitude,
                longitude,
                address: label
              }
            });
          };

          const selectLocationFromMap = async (latitude, longitude) => {
            try {
              postToParent({ type: "loading", loading: true });
              const address = await reverseGeocode(latitude, longitude);
              await setMarkerLocation(latitude, longitude, address);
            } catch (error) {
              postToParent({
                type: "error",
                message: error?.message || "Unable to resolve that map position."
              });
            } finally {
              postToParent({ type: "loading", loading: false });
            }
          };

          map.on("click", async function(event) {
            await selectLocationFromMap(event.latlng.lat, event.latlng.lng);
          });

          window.TourMateHotelMap = {
            receiveCommand: async function(command) {
              if (!command || typeof command !== "object") {
                return;
              }

              if (command.type === "search") {
                try {
                  postToParent({ type: "loading", loading: true });
                  const result = await geocodeAddress(String(command.query || ""));
                  await setMarkerLocation(
                    Number(result.lat),
                    Number(result.lon),
                    String(result.display_name || "")
                  );
                } catch (error) {
                  postToParent({
                    type: "error",
                    message: error?.message || "Unable to find that location."
                  });
                } finally {
                  postToParent({ type: "loading", loading: false });
                }
              }
            }
          };

          window.addEventListener("message", async function(event) {
            const command = event.data;
            if (command && command.source === SOURCE) {
              await window.TourMateHotelMap.receiveCommand(command);
            }
          });

          if (initialAddress) {
            marker = L.marker([${initialLatitude}, ${initialLongitude}], { draggable: true }).addTo(map);
            attachMarkerEvents();
            marker.bindPopup(initialAddress).openPopup();
          }
        </script>
      </body>
    </html>
  `;
};

export function HotelLocationPicker({
  value,
  onChange,
  error,
  label = "Hotel Location *",
  searchPlaceholder = "Search hotel name, address, or place",
  helperText = "Search first, then tap the map or drag the marker to pinpoint your hotel.",
  selectionTitle = "Selected Address",
  emptySelectionText = "No location selected yet.",
  searchValidationMessage = "Enter a hotel name, address, or place to search.",
}: HotelLocationPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [mapError, setMapError] = useState("");
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const webViewRef = useRef<any>(null);

  const mapDocument = useMemo(() => buildMapDocument(value), [value]);

  useEffect(() => {
    if (Platform.OS !== "web") {
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      const payload = event.data;
      if (!payload || payload.source !== MAP_EVENT_SOURCE) {
        return;
      }

      if (payload.type === "loading") {
        setIsSearching(Boolean(payload.loading));
        return;
      }

      if (payload.type === "error") {
        setMapError(String(payload.message || "Unable to update map location."));
        setIsSearching(false);
        return;
      }

      if (payload.type === "location-selected" && payload.value) {
        setMapError("");
        setIsSearching(false);
        onChange(payload.value);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onChange]);

  const handleNativeMessage = (event: any) => {
    try {
      const payload = JSON.parse(event?.nativeEvent?.data || "{}");
      if (payload.source !== MAP_EVENT_SOURCE) {
        return;
      }

      if (payload.type === "loading") {
        setIsSearching(Boolean(payload.loading));
        return;
      }

      if (payload.type === "error") {
        setMapError(String(payload.message || "Unable to update map location."));
        setIsSearching(false);
        return;
      }

      if (payload.type === "location-selected" && payload.value) {
        setMapError("");
        setIsSearching(false);
        onChange(payload.value);
      }
    } catch {
      setMapError("Unable to read map selection. Please try again.");
      setIsSearching(false);
    }
  };

  const sendSearchCommand = () => {
    const query = searchQuery.trim();
    if (!query) {
      setMapError(searchValidationMessage);
      return;
    }

    setMapError("");
    setIsSearching(true);
    const command = {
      source: MAP_EVENT_SOURCE,
      type: "search",
      query,
    };

    if (Platform.OS === "web") {
      iframeRef.current?.contentWindow?.postMessage(command, "*");
      return;
    }

    webViewRef.current?.injectJavaScript(
      `window.TourMateHotelMap && window.TourMateHotelMap.receiveCommand(${JSON.stringify(
        command
      )}); true;`
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder={searchPlaceholder}
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity
          style={styles.searchButton}
          onPress={sendSearchCommand}
          disabled={isSearching}
        >
          {isSearching ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <MaterialCommunityIcons name="magnify" size={20} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.helperText}>{helperText}</Text>

      <View style={[styles.mapFrame, error && styles.mapFrameError]}>
        {Platform.OS === "web" ? (
          <iframe
            ref={iframeRef}
            title="Hotel location picker"
            srcDoc={mapDocument}
            style={styles.iframe as any}
          />
        ) : NativeWebView ? (
          <NativeWebView
            ref={webViewRef}
            originWhitelist={["*"]}
            source={{ html: mapDocument }}
            onMessage={handleNativeMessage}
            style={styles.nativeWebView}
          />
        ) : (
          <View style={styles.unavailableState}>
            <Text style={styles.unavailableText}>Map is unavailable on this device.</Text>
          </View>
        )}
      </View>

      <View style={styles.selectionCard}>
        <View style={styles.selectionHeader}>
          <MaterialCommunityIcons name="map-marker-radius" size={18} color="#1B73E8" />
          <Text style={styles.selectionTitle}>{selectionTitle}</Text>
        </View>
        <Text style={styles.selectionAddress}>
          {value?.address || emptySelectionText}
        </Text>
        {value ? (
          <Text style={styles.selectionMeta}>
            {value.latitude.toFixed(6)}, {value.longitude.toFixed(6)}
          </Text>
        ) : null}
      </View>

      {mapError ? <Text style={styles.errorText}>{mapError}</Text> : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  searchRow: {
    flexDirection: "row",
    gap: 10,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#111827",
  },
  searchButton: {
    width: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1B73E8",
  },
  helperText: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 18,
  },
  mapFrame: {
    height: 260,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    overflow: "hidden",
    backgroundColor: "#F3F4F6",
  },
  mapFrameError: {
    borderColor: "#EF4444",
  },
  iframe: {
    width: "100%",
    height: "100%",
    borderWidth: 0,
    borderColor: "transparent",
  },
  nativeWebView: {
    flex: 1,
    backgroundColor: "transparent",
  },
  unavailableState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  unavailableText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  selectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F8FAFC",
    padding: 14,
    gap: 6,
  },
  selectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  selectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1F2937",
  },
  selectionAddress: {
    fontSize: 14,
    color: "#111827",
    lineHeight: 20,
  },
  selectionMeta: {
    fontSize: 12,
    color: "#6B7280",
  },
  errorText: {
    fontSize: 12,
    color: "#DC2626",
    lineHeight: 18,
  },
});

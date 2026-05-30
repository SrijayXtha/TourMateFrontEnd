import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { LeafletMapFrame, type LeafletMapFrameRef } from "./LeafletMapFrame";
import {
  DEFAULT_KATHMANDU,
  MapEntity,
  SAMPLE_MAP_ENTITIES,
  toDestinationDetails,
  toGuideDetails,
  toHotelDetails,
} from "./mapData";

interface TouristMapProps {
  onBack: () => void;
  onNavigate: (screen: string, data?: any) => void;
}

interface Coordinate {
  latitude: number;
  longitude: number;
}

type FilterMode = "all" | "guides" | "hotels";

interface SearchResultState {
  kind: "none" | "message" | "error";
  text: string;
}

const showDialog = (title: string, message: string) => {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.alert(`${title}\n\n${message}`);
    return;
  }

  Alert.alert(title, message);
};

const normalize = (value: string) => value.trim().toLowerCase();

const haversineDistanceKm = (from: Coordinate, to: Coordinate) => {
  const earthRadiusKm = 6371;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const latDelta = toRadians(to.latitude - from.latitude);
  const lonDelta = toRadians(to.longitude - from.longitude);
  const fromLat = toRadians(from.latitude);
  const toLat = toRadians(to.latitude);

  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(fromLat) * Math.cos(toLat) * Math.sin(lonDelta / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const buildOsmUrl = (coordinate: Coordinate) =>
  `https://www.openstreetmap.org/?mlat=${coordinate.latitude}&mlon=${coordinate.longitude}#map=16/${coordinate.latitude}/${coordinate.longitude}`;

const buildDirectionsUrl = (from: Coordinate, to: Coordinate) =>
  `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${from.latitude}%2C${from.longitude}%3B${to.latitude}%2C${to.longitude}`;

const openExternalUrl = (url: string) => {
  if (typeof window !== "undefined") {
    window.open(url, "_blank", "noopener,noreferrer");
  }
};

export function TouristMap({ onBack, onNavigate }: TouristMapProps) {
  const mapRef = useRef<LeafletMapFrameRef | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const followUserRef = useRef(false);
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [menuVisible, setMenuVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchState, setSearchState] = useState<SearchResultState>({
    kind: "none",
    text: "",
  });
  const [searching, setSearching] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Coordinate | null>(null);
  const [mapCenter, setMapCenter] = useState<Coordinate>({
    latitude: DEFAULT_KATHMANDU.latitude,
    longitude: DEFAULT_KATHMANDU.longitude,
  });
  const [selectedEntityId, setSelectedEntityId] = useState("place-kathmandu");
  const [selectedLocationLabel, setSelectedLocationLabel] = useState(DEFAULT_KATHMANDU.name);
  const [selectedPlace, setSelectedPlace] = useState<MapEntity | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<Coordinate[]>([]);
  const [routeSummary, setRouteSummary] = useState("");
  const [navigationStarted, setNavigationStarted] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [followUser, setFollowUser] = useState(false);
  const [gpsButtonActive, setGpsButtonActive] = useState(false);
  const [locatingUser, setLocatingUser] = useState(false);

  useEffect(() => {
    if (!statusText) {
      return;
    }

    const timeout = window.setTimeout(() => setStatusText(""), 2400);
    return () => window.clearTimeout(timeout);
  }, [statusText]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  useEffect(() => {
    followUserRef.current = followUser;
  }, [followUser]);

  const filteredEntities = useMemo(() => {
    const base =
      filterMode === "guides"
        ? SAMPLE_MAP_ENTITIES.filter((item) => item.type === "guide")
        : filterMode === "hotels"
          ? SAMPLE_MAP_ENTITIES.filter((item) => item.type === "hotel")
          : SAMPLE_MAP_ENTITIES;

    const query = normalize(searchQuery);
    if (!query) {
      return base;
    }

    return base.filter((item) =>
      normalize(`${item.name} ${item.address} ${item.type} ${item.description}`).includes(query)
    );
  }, [filterMode, searchQuery]);

  const displayedMarkers = useMemo(() => {
    const markers = [...filteredEntities];
    if (selectedPlace && !markers.some((item) => item.id === selectedPlace.id)) {
      markers.push(selectedPlace);
    }
    return markers.map((item) => ({
      ...item,
      distance: currentLocation
        ? Number.parseFloat(
            haversineDistanceKm(currentLocation, {
              latitude: item.latitude,
              longitude: item.longitude,
            }).toFixed(1)
          )
        : item.distance,
    }));
  }, [currentLocation, filteredEntities, selectedPlace]);

  const selectedEntity = useMemo(() => {
    return (
      displayedMarkers.find((item) => item.id === selectedEntityId) ||
      selectedPlace ||
      displayedMarkers[0] ||
      SAMPLE_MAP_ENTITIES.find((item) => item.id === "place-kathmandu") ||
      null
    );
  }, [displayedMarkers, selectedEntityId, selectedPlace]);

  const detailCardTitle = useMemo(() => {
    if (selectedEntity) {
      return selectedEntity.name;
    }

    if (filterMode === "guides") {
      return `Guides near ${selectedLocationLabel}`;
    }

    if (filterMode === "hotels") {
      return `Hotels near ${selectedLocationLabel}`;
    }

    return selectedLocationLabel;
  }, [filterMode, selectedEntity, selectedLocationLabel]);

  const detailCardSubtitle = useMemo(() => {
    if (selectedEntity) {
      const bits = [
        selectedEntity.type === "guide"
          ? "Guide"
          : selectedEntity.type === "hotel"
            ? "Hotel"
            : "Place",
        selectedEntity.address,
        typeof selectedEntity.distance === "number"
          ? `${selectedEntity.distance} km away`
          : "",
      ].filter(Boolean);
      return bits.join(" • ");
    }

    if (filterMode === "guides") {
      return displayedMarkers.length > 0
        ? `${displayedMarkers.length} guides available nearby`
        : "No guides available nearby";
    }

    if (filterMode === "hotels") {
      return displayedMarkers.length > 0
        ? `${displayedMarkers.length} hotels available nearby`
        : "No hotels available nearby";
    }

    return "Heritage core and cultural hotspots";
  }, [displayedMarkers.length, filterMode, selectedEntity]);

  const handleMarkerSelect = (markerId: string) => {
    setSelectedEntityId(markerId);
    const marker = displayedMarkers.find((item) => item.id === markerId);
    if (marker) {
      setSelectedLocationLabel(marker.name);
      setMapCenter({ latitude: marker.latitude, longitude: marker.longitude });
      mapRef.current?.flyTo(
        { latitude: marker.latitude, longitude: marker.longitude },
        16,
        1
      );
      setFollowUser(false);
    }
  };

  const handleMenuAction = (action: FilterMode | "clear" | "close") => {
    setMenuVisible(false);

    if (action === "close") {
      return;
    }

    if (action === "clear") {
      setFilterMode("all");
      setSearchQuery("");
      setSearchState({ kind: "none", text: "" });
      setSelectedPlace(null);
      setSelectedEntityId("place-kathmandu");
      setSelectedLocationLabel(DEFAULT_KATHMANDU.name);
      const defaultCenter = {
        latitude: DEFAULT_KATHMANDU.latitude,
        longitude: DEFAULT_KATHMANDU.longitude,
      };
      setMapCenter(defaultCenter);
      mapRef.current?.flyTo(defaultCenter, 14, 1);
      setFollowUser(false);
      return;
    }

    setFilterMode(action);
    setSearchState({ kind: "none", text: "" });
  };

  const handleCompassReset = () => {
    const target = selectedEntity
      ? { latitude: selectedEntity.latitude, longitude: selectedEntity.longitude }
      : mapCenter;
    mapRef.current?.flyTo(target, 16, 1);
    setStatusText("Compass reset");
  };

  const handleLocationError = (error: GeolocationPositionError | null) => {
    setLocatingUser(false);

    if (error?.code === 1) {
      showDialog("Location Permission Required", "Location permission is required");
      return;
    }

    showDialog("Location Unavailable", "Please enable location services");
  };

  const startWatchingLocation = () => {
    if (!navigator.geolocation) {
      showDialog("Location Unavailable", "Please enable location services");
      return false;
    }

    if (watchIdRef.current !== null) {
      return true;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const coordinate = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        setCurrentLocation(coordinate);
        setLocatingUser(false);
        if (followUserRef.current) {
          mapRef.current?.flyTo(coordinate, 17, 0.9);
        }
      },
      (error) => {
        if (watchIdRef.current !== null && navigator.geolocation) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }
        handleLocationError(error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 3000,
        timeout: 15000,
      }
    );

    return true;
  };

  const handleCurrentLocation = async () => {
    if (!navigator.geolocation) {
      showDialog("Location Unavailable", "Please enable location services");
      return;
    }

    setGpsButtonActive(true);
    window.setTimeout(() => setGpsButtonActive(false), 700);
    setLocatingUser(true);
    setFollowUser(true);

    startWatchingLocation();

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coordinate = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        setCurrentLocation(coordinate);
        setMapCenter(coordinate);
        setSelectedLocationLabel("Your location");
        mapRef.current?.flyTo(coordinate, 17, 1);
        setStatusText("Centered on your current location");
        setLocatingUser(false);
      },
      (error) => {
        setFollowUser(navigationStarted);
        handleLocationError(error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 15000,
      }
    );
  };

  const handleSearch = async () => {
    const query = searchQuery.trim();
    if (!query) {
      setSearchState({ kind: "message", text: "Type something to search." });
      return;
    }

    const localResults = filteredEntities.filter((item) =>
      normalize(`${item.name} ${item.address} ${item.description}`).includes(normalize(query))
    );

    if (localResults.length > 0) {
      const firstResult = localResults[0];
      setSelectedPlace(null);
      setSelectedEntityId(firstResult.id);
      setSelectedLocationLabel(firstResult.name);
      setMapCenter({ latitude: firstResult.latitude, longitude: firstResult.longitude });
      mapRef.current?.flyTo(
        { latitude: firstResult.latitude, longitude: firstResult.longitude },
        16,
        1
      );
      setFollowUser(false);
      setSearchState({
        kind: "message",
        text: `${localResults.length} matching result${localResults.length === 1 ? "" : "s"} found.`,
      });
      return;
    }

    setSearching(true);
    setSearchState({ kind: "none", text: "" });

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(
          query
        )}`
      );

      if (!response.ok) {
        throw new Error("Search service is unavailable right now.");
      }

      const payload = await response.json();
      if (!Array.isArray(payload) || payload.length === 0) {
        setSearchState({ kind: "message", text: "No results found" });
        return;
      }

      const result = payload[0];
      const searchedPlace: MapEntity = {
        id: `search-${Date.now()}`,
        name: result.display_name?.split(",")[0] || query,
        type: "place",
        latitude: Number(result.lat),
        longitude: Number(result.lon),
        address: String(result.display_name || query),
        image:
          "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=600&q=80",
        rating: 4.5,
        description: "OpenStreetMap search result",
        category: "Search Result",
        price: "Free",
      };

      setSelectedPlace(searchedPlace);
      setSelectedEntityId(searchedPlace.id);
      setSelectedLocationLabel(searchedPlace.name);
      setMapCenter({
        latitude: searchedPlace.latitude,
        longitude: searchedPlace.longitude,
      });
      mapRef.current?.flyTo(
        { latitude: searchedPlace.latitude, longitude: searchedPlace.longitude },
        16,
        1
      );
      setFollowUser(false);
      setSearchState({ kind: "message", text: "Location found and centered on the map." });
    } catch (error: any) {
      setSearchState({
        kind: "error",
        text: error?.message || "Unable to search right now. Please try again.",
      });
    } finally {
      setSearching(false);
    }
  };

  const handleLocationChip = () => {
    const target = selectedEntity
      ? { latitude: selectedEntity.latitude, longitude: selectedEntity.longitude }
      : {
          latitude: DEFAULT_KATHMANDU.latitude,
          longitude: DEFAULT_KATHMANDU.longitude,
        };
    mapRef.current?.flyTo(target, 16, 1);
    setMapCenter(target);
    setSelectedLocationLabel(selectedEntity?.name || DEFAULT_KATHMANDU.name);
    setFollowUser(false);
  };

  const handleWebMap = () => {
    const target = selectedEntity || {
      latitude: mapCenter.latitude,
      longitude: mapCenter.longitude,
    };

    openExternalUrl(
      buildOsmUrl({
        latitude: target.latitude,
        longitude: target.longitude,
      })
    );
  };

  const handleViewDetails = () => {
    if (!selectedEntity) {
      return;
    }

    if (selectedEntity.type === "guide") {
      onNavigate("guide-profile", toGuideDetails(selectedEntity));
      return;
    }

    if (selectedEntity.type === "hotel") {
      onNavigate("hotel-details", toHotelDetails(selectedEntity));
      return;
    }

    onNavigate("destination-details", toDestinationDetails(selectedEntity));
  };

  const fetchRoute = async () => {
    if (!selectedEntity) {
      return false;
    }

    const from = currentLocation || {
      latitude: DEFAULT_KATHMANDU.latitude,
      longitude: DEFAULT_KATHMANDU.longitude,
    };

    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${from.longitude},${from.latitude};${selectedEntity.longitude},${selectedEntity.latitude}?overview=full&geometries=geojson`
      );

      if (!response.ok) {
        throw new Error("Routing service unavailable.");
      }

      const payload = await response.json();
      const route = payload?.routes?.[0];
      const coordinates = Array.isArray(route?.geometry?.coordinates)
        ? route.geometry.coordinates.map((item: [number, number]) => ({
            latitude: item[1],
            longitude: item[0],
          }))
        : [];

      if (coordinates.length > 1) {
        setRouteCoordinates(coordinates);
        const distanceKm = Number(route.distance / 1000).toFixed(1);
        const durationMin = Math.round(route.duration / 60);
        setRouteSummary(`${distanceKm} km • ${durationMin} min`);
        return true;
      }
    } catch {
      // Fall back below.
    }

    openExternalUrl(buildDirectionsUrl(from, selectedEntity));
    setStatusText("Opened external directions");
    return false;
  };

  const handleDirections = async () => {
    const success = await fetchRoute();
    if (success) {
      setStatusText("Route ready");
    }
  };

  const handleStartNavigation = async () => {
    if (!selectedEntity) {
      return;
    }

    if (!currentLocation) {
      await handleCurrentLocation();
    }

    const success = await fetchRoute();
    if (currentLocation) {
      mapRef.current?.flyTo(currentLocation, 17, 1);
      setMapCenter(currentLocation);
    }
    setNavigationStarted(true);
    setFollowUser(true);
    setStatusText(success ? "Navigation started" : "Opened external navigation");
  };

  const handleFilterShortcut = (mode: FilterMode) => {
    setFilterMode(mode);
    setSearchState({ kind: "none", text: "" });
    const nextMarker = SAMPLE_MAP_ENTITIES.find(
      (item) => item.type === (mode === "guides" ? "guide" : "hotel")
    );
    if (nextMarker) {
      setSelectedEntityId(nextMarker.id);
      setSelectedLocationLabel(nextMarker.name);
      setMapCenter({ latitude: nextMarker.latitude, longitude: nextMarker.longitude });
      mapRef.current?.flyTo(
        { latitude: nextMarker.latitude, longitude: nextMarker.longitude },
        16,
        1
      );
    }
  };

  return (
    <View style={styles.container}>
      <LeafletMapFrame
        ref={mapRef}
        center={mapCenter}
        markers={displayedMarkers}
        currentLocation={currentLocation}
        route={routeCoordinates}
        onMarkerSelect={handleMarkerSelect}
      />

      <View pointerEvents="box-none" style={styles.overlay}>
        <View style={styles.topRow}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onBack}
            activeOpacity={0.88}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#1F2937" />
          </TouchableOpacity>

          <View style={styles.topActions}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setMenuVisible(true)}
              activeOpacity={0.88}
            >
              <MaterialCommunityIcons name="menu" size={26} color="#1F2937" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleCompassReset}
              activeOpacity={0.88}
            >
              <MaterialCommunityIcons name="compass-outline" size={24} color="#1F2937" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.iconButton, gpsButtonActive && styles.iconButtonActive]}
              onPress={() => void handleCurrentLocation()}
              activeOpacity={0.88}
            >
              {locatingUser ? (
                <ActivityIndicator size="small" color="#1F2937" />
              ) : (
                <MaterialCommunityIcons name="crosshairs-gps" size={24} color="#1F2937" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.searchShell}>
          <MaterialCommunityIcons name="magnify" size={20} color="#6B7280" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search hotels, guides, places"
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
            onSubmitEditing={() => void handleSearch()}
          />
          <TouchableOpacity onPress={() => void handleSearch()} activeOpacity={0.85}>
            {searching ? (
              <ActivityIndicator size="small" color="#1D4ED8" />
            ) : (
              <Text style={styles.searchAction}>Go</Text>
            )}
          </TouchableOpacity>
        </View>

        {searchState.kind !== "none" ? (
          <View
            style={[
              styles.searchFeedback,
              searchState.kind === "error" && styles.searchFeedbackError,
            ]}
          >
            <Text
              style={[
                styles.searchFeedbackText,
                searchState.kind === "error" && styles.searchFeedbackTextError,
              ]}
            >
              {searchState.text}
            </Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={styles.locationChip}
          onPress={handleLocationChip}
          activeOpacity={0.9}
        >
          <MaterialCommunityIcons name="crosshairs-gps" size={16} color="#374151" />
          <Text style={styles.locationChipLabel}>{selectedLocationLabel}</Text>
        </TouchableOpacity>

        {statusText ? (
          <View style={styles.statusBanner}>
            <Text style={styles.statusBannerText}>{statusText}</Text>
          </View>
        ) : null}

        <View style={styles.bottomPanel}>
          <View style={styles.bottomPanelHeader}>
            <View style={styles.bottomPanelTitleWrap}>
              <Text style={styles.bottomPanelTitle}>{detailCardTitle}</Text>
              <Text style={styles.bottomPanelMeta}>{detailCardSubtitle}</Text>
              {routeSummary ? (
                <Text style={styles.routeText}>{routeSummary}</Text>
              ) : null}
              {navigationStarted ? (
                <Text style={styles.routeText}>Navigation started</Text>
              ) : null}
            </View>
            <TouchableOpacity
              style={styles.liveBadge}
              onPress={handleWebMap}
              activeOpacity={0.88}
            >
              <Text style={styles.liveBadgeText}>Web Map</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.typeRow}>
            <Text style={styles.typeBadge}>
              {selectedEntity
                ? selectedEntity.type === "guide"
                  ? "Guide"
                  : selectedEntity.type === "hotel"
                    ? "Hotel"
                    : "Place"
                : "Place"}
            </Text>
            {selectedEntity?.address ? (
              <Text style={styles.addressText}>{selectedEntity.address}</Text>
            ) : null}
          </View>

          <View style={styles.bottomActions}>
            <TouchableOpacity
              style={styles.bottomActionButton}
              onPress={() => handleFilterShortcut("guides")}
              activeOpacity={0.9}
            >
              <MaterialCommunityIcons name="account-group-outline" size={18} color="#1B73E8" />
              <Text style={styles.bottomActionText}>Guides</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.bottomActionButton}
              onPress={() => handleFilterShortcut("hotels")}
              activeOpacity={0.9}
            >
              <MaterialCommunityIcons name="bed-outline" size={18} color="#D97706" />
              <Text style={styles.bottomActionText}>Hotels</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.detailActions}>
            <TouchableOpacity
              style={styles.detailChip}
              onPress={handleViewDetails}
              activeOpacity={0.88}
            >
              <Text style={styles.detailChipText}>View details</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.detailChip}
              onPress={() => void handleDirections()}
              activeOpacity={0.88}
            >
              <Text style={styles.detailChipText}>Directions</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.detailChipPrimary}
              onPress={() => void handleStartNavigation()}
              activeOpacity={0.88}
            >
              <Text style={styles.detailChipPrimaryText}>Start</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <Modal visible={menuVisible} animationType="fade" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.menuCard}>
            <TouchableOpacity
              style={styles.menuAction}
              onPress={() => handleMenuAction("guides")}
            >
              <Text style={styles.menuActionText}>Show Guides</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuAction}
              onPress={() => handleMenuAction("hotels")}
            >
              <Text style={styles.menuActionText}>Show Hotels</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuAction}
              onPress={() => handleMenuAction("all")}
            >
              <Text style={styles.menuActionText}>Show All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuAction}
              onPress={() => handleMenuAction("clear")}
            >
              <Text style={styles.menuActionText}>Clear Search</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.menuAction, styles.menuCloseAction]}
              onPress={() => handleMenuAction("close")}
            >
              <Text style={styles.menuCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E5E7EB",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 18,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
    marginBottom: 18,
  },
  topActions: {
    flexDirection: "row",
    gap: 12,
  },
  iconButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.96)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 8,
  },
  iconButtonActive: {
    backgroundColor: "#DBEAFE",
    borderWidth: 1,
    borderColor: "#93C5FD",
  },
  searchShell: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.96)",
    borderRadius: 24,
    paddingHorizontal: 20,
    height: 72,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 20,
    color: "#111827",
  },
  searchAction: {
    color: "#1D4ED8",
    fontSize: 14,
    fontWeight: "700",
  },
  searchFeedback: {
    marginTop: 10,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.97)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignSelf: "flex-start",
    maxWidth: "90%",
  },
  searchFeedbackError: {
    backgroundColor: "#FEF2F2",
  },
  searchFeedbackText: {
    color: "#374151",
    fontSize: 13,
    fontWeight: "600",
  },
  searchFeedbackTextError: {
    color: "#B91C1C",
  },
  locationChip: {
    marginTop: 16,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 18,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.96)",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
  },
  locationChipLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  statusBanner: {
    marginTop: 12,
    alignSelf: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "rgba(17,24,39,0.88)",
  },
  statusBannerText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  bottomPanel: {
    marginTop: "auto",
    alignSelf: "center",
    width: "100%",
    maxWidth: 560,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.96)",
    padding: 18,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 10,
  },
  bottomPanelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 10,
  },
  bottomPanelTitleWrap: {
    flex: 1,
  },
  bottomPanelTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  bottomPanelMeta: {
    fontSize: 14,
    lineHeight: 20,
    color: "#64748B",
  },
  routeText: {
    marginTop: 4,
    fontSize: 12,
    color: "#1D4ED8",
    fontWeight: "700",
  },
  liveBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#DBEAFE",
  },
  liveBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1D4ED8",
  },
  typeRow: {
    marginBottom: 14,
  },
  typeBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "#EFF6FF",
    color: "#1D4ED8",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
  },
  addressText: {
    color: "#6B7280",
    fontSize: 13,
    lineHeight: 18,
  },
  bottomActions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  bottomActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    paddingVertical: 14,
  },
  bottomActionText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  detailActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  detailChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  detailChipText: {
    color: "#1D4ED8",
    fontSize: 12,
    fontWeight: "700",
  },
  detailChipPrimary: {
    borderRadius: 999,
    backgroundColor: "#1B73E8",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  detailChipPrimaryText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.22)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 90,
    paddingRight: 18,
  },
  menuCard: {
    width: 210,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    paddingVertical: 8,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 10,
  },
  menuAction: {
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  menuActionText: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "600",
  },
  menuCloseAction: {
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  menuCloseText: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "700",
  },
});

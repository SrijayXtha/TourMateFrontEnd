import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import * as Speech from "expo-speech";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Platform,
    Share,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import MapView, {
    Polyline,
    Region,
    UrlTile
} from "react-native-maps";
import { api } from "../../constants/api";
import { mockGuides, mockHotels } from "../../data/mockData";
import { openAppMenu } from "../common/menu";
import CustomMarker from "./CustomMarker";
import GuideMarker from "./GuideMarker";
import HotelMarker from "./HotelMarker";
import LiveLocationMarker from "./LiveLocationMarker";

interface TouristMapProps {
  onBack: () => void;
  onNavigate: (screen: string, data?: any) => void;
}

interface Coordinate {
  latitude: number;
  longitude: number;
}

type MarkerKind =
  | "guide"
  | "hotel"
  | "incident"
  | "hospital"
  | "museum"
  | "gallery"
  | "church"
  | "supermarket"
  | "university"
  | "government"
  | "school"
  | "college"
  | "temple"
  | "poi";

type MarkerGroup = "guide" | "place" | "incident";

interface MapMarker extends Coordinate {
  id: string;
  sourceId?: string;
  name: string;
  kind: MarkerKind;
  group: MarkerGroup;
  location: string;
  rating?: number;
  stars?: number;
  distanceKm?: number;
  description?: string;
  available?: boolean;
  specialty?: string;
  profileImage?: string;
}

interface InfrastructureSeed extends Coordinate {
  id: string;
  name: string;
  kind: Extract<MarkerKind, "hospital" | "government" | "school" | "college" | "temple">;
  location: string;
  description: string;
}

interface IncidentSeed extends Coordinate {
  id: string;
  name: string;
  location: string;
  description: string;
}

interface NearbyMarkerOptions {
  radiusKm?: number;
  minVisible?: number;
  maxVisible?: number;
}

interface HotelCluster {
  id: string;
  latitude: number;
  longitude: number;
  count: number;
}

const DEFAULT_CENTER: Coordinate = { latitude: 28.416, longitude: 82.211 };
// Use no-label/no-POI tiles so built-in point symbols from the basemap do not render.
const CARTO_LIGHT_TILE_TEMPLATE = "https://a.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png";
const INITIAL_REGION: Region = {
  latitude: DEFAULT_CENTER.latitude,
  longitude: DEFAULT_CENTER.longitude,
  latitudeDelta: 7,
  longitudeDelta: 7,
};

const NEARBY_RADIUS_KM = 220;
const MIN_VISIBLE_MARKERS = 6;
const MAX_VISIBLE_MARKERS = 18;
const GUIDE_RADIUS_METERS = 5000;
const HOTEL_RADIUS_METERS = 5000;
const LANDMARK_COLOR = "#6B5B2E";
const LANDMARK_MEDICAL_COLOR = "#8B3F63";
const LANDMARK_LABEL_FONT_SIZE = 11;

const LOCATION_COORDINATES: Array<Coordinate & { key: string; label: string }> = [
  { key: "lalitpur", label: "Lalitpur", latitude: 27.6644, longitude: 85.3188 },
  { key: "kathmandu", label: "Kathmandu", latitude: 27.7172, longitude: 85.324 },
  { key: "boudha", label: "Boudha", latitude: 27.7215, longitude: 85.362 },
  { key: "battisputali", label: "Battisputali", latitude: 27.7069, longitude: 85.3449 },
  { key: "lakeside", label: "Lakeside", latitude: 28.2101, longitude: 83.9591 },
  { key: "pokhara", label: "Pokhara", latitude: 28.2096, longitude: 83.9856 },
  { key: "chitwan", label: "Chitwan", latitude: 27.5291, longitude: 84.3542 },
  { key: "goa", label: "Goa", latitude: 15.2993, longitude: 74.124 },
  { key: "jaipur", label: "Jaipur", latitude: 26.9124, longitude: 75.7873 },
  { key: "jaisalmer", label: "Jaisalmer", latitude: 26.9157, longitude: 70.9083 },
  { key: "rishikesh", label: "Rishikesh", latitude: 30.0869, longitude: 78.2676 },
];

const KNOWN_INFRASTRUCTURES: InfrastructureSeed[] = [
  {
    id: "infra-hospital-bir",
    name: "Bir Hospital",
    kind: "hospital",
    location: "Kathmandu",
    description: "Major public hospital",
    latitude: 27.7049,
    longitude: 85.3135,
  },
  {
    id: "infra-hospital-patan",
    name: "Patan Hospital",
    kind: "hospital",
    location: "Lalitpur",
    description: "Regional trauma and emergency care",
    latitude: 27.671,
    longitude: 85.3193,
  },
  {
    id: "infra-hospital-teaching",
    name: "Teaching Hospital",
    kind: "hospital",
    location: "Maharajgunj",
    description: "University teaching hospital",
    latitude: 27.7358,
    longitude: 85.3315,
  },
  {
    id: "infra-hospital-pokhara",
    name: "Pokhara Health Sciences",
    kind: "hospital",
    location: "Pokhara",
    description: "Provincial health center",
    latitude: 28.2097,
    longitude: 83.985,
  },
  {
    id: "infra-hospital-bharatpur",
    name: "Bharatpur Hospital",
    kind: "hospital",
    location: "Chitwan",
    description: "District referral hospital",
    latitude: 27.678,
    longitude: 84.4364,
  },
  {
    id: "infra-gov-singha",
    name: "Singha Durbar",
    kind: "government",
    location: "Kathmandu",
    description: "Central government offices",
    latitude: 27.6988,
    longitude: 85.3194,
  },
  {
    id: "infra-gov-immigration",
    name: "Department of Immigration",
    kind: "government",
    location: "Kalikasthan",
    description: "Visa and travel services",
    latitude: 27.7078,
    longitude: 85.3273,
  },
  {
    id: "infra-gov-kmc",
    name: "Kathmandu Metro Office",
    kind: "government",
    location: "Kathmandu",
    description: "Municipal administration",
    latitude: 27.7046,
    longitude: 85.3208,
  },
  {
    id: "infra-gov-lalitpur",
    name: "Lalitpur Metro Office",
    kind: "government",
    location: "Lalitpur",
    description: "Municipal administration",
    latitude: 27.6663,
    longitude: 85.324,
  },
  {
    id: "infra-gov-pokhara",
    name: "Pokhara Metro Office",
    kind: "government",
    location: "Pokhara",
    description: "Municipal administration",
    latitude: 28.209,
    longitude: 83.9858,
  },
  {
    id: "infra-school-stxavier",
    name: "St Xavier School",
    kind: "school",
    location: "Jawalakhel",
    description: "Secondary school campus",
    latitude: 27.6719,
    longitude: 85.313,
  },
  {
    id: "infra-school-budhanilkantha",
    name: "Budhanilkantha School",
    kind: "school",
    location: "Budhanilkantha",
    description: "National school",
    latitude: 27.7797,
    longitude: 85.362,
  },
  {
    id: "infra-school-tripadma",
    name: "Tri Padma School",
    kind: "school",
    location: "Kathmandu",
    description: "Historic city school",
    latitude: 27.7177,
    longitude: 85.3155,
  },
  {
    id: "infra-school-gandaki",
    name: "Gandaki Boarding School",
    kind: "school",
    location: "Pokhara",
    description: "School and hostel campus",
    latitude: 28.2513,
    longitude: 83.9832,
  },
  {
    id: "infra-school-sainik",
    name: "Sainik Awasiya School",
    kind: "school",
    location: "Bhaktapur",
    description: "Military residential school",
    latitude: 27.7468,
    longitude: 85.3448,
  },
  {
    id: "infra-college-pulchowk",
    name: "Pulchowk Campus",
    kind: "college",
    location: "Lalitpur",
    description: "Engineering college",
    latitude: 27.6827,
    longitude: 85.3182,
  },
  {
    id: "infra-college-asc",
    name: "Amrit Science Campus",
    kind: "college",
    location: "Kathmandu",
    description: "Science and technology college",
    latitude: 27.7167,
    longitude: 85.3146,
  },
  {
    id: "infra-college-pnc",
    name: "Prithvi Narayan Campus",
    kind: "college",
    location: "Pokhara",
    description: "Tribhuvan University campus",
    latitude: 28.2242,
    longitude: 83.9918,
  },
  {
    id: "infra-college-ku",
    name: "Kathmandu University",
    kind: "college",
    location: "Dhulikhel",
    description: "University main campus",
    latitude: 27.6199,
    longitude: 85.5386,
  },
  {
    id: "infra-college-trichandra",
    name: "Tri Chandra College",
    kind: "college",
    location: "Kathmandu",
    description: "Historic higher education campus",
    latitude: 27.7067,
    longitude: 85.3189,
  },
  {
    id: "infra-temple-pashupati",
    name: "Pashupatinath Temple",
    kind: "temple",
    location: "Gaushala",
    description: "Major heritage temple zone",
    latitude: 27.7105,
    longitude: 85.3488,
  },
  {
    id: "infra-temple-swayambhu",
    name: "Swayambhunath",
    kind: "temple",
    location: "Kathmandu",
    description: "Hilltop temple complex",
    latitude: 27.7149,
    longitude: 85.2906,
  },
  {
    id: "infra-temple-budhanilkantha",
    name: "Budhanilkantha Temple",
    kind: "temple",
    location: "Budhanilkantha",
    description: "Sacred temple site",
    latitude: 27.779,
    longitude: 85.3673,
  },
  {
    id: "infra-temple-manakamana",
    name: "Manakamana Temple",
    kind: "temple",
    location: "Gorkha",
    description: "Pilgrimage temple",
    latitude: 27.8165,
    longitude: 84.6202,
  },
  {
    id: "infra-temple-talbarahi",
    name: "Tal Barahi Temple",
    kind: "temple",
    location: "Pokhara",
    description: "Temple on Phewa lake",
    latitude: 28.2095,
    longitude: 83.9567,
  },
];

const KNOWN_INCIDENTS: IncidentSeed[] = [
  {
    id: "incident-maitighar",
    name: "Traffic Disruption Alert",
    location: "Maitighar",
    description: "Intersection congestion reported",
    latitude: 27.6939,
    longitude: 85.3236,
  },
  {
    id: "incident-thamel",
    name: "Crowd Density Alert",
    location: "Thamel",
    description: "Heavy tourist crowd zone",
    latitude: 27.7154,
    longitude: 85.3123,
  },
  {
    id: "incident-koteshwor",
    name: "Road Repair Zone",
    location: "Koteshwor",
    description: "Road maintenance ongoing",
    latitude: 27.6784,
    longitude: 85.349,
  },
  {
    id: "incident-pokhara-lakeside",
    name: "Weather Caution",
    location: "Lakeside",
    description: "Low visibility after rain",
    latitude: 28.2085,
    longitude: 83.9594,
  },
  {
    id: "incident-chitwan-highway",
    name: "Highway Delay",
    location: "Chitwan",
    description: "Slow movement on arterial route",
    latitude: 27.5644,
    longitude: 84.4248,
  },
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

const selectNearbyMarkers = (
  markers: MapMarker[],
  origin: Coordinate,
  options: NearbyMarkerOptions = {}
): MapMarker[] => {
  const {
    radiusKm = NEARBY_RADIUS_KM,
    minVisible = MIN_VISIBLE_MARKERS,
    maxVisible = MAX_VISIBLE_MARKERS,
  } = options;

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
    .sort((first, second) => (first.distanceKm ?? 0) - (second.distanceKm ?? 0));

  return ranked
    .filter((marker, index) => (marker.distanceKm ?? 0) <= radiusKm || index < minVisible)
    .slice(0, maxVisible);
};

const formatLocationLabel = (coordinate: Coordinate | null): string => {
  if (!coordinate) {
    return "Current Area";
  }

  const nearest = LOCATION_COORDINATES.map((entry) => ({
    entry,
    distanceKm: haversineDistanceKm(coordinate, {
      latitude: entry.latitude,
      longitude: entry.longitude,
    }),
  })).sort((first, second) => first.distanceKm - second.distanceKm)[0];

  if (nearest && nearest.distanceKm <= 140) {
    return nearest.entry.label;
  }

  return "Live Location";
};

const markerDescription = (marker: MapMarker): string => {
  const parts: string[] = [];

  if (marker.description) {
    parts.push(marker.description);
  }

  if (marker.specialty) {
    parts.push(marker.specialty);
  }

  if (typeof marker.distanceKm === "number") {
    parts.push(`${marker.distanceKm} km away`);
  }

  return parts.length ? parts.join(" • ") : marker.location;
};

const clusterHotelMarkers = (markers: MapMarker[], latitudeDelta: number): HotelCluster[] => {
  const cellSize = Math.max(0.015, Math.min(0.08, latitudeDelta / 4));
  const bucket = new Map<string, MapMarker[]>();

  markers.forEach((marker) => {
    const latKey = Math.round(marker.latitude / cellSize);
    const lonKey = Math.round(marker.longitude / cellSize);
    const key = `${latKey}:${lonKey}`;
    const group = bucket.get(key) ?? [];
    group.push(marker);
    bucket.set(key, group);
  });

  const result: HotelCluster[] = [];

  bucket.forEach((group, key) => {
    if (group.length < 2) {
      return;
    }

    const latitude = group.reduce((sum, marker) => sum + marker.latitude, 0) / group.length;
    const longitude = group.reduce((sum, marker) => sum + marker.longitude, 0) / group.length;

    result.push({
      id: `cluster-${key}`,
      latitude,
      longitude,
      count: group.length,
    });
  });

  return result;
};

export function TouristMap({ onBack, onNavigate }: TouristMapProps) {
  const mapRef = useRef<MapView>(null);
  const hasInitialZoomRef = useRef(false);

  const [mapReady, setMapReady] = useState(false);
  const [userLocation, setUserLocation] = useState<Coordinate | null>(null);
  const [currentRegion, setCurrentRegion] = useState<Region>(INITIAL_REGION);
  const [dynamicHotels, setDynamicHotels] = useState<MapMarker[]>([]);
  const [backendGuides, setBackendGuides] = useState<MapMarker[]>([]);
  const [routeCoordinates, setRouteCoordinates] = useState<Coordinate[]>([]);
  const [routeSummary, setRouteSummary] = useState<string>("");
  const [isRouting, setIsRouting] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [routeSteps, setRouteSteps] = useState<string[]>([]);
  const [isVoiceMuted, setIsVoiceMuted] = useState(false);
  const [isVoiceNavigating, setIsVoiceNavigating] = useState(false);
  const [showRoutingControls, setShowRoutingControls] = useState(false);
  const [isNavigationMode, setIsNavigationMode] = useState(false);
  const [isMarkerSheetMinimized, setIsMarkerSheetMinimized] = useState(false);
  const [routeDistanceKm, setRouteDistanceKm] = useState<number | null>(null);
  const [routeDurationMin, setRouteDurationMin] = useState<number | null>(null);
  const [activeDestinationName, setActiveDestinationName] = useState("");
  const navTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ignoreNextMapPressRef = useRef(false);

  const fallbackGuideMarkers = useMemo<MapMarker[]>(() => {
    return mockGuides.reduce<MapMarker[]>((markers, guide, index) => {
      const baseCoordinate = resolveCoordinates(guide.location || "");
      if (!baseCoordinate) {
        return markers;
      }

      const coordinate = jitterCoordinate(baseCoordinate, toSeed(String(guide.id)) + index);
      markers.push({
        id: `guide-${guide.id}`,
        sourceId: String(guide.id),
        name: guide.name,
        kind: "guide",
        group: "guide",
        location: guide.location || "Unknown",
        rating: guide.rating,
        specialty: Array.isArray((guide as any).specialties)
          ? String((guide as any).specialties[0] || "City Tour")
          : "City Tour",
        profileImage:
          typeof (guide as any).photo === "string" ? (guide as any).photo : undefined,
        available: true,
        description: "Registered guide",
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
      });

      return markers;
    }, []);
  }, []);

  const fallbackHotelMarkers = useMemo<MapMarker[]>(() => {
    return mockHotels.reduce<MapMarker[]>((markers, hotel, index) => {
      const baseCoordinate = resolveCoordinates(hotel.location || "");
      if (!baseCoordinate) {
        return markers;
      }

      const coordinate = jitterCoordinate(baseCoordinate, toSeed(String(hotel.id)) + index + 21);
      markers.push({
        id: `hotel-${hotel.id}`,
        sourceId: String(hotel.id),
        name: hotel.name,
        kind: "hotel",
        group: "place",
        location: hotel.location || "Unknown",
        rating: hotel.rating,
        stars:
          Number.isFinite(Number(hotel.rating)) && Number(hotel.rating) > 0
            ? Number(hotel.rating)
            : undefined,
        description: "Hotel",
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
      });

      return markers;
    }, []);
  }, []);

  const infrastructureMarkers = useMemo<MapMarker[]>(() => {
    return KNOWN_INFRASTRUCTURES.map((entry) => ({
      id: entry.id,
      name: entry.name,
      kind: entry.kind,
      group: "place",
      location: entry.location,
      description: entry.description,
      latitude: entry.latitude,
      longitude: entry.longitude,
    }));
  }, []);

  const incidentMarkers = useMemo<MapMarker[]>(() => {
    return KNOWN_INCIDENTS.map((entry) => ({
      id: entry.id,
      name: entry.name,
      kind: "incident",
      group: "incident",
      location: entry.location,
      description: entry.description,
      latitude: entry.latitude,
      longitude: entry.longitude,
    }));
  }, []);

  const origin = userLocation || DEFAULT_CENTER;

  const guidePool = backendGuides.length ? backendGuides : fallbackGuideMarkers;
  const hotelPool = dynamicHotels.length ? dynamicHotels : fallbackHotelMarkers;

  const visibleGuides = useMemo(() => {
    return selectNearbyMarkers(guidePool, origin, {
      radiusKm: 120,
      minVisible: 6,
      maxVisible: 60,
    });
  }, [guidePool, origin]);

  const visibleHotels = useMemo(() => {
    return selectNearbyMarkers(hotelPool, origin, {
      radiusKm: 120,
      minVisible: 8,
      maxVisible: 120,
    });
  }, [hotelPool, origin]);

  const visibleInfrastructures = useMemo(() => {
    return selectNearbyMarkers(infrastructureMarkers, origin, {
      radiusKm: 340,
      minVisible: 18,
      maxVisible: 80,
    });
  }, [infrastructureMarkers, origin]);

  const visibleIncidents = useMemo(() => {
    return selectNearbyMarkers(incidentMarkers, origin, {
      radiusKm: 300,
      minVisible: 5,
      maxVisible: 24,
    });
  }, [incidentMarkers, origin]);

  const visiblePlaces = useMemo(() => {
    return [...visibleHotels, ...visibleInfrastructures];
  }, [visibleHotels, visibleInfrastructures]);

  const searchableMarkers = useMemo(() => {
    return [...visibleHotels, ...visibleGuides, ...visibleInfrastructures];
  }, [visibleHotels, visibleGuides, visibleInfrastructures]);

  const searchResults = useMemo(() => {
    const query = normalize(searchQuery);
    if (!query) {
      return [];
    }

    return searchableMarkers
      .filter((marker) => normalize(`${marker.name} ${marker.location}`).includes(query))
      .slice(0, 6);
  }, [searchQuery, searchableMarkers]);

  const showHotelClusters = currentRegion.latitudeDelta > 0.18;

  const hotelClusters = useMemo(() => {
    if (!showHotelClusters) {
      return [];
    }

    return clusterHotelMarkers(visibleHotels, currentRegion.latitudeDelta);
  }, [showHotelClusters, visibleHotels, currentRegion.latitudeDelta]);

  // Start live GPS and keep updating position.
  useEffect(() => {
    let isMounted = true;
    let subscription: Location.LocationSubscription | null = null;

    const startLiveLocation = async () => {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (!isMounted || permission.status !== "granted") {
          return;
        }

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
          // Keep watcher even when one-time fetch fails.
        }

        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 6000,
            distanceInterval: 20,
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
        // Keep fallback center.
      }
    };

    void startLiveLocation();

    return () => {
      isMounted = false;
      subscription?.remove();
    };
  }, []);

  // Fetch nearby hotels dynamically from Overpass API.
  useEffect(() => {
    let canceled = false;

    const fetchNearbyHotels = async () => {
      const center = userLocation || DEFAULT_CENTER;
      const overpassQuery = `[out:json];\nnode["tourism"="hotel"](around:${HOTEL_RADIUS_METERS},${center.latitude},${center.longitude});\nout body;`;

      try {
        const response = await fetch("https://overpass-api.de/api/interpreter", {
          method: "POST",
          headers: {
            "Content-Type": "text/plain;charset=UTF-8",
          },
          body: overpassQuery,
        });

        if (!response.ok) {
          throw new Error("Unable to fetch hotels from Overpass");
        }

        const json = await response.json();
        const elements = Array.isArray(json?.elements) ? json.elements : [];

        const hotels: MapMarker[] = elements
          .filter((item: any) => Number.isFinite(item?.lat) && Number.isFinite(item?.lon))
          .map((item: any, index: number) => {
            const tags = item?.tags || {};
            const starsRaw = Number(tags["stars"] || tags["hotel:stars"] || 0);
            const stars = Number.isFinite(starsRaw) && starsRaw > 0 ? starsRaw : undefined;

            return {
              id: `osm-hotel-${item.id || index}`,
              sourceId: String(item.id || index),
              name: String(tags.name || "Hotel"),
              kind: "hotel",
              group: "place",
              location: String(tags["addr:street"] || tags["addr:city"] || "Nearby"),
              description: "OpenStreetMap hotel",
              stars,
              rating: stars,
              latitude: Number(item.lat),
              longitude: Number(item.lon),
            } as MapMarker;
          })
          .slice(0, 180);

        if (!canceled && hotels.length) {
          setDynamicHotels(hotels);
        }
      } catch {
        if (!canceled) {
          setDynamicHotels([]);
        }
      }
    };

    void fetchNearbyHotels();

    return () => {
      canceled = true;
    };
  }, [userLocation]);

  // Fetch nearby guides from backend API with fallback to mock guides.
  useEffect(() => {
    let canceled = false;

    const fetchNearbyGuides = async () => {
      const center = userLocation || DEFAULT_CENTER;
      const radius = GUIDE_RADIUS_METERS;

      const parseGuideArray = (payload: any): any[] => {
        if (Array.isArray(payload)) {
          return payload;
        }

        if (Array.isArray(payload?.data?.guides)) {
          return payload.data.guides;
        }

        if (Array.isArray(payload?.guides)) {
          return payload.guides;
        }

        if (Array.isArray(payload?.data)) {
          return payload.data;
        }

        return [];
      };

      try {
        let response;

        try {
          response = await api.get("/api/guides", {
            params: { lat: center.latitude, lon: center.longitude, radius },
          });
        } catch {
          response = await api.get("/guides", {
            params: { lat: center.latitude, lon: center.longitude, radius },
          });
        }

        const guides = parseGuideArray(response?.data)
          .map((guide: any, index: number) => {
            const latitude = Number(guide?.lat ?? guide?.latitude);
            const longitude = Number(guide?.lon ?? guide?.longitude);

            if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
              return null;
            }

            const available = Boolean(
              guide?.available ?? guide?.isAvailable ?? guide?.is_available ?? false
            );

            return {
              id: `api-guide-${guide?.id ?? index}`,
              sourceId: String(guide?.id ?? ""),
              name: String(guide?.name || guide?.fullName || "Guide"),
              kind: "guide",
              group: "guide",
              location: String(guide?.location || "Nearby"),
              description: "Registered guide",
              specialty: String(guide?.specialty || guide?.speciality || "City Tour"),
              rating: Number.isFinite(Number(guide?.rating)) ? Number(guide.rating) : undefined,
              profileImage:
                typeof guide?.profileImage === "string" ? guide.profileImage : undefined,
              available,
              latitude,
              longitude,
            } as MapMarker;
          })
          .filter(Boolean) as MapMarker[];

        if (!canceled && guides.length) {
          setBackendGuides(guides);
        }
      } catch {
        if (!canceled) {
          setBackendGuides([]);
        }
      }
    };

    void fetchNearbyGuides();

    return () => {
      canceled = true;
    };
  }, [userLocation]);

  // Zoom to live location when map tab opens and first fix is ready.
  useEffect(() => {
    if (!mapReady || !mapRef.current || !userLocation || hasInitialZoomRef.current) {
      return;
    }

    mapRef.current.animateToRegion(
      {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      },
      650
    );

    hasInitialZoomRef.current = true;
  }, [mapReady, userLocation]);

  useEffect(() => {
    return () => {
      if (navTimerRef.current) {
        clearInterval(navTimerRef.current);
      }
      Speech.stop();
    };
  }, []);

  const topActionOffset = Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) + 18 : 52;
  const locationLabel = formatLocationLabel(userLocation);

  const handleMenuPress = () => {
    openAppMenu();
  };

  const handleCompassPress = () => {
    if (!mapRef.current) {
      return;
    }

    const focus = userLocation || DEFAULT_CENTER;
    mapRef.current.animateToRegion(
      {
        latitude: focus.latitude,
        longitude: focus.longitude,
        latitudeDelta: 0.12,
        longitudeDelta: 0.12,
      },
      420
    );
  };

  const handleLocatePress = () => {
    if (!mapRef.current) {
      return;
    }

    const focus = userLocation || DEFAULT_CENTER;
    mapRef.current.animateToRegion(
      {
        latitude: focus.latitude,
        longitude: focus.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      },
      420
    );
  };

  const stopVoiceNavigation = () => {
    if (navTimerRef.current) {
      clearInterval(navTimerRef.current);
      navTimerRef.current = null;
    }
    setIsVoiceNavigating(false);
    Speech.stop();
  };

  const resetRoutingState = () => {
    stopVoiceNavigation();
    setShowRoutingControls(false);
    setIsNavigationMode(false);
    setIsMarkerSheetMinimized(false);
    setRouteCoordinates([]);
    setRouteSummary("");
    setRouteSteps([]);
    setRouteDistanceKm(null);
    setRouteDurationMin(null);
    setActiveDestinationName("");
  };

  const startVoiceNavigation = () => {
    setShowRoutingControls(true);
    if (!routeSteps.length) {
      Alert.alert("No route", "Select a destination first to start directions.");
      return;
    }

    stopVoiceNavigation();
    setIsNavigationMode(true);
    setIsVoiceNavigating(true);

    if (isVoiceMuted) {
      return;
    }

    let stepIndex = 0;
    Speech.speak(`Starting directions. ${routeSteps[0]}`, { rate: 0.95, pitch: 1.0 });
    navTimerRef.current = setInterval(() => {
      stepIndex += 1;
      if (stepIndex >= routeSteps.length) {
        Speech.speak("You have arrived at your destination.");
        stopVoiceNavigation();
        return;
      }
      Speech.speak(routeSteps[stepIndex], { rate: 0.95, pitch: 1.0 });
    }, 9000);
  };

  const consumeNextMapPress = () => {
    ignoreNextMapPressRef.current = true;
    setTimeout(() => {
      ignoreNextMapPressRef.current = false;
    }, 80);
  };

  const handleMapPress = () => {
    if (ignoreNextMapPressRef.current) {
      return;
    }
    setSelectedMarker(null);
    setIsMarkerSheetMinimized(false);
  };

  const handleSearchResultPress = (marker: MapMarker) => {
    resetRoutingState();
    consumeNextMapPress();
    setSearchQuery(marker.name);
    setSelectedMarker(marker);
    mapRef.current?.animateToRegion(
      {
        latitude: marker.latitude,
        longitude: marker.longitude,
        latitudeDelta: 0.025,
        longitudeDelta: 0.025,
      },
      450
    );
  };

  const handleViewDetails = (marker: MapMarker) => {
    if (marker.kind === "hotel" && marker.sourceId) {
      const selectedHotel = mockHotels.find((item) => String(item.id) === marker.sourceId);
      if (selectedHotel) {
        onNavigate("hotel-details", selectedHotel);
        return;
      }
    }

    if (marker.kind === "guide" && marker.sourceId) {
      const selectedGuide = mockGuides.find((item) => String(item.id) === marker.sourceId);
      if (selectedGuide) {
        onNavigate("guide-profile", selectedGuide);
        return;
      }
    }

    Alert.alert(marker.name, markerDescription(marker));
  };

  const handleDirectionsPress = async (marker: MapMarker) => {
    setShowRoutingControls(true);
    setIsMarkerSheetMinimized(true);
    await buildRouteWithOSRM(marker, marker.name);
  };

  const handleShareMarker = async (marker: MapMarker) => {
    const shareLink = `https://tourmate.app/map/${encodeURIComponent(marker.kind)}/${encodeURIComponent(marker.sourceId || marker.id)}`;
    await Share.share({
      title: `${marker.name} - TourMate`,
      message: `Check this place on TourMate: ${marker.name} (${marker.location}) ${shareLink}`,
      url: shareLink,
    });
  };

  const handleSaveMarker = (marker: MapMarker) => {
    Alert.alert("Saved", `${marker.name} has been saved to your places.`);
  };

  const getMarkerImage = (marker: MapMarker): string => {
    if (marker.kind === "hotel" && marker.sourceId) {
      const selectedHotel = mockHotels.find((item) => String(item.id) === marker.sourceId);
      if (selectedHotel?.image) {
        return selectedHotel.image;
      }
    }

    if (marker.kind === "guide" && marker.sourceId) {
      const selectedGuide = mockGuides.find((item) => String(item.id) === marker.sourceId);
      if (typeof selectedGuide?.photo === "string") {
        return selectedGuide.photo;
      }
    }

    return "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=500&q=80";
  };

  const buildRouteWithOSRM = async (destination: Coordinate, destinationName: string) => {
    const originPoint = userLocation || DEFAULT_CENTER;

    setIsRouting(true);

    try {
      const url =
        `https://router.project-osrm.org/route/v1/driving/` +
        `${originPoint.longitude},${originPoint.latitude};${destination.longitude},${destination.latitude}` +
        `?overview=full&geometries=geojson&steps=true`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Routing service unavailable");
      }

      const json = await response.json();
      const firstRoute = Array.isArray(json?.routes) ? json.routes[0] : null;
      const coordinatesRaw = firstRoute?.geometry?.coordinates;

      if (!Array.isArray(coordinatesRaw) || coordinatesRaw.length < 2) {
        throw new Error("No route found");
      }

      const route = coordinatesRaw
        .filter((item: any) => Array.isArray(item) && item.length >= 2)
        .map((item: any) => ({
          latitude: Number(item[1]),
          longitude: Number(item[0]),
        }))
        .filter((item: Coordinate) => Number.isFinite(item.latitude) && Number.isFinite(item.longitude));

      if (route.length < 2) {
        throw new Error("Invalid route geometry");
      }

      const distanceKm = Number((Number(firstRoute.distance || 0) / 1000).toFixed(1));
      const durationMin = Math.max(1, Math.round(Number(firstRoute.duration || 0) / 60));
      const legs = Array.isArray(firstRoute?.legs) ? firstRoute.legs : [];
      const steps = legs.flatMap((leg: any) => (Array.isArray(leg?.steps) ? leg.steps : []));
      const spokenSteps = steps
        .map((step: any) => {
          const road = String(step?.name || "the road").trim();
          const instruction = String(step?.maneuver?.modifier || step?.maneuver?.type || "continue");
          return `Next, ${instruction} on ${road}`;
        })
        .filter(Boolean)
        .slice(0, 12);

      setRouteCoordinates(route);
      setRouteSummary(`${destinationName} • ${distanceKm} km • ${durationMin} min`);
      setRouteSteps(spokenSteps.length ? spokenSteps : [`Continue towards ${destinationName}`]);
      setRouteDistanceKm(distanceKm);
      setRouteDurationMin(durationMin);
      setActiveDestinationName(destinationName);

      if (mapRef.current) {
        mapRef.current.fitToCoordinates(route, {
          edgePadding: {
            top: 120,
            right: 60,
            bottom: 200,
            left: 60,
          },
          animated: true,
        });
      }
    } catch {
      Alert.alert("Route unavailable", "Could not fetch road-following directions right now.");
    } finally {
      setIsRouting(false);
    }
  };

  const handleHotelPress = (hotel: MapMarker) => {
    resetRoutingState();
    consumeNextMapPress();
    setSelectedMarker(hotel);
    setIsMarkerSheetMinimized(false);
  };

  const handleGuidePress = (guide: MapMarker) => {
    resetRoutingState();
    consumeNextMapPress();
    setSelectedMarker(guide);
    setIsMarkerSheetMinimized(false);
  };

  const handleGenericMarkerPress = (marker: MapMarker) => {
    resetRoutingState();
    consumeNextMapPress();
    setSelectedMarker(marker);
    setIsMarkerSheetMinimized(false);
  };

  return (
    <View style={styles.container}>
      {/* Map Theme: CartoDB Positron (OSM-based light style close to Google Maps light) */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={INITIAL_REGION}
        mapType="none"
        showsCompass
        showsUserLocation={false}
        onMapReady={() => setMapReady(true)}
        onRegionChangeComplete={(region) => setCurrentRegion(region)}
        onPress={handleMapPress}
      >
        <UrlTile urlTemplate={CARTO_LIGHT_TILE_TEMPLATE} maximumZ={20} flipY={false} zIndex={0} />

        {/* OSRM road-following route polyline */}
        {routeCoordinates.length > 1 ? (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#4285F4"
            strokeWidth={5}
            lineCap="round"
            lineJoin="round"
            geodesic
          />
        ) : null}

        {userLocation ? (
          <LiveLocationMarker
            coordinate={{ latitude: userLocation.latitude, longitude: userLocation.longitude }}
          />
        ) : null}

        {visibleHotels.map((hotel) => (
          <HotelMarker
            key={hotel.id}
            coordinate={{ latitude: hotel.latitude, longitude: hotel.longitude }}
            onPress={() => handleHotelPress(hotel)}
          />
        ))}

        {visibleGuides.map((guide) => (
          <GuideMarker
            key={guide.id}
            coordinate={{ latitude: guide.latitude, longitude: guide.longitude }}
            onPress={() => handleGuidePress(guide)}
            available={guide.available !== false}
          />
        ))}

        {visibleInfrastructures.map((marker) => (
          <CustomMarker
            key={marker.id}
            coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
            onPress={() => handleGenericMarkerPress(marker)}
          />
        ))}

        {visibleIncidents.map((marker) => (
          <CustomMarker
            key={marker.id}
            coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
            onPress={() => handleGenericMarkerPress(marker)}
          />
        ))}
      </MapView>

      {!mapReady ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1B73E8" />
        </View>
      ) : null}

      {!isNavigationMode ? (
      <View pointerEvents="box-none" style={[styles.topActionOverlay, { top: topActionOffset }]}>
        <TouchableOpacity onPress={onBack} style={styles.topIconButton} activeOpacity={0.85}>
          <MaterialCommunityIcons name="arrow-left" size={21} color="#1F2937" />
        </TouchableOpacity>

        <View style={styles.topRightActions}>
          <TouchableOpacity onPress={handleMenuPress} style={styles.menuIconButton} activeOpacity={0.85}>
            <View style={styles.hamburgerIcon}>
              <View style={styles.hamburgerLine} />
              <View style={styles.hamburgerLine} />
              <View style={styles.hamburgerLine} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleCompassPress} style={styles.topIconButton} activeOpacity={0.85}>
            <MaterialCommunityIcons name="compass-outline" size={22} color="#1F2937" />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleLocatePress} style={styles.topIconButton} activeOpacity={0.85}>
            <MaterialCommunityIcons name="crosshairs-gps" size={21} color="#1F2937" />
          </TouchableOpacity>
        </View>
      </View>
      ) : null}

      {!isNavigationMode ? (
      <View style={styles.searchShell}>
        <MaterialCommunityIcons name="magnify" size={18} color="#6B7280" />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search hotels, guides, places"
          placeholderTextColor="#9CA3AF"
          style={styles.searchInput}
        />
      </View>
      ) : null}
      {searchResults.length > 0 ? (
        <View style={styles.searchResultsCard}>
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.searchResultItem} onPress={() => handleSearchResultPress(item)}>
                <Text style={styles.searchResultTitle}>{item.name}</Text>
                <Text style={styles.searchResultMeta}>{item.location}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      ) : null}

      {!isNavigationMode ? (
      <View style={styles.locationChip}>
        <MaterialCommunityIcons name="crosshairs-gps" size={14} color="#2f3d4f" />
        <Text style={styles.locationChipLabel}>{locationLabel}</Text>
      </View>
      ) : null}

      {showRoutingControls && !isNavigationMode ? (
        <View style={styles.directionsControls}>
          <TouchableOpacity style={styles.directionButton} onPress={startVoiceNavigation} activeOpacity={0.9}>
            <MaterialCommunityIcons name="play-circle-outline" size={18} color="#1B73E8" />
            <Text style={styles.directionButtonText}>Start</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.directionButton}
            onPress={() => {
              stopVoiceNavigation();
              setShowRoutingControls(false);
              setIsNavigationMode(false);
              setIsMarkerSheetMinimized(false);
              setRouteCoordinates([]);
              setRouteSummary("");
              setRouteSteps([]);
              setRouteDistanceKm(null);
              setRouteDurationMin(null);
              setActiveDestinationName("");
            }}
            activeOpacity={0.9}
          >
            <MaterialCommunityIcons name="stop-circle-outline" size={18} color="#DC2626" />
            <Text style={styles.directionButtonText}>End</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.voiceButton}
            onPress={() => {
              const next = !isVoiceMuted;
              setIsVoiceMuted(next);
              if (next) {
                Speech.stop();
              } else if (isVoiceNavigating && routeSteps[0]) {
                Speech.speak(routeSteps[0], { rate: 0.95 });
              }
            }}
            activeOpacity={0.9}
          >
            <MaterialCommunityIcons name={isVoiceMuted ? "volume-off" : "volume-high"} size={20} color="#1F2937" />
          </TouchableOpacity>
        </View>
      ) : null}

      {(isRouting || routeSummary) && !isNavigationMode ? (
        <View style={styles.routeChip}>
          <Text style={styles.routeChipText}>{isRouting ? "Routing..." : routeSummary}</Text>
        </View>
      ) : null}

      {selectedMarker ? (
        <View style={[styles.bottomSheetCard, isMarkerSheetMinimized && styles.bottomSheetCardMinimized]}>
          <TouchableOpacity
            style={styles.bottomSheetClose}
            onPress={() => {
              setSelectedMarker(null);
              setIsMarkerSheetMinimized(false);
            }}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="close" size={20} color="#374151" />
          </TouchableOpacity>

          {!isMarkerSheetMinimized ? (
            <>
          <Image source={{ uri: getMarkerImage(selectedMarker) }} style={styles.bottomSheetImage} />

          <View style={styles.bottomSheetImageActionsRow}>
            <View style={styles.bottomSheetInfo}>
              <Text style={styles.bottomSheetTitle}>{selectedMarker.name}</Text>
              <Text style={styles.bottomSheetMeta}>{selectedMarker.location}</Text>
              {selectedMarker.rating ? (
                <View style={styles.ratingRow}>
                  <MaterialCommunityIcons name="star" size={14} color="#F59E0B" />
                  <Text style={styles.ratingText}>{selectedMarker.rating.toFixed(1)}</Text>
                  {selectedMarker.stars ? (
                    <Text style={styles.ratingSubtext}>{` • ${selectedMarker.stars}-star`}</Text>
                  ) : null}
                </View>
              ) : null}
            </View>

            <View style={styles.bottomSheetIconActions}>
              <TouchableOpacity
                style={styles.iconActionButton}
                onPress={() => void handleShareMarker(selectedMarker)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="share-variant" size={20} color="#1F2937" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconActionButton}
                onPress={() => handleSaveMarker(selectedMarker)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="bookmark-outline" size={20} color="#1F2937" />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.bottomSheetMeta}>{markerDescription(selectedMarker)}</Text>

          {selectedMarker.kind === "hotel" ? (
            <View style={styles.bottomSheetActionsRow}>
              <TouchableOpacity style={styles.actionChip} onPress={() => handleViewDetails(selectedMarker)}>
                <Text style={styles.actionChipText}>View details</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionChip} onPress={() => void handleDirectionsPress(selectedMarker)}>
                <Text style={styles.actionChipText}>Directions</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionChip}
                onPress={async () => {
                  await handleDirectionsPress(selectedMarker);
                  startVoiceNavigation();
                }}
              >
                <Text style={styles.actionChipText}>Start</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          {selectedMarker.kind === "guide" ? (
            <View style={styles.bottomSheetActionsRow}>
              <TouchableOpacity style={styles.actionChip} onPress={() => handleViewDetails(selectedMarker)}>
                <Text style={styles.actionChipText}>View details</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionChip} onPress={() => void handleDirectionsPress(selectedMarker)}>
                <Text style={styles.actionChipText}>Directions</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          {selectedMarker.kind !== "hotel" && selectedMarker.kind !== "guide" ? (
            <TouchableOpacity
              style={styles.bottomSheetButton}
              onPress={() => void handleDirectionsPress(selectedMarker)}
              activeOpacity={0.9}
            >
              <Text style={styles.bottomSheetButtonText}>Directions</Text>
            </TouchableOpacity>
          ) : null}
            </>
          ) : (
            <View style={styles.minimizedMarkerRow}>
              <Text style={styles.minimizedMarkerTitle} numberOfLines={1}>
                {selectedMarker.name}
              </Text>
              <TouchableOpacity
                style={styles.minimizedExpandButton}
                onPress={() => setIsMarkerSheetMinimized(false)}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="chevron-up" size={18} color="#1F2937" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : null}

      {isNavigationMode ? (
        <>
          <View style={styles.navTopBanner}>
            <View style={styles.navTopMain}>
              <MaterialCommunityIcons name="arrow-up" size={22} color="#FFFFFF" />
              <Text style={styles.navTopText} numberOfLines={1}>
                toward {activeDestinationName || "Destination"}
              </Text>
            </View>
            <View style={styles.navThenCard}>
              <Text style={styles.navThenText}>Then</Text>
              <MaterialCommunityIcons name="arrow-top-right" size={16} color="#FFFFFF" />
            </View>
          </View>

          <View style={styles.navBottomPanel}>
            <View>
              <Text style={styles.navEtaText}>{routeDurationMin ?? 0} min</Text>
              <Text style={styles.navMetaText}>{routeDistanceKm ?? 0} km • live guidance</Text>
            </View>
            <View style={styles.navBottomActions}>
              <TouchableOpacity
                style={styles.navCircleButton}
                onPress={() => setIsVoiceMuted((prev) => !prev)}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons
                  name={isVoiceMuted ? "volume-off" : "volume-high"}
                  size={18}
                  color="#1F2937"
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.navExitButton}
                onPress={resetRoutingState}
                activeOpacity={0.9}
              >
                <Text style={styles.navExitText}>Exit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  map: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.75)",
    zIndex: 40,
  },
  topActionOverlay: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 50,
  },
  topIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.96)",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  menuIconButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  topRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  hamburgerIcon: {
    width: 18,
    justifyContent: "center",
    gap: 3,
  },
  hamburgerLine: {
    height: 2,
    backgroundColor: "#1F2937",
    borderRadius: 1,
  },
  searchShell: {
    position: "absolute",
    top: 102,
    left: 16,
    right: 16,
    height: 42,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.98)",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    gap: 8,
    zIndex: 46,
  },
  searchInput: {
    flex: 1,
    color: "#111827",
    fontSize: 14,
  },
  searchResultsCard: {
    position: "absolute",
    top: 148,
    left: 16,
    right: 16,
    maxHeight: 220,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    zIndex: 47,
  },
  searchResultItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  searchResultTitle: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "600",
  },
  searchResultMeta: {
    color: "#6B7280",
    fontSize: 12,
    marginTop: 2,
  },
  locationChip: {
    position: "absolute",
    top: 156,
    left: 16,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    flexDirection: "row",
    alignItems: "center",
    zIndex: 45,
  },
  locationChipLabel: {
    marginLeft: 6,
    color: "#2f3d4f",
    fontSize: 13,
    fontWeight: "600",
  },
  controlStack: {
    position: "absolute",
    left: 16,
    top: 146,
    zIndex: 45,
    gap: 8,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.96)",
    shadowColor: "#3A526B",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  controlButtonActive: {
    backgroundColor: "#ffffff",
  },
  controlButtonText: {
    color: "#667386",
    fontSize: 14,
    fontWeight: "700",
  },
  controlButtonTextActive: {
    color: "#1f3046",
  },
  // Marker styles
  landmarkMarkerShell: {
    width: 122,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  landmarkMarkerLabel: {
    marginTop: 1,
    color: LANDMARK_COLOR,
    fontSize: LANDMARK_LABEL_FONT_SIZE,
    fontWeight: "700",
    lineHeight: 12,
    textAlign: "center",
  },
  liveMarkerFlatShell: {
    width: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  liveMarkerFlatLabel: {
    marginTop: 1,
    color: "#3F78B5",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
  },

  // Callout styles
  calloutCard: {
    width: 230,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  calloutHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  calloutHeaderCopy: {
    flex: 1,
    marginLeft: 8,
  },
  calloutTitle: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },
  calloutSubtitle: {
    color: "#4B5563",
    fontSize: 12,
    fontWeight: "500",
  },
  calloutMeta: {
    color: "#4B5563",
    fontSize: 12,
    marginTop: 2,
  },
  calloutButton: {
    marginTop: 10,
    alignSelf: "flex-start",
    backgroundColor: "#1B73E8",
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  calloutButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  guideAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E5E7EB",
  },
  guideAvatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  simpleCallout: {
    minWidth: 140,
    paddingVertical: 4,
  },
  simpleCalloutTitle: {
    color: "#111827",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 2,
  },
  simpleCalloutText: {
    color: "#4B5563",
    fontSize: 11,
  },

  // Legend and info cards
  leftLegendCard: {
    position: "absolute",
    left: 14,
    bottom: 14,
    width: 150,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.96)",
    paddingHorizontal: 10,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    zIndex: 40,
  },
  rightLegendCard: {
    position: "absolute",
    right: 14,
    bottom: 14,
    width: 126,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.96)",
    paddingHorizontal: 10,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    zIndex: 40,
  },
  infrastructureCard: {
    position: "absolute",
    right: 14,
    bottom: 90,
    width: 182,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.96)",
    paddingHorizontal: 10,
    paddingVertical: 7,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    zIndex: 38,
  },
  infrastructureTitle: {
    color: "#1F2937",
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 1,
  },
  infrastructureText: {
    color: "#4B5563",
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "500",
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginVertical: 3,
  },
  legendText: {
    color: "#374151",
    fontSize: 11,
    fontWeight: "600",
  },
  legendBlueDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#1A73E8",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  legendOrangePin: {
    width: 12,
    height: 12,
    borderRadius: 4,
    backgroundColor: "#FF6D00",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  legendGreenPin: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#00C853",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  directionsControls: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 108,
    flexDirection: "row",
    gap: 8,
    zIndex: 41,
  },
  directionButton: {
    flex: 1,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.98)",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 8,
  },
  voiceButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.98)",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  directionButtonText: {
    color: "#1F2937",
    fontSize: 13,
    fontWeight: "700",
  },
  routeChip: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 178,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "rgba(17, 24, 39, 0.92)",
    zIndex: 40,
  },
  routeChipText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  bottomSheetCard: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 74,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
    zIndex: 42,
  },
  bottomSheetCardMinimized: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  bottomSheetTitle: {
    fontSize: 16,
    color: "#111827",
    fontWeight: "700",
    marginBottom: 4,
  },
  bottomSheetImage: {
    width: "100%",
    height: 120,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: "#E5E7EB",
  },
  bottomSheetMeta: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 2,
  },
  bottomSheetActionsRow: {
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  actionChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  actionChipText: {
    color: "#1D4ED8",
    fontSize: 12,
    fontWeight: "700",
  },
  bottomSheetButton: {
    marginTop: 10,
    alignSelf: "flex-start",
    backgroundColor: "#1B73E8",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bottomSheetButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  bottomSheetClose: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.92)",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    zIndex: 5,
  },
  bottomSheetImageActionsRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  bottomSheetInfo: {
    flex: 1,
    paddingRight: 8,
  },
  bottomSheetIconActions: {
    alignItems: "flex-end",
    justifyContent: "flex-start",
    gap: 8,
  },
  iconActionButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  ratingText: {
    color: "#111827",
    fontSize: 13,
    fontWeight: "700",
  },
  ratingSubtext: {
    color: "#6B7280",
    fontSize: 12,
    fontWeight: "600",
  },
  minimizedMarkerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
    paddingRight: 42,
  },
  minimizedMarkerTitle: {
    flex: 1,
    color: "#111827",
    fontSize: 14,
    fontWeight: "700",
  },
  minimizedExpandButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  navTopBanner: {
    position: "absolute",
    top: 58,
    left: 12,
    right: 12,
    zIndex: 60,
  },
  navTopMain: {
    backgroundColor: "#036666",
    borderRadius: 18,
    minHeight: 82,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  navTopText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  navThenCard: {
    marginTop: 8,
    alignSelf: "flex-start",
    backgroundColor: "#045d5d",
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    borderTopRightRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  navThenText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
  },
  navBottomPanel: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 20,
    minHeight: 84,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 60,
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 7,
  },
  navEtaText: {
    color: "#2A7E3B",
    fontSize: 34,
    fontWeight: "700",
    lineHeight: 38,
  },
  navMetaText: {
    color: "#4B5563",
    fontSize: 16,
    fontWeight: "500",
    marginTop: 2,
  },
  navBottomActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  navCircleButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  navExitButton: {
    minWidth: 90,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  navExitText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
});

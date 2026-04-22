import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
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

  const topActionOffset = Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) + 18 : 52;
  const locationLabel = formatLocationLabel(userLocation);

  const handleMenuPress = () => {
    Alert.alert("Menu", "Menu options will be available soon.");
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

  const buildRouteWithOSRM = async (destination: Coordinate, destinationName: string) => {
    const originPoint = userLocation || DEFAULT_CENTER;

    setIsRouting(true);

    try {
      const url =
        `https://router.project-osrm.org/route/v1/driving/` +
        `${originPoint.longitude},${originPoint.latitude};${destination.longitude},${destination.latitude}` +
        `?overview=full&geometries=geojson`;

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

      setRouteCoordinates(route);
      setRouteSummary(`${destinationName} • ${distanceKm} km • ${durationMin} min`);

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
    if (hotel.sourceId) {
      const selectedHotel = mockHotels.find((item) => String(item.id) === hotel.sourceId);
      if (selectedHotel) {
        onNavigate("hotel-details", selectedHotel);
        return;
      }
    }

    void buildRouteWithOSRM(hotel, hotel.name);
  };

  const handleGuidePress = (guide: MapMarker) => {
    if (guide.sourceId) {
      const selectedGuide = mockGuides.find((item) => String(item.id) === guide.sourceId);
      if (selectedGuide) {
        onNavigate("guide-profile", selectedGuide);
        return;
      }
    }

    Alert.alert(guide.name, markerDescription(guide));
  };

  const handleGenericMarkerPress = (marker: MapMarker) => {
    Alert.alert(marker.name, markerDescription(marker));
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

      <View pointerEvents="box-none" style={[styles.topActionOverlay, { top: topActionOffset }]}> 
        <TouchableOpacity onPress={onBack} style={styles.topIconButton} activeOpacity={0.85}>
          <MaterialCommunityIcons name="arrow-left" size={21} color="#1F2937" />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleMenuPress} style={styles.topIconButton} activeOpacity={0.85}>
          <MaterialCommunityIcons name="menu" size={22} color="#1F2937" />
        </TouchableOpacity>
      </View>

      <View style={styles.locationChip}>
        <MaterialCommunityIcons name="crosshairs-gps" size={14} color="#2f3d4f" />
        <Text style={styles.locationChipLabel}>{locationLabel}</Text>
      </View>

      <TouchableOpacity onPress={handleLocatePress} style={styles.locateButton} activeOpacity={0.9}>
        <Text style={styles.locateButtonText}>Loc</Text>
      </TouchableOpacity>

      {/* Bottom-left map legend */}
      <View style={styles.leftLegendCard}>
        <View style={styles.legendRow}>
          <View style={styles.legendBlueDot} />
          <Text style={styles.legendText}>Current/POI</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={styles.legendOrangePin} />
          <Text style={styles.legendText}>Hotel</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={styles.legendGreenPin} />
          <Text style={styles.legendText}>Tourist Guide</Text>
        </View>
      </View>

      {/* Infrastructure summary */}
      <View style={styles.infrastructureCard}>
        <Text style={styles.infrastructureTitle}>Infrastructure</Text>
        <Text style={styles.infrastructureText}>
          Hospitals • Schools • Colleges • Govt Offices • Temples • Parks • Water
        </Text>
      </View>

      {/* Bottom-right legend requested: only guides and hotels */}
      <View style={styles.rightLegendCard}>
        <View style={styles.legendRow}>
          <View style={styles.legendOrangePin} />
          <Text style={styles.legendText}>Hotels</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={styles.legendGreenPin} />
          <Text style={styles.legendText}>Guides</Text>
        </View>
      </View>

      {(isRouting || routeSummary) && (
        <View style={styles.routeChip}>
          <Text style={styles.routeChipText}>{isRouting ? "Routing..." : routeSummary}</Text>
        </View>
      )}
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
  locationChip: {
    position: "absolute",
    top: 96,
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
  locateButton: {
    position: "absolute",
    top: 146,
    right: 16,
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
    zIndex: 45,
  },
  locateButtonText: {
    color: "#3478f6",
    fontSize: 12,
    fontWeight: "700",
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
  routeChip: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 160,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(17, 24, 39, 0.82)",
    zIndex: 40,
  },
  routeChipText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
});

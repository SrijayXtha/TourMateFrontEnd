import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { StyleSheet, View } from "react-native";
import type { MapEntity } from "./mapData";

interface Coordinate {
  latitude: number;
  longitude: number;
}

interface LeafletMapFrameProps {
  center: Coordinate;
  markers: MapEntity[];
  currentLocation: Coordinate | null;
  route: Coordinate[];
  onMarkerSelect: (markerId: string) => void;
}

export interface LeafletMapFrameRef {
  flyTo: (target: Coordinate, zoom?: number, durationSeconds?: number) => void;
}

const MAP_SOURCE = "tourmate-web-map";
const MAP_COMMAND_SOURCE = "tourmate-web-map-host";

const buildMapDocument = (center: Coordinate) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          crossorigin=""
        />
        <style>
          html, body, #map {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            overflow: hidden;
          }

          body {
            background: #f8fafc;
          }

          .leaflet-control-zoom {
            display: none;
          }

          .leaflet-control-attribution {
            background: rgba(255,255,255,0.85);
            border-radius: 10px;
            margin: 0 0 10px 10px;
            padding: 3px 8px;
            font-size: 10px;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
        <script>
          const SOURCE = "${MAP_SOURCE}";
          const COMMAND_SOURCE = "${MAP_COMMAND_SOURCE}";
          const map = L.map("map", {
            zoomControl: false,
            attributionControl: true,
          }).setView([${center.latitude}, ${center.longitude}], 14);

          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: "&copy; OpenStreetMap contributors"
          }).addTo(map);

          const typeColor = {
            guide: "#16A34A",
            hotel: "#F97316",
            place: "#1D4ED8",
          };

          const markersLayer = L.layerGroup().addTo(map);
          const routeLayer = L.layerGroup().addTo(map);
          const currentLocationLayer = L.layerGroup().addTo(map);

          const renderMarkers = (markers) => {
            markersLayer.clearLayers();
            (Array.isArray(markers) ? markers : []).forEach((marker) => {
              const color = typeColor[marker.type] || "#1D4ED8";
              const circle = L.circleMarker([marker.latitude, marker.longitude], {
                radius: marker.type === "place" ? 8 : 9,
                color,
                fillColor: marker.type === "place" ? "#FFFFFF" : color,
                fillOpacity: 1,
                weight: 3,
              }).addTo(markersLayer);

              circle.on("click", () => {
                window.parent.postMessage({
                  source: SOURCE,
                  type: "marker-select",
                  markerId: marker.id,
                }, "*");
              });
            });
          };

          const renderRoute = (route) => {
            routeLayer.clearLayers();
            const routePoints = Array.isArray(route) ? route : [];
            if (routePoints.length > 1) {
              L.polyline(
                routePoints.map((point) => [point.latitude, point.longitude]),
                {
                  color: "#2563EB",
                  weight: 4,
                  opacity: 0.85,
                }
              ).addTo(routeLayer);
            }
          };

          const renderCurrentLocation = (currentLocation) => {
            currentLocationLayer.clearLayers();
            if (
              currentLocation &&
              Number.isFinite(currentLocation.latitude) &&
              Number.isFinite(currentLocation.longitude)
            ) {
              L.circleMarker([currentLocation.latitude, currentLocation.longitude], {
                radius: 10,
                color: "#2563EB",
                fillColor: "#60A5FA",
                fillOpacity: 0.95,
                weight: 3,
              }).addTo(currentLocationLayer).bindPopup("Your current location");
            }
          };

          window.addEventListener("message", (event) => {
            const payload = event.data;
            if (!payload || payload.source !== COMMAND_SOURCE) {
              return;
            }

            if (payload.type === "sync") {
              renderMarkers(payload.markers);
              renderRoute(payload.route);
              renderCurrentLocation(payload.currentLocation);
              return;
            }

            if (payload.type === "fly-to" && payload.target) {
              const zoom = Number.isFinite(payload.zoom) ? payload.zoom : map.getZoom();
              const duration = Number.isFinite(payload.durationSeconds)
                ? payload.durationSeconds
                : 1;
              map.flyTo(
                [payload.target.latitude, payload.target.longitude],
                zoom,
                { duration }
              );
            }
          });

          window.parent.postMessage({
            source: SOURCE,
            type: "map-ready",
          }, "*");
        </script>
      </body>
    </html>
  `;
};

export const LeafletMapFrame = forwardRef<LeafletMapFrameRef, LeafletMapFrameProps>(function LeafletMapFrame({
  center,
  markers,
  currentLocation,
  route,
  onMarkerSelect,
}: LeafletMapFrameProps, ref) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [mapReady, setMapReady] = React.useState(false);
  const mapDocument = useMemo(() => buildMapDocument(center), [center]);

  const postMapMessage = (payload: Record<string, unknown>) => {
    iframeRef.current?.contentWindow?.postMessage(
      {
        source: MAP_COMMAND_SOURCE,
        ...payload,
      },
      "*"
    );
  };

  useImperativeHandle(ref, () => ({
    flyTo(target: Coordinate, zoom = 17, durationSeconds = 1) {
      postMapMessage({
        type: "fly-to",
        target,
        zoom,
        durationSeconds,
      });
    },
  }));

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const payload = event.data;
      if (!payload || payload.source !== MAP_SOURCE) {
        return;
      }

      if (payload.type === "marker-select") {
        onMarkerSelect(String(payload.markerId || ""));
        return;
      }

      if (payload.type === "map-ready") {
        setMapReady(true);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onMarkerSelect]);

  useEffect(() => {
    if (!mapReady) {
      return;
    }

    postMapMessage({
      type: "sync",
      markers,
      currentLocation,
      route,
    });
  }, [currentLocation, mapReady, markers, route]);

  return (
    <View style={styles.container}>
      <iframe
        ref={iframeRef}
        title="TourMate Web Map"
        srcDoc={mapDocument}
        style={styles.iframe as any}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  iframe: {
    width: "100%",
    height: "100%",
    borderWidth: 0,
    borderColor: "transparent",
  },
});

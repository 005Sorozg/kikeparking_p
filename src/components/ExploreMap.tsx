import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import { Feather, Ionicons } from "@expo/vector-icons";
import {
  ParkingFilters,
  ParkingSpot,
  Coordinates,
  formatPrice,
  getNearby,
  getParkingSpots,
} from "../services/parking";
import { DEFAULT_LOCATION, getMyLocation } from "../services/location";
import { ImagePlaceholder } from "./ui";
import { colors, radius, shadow, spacing } from "../styles/theme";

// Con el mapa más alejado que esto (en grados de latitud), se agrupan por barrio
const NEIGHBORHOOD_ZOOM = 0.06;

// Región del mapa que deja ver todos los puntos, con un poco de margen
export function regionContaining(points: Coordinates[], minDelta = 0.01): Region {
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * 1.4, minDelta),
    longitudeDelta: Math.max((maxLng - minLng) * 1.4, minDelta),
  };
}

interface NeighborhoodGroup {
  neighborhood: string;
  center: Coordinates;
  points: Coordinates[];
}

// Junta los parqueaderos del mismo barrio en una sola burbuja (en el promedio de sus puntos)
function groupByNeighborhood(mockParkingSpots: ParkingSpot[]): NeighborhoodGroup[] {
  const groups = new Map<string, Coordinates[]>();

  for (const p of mockParkingSpots) {
    if (!p.location) continue;
    groups.set(p.neighborhood, [...(groups.get(p.neighborhood) ?? []), p.location]);
  }

  return [...groups.entries()].map(([neighborhood, points]) => ({
    neighborhood,
    points,
    center: {
      lat: points.reduce((sum, p) => sum + p.lat, 0) / points.length,
      lng: points.reduce((sum, p) => sum + p.lng, 0) / points.length,
    },
  }));
}

// Mapa de Explorar. Alejado: burbujas por barrio con la cantidad. Cerca: el precio
// de cada parqueadero; al tocarlo sale una tarjeta que abre el detalle.
export function ExploreMap({
  filters,
  onOpen,
}: {
  filters: ParkingFilters;
  onOpen: (id: string) => void;
}) {
  const mapRef = useRef<MapView>(null);
  // Región con la que arranca (null mientras se busca la ubicación)
  const [initial, setInitial] = useState<Region | null>(null);
  // Región que se ve ahora; cambia cuando el usuario mueve el mapa
  const [region, setRegion] = useState<Region | null>(null);
  const [myLocation, setMyLocation] = useState<Coordinates | null>(null);
  const [mockParkingSpots, setMockParkingSpots] = useState<ParkingSpot[]>([]);
  const [selected, setSelected] = useState<ParkingSpot | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Al abrir: ubicación del celular y los 10 parqueaderos más cercanos
  useEffect(() => {
    let active = true;

    (async () => {
      const me = await getMyLocation();
      const center = me ?? DEFAULT_LOCATION;
      let initialRegion: Region = {
        latitude: center.lat,
        longitude: center.lng,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      };

      try {
        const nearby = await getNearby(center, 10);
        if (nearby.length > 0) {
          initialRegion = regionContaining([
            center,
            ...nearby.map((p) => p.location!),
          ]);
          if (active) setMockParkingSpots(nearby);
        }
      } catch {
        // Si falla, el mapa igual abre y carga lo que se vea en pantalla
      }

      if (!active) return;
      setMyLocation(me);
      setInitial(initialRegion);
      setRegion(initialRegion);
    })();

    return () => {
      active = false;
    };
  }, []);

  // Cada vez que el mapa se mueve (o cambian los filtros) se piden los que se ven.
  // El retraso evita llamar al backend mientras el usuario todavía está arrastrando.
  useEffect(() => {
    if (!region) return;
    let active = true;

    const timer = setTimeout(async () => {
      try {
        const data = await getParkingSpots({
          ...filters,
          area: {
            minLat: region.latitude - region.latitudeDelta / 2,
            maxLat: region.latitude + region.latitudeDelta / 2,
            minLng: region.longitude - region.longitudeDelta / 2,
            maxLng: region.longitude + region.longitudeDelta / 2,
          },
        });
        if (active) {
          setMockParkingSpots(data);
          setError(null);
        }
      } catch (e) {
        if (active) {
          setError(e instanceof Error ? e.message : "No se pudo cargar el mapa.");
        }
      }
    }, 400);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [region, filters]);

  const zoomedOut = (region?.latitudeDelta ?? 0) > NEIGHBORHOOD_ZOOM;
  const groups = useMemo(() => groupByNeighborhood(mockParkingSpots), [mockParkingSpots]);

  const goToMyLocation = () => {
    if (!myLocation) return;
    mapRef.current?.animateToRegion(
      {
        latitude: myLocation.lat,
        longitude: myLocation.lng,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      },
      400,
    );
  };

  if (!initial) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.loadingText}>Buscando parqueaderos cerca de ti...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={initial}
        showsUserLocation={myLocation !== null}
        showsMyLocationButton={false}
        toolbarEnabled={false}
        onRegionChangeComplete={setRegion}
        onPress={(e) => {
          // Tocar el mapa (no un marcador) cierra la tarjeta
          if (e.nativeEvent.action !== "marker-press") setSelected(null);
        }}
      >
        {zoomedOut
          ? groups.map((g) => (
              <Marker
                key={`barrio-${g.neighborhood}`}
                coordinate={{ latitude: g.center.lat, longitude: g.center.lng }}
                onPress={() =>
                  // Al tocar la burbuja, se acerca a ese barrio
                  mapRef.current?.animateToRegion(regionContaining(g.points, 0.02), 400)
                }
              >
                <View style={styles.bubble}>
                  <View style={styles.bubbleCircle}>
                    <Text style={styles.bubbleCount}>{g.points.length}</Text>
                  </View>
                  <Text style={styles.bubbleNeighborhood} numberOfLines={1}>
                    {g.neighborhood}
                  </Text>
                </View>
              </Marker>
            ))
          : mockParkingSpots
              .filter((p) => p.location)
              .map((p) => {
                const active = selected?.id === p.id;
                return (
                  <Marker
                    key={p.id}
                    coordinate={{ latitude: p.location!.lat, longitude: p.location!.lng }}
                    onPress={() => setSelected(p)}
                  >
                    <View
                      style={[
                        styles.price,
                        active && styles.priceActive,
                        !p.available && styles.priceUnavailable,
                      ]}
                    >
                      <Text style={[styles.priceText, active && styles.priceTextActive]}>
                        {formatPrice(p.pricePerHour)}
                      </Text>
                    </View>
                  </Marker>
                );
              })}
      </MapView>

      {/* Arriba: cuántos hay en lo que se ve */}
      <View style={styles.counter}>
        <Text style={styles.counterText}>
          {error ??
            (mockParkingSpots.length === 0
              ? "No hay parqueaderos en esta zona"
              : `${mockParkingSpots.length} ${mockParkingSpots.length === 1 ? "parqueadero" : "parqueaderos"} en esta zona`)}
        </Text>
      </View>

      {myLocation && (
        <Pressable
          style={[styles.locationButton, selected && styles.locationButtonRaised]}
          onPress={goToMyLocation}
        >
          <Feather name="navigation" size={18} color={colors.text} />
        </Pressable>
      )}

      {/* Tarjeta del parqueadero tocado */}
      {selected && (
        <Pressable style={styles.card} onPress={() => onOpen(selected.id)}>
          <ImagePlaceholder style={styles.cardPhoto} iconSize={28} source={selected.image} />
          <View style={styles.cardTexts}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {selected.title}
            </Text>
            <Text style={styles.cardDetail} numberOfLines={1}>
              {selected.neighborhood} · {selected.address}
            </Text>
            <View style={styles.cardRow}>
              <Text style={styles.cardPrice}>
                {formatPrice(selected.pricePerHour)}
                <Text style={styles.cardUnit}> / hora</Text>
              </Text>
              <View style={styles.cardRating}>
                <Ionicons name="star" size={12} color={colors.black} />
                <Text style={styles.cardDetail}>
                  {selected.reviewCount > 0 ? selected.rating.toFixed(1) : "Nuevo"}
                </Text>
              </View>
            </View>
            {!selected.available && (
              <Text style={styles.cardUnavailable}>No disponible por ahora</Text>
            )}
          </View>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: 12,
    color: colors.textLight,
  },
  bubble: {
    alignItems: "center",
  },
  bubbleCircle: {
    minWidth: 40,
    height: 40,
    paddingHorizontal: 8,
    borderRadius: 20,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  bubbleCount: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.white,
  },
  bubbleNeighborhood: {
    marginTop: 3,
    maxWidth: 120,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
    backgroundColor: colors.white,
    fontSize: 11,
    fontWeight: "600",
    color: colors.text,
    overflow: "hidden",
  },
  price: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  priceActive: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  priceUnavailable: {
    opacity: 0.55,
  },
  priceText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
  },
  priceTextActive: {
    color: colors.white,
  },
  counter: {
    position: "absolute",
    top: spacing.sm,
    alignSelf: "center",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    ...shadow,
  },
  counterText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
  },
  locationButton: {
    position: "absolute",
    right: 16,
    bottom: 90,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    ...shadow,
  },
  locationButtonRaised: {
    bottom: 210,
  },
  card: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 80,
    flexDirection: "row",
    gap: 12,
    padding: 10,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    ...shadow,
  },
  cardPhoto: {
    width: 90,
    height: 90,
    borderRadius: radius.md,
  },
  cardTexts: {
    flex: 1,
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  cardDetail: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  cardPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  cardUnit: {
    fontSize: 12,
    fontWeight: "400",
  },
  cardRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  cardUnavailable: {
    fontSize: 11,
    color: colors.primary,
    marginTop: 3,
  },
});
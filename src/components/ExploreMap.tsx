import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import { Feather, Ionicons } from "@expo/vector-icons";
import {
  FiltrosParqueaderos,
  Parqueadero,
  Ubicacion,
  formatearPrecio,
  obtenerCercanos,
  obtenerParqueaderos,
} from "../services/parking";
import { UBICACION_POR_DEFECTO, obtenerMiUbicacion } from "../services/location";
import { ImagePlaceholder } from "./ui";
import { colors, radius, shadow, spacing } from "../styles/theme";

// Con el mapa más alejado que esto (en grados de latitud), se agrupan por barrio
const ZOOM_BARRIOS = 0.06;

// Región del mapa que deja ver todos los puntos, con un poco de margen
export function regionQueIncluya(puntos: Ubicacion[], deltaMinimo = 0.01): Region {
  const lats = puntos.map((p) => p.lat);
  const lngs = puntos.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * 1.4, deltaMinimo),
    longitudeDelta: Math.max((maxLng - minLng) * 1.4, deltaMinimo),
  };
}

interface GrupoBarrio {
  barrio: string;
  centro: Ubicacion;
  puntos: Ubicacion[];
}

// Junta los parqueaderos del mismo barrio en una sola burbuja (en el promedio de sus puntos)
function agruparPorBarrio(parqueaderos: Parqueadero[]): GrupoBarrio[] {
  const grupos = new Map<string, Ubicacion[]>();

  for (const p of parqueaderos) {
    if (!p.ubicacion) continue;
    grupos.set(p.barrio, [...(grupos.get(p.barrio) ?? []), p.ubicacion]);
  }

  return [...grupos.entries()].map(([barrio, puntos]) => ({
    barrio,
    puntos,
    centro: {
      lat: puntos.reduce((suma, p) => suma + p.lat, 0) / puntos.length,
      lng: puntos.reduce((suma, p) => suma + p.lng, 0) / puntos.length,
    },
  }));
}

// Mapa de Explorar. Alejado: burbujas por barrio con la cantidad. Cerca: el precio
// de cada parqueadero; al tocarlo sale una tarjeta que abre el detalle.
export function ExploreMap({
  filtros,
  onAbrir,
}: {
  filtros: FiltrosParqueaderos;
  onAbrir: (id: string) => void;
}) {
  const mapa = useRef<MapView>(null);
  // Región con la que arranca (null mientras se busca la ubicación)
  const [inicial, setInicial] = useState<Region | null>(null);
  // Región que se ve ahora; cambia cuando el usuario mueve el mapa
  const [region, setRegion] = useState<Region | null>(null);
  const [miUbicacion, setMiUbicacion] = useState<Ubicacion | null>(null);
  const [parqueaderos, setParqueaderos] = useState<Parqueadero[]>([]);
  const [seleccionado, setSeleccionado] = useState<Parqueadero | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Al abrir: ubicación del celular y los 10 parqueaderos más cercanos
  useEffect(() => {
    let activo = true;

    (async () => {
      const yo = await obtenerMiUbicacion();
      const centro = yo ?? UBICACION_POR_DEFECTO;
      let regionInicial: Region = {
        latitude: centro.lat,
        longitude: centro.lng,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      };

      try {
        const cercanos = await obtenerCercanos(centro, 10);
        if (cercanos.length > 0) {
          regionInicial = regionQueIncluya([
            centro,
            ...cercanos.map((p) => p.ubicacion!),
          ]);
          if (activo) setParqueaderos(cercanos);
        }
      } catch {
        // Si falla, el mapa igual abre y carga lo que se vea en pantalla
      }

      if (!activo) return;
      setMiUbicacion(yo);
      setInicial(regionInicial);
      setRegion(regionInicial);
    })();

    return () => {
      activo = false;
    };
  }, []);

  // Cada vez que el mapa se mueve (o cambian los filtros) se piden los que se ven.
  // El retraso evita llamar al backend mientras el usuario todavía está arrastrando.
  useEffect(() => {
    if (!region) return;
    let activo = true;

    const temporizador = setTimeout(async () => {
      try {
        const datos = await obtenerParqueaderos({
          ...filtros,
          area: {
            minLat: region.latitude - region.latitudeDelta / 2,
            maxLat: region.latitude + region.latitudeDelta / 2,
            minLng: region.longitude - region.longitudeDelta / 2,
            maxLng: region.longitude + region.longitudeDelta / 2,
          },
        });
        if (activo) {
          setParqueaderos(datos);
          setError(null);
        }
      } catch (e) {
        if (activo) {
          setError(e instanceof Error ? e.message : "No se pudo cargar el mapa.");
        }
      }
    }, 400);

    return () => {
      activo = false;
      clearTimeout(temporizador);
    };
  }, [region, filtros]);

  const alejado = (region?.latitudeDelta ?? 0) > ZOOM_BARRIOS;
  const grupos = useMemo(() => agruparPorBarrio(parqueaderos), [parqueaderos]);

  const irAMiUbicacion = () => {
    if (!miUbicacion) return;
    mapa.current?.animateToRegion(
      {
        latitude: miUbicacion.lat,
        longitude: miUbicacion.lng,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      },
      400,
    );
  };

  if (!inicial) {
    return (
      <View style={styles.cargando}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.cargandoTexto}>Buscando parqueaderos cerca de ti...</Text>
      </View>
    );
  }

  return (
    <View style={styles.contenedor}>
      <MapView
        ref={mapa}
        style={StyleSheet.absoluteFill}
        initialRegion={inicial}
        showsUserLocation={miUbicacion !== null}
        showsMyLocationButton={false}
        toolbarEnabled={false}
        onRegionChangeComplete={setRegion}
        onPress={(e) => {
          // Tocar el mapa (no un marcador) cierra la tarjeta
          if (e.nativeEvent.action !== "marker-press") setSeleccionado(null);
        }}
      >
        {alejado
          ? grupos.map((g) => (
              <Marker
                key={`barrio-${g.barrio}`}
                coordinate={{ latitude: g.centro.lat, longitude: g.centro.lng }}
                onPress={() =>
                  // Al tocar la burbuja, se acerca a ese barrio
                  mapa.current?.animateToRegion(regionQueIncluya(g.puntos, 0.02), 400)
                }
              >
                <View style={styles.burbuja}>
                  <View style={styles.burbujaCirculo}>
                    <Text style={styles.burbujaCantidad}>{g.puntos.length}</Text>
                  </View>
                  <Text style={styles.burbujaBarrio} numberOfLines={1}>
                    {g.barrio}
                  </Text>
                </View>
              </Marker>
            ))
          : parqueaderos
              .filter((p) => p.ubicacion)
              .map((p) => {
                const activo = seleccionado?.id === p.id;
                return (
                  <Marker
                    key={p.id}
                    coordinate={{ latitude: p.ubicacion!.lat, longitude: p.ubicacion!.lng }}
                    onPress={() => setSeleccionado(p)}
                  >
                    <View
                      style={[
                        styles.precio,
                        activo && styles.precioActivo,
                        !p.disponible && styles.precioNoDisponible,
                      ]}
                    >
                      <Text style={[styles.precioTexto, activo && styles.precioTextoActivo]}>
                        {formatearPrecio(p.precioHora)}
                      </Text>
                    </View>
                  </Marker>
                );
              })}
      </MapView>

      {/* Arriba: cuántos hay en lo que se ve */}
      <View style={styles.contador}>
        <Text style={styles.contadorTexto}>
          {error ??
            (parqueaderos.length === 0
              ? "No hay parqueaderos en esta zona"
              : `${parqueaderos.length} ${parqueaderos.length === 1 ? "parqueadero" : "parqueaderos"} en esta zona`)}
        </Text>
      </View>

      {miUbicacion && (
        <Pressable
          style={[styles.botonUbicacion, seleccionado && styles.botonUbicacionArriba]}
          onPress={irAMiUbicacion}
        >
          <Feather name="navigation" size={18} color={colors.text} />
        </Pressable>
      )}

      {/* Tarjeta del parqueadero tocado */}
      {seleccionado && (
        <Pressable style={styles.tarjeta} onPress={() => onAbrir(seleccionado.id)}>
          <ImagePlaceholder style={styles.tarjetaFoto} iconSize={28} source={seleccionado.imagen} />
          <View style={styles.tarjetaTextos}>
            <Text style={styles.tarjetaTitulo} numberOfLines={1}>
              {seleccionado.titulo}
            </Text>
            <Text style={styles.tarjetaDetalle} numberOfLines={1}>
              {seleccionado.barrio} · {seleccionado.direccion}
            </Text>
            <View style={styles.tarjetaFila}>
              <Text style={styles.tarjetaPrecio}>
                {formatearPrecio(seleccionado.precioHora)}
                <Text style={styles.tarjetaUnidad}> / hora</Text>
              </Text>
              <View style={styles.tarjetaCalificacion}>
                <Ionicons name="star" size={12} color={colors.black} />
                <Text style={styles.tarjetaDetalle}>
                  {seleccionado.resenas > 0 ? seleccionado.calificacion.toFixed(1) : "Nuevo"}
                </Text>
              </View>
            </View>
            {!seleccionado.disponible && (
              <Text style={styles.tarjetaNoDisponible}>No disponible por ahora</Text>
            )}
          </View>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
  },
  cargando: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  cargandoTexto: {
    fontSize: 12,
    color: colors.textLight,
  },
  burbuja: {
    alignItems: "center",
  },
  burbujaCirculo: {
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
  burbujaCantidad: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.white,
  },
  burbujaBarrio: {
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
  precio: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  precioActivo: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  precioNoDisponible: {
    opacity: 0.55,
  },
  precioTexto: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
  },
  precioTextoActivo: {
    color: colors.white,
  },
  contador: {
    position: "absolute",
    top: spacing.sm,
    alignSelf: "center",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    ...shadow,
  },
  contadorTexto: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
  },
  botonUbicacion: {
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
  botonUbicacionArriba: {
    bottom: 210,
  },
  tarjeta: {
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
  tarjetaFoto: {
    width: 90,
    height: 90,
    borderRadius: radius.md,
  },
  tarjetaTextos: {
    flex: 1,
    justifyContent: "center",
  },
  tarjetaTitulo: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  tarjetaDetalle: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
  },
  tarjetaFila: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  tarjetaPrecio: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  tarjetaUnidad: {
    fontSize: 12,
    fontWeight: "400",
  },
  tarjetaCalificacion: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  tarjetaNoDisponible: {
    fontSize: 11,
    color: colors.primary,
    marginTop: 3,
  },
});
import React, { useRef, useState } from "react";
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Ubicacion } from "../services/parking";
import { UBICACION_POR_DEFECTO, direccionDe, obtenerMiUbicacion } from "../services/location";
import { PrimaryButton } from "./ui";
import { colors, radius, shadow, spacing } from "../styles/theme";

const aRegion = (u: Ubicacion, delta = 0.005): Region => ({
  latitude: u.lat,
  longitude: u.lng,
  latitudeDelta: delta,
  longitudeDelta: delta,
});

// Publicar / editar: el propietario marca dónde está su parqueadero.
// Al confirmar, se busca la dirección y el barrio de ese punto para llenar el formulario
// (los puede corregir a mano si el celular no los encuentra bien).
export function LocationPicker({
  value,
  onChange,
}: {
  value: Ubicacion | null;
  onChange: (ubicacion: Ubicacion, encontrado: { direccion?: string; barrio?: string }) => void;
}) {
  const insets = useSafeAreaInsets();
  const mapa = useRef<MapView>(null);
  const [abierto, setAbierto] = useState(false);
  // Región con la que abre la ventana del mapa
  const [inicial, setInicial] = useState<Region | null>(null);
  // Centro del mapa = donde está el pin
  const [centro, setCentro] = useState<Ubicacion | null>(null);
  const [buscando, setBuscando] = useState(false);

  const abrir = async () => {
    setAbierto(true);
    setInicial(null);

    // Si ya tenía ubicación arranca ahí; si no, donde está el celular
    const punto = value ?? (await obtenerMiUbicacion()) ?? UBICACION_POR_DEFECTO;
    setInicial(aRegion(punto, value ? 0.004 : 0.01));
    setCentro(punto);
  };

  const usarMiUbicacion = async () => {
    const yo = await obtenerMiUbicacion();
    if (yo) mapa.current?.animateToRegion(aRegion(yo), 400);
  };

  const confirmar = async () => {
    if (!centro) return;
    setBuscando(true);
    const encontrado = await direccionDe(centro);
    setBuscando(false);
    setAbierto(false);
    onChange(centro, encontrado);
  };

  return (
    <View>
      {/* Vista previa: el punto marcado, o un aviso si todavía no tiene */}
      <Pressable style={styles.previa} onPress={abrir}>
        {value ? (
          <MapView
            style={StyleSheet.absoluteFill}
            region={aRegion(value, 0.004)}
            liteMode
            scrollEnabled={false}
            zoomEnabled={false}
            rotateEnabled={false}
            pitchEnabled={false}
            pointerEvents="none"
          >
            <Marker coordinate={{ latitude: value.lat, longitude: value.lng }} />
          </MapView>
        ) : (
          <View style={styles.previaVacia}>
            <Feather name="map-pin" size={22} color={colors.textLight} />
            <Text style={styles.previaTexto}>Toca para marcar la ubicación en el mapa</Text>
          </View>
        )}
      </Pressable>
      {value && (
        <Pressable onPress={abrir}>
          <Text style={styles.cambiar}>Cambiar ubicación</Text>
        </Pressable>
      )}

      <Modal visible={abierto} animationType="slide" onRequestClose={() => setAbierto(false)}>
        <View style={styles.ventana}>
          {inicial ? (
            <MapView
              ref={mapa}
              style={StyleSheet.absoluteFill}
              initialRegion={inicial}
              showsUserLocation
              showsMyLocationButton={false}
              toolbarEnabled={false}
              onRegionChangeComplete={(r) => setCentro({ lat: r.latitude, lng: r.longitude })}
            />
          ) : (
            <ActivityIndicator style={styles.cargando} color={colors.primary} />
          )}

          {/* Pin fijo en el centro: se mueve el mapa, no el pin */}
          {inicial && (
            <View style={styles.pinContenedor} pointerEvents="none">
              <Ionicons name="location" size={44} color={colors.primary} />
            </View>
          )}

          <View style={[styles.arriba, { top: insets.top + spacing.sm }]}>
            <Pressable style={styles.botonRedondo} onPress={() => setAbierto(false)}>
              <Feather name="x" size={20} color={colors.text} />
            </Pressable>
            <View style={styles.instruccion}>
              <Text style={styles.instruccionTexto}>
                Mueve el mapa hasta que el pin quede sobre la entrada de tu parqueadero
              </Text>
            </View>
          </View>

          <View style={[styles.abajo, { paddingBottom: insets.bottom + spacing.md }]}>
            <Pressable style={styles.miUbicacion} onPress={usarMiUbicacion}>
              <Feather name="navigation" size={16} color={colors.text} />
              <Text style={styles.miUbicacionTexto}>Usar mi ubicación</Text>
            </Pressable>
            <PrimaryButton
              label={buscando ? "Buscando la dirección..." : "Confirmar ubicación"}
              onPress={confirmar}
              disabled={!centro || buscando}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  previa: {
    height: 140,
    borderRadius: radius.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  previaVacia: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.chip,
  },
  previaTexto: {
    fontSize: 12,
    color: colors.textLight,
  },
  cambiar: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
    textDecorationLine: "underline",
    marginTop: spacing.sm,
  },
  ventana: {
    flex: 1,
    backgroundColor: colors.background,
  },
  cargando: {
    flex: 1,
  },
  pinContenedor: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    // El ícono se sube la mitad de su alto para que la punta quede justo en el centro
    paddingBottom: 44,
  },
  arriba: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  botonRedondo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    ...shadow,
  },
  instruccion: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    ...shadow,
  },
  instruccionTexto: {
    fontSize: 12,
    color: colors.text,
  },
  abajo: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    paddingTop: spacing.md,
    gap: spacing.md,
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  miUbicacion: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: 8,
  },
  miUbicacionTexto: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
  },
});
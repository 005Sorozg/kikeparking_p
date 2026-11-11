import React, { useRef, useState } from "react";
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Coordinates } from "../services/parking";
import { DEFAULT_LOCATION, reverseGeocode, getMyLocation } from "../services/location";
import { PrimaryButton } from "./ui";
import { colors, radius, shadow, spacing } from "../styles/theme";

const toRegion = (u: Coordinates, delta = 0.005): Region => ({
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
  value: Coordinates | null;
  onChange: (location: Coordinates, found: { address?: string; neighborhood?: string }) => void;
}) {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const [isOpen, setIsOpen] = useState(false);
  // Región con la que abre la ventana del mapa
  const [initial, setInitial] = useState<Region | null>(null);
  // Centro del mapa = donde está el pin
  const [center, setCenter] = useState<Coordinates | null>(null);
  const [searching, setSearching] = useState(false);

  const open = async () => {
    setIsOpen(true);
    setInitial(null);

    // Si ya tenía ubicación arranca ahí; si no, donde está el celular
    const point = value ?? (await getMyLocation()) ?? DEFAULT_LOCATION;
    setInitial(toRegion(point, value ? 0.004 : 0.01));
    setCenter(point);
  };

  const centerOnMyLocation = async () => {
    const me = await getMyLocation();
    if (me) mapRef.current?.animateToRegion(toRegion(me), 400);
  };

  const confirm = async () => {
    if (!center) return;
    setSearching(true);
    const found = await reverseGeocode(center);
    setSearching(false);
    setIsOpen(false);
    onChange(center, found);
  };

  return (
    <View>
      {/* Vista previa: el punto marcado, o un aviso si todavía no tiene */}
      <Pressable style={styles.preview} onPress={open}>
        {value ? (
          <MapView
            style={StyleSheet.absoluteFill}
            region={toRegion(value, 0.004)}
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
          <View style={styles.previewEmpty}>
            <Feather name="map-pin" size={22} color={colors.textLight} />
            <Text style={styles.previewText}>Toca para marcar la ubicación en el mapa</Text>
          </View>
        )}
      </Pressable>
      {value && (
        <Pressable onPress={open}>
          <Text style={styles.change}>Cambiar ubicación</Text>
        </Pressable>
      )}

      <Modal visible={isOpen} animationType="slide" onRequestClose={() => setIsOpen(false)}>
        <View style={styles.modalContainer}>
          {initial ? (
            <MapView
              ref={mapRef}
              style={StyleSheet.absoluteFill}
              initialRegion={initial}
              showsUserLocation
              showsMyLocationButton={false}
              toolbarEnabled={false}
              onRegionChangeComplete={(r) => setCenter({ lat: r.latitude, lng: r.longitude })}
            />
          ) : (
            <ActivityIndicator style={styles.loading} color={colors.primary} />
          )}

          {/* Pin fijo en el centro: se mueve el mapa, no el pin */}
          {initial && (
            <View style={styles.pinContainer} pointerEvents="none">
              <Ionicons name="location" size={44} color={colors.primary} />
            </View>
          )}

          <View style={[styles.topBar, { top: insets.top + spacing.sm }]}>
            <Pressable style={styles.roundButton} onPress={() => setIsOpen(false)}>
              <Feather name="x" size={20} color={colors.text} />
            </Pressable>
            <View style={styles.instruction}>
              <Text style={styles.instructionText}>
                Mueve el mapa hasta que el pin quede sobre la entrada de tu parqueadero
              </Text>
            </View>
          </View>

          <View style={[styles.bottomPanel, { paddingBottom: insets.bottom + spacing.md }]}>
            <Pressable style={styles.myLocation} onPress={centerOnMyLocation}>
              <Feather name="navigation" size={16} color={colors.text} />
              <Text style={styles.myLocationText}>Usar mi ubicación</Text>
            </Pressable>
            <PrimaryButton
              label={searching ? "Buscando la dirección..." : "Confirmar ubicación"}
              onPress={confirm}
              disabled={!center || searching}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  preview: {
    height: 140,
    borderRadius: radius.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  previewEmpty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.chip,
  },
  previewText: {
    fontSize: 12,
    color: colors.textLight,
  },
  change: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
    textDecorationLine: "underline",
    marginTop: spacing.sm,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loading: {
    flex: 1,
  },
  pinContainer: {
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
  topBar: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  roundButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    ...shadow,
  },
  instruction: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    ...shadow,
  },
  instructionText: {
    fontSize: 12,
    color: colors.text,
  },
  bottomPanel: {
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
  myLocation: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: 8,
  },
  myLocationText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
  },
});
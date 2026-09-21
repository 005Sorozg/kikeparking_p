import React, { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { AppScreenProps } from "../types/navigation";
import { parkingSpots } from "../services/parking";
import { colors, radius, spacing } from "../styles/theme";

// Pantalla principal: aquí el usuario busca parqueaderos por barrio y puede filtrar para ver solo los que están disponibles.
export function HomeScreen({ navigation }: AppScreenProps<"Home">) {
  const insets = useSafeAreaInsets();
  const [busqueda, setBusqueda] = useState("");
  const [soloDisponibles, setSoloDisponibles] = useState(false);

  // Esto recalcula la lista filtrada cada vez que cambia la búsqueda
  // o el filtro, sin tener que tocar los datos originales.
  const resultados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return parkingSpots.filter((p) => {
      const coincide =
        texto.length === 0 ||
        p.barrio.toLowerCase().includes(texto) ||
        p.titulo.toLowerCase().includes(texto);
      return coincide && (!soloDisponibles || p.disponible);
    });
  }, [busqueda, soloDisponibles]);

  return (
      <View style={[styles.contenedor, { paddingTop: insets.top + spacing.md }]}>
      <TextInput
        style={styles.buscador}
        value={busqueda}
        onChangeText={setBusqueda}
        placeholder="¿Dónde necesitas estacionar?"
        placeholderTextColor={colors.textLight}
      />

      <Pressable
        style={[styles.filtro, soloDisponibles && styles.filtroActivo]}
        onPress={() => setSoloDisponibles((v) => !v)}
      >
        <Text
          style={[
            styles.filtroTexto,
            soloDisponibles && styles.filtroTextoActivo,
          ]}
        >
          Solo disponibles
        </Text>
      </Pressable>

      <FlatList
        data={resultados}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.lista}
        renderItem={({ item }) => (
          <Pressable
            style={styles.tarjeta}
            onPress={() =>
              navigation.navigate("ParkingDetail", { parkingSpotId: item.id })
            }
          >
            {/* Espacio de la foto*/}
            <View style={styles.foto}>
              <Text style={styles.fotoIcono}>🅿️</Text>
            </View>

            <View style={styles.info}>
              <View style={styles.filaTitulo}>
                <Text style={styles.titulo} numberOfLines={1}>
                  {item.titulo}
                </Text>
                <Text style={styles.calificacion}>★ {item.calificacion}</Text>
              </View>
              <Text style={styles.barrio}>{item.barrio}</Text>
              <Text style={styles.precio}>
                ${item.precioHora.toLocaleString("es-CO")} / hora
              </Text>
              {!item.disponible && (
                <Text style={styles.ocupado}>Ocupado</Text>
              )}
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={styles.vacio}>
            No encontramos parqueaderos con esa búsqueda.
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  buscador: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  filtro: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },
  filtroActivo: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filtroTexto: {
    color: colors.textLight,
    fontWeight: "600",
    fontSize: 13,
  },
  filtroTextoActivo: {
    color: colors.white,
  },
  lista: {
    paddingBottom: spacing.xl,
  },
  tarjeta: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    overflow: "hidden",
  },
  foto: {
    height: 120,
    backgroundColor: "#EFEFEF",
    alignItems: "center",
    justifyContent: "center",
  },
  fotoIcono: {
    fontSize: 40,
  },
  info: {
    padding: spacing.md,
  },
  filaTitulo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  titulo: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    flex: 1,
  },
  calificacion: {
    color: colors.primary,
    fontWeight: "600",
    marginLeft: spacing.sm,
  },
  barrio: {
    color: colors.textLight,
    fontSize: 13,
    marginTop: 2,
  },
  precio: {
    color: colors.text,
    fontWeight: "700",
    marginTop: spacing.xs,
  },
  ocupado: {
    color: colors.primary,
    fontWeight: "600",
    marginTop: spacing.xs,
    fontSize: 12,
  },
  vacio: {
    textAlign: "center",
    color: colors.textLight,
    marginTop: spacing.xl,
  },
});
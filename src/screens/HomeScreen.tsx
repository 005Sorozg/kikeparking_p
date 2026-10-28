import React, { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { MainTabScreenProps } from "../types/navigation";
import {
  FILTROS_RAPIDOS,
  formatearPrecio,
  parkingSpots,
} from "../services/parking";
import { Chip, ImagePlaceholder } from "../components/ui";
import { colors, radius, shadow, spacing } from "../styles/theme";

// Inicio - Explorar: buscador, chips de filtros y tarjetas grandes de parqueaderos.
export function HomeScreen({ navigation }: MainTabScreenProps<"Explore">) {
  const insets = useSafeAreaInsets();
  const [busqueda, setBusqueda] = useState("");
  const [filtros, setFiltros] = useState<string[]>([]);
  // Favoritos locales: arrancan con lo que trae cada parqueadero.
  const [favoritos, setFavoritos] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(parkingSpots.map((p) => [p.id, p.favorito])),
  );

  const alternarFiltro = (filtro: string) =>
    setFiltros((actuales) =>
      actuales.includes(filtro)
        ? actuales.filter((f) => f !== filtro)
        : [...actuales, filtro],
    );

  const alternarFavorito = (id: string) =>
    setFavoritos((actuales) => ({ ...actuales, [id]: !actuales[id] }));

  const resultados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return parkingSpots.filter((p) => {
      const coincide =
        texto.length === 0 ||
        p.barrio.toLowerCase().includes(texto) ||
        p.ciudad.toLowerCase().includes(texto) ||
        p.titulo.toLowerCase().includes(texto);
      const cumpleFiltros = filtros.every((f) => p.etiquetas.includes(f));
      return coincide && cumpleFiltros;
    });
  }, [busqueda, filtros]);

  return (
    <View style={[styles.contenedor, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.buscador}>
        <Feather name="search" size={16} color={colors.text} />
        <View style={styles.buscadorTextos}>
          <Text style={styles.buscadorTitulo}>¿Dónde necesitas estacionar?</Text>
          <TextInput
            style={styles.buscadorInput}
            value={busqueda}
            onChangeText={setBusqueda}
            placeholder="Buscar parqueaderos cercanos"
            placeholderTextColor={colors.textLight}
          />
        </View>
      </View>

      <View style={styles.filtrosBorde}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtros}
        >
          <Chip label="Filtrar" icon="filter" />
          {FILTROS_RAPIDOS.map((filtro) => (
            <Chip
              key={filtro}
              label={filtro}
              selected={filtros.includes(filtro)}
              onPress={() => alternarFiltro(filtro)}
            />
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={resultados}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.lista}
        ItemSeparatorComponent={() => <View style={{ height: spacing.lg }} />}
        renderItem={({ item }) => {
          const esFavorito = favoritos[item.id];
          return (
            <Pressable
              style={styles.tarjeta}
              onPress={() =>
                navigation.navigate("ParkingDetail", { parkingSpotId: item.id })
              }
            >
              <View style={styles.fotoContenedor}>
                <ImagePlaceholder
                  style={styles.foto}
                  iconSize={96}
                  source={item.imagen}
                />
                <Pressable
                  style={styles.corazon}
                  hitSlop={8}
                  onPress={() => alternarFavorito(item.id)}
                >
                  <Ionicons
                    name={esFavorito ? "heart" : "heart-outline"}
                    size={16}
                    color={esFavorito ? colors.primary : "#B5B5B5"}
                  />
                </Pressable>
              </View>

              <View style={styles.info}>
                <View style={styles.filaTitulo}>
                  <Text style={styles.titulo} numberOfLines={1}>
                    {item.titulo}
                  </Text>
                  <View style={styles.calificacion}>
                    <Ionicons name="star" size={14} color={colors.black} />
                    <Text style={styles.calificacionTexto}>
                      {item.calificacion}
                    </Text>
                  </View>
                </View>
                <Text style={styles.detalle}>
                  {item.barrio}, {item.ciudad}
                </Text>
                <Text style={styles.detalle}>
                  {item.distanciaKm.toFixed(1)} km de distancia
                </Text>
                <Text style={styles.detalle}>
                  {item.vehiculos} {item.vehiculos === 1 ? "vehículo" : "vehículos"}
                </Text>
                <Text style={styles.detalle}>{item.etiquetas.join(" • ")}</Text>
                <Text style={styles.precio}>
                  {formatearPrecio(item.precioDia)}
                  <Text style={styles.precioUnidad}> / día</Text>
                </Text>
              </View>
            </Pressable>
          );
        }}
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
  },
  buscador: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    height: 54,
    marginHorizontal: 18,
    paddingHorizontal: 18,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.white,
    ...shadow,
  },
  buscadorTextos: {
    flex: 1,
  },
  buscadorTitulo: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
  },
  buscadorInput: {
    height: 16,
    padding: 0,
    fontSize: 11,
    color: colors.text,
  },
  filtrosBorde: {
    marginTop: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  filtros: {
    paddingHorizontal: 18,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  lista: {
    padding: 18,
    paddingBottom: spacing.xl,
  },
  tarjeta: {
    width: "100%",
  },
  fotoContenedor: {
    width: "100%",
    aspectRatio: 1,
  },
  foto: {
    width: "100%",
    height: "100%",
    borderRadius: radius.lg,
  },
  corazon: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    paddingHorizontal: 4,
    paddingTop: spacing.sm,
  },
  filaTitulo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  titulo: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
  },
  calificacion: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginLeft: spacing.sm,
  },
  calificacionTexto: {
    fontSize: 12,
    color: colors.text,
  },
  detalle: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 3,
  },
  precio: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    marginTop: 6,
  },
  precioUnidad: {
    fontSize: 12,
    fontWeight: "400",
  },
  vacio: {
    textAlign: "center",
    color: colors.textLight,
    marginTop: spacing.xl,
  },
});

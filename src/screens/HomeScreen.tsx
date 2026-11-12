import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { MainTabScreenProps } from "../types/navigation";
import {
  ParkingSpot,
  formatPrice,
  getParkingSpots,
} from "../services/parking";
import { Chip, ImagePlaceholder } from "../components/ui";
import { useFavorites } from "../context/FavoritesContext";
import { FiltersModal, ExtraFilters, countFilters } from "../components/FiltersModal";
import { ExploreMap } from "../components/ExploreMap";
import { colors, radius, shadow, spacing } from "../styles/theme";

type SortOrder = "rating" | "price" | null;

// Inicio - Explorar: buscador, filtros y tarjetas de parqueaderos que vienen del backend.
export function HomeScreen({ navigation }: MainTabScreenProps<"Explore">) {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [sort, setSort] = useState<SortOrder>(null);
  // Filtros de la ventana "Filtrar" (vehículo, techado, vigilancia...)
  const [extraFilters, setExtraFilters] = useState<ExtraFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const filterCount = countFilters(extraFilters);
  // Lista o mapa (el mapa solo existe en el celular)
  const [showMap, setShowMap] = useState(false);
  const hasMap = Platform.OS !== "web";
  // Los mismos filtros de la lista, para el mapa. useMemo evita que el mapa
  // vuelva a pedir datos cada vez que esta pantalla se redibuja.
  const mapFilters = useMemo(
    () => ({ search, onlyAvailable, ...extraFilters }),
    [search, onlyAvailable, extraFilters],
  );
  const [mockParkingSpots, setMockParkingSpots] = useState<ParkingSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Favoritos compartidos con el detalle y la pestaña Favoritos (vienen del backend).
  const { isFavorite, toggleFavorite } = useFavorites();

  // Se ejecuta al abrir la pantalla, al volver a ella (ej: después de publicar un
  // parqueadero) y cada vez que cambia un filtro. El retraso de 300 ms evita
  // llamar al backend con cada letra que se escribe.
  useFocusEffect(
    useCallback(() => {
      let active = true;

      const timer = setTimeout(async () => {
        try {
          setError(null);
          const data = await getParkingSpots({
            search,
            onlyAvailable,
            sort: sort ?? undefined,
            ...extraFilters,
          });
          if (active) setMockParkingSpots(data);
        } catch (e) {
          if (active) {
            setError(
              e instanceof Error
                ? e.message
                : "No se pudieron cargar los parqueaderos.",
            );
          }
        } finally {
          if (active) setLoading(false);
        }
      }, 300);

      return () => {
        active = false;
        clearTimeout(timer);
      };
    }, [search, onlyAvailable, sort, extraFilters]),
  );

  const toggleSort = (value: "rating" | "price") =>
    setSort((current) => (current === value ? null : value));

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.searchBar}>
        <Feather name="search" size={16} color={colors.text} />
        <View style={styles.searchBarTexts}>
          <Text style={styles.searchBarTitle}>¿Dónde necesitas estacionar?</Text>
          <TextInput
            style={styles.searchBarInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar por barrio o nombre"
            placeholderTextColor={colors.textLight}
          />
        </View>
      </View>

      <View style={styles.filtersBorder}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          <Chip
            label={filterCount > 0 ? `Filtrar (${filterCount})` : "Filtrar"}
            icon="filter"
            selected={filterCount > 0}
            onPress={() => setShowFilters(true)}
          />
          <Chip
            label="Solo disponibles"
            selected={onlyAvailable}
            onPress={() => setOnlyAvailable((v) => !v)}
          />
          <Chip
            label="Mejor calificados"
            selected={sort === "rating"}
            onPress={() => toggleSort("rating")}
          />
          <Chip
            label="Menor precio"
            selected={sort === "price"}
            onPress={() => toggleSort("price")}
          />
        </ScrollView>
      </View>

      {showMap ? (
        <ExploreMap
          filters={mapFilters}
          onOpen={(id) => navigation.navigate("ParkingDetail", { parkingSpotId: id })}
        />
      ) : (

      <FlatList
        data={mockParkingSpots}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: spacing.lg }} />}
        renderItem={({ item }) => {
          const favorite = isFavorite(item.id);
          return (
            <Pressable
              style={styles.card}
              onPress={() =>
                navigation.navigate("ParkingDetail", { parkingSpotId: item.id })
              }
            >
              <View style={styles.photoContainer}>
                <ImagePlaceholder
                  style={styles.photo}
                  iconSize={96}
                  source={item.image}
                />
                <Pressable
                  style={styles.heart}
                  hitSlop={8}
                  onPress={() => toggleFavorite(item)}
                >
                  <Ionicons
                    name={favorite ? "heart" : "heart-outline"}
                    size={16}
                    color={favorite ? colors.primary : "#B5B5B5"}
                  />
                </Pressable>
              </View>

              <View style={styles.info}>
                <View style={styles.rowTitle}>
                  <Text style={styles.title} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <View style={styles.rating}>
                    <Ionicons name="star" size={14} color={colors.black} />
                    <Text style={styles.ratingText}>
                       {item.reviewCount > 0 ? item.rating.toFixed(1) : "Nuevo"}
                    </Text>
                  </View>
                </View>
                <Text style={styles.detail}>{item.neighborhood}</Text>
                <Text style={styles.detail}>{item.address}</Text>
                <Text style={styles.price}>
                  {formatPrice(item.pricePerHour)}
                  <Text style={styles.priceUnit}> / hora</Text>
                </Text>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator
              style={{ marginTop: spacing.xl }}
              color={colors.primary}
            />
          ) : (
            <Text style={styles.empty}>
              {error ??
                (filterCount > 0
                  ? "Ningún parqueadero cumple esos filtros."
                  : "No encontramos parqueaderos con esa búsqueda.")}
            </Text>
          )
        }
      />
      )}

      {/* Botón flotante para cambiar entre lista y mapa */}
      {hasMap && (
        <Pressable style={styles.modeButton} onPress={() => setShowMap((v) => !v)}>
          <Text style={styles.modeButtonText}>{showMap ? "Lista" : "Mapa"}</Text>
          <Feather name={showMap ? "list" : "map"} size={15} color={colors.white} />
        </Pressable>
      )}

      <FiltersModal
        visible={showFilters}
        filters={extraFilters}
        onClose={() => setShowFilters(false)}
        onApply={(newItems) => {
          setExtraFilters(newItems);
          setShowFilters(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchBar: {
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
  searchBarTexts: {
    flex: 1,
  },
  searchBarTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
  },
  searchBarInput: {
    height: 16,
    padding: 0,
    fontSize: 11,
    color: colors.text,
  },
  filtersBorder: {
    marginTop: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  filters: {
    paddingHorizontal: 18,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  list: {
    padding: 18,
    // Espacio extra abajo para que el botón "Mapa" no tape la última tarjeta
    paddingBottom: 90,
  },
  modeButton: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: radius.full,
    backgroundColor: colors.text,
    ...shadow,
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.white,
  },
  card: {
    width: "100%",
  },
  photoContainer: {
    width: "100%",
    aspectRatio: 1,
  },
  photo: {
    width: "100%",
    height: "100%",
    borderRadius: radius.lg,
  },
  heart: {
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
  rowTitle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
  },
  rating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginLeft: spacing.sm,
  },
  ratingText: {
    fontSize: 12,
    color: colors.text,
  },
  detail: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 3,
  },
  price: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    marginTop: 6,
  },
  priceUnit: {
    fontSize: 12,
    fontWeight: "400",
  },
  empty: {
    textAlign: "center",
    color: colors.textLight,
    marginTop: spacing.xl,
  },
});
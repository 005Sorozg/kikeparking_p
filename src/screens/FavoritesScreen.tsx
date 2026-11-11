import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { MainTabScreenProps } from "../types/navigation";
import { groupByNeighborhood } from "../services/favorites";
import { useFavorites } from "../context/FavoritesContext";
import { ImagePlaceholder } from "../components/ui";
import { colors, radius, spacing } from "../styles/theme";

const MARGIN = 18;
const GAP = 14;

// Favoritos: una tarjeta por barrio con los parqueaderos guardados.
// Al bajar, el título grande pasa a la barra de arriba (Estado A → B).
export function FavoritesScreen({ navigation }: MainTabScreenProps<"Favorites">) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { favorites: favorites, loaded: loaded, error, reload: reload } = useFavorites();
  const [compact, setCompact] = useState(false);
  const cardWidth = (width - MARGIN * 2 - GAP) / 2;
  const collections = groupByNeighborhood(favorites);

  // Al volver a la pestaña se actualiza (ej: si guardó algo desde otro celular).
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    setCompact(e.nativeEvent.contentOffset.y > 40);

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.bar,
          { paddingTop: insets.top + spacing.sm },
          compact && styles.barCompact,
        ]}
      >
        <Text style={[styles.titleCompact, !compact && styles.hidden]}>
          Favoritos
        </Text>
      </View>

      <FlatList
        data={collections}
        keyExtractor={(item) => item.neighborhood}
        numColumns={2}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        columnWrapperStyle={{ gap: GAP }}
        contentContainerStyle={styles.list}
        ListHeaderComponent={<Text style={styles.title}>Favoritos</Text>}
        ListEmptyComponent={
          !loaded ? (
            <ActivityIndicator color={colors.primary} style={styles.loading} />
          ) : (
            <Text style={styles.empty}>
              {error ??
                "Aún no tienes favoritos. Toca el corazón de un parqueadero para guardarlo aquí."}
            </Text>
          )
        }
        renderItem={({ item }) => {
          const total = item.mockParkingSpots.length;
          return (
            <Pressable
              style={{ width: cardWidth, marginBottom: spacing.md }}
              onPress={() =>
                navigation.navigate("FavoriteCollection", { neighborhood: item.neighborhood })
              }
            >
              <ImagePlaceholder
                style={{
                  width: cardWidth,
                  height: cardWidth,
                  borderRadius: radius.lg,
                }}
                iconSize={36}
                // La foto de la tarjeta es la del favorito más reciente de ese barrio
                source={item.mockParkingSpots[0].image}
              />
              <Text style={styles.name} numberOfLines={1}>
                {item.neighborhood}
              </Text>
              <Text style={styles.subtitle}>
                {total} {total === 1 ? "guardado" : "guardados"}
              </Text>
            </Pressable>
          );
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
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: MARGIN + 6,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "transparent",
    backgroundColor: colors.white,
  },
  barCompact: {
    borderBottomColor: colors.borderLight,
  },
  titleCompact: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
  },
  hidden: {
    opacity: 0,
  },
  list: {
    paddingHorizontal: MARGIN,
    paddingBottom: spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
    paddingHorizontal: 6,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  name: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.text,
    marginTop: spacing.sm,
  },
  subtitle: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 2,
  },
  loading: {
    marginTop: spacing.xl,
  },
  empty: {
    fontSize: 13,
    color: colors.textLight,
    textAlign: "center",
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
});

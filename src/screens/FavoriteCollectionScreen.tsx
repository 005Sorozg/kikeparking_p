import React, { useEffect } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import type { AppScreenProps } from "../types/navigation";
import { formatPrice } from "../services/parking";
import { useFavorites } from "../context/FavoritesContext";
import { ImagePlaceholder } from "../components/ui";
import { colors, radius, spacing } from "../styles/theme";

// Favoritos de un barrio. El corazón los quita de la lista.
export function FavoriteCollectionScreen({
  route,
  navigation,
}: AppScreenProps<"FavoriteCollection">) {
  const { neighborhood } = route.params;
  const { favorites, toggleFavorite } = useFavorites();
  const list = favorites.filter((p) => p.neighborhood === neighborhood);
  const focused = useIsFocused();

  // Título del encabezado = nombre del barrio
  useEffect(() => {
    navigation.setOptions({ title: neighborhood });
  }, [navigation, neighborhood]);

  // Si quitó el último favorito del barrio, la colección ya no existe: se vuelve atrás.
  // Solo cuando esta pantalla está visible: si lo quitó desde el detalle (que está
  // encima), se espera a que regrese para no cerrar la pantalla equivocada.
  useEffect(() => {
    if (focused && list.length === 0 && navigation.canGoBack()) navigation.goBack();
  }, [focused, list.length, navigation]);

  return (
    <FlatList
      style={styles.container}
      data={list}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      renderItem={({ item }) => (
        <Pressable
          style={styles.row}
          onPress={() =>
            navigation.navigate("ParkingDetail", { parkingSpotId: item.id })
          }
        >
          <ImagePlaceholder style={styles.photo} iconSize={30} source={item.image} />
          <View style={styles.texts}>
            <Text style={styles.name} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.detail} numberOfLines={1}>
              {item.address}
            </Text>
            <Text style={styles.price}>
              {formatPrice(item.pricePerHour)}
              <Text style={styles.priceUnit}> / hora</Text>
            </Text>
            {!item.available && (
              <Text style={styles.unavailable}>No disponible por ahora</Text>
            )}
          </View>
          <Pressable hitSlop={10} onPress={() => toggleFavorite(item)}>
            <Ionicons name="heart" size={22} color={colors.primary} />
          </Pressable>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    padding: 18,
  },
  separator: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  photo: {
    width: 84,
    height: 84,
    borderRadius: radius.md,
  },
  texts: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  detail: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 3,
  },
  price: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
    marginTop: 4,
  },
  priceUnit: {
    fontSize: 12,
    fontWeight: "400",
  },
  unavailable: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 3,
  },
});
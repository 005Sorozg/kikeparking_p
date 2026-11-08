import React, { useEffect } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import type { AppScreenProps } from "../types/navigation";
import { formatearPrecio } from "../services/parking";
import { useFavoritos } from "../context/FavoritesContext";
import { ImagePlaceholder } from "../components/ui";
import { colors, radius, spacing } from "../styles/theme";

// Favoritos de un barrio. El corazón los quita de la lista.
export function FavoriteCollectionScreen({
  route,
  navigation,
}: AppScreenProps<"FavoriteCollection">) {
  const { barrio } = route.params;
  const { favoritos, alternarFavorito } = useFavoritos();
  const lista = favoritos.filter((p) => p.barrio === barrio);
  const enfocada = useIsFocused();

  // Título del encabezado = nombre del barrio
  useEffect(() => {
    navigation.setOptions({ title: barrio });
  }, [navigation, barrio]);

  // Si quitó el último favorito del barrio, la colección ya no existe: se vuelve atrás.
  // Solo cuando esta pantalla está visible: si lo quitó desde el detalle (que está
  // encima), se espera a que regrese para no cerrar la pantalla equivocada.
  useEffect(() => {
    if (enfocada && lista.length === 0 && navigation.canGoBack()) navigation.goBack();
  }, [enfocada, lista.length, navigation]);

  return (
    <FlatList
      style={styles.contenedor}
      data={lista}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.lista}
      ItemSeparatorComponent={() => <View style={styles.separador} />}
      renderItem={({ item }) => (
        <Pressable
          style={styles.fila}
          onPress={() =>
            navigation.navigate("ParkingDetail", { parkingSpotId: item.id })
          }
        >
          <ImagePlaceholder style={styles.foto} iconSize={30} source={item.imagen} />
          <View style={styles.textos}>
            <Text style={styles.nombre} numberOfLines={1}>
              {item.titulo}
            </Text>
            <Text style={styles.detalle} numberOfLines={1}>
              {item.direccion}
            </Text>
            <Text style={styles.precio}>
              {formatearPrecio(item.precioHora)}
              <Text style={styles.precioUnidad}> / hora</Text>
            </Text>
            {!item.disponible && (
              <Text style={styles.noDisponible}>No disponible por ahora</Text>
            )}
          </View>
          <Pressable hitSlop={10} onPress={() => alternarFavorito(item)}>
            <Ionicons name="heart" size={22} color={colors.primary} />
          </Pressable>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: colors.background,
  },
  lista: {
    padding: 18,
  },
  separador: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.md,
  },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  foto: {
    width: 84,
    height: 84,
    borderRadius: radius.md,
  },
  textos: {
    flex: 1,
  },
  nombre: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  detalle: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 3,
  },
  precio: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
    marginTop: 4,
  },
  precioUnidad: {
    fontSize: 12,
    fontWeight: "400",
  },
  noDisponible: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 3,
  },
});
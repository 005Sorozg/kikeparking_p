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
import { agruparPorBarrio } from "../services/favorites";
import { useFavoritos } from "../context/FavoritesContext";
import { ImagePlaceholder } from "../components/ui";
import { colors, radius, spacing } from "../styles/theme";

const MARGEN = 18;
const ESPACIO = 14;

// Favoritos: una tarjeta por barrio con los parqueaderos guardados.
// Al bajar, el título grande pasa a la barra de arriba (Estado A → B).
export function FavoritesScreen({ navigation }: MainTabScreenProps<"Favorites">) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { favoritos, cargados, error, recargar } = useFavoritos();
  const [compacto, setCompacto] = useState(false);
  const anchoTarjeta = (width - MARGEN * 2 - ESPACIO) / 2;
  const colecciones = agruparPorBarrio(favoritos);

  // Al volver a la pestaña se actualiza (ej: si guardó algo desde otro celular).
  useFocusEffect(
    useCallback(() => {
      recargar();
    }, [recargar]),
  );

  const alHacerScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    setCompacto(e.nativeEvent.contentOffset.y > 40);

  return (
    <View style={styles.contenedor}>
      <View
        style={[
          styles.barra,
          { paddingTop: insets.top + spacing.sm },
          compacto && styles.barraCompacta,
        ]}
      >
        <Text style={[styles.tituloCompacto, !compacto && styles.oculto]}>
          Favoritos
        </Text>
      </View>

      <FlatList
        data={colecciones}
        keyExtractor={(item) => item.barrio}
        numColumns={2}
        onScroll={alHacerScroll}
        scrollEventThrottle={16}
        columnWrapperStyle={{ gap: ESPACIO }}
        contentContainerStyle={styles.lista}
        ListHeaderComponent={<Text style={styles.titulo}>Favoritos</Text>}
        ListEmptyComponent={
          !cargados ? (
            <ActivityIndicator color={colors.primary} style={styles.cargando} />
          ) : (
            <Text style={styles.vacio}>
              {error ??
                "Aún no tienes favoritos. Toca el corazón de un parqueadero para guardarlo aquí."}
            </Text>
          )
        }
        renderItem={({ item }) => {
          const total = item.parqueaderos.length;
          return (
            <Pressable
              style={{ width: anchoTarjeta, marginBottom: spacing.md }}
              onPress={() =>
                navigation.navigate("FavoriteCollection", { barrio: item.barrio })
              }
            >
              <ImagePlaceholder
                style={{
                  width: anchoTarjeta,
                  height: anchoTarjeta,
                  borderRadius: radius.lg,
                }}
                iconSize={36}
                // La foto de la tarjeta es la del favorito más reciente de ese barrio
                source={item.parqueaderos[0].imagen}
              />
              <Text style={styles.nombre} numberOfLines={1}>
                {item.barrio}
              </Text>
              <Text style={styles.subtitulo}>
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
  contenedor: {
    flex: 1,
    backgroundColor: colors.background,
  },
  barra: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: MARGEN + 6,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "transparent",
    backgroundColor: colors.white,
  },
  barraCompacta: {
    borderBottomColor: colors.borderLight,
  },
  tituloCompacto: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
  },
  oculto: {
    opacity: 0,
  },
  lista: {
    paddingHorizontal: MARGEN,
    paddingBottom: spacing.xl,
  },
  titulo: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
    paddingHorizontal: 6,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  nombre: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.text,
    marginTop: spacing.sm,
  },
  subtitulo: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 2,
  },
  cargando: {
    marginTop: spacing.xl,
  },
  vacio: {
    fontSize: 13,
    color: colors.textLight,
    textAlign: "center",
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
});

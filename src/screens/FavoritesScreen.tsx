import React, { useState } from "react";
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { favoriteCollections } from "../services/favorites";
import { ImagePlaceholder } from "../components/ui";
import { colors, radius, spacing } from "../styles/theme";

const MARGEN = 18;
const ESPACIO = 14;

// Favoritos: colecciones en cuadrícula. Al bajar, el título grande pasa a la barra de arriba (Estado A → B).
export function FavoritesScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [compacto, setCompacto] = useState(false);
  const anchoTarjeta = (width - MARGEN * 2 - ESPACIO) / 2;

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
        <Pressable style={styles.editar}>
          <Text style={styles.editarTexto}>Edita</Text>
        </Pressable>
      </View>

      <FlatList
        data={favoriteCollections}
        keyExtractor={(item) => item.id}
        numColumns={2}
        onScroll={alHacerScroll}
        scrollEventThrottle={16}
        columnWrapperStyle={{ gap: ESPACIO }}
        contentContainerStyle={styles.lista}
        ListHeaderComponent={<Text style={styles.titulo}>Favoritos</Text>}
        renderItem={({ item }) => {
          const subtitulo =
            item.subtitulo ??
            `${item.guardados} ${item.guardados === 1 ? "guardado" : "guardados"}`;
          return (
            <Pressable style={{ width: anchoTarjeta, marginBottom: spacing.md }}>
              <ImagePlaceholder
                style={{
                  width: anchoTarjeta,
                  height: anchoTarjeta,
                  borderRadius: radius.lg,
                }}
                iconSize={36}
              />
              <Text style={styles.nombre} numberOfLines={1}>
                {item.titulo}
              </Text>
              <Text style={styles.subtitulo}>{subtitulo}</Text>
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
  editar: {
    marginLeft: "auto",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.full,
    backgroundColor: colors.chip,
  },
  editarTexto: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.text,
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
});

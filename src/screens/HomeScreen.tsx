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
  Parqueadero,
  formatearPrecio,
  obtenerParqueaderos,
} from "../services/parking";
import { Chip, ImagePlaceholder } from "../components/ui";
import { useFavoritos } from "../context/FavoritesContext";
import { FiltersModal, FiltrosExtra, contarFiltros } from "../components/FiltersModal";
import { ExploreMap } from "../components/ExploreMap";
import { colors, radius, shadow, spacing } from "../styles/theme";

type Orden = "rating" | "price" | null;

// Inicio - Explorar: buscador, filtros y tarjetas de parqueaderos que vienen del backend.
export function HomeScreen({ navigation }: MainTabScreenProps<"Explore">) {
  const insets = useSafeAreaInsets();
  const [busqueda, setBusqueda] = useState("");
  const [soloDisponibles, setSoloDisponibles] = useState(false);
  const [orden, setOrden] = useState<Orden>(null);
  // Filtros de la ventana "Filtrar" (vehículo, techado, vigilancia...)
  const [filtrosExtra, setFiltrosExtra] = useState<FiltrosExtra>({});
  const [verFiltros, setVerFiltros] = useState(false);
  const cantidadFiltros = contarFiltros(filtrosExtra);
  // Lista o mapa (el mapa solo existe en el celular)
  const [verMapa, setVerMapa] = useState(false);
  const hayMapa = Platform.OS !== "web";
  // Los mismos filtros de la lista, para el mapa. useMemo evita que el mapa
  // vuelva a pedir datos cada vez que esta pantalla se redibuja.
  const filtrosMapa = useMemo(
    () => ({ busqueda, soloDisponibles, ...filtrosExtra }),
    [busqueda, soloDisponibles, filtrosExtra],
  );
  const [parqueaderos, setParqueaderos] = useState<Parqueadero[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Favoritos compartidos con el detalle y la pestaña Favoritos (vienen del backend).
  const { esFavorito, alternarFavorito } = useFavoritos();

  // Se ejecuta al abrir la pantalla, al volver a ella (ej: después de publicar un
  // parqueadero) y cada vez que cambia un filtro. El retraso de 300 ms evita
  // llamar al backend con cada letra que se escribe.
  useFocusEffect(
    useCallback(() => {
      let activo = true;

      const temporizador = setTimeout(async () => {
        try {
          setError(null);
          const datos = await obtenerParqueaderos({
            busqueda,
            soloDisponibles,
            orden: orden ?? undefined,
            ...filtrosExtra,
          });
          if (activo) setParqueaderos(datos);
        } catch (e) {
          if (activo) {
            setError(
              e instanceof Error
                ? e.message
                : "No se pudieron cargar los parqueaderos.",
            );
          }
        } finally {
          if (activo) setCargando(false);
        }
      }, 300);

      return () => {
        activo = false;
        clearTimeout(temporizador);
      };
    }, [busqueda, soloDisponibles, orden, filtrosExtra]),
  );

  const alternarOrden = (valor: "rating" | "price") =>
    setOrden((actual) => (actual === valor ? null : valor));

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
            placeholder="Buscar por barrio o nombre"
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
          <Chip
            label={cantidadFiltros > 0 ? `Filtrar (${cantidadFiltros})` : "Filtrar"}
            icon="filter"
            selected={cantidadFiltros > 0}
            onPress={() => setVerFiltros(true)}
          />
          <Chip
            label="Solo disponibles"
            selected={soloDisponibles}
            onPress={() => setSoloDisponibles((v) => !v)}
          />
          <Chip
            label="Mejor calificados"
            selected={orden === "rating"}
            onPress={() => alternarOrden("rating")}
          />
          <Chip
            label="Menor precio"
            selected={orden === "price"}
            onPress={() => alternarOrden("price")}
          />
        </ScrollView>
      </View>

      {verMapa ? (
        <ExploreMap
          filtros={filtrosMapa}
          onAbrir={(id) => navigation.navigate("ParkingDetail", { parkingSpotId: id })}
        />
      ) : (

      <FlatList
        data={parqueaderos}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.lista}
        ItemSeparatorComponent={() => <View style={{ height: spacing.lg }} />}
        renderItem={({ item }) => {
          const favorito = esFavorito(item.id);
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
                  onPress={() => alternarFavorito(item)}
                >
                  <Ionicons
                    name={favorito ? "heart" : "heart-outline"}
                    size={16}
                    color={favorito ? colors.primary : "#B5B5B5"}
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
                       {item.resenas > 0 ? item.calificacion.toFixed(1) : "Nuevo"}
                    </Text>
                  </View>
                </View>
                <Text style={styles.detalle}>{item.barrio}</Text>
                <Text style={styles.detalle}>{item.direccion}</Text>
                <Text style={styles.precio}>
                  {formatearPrecio(item.precioHora)}
                  <Text style={styles.precioUnidad}> / hora</Text>
                </Text>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          cargando ? (
            <ActivityIndicator
              style={{ marginTop: spacing.xl }}
              color={colors.primary}
            />
          ) : (
            <Text style={styles.vacio}>
              {error ??
                (cantidadFiltros > 0
                  ? "Ningún parqueadero cumple esos filtros."
                  : "No encontramos parqueaderos con esa búsqueda.")}
            </Text>
          )
        }
      />
      )}

      {/* Botón flotante para cambiar entre lista y mapa */}
      {hayMapa && (
        <Pressable style={styles.botonModo} onPress={() => setVerMapa((v) => !v)}>
          <Text style={styles.botonModoTexto}>{verMapa ? "Lista" : "Mapa"}</Text>
          <Feather name={verMapa ? "list" : "map"} size={15} color={colors.white} />
        </Pressable>
      )}

      <FiltersModal
        visible={verFiltros}
        filtros={filtrosExtra}
        onCerrar={() => setVerFiltros(false)}
        onAplicar={(nuevos) => {
          setFiltrosExtra(nuevos);
          setVerFiltros(false);
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
    // Espacio extra abajo para que el botón "Mapa" no tape la última tarjeta
    paddingBottom: 90,
  },
  botonModo: {
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
  botonModoTexto: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.white,
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
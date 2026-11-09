import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import type { AppScreenProps } from "../types/navigation";
import { formatearPrecio } from "../services/parking";
import {
  FaseReserva,
  Reserva,
  cancelarReserva,
  esProxima,
  formatearRango,
  obtenerMisReservas,
  obtenerReservasRecibidas,
  tiempoRestante,
} from "../services/bookings";
import { BookingPhaseTag } from "../components/BookingPhaseTag";
import { useAuth } from "../context/AuthContext";
import { Chip, ImagePlaceholder } from "../components/ui";
import { colors, radius, spacing } from "../styles/theme";

// Cada filtro muestra las reservas de un estado
const FILTROS: { id: FaseReserva; etiqueta: string; vacio: string }[] = [
  { id: "upcoming", etiqueta: "Próximas", vacio: "No tienes reservas próximas." },
  { id: "in_progress", etiqueta: "En curso", vacio: "No hay reservas en curso ahora." },
  { id: "completed", etiqueta: "Completadas", vacio: "Todavía no hay reservas completadas." },
  { id: "cancelled", etiqueta: "Canceladas", vacio: "No hay reservas canceladas." },
];

// Reservas: el conductor ve las que hizo y el propietario las que recibió.
export function MyBookingsScreen(_: AppScreenProps<"MyBookings">) {
  const { usuario, token } = useAuth();
  const esPropietario = usuario?.role === "propietario";

  const [filtro, setFiltro] = useState<FaseReserva>("upcoming");
  const [reservas, setReservas] = useState<Reserva[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Reserva que está pidiendo confirmación para cancelarse.
  const [confirmando, setConfirmando] = useState<number | null>(null);
  const [cancelando, setCancelando] = useState<number | null>(null);

  // Se recarga cada vez que la pantalla se vuelve a mostrar.
  useFocusEffect(
    useCallback(() => {
      if (!token) {
        setError("Debes iniciar sesión para ver tus reservas.");
        return;
      }

      let activo = true;
      const pedir = esPropietario ? obtenerReservasRecibidas : obtenerMisReservas;

      pedir(token)
        .then((datos) => {
          if (activo) {
            setReservas(datos);
            setError(null);
          }
        })
        .catch((e) => {
          if (activo) {
            setError(
              e instanceof Error ? e.message : "No se pudieron cargar las reservas.",
            );
          }
        });

      return () => {
        activo = false;
      };
    }, [token, esPropietario]),
  );

  const cancelar = async (id: number) => {
    if (!token) return;

    setCancelando(id);
    try {
      const actualizada = await cancelarReserva(id, token);
      setReservas((actuales) =>
        (actuales ?? []).map((r) => (r.id === id ? actualizada : r)),
      );
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cancelar la reserva.");
    } finally {
      setCancelando(null);
      setConfirmando(null);
    }
  };

  const visibles = (reservas ?? [])
    .filter((r) => r.fase === filtro)
    // Próximas y en curso: la más cercana primero. Las demás: la más reciente primero.
    .sort((a, b) =>
      filtro === "upcoming" || filtro === "in_progress"
        ? a.entrada.getTime() - b.entrada.getTime()
        : b.entrada.getTime() - a.entrada.getTime(),
    );

  return (
    <View style={styles.contenedor}>
      <Text style={styles.titulo}>
        {esPropietario ? "Reservas recibidas" : "Reservas"}
      </Text>

      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {FILTROS.map((f) => (
            <Chip
              key={f.id}
              label={f.etiqueta}
              variant="filled"
              selected={filtro === f.id}
              onPress={() => setFiltro(f.id)}
            />
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.lista}>
        {error && <Text style={styles.error}>{error}</Text>}

        {!reservas && !error && <ActivityIndicator color={colors.primary} />}

        {reservas && visibles.length === 0 && (
          <Text style={styles.vacio}>
            {FILTROS.find((f) => f.id === filtro)?.vacio}
          </Text>
        )}

        {visibles.map((r) => {
          const cancelada = r.estado === "cancelled";
          return (
            <View key={r.id} style={styles.fila}>
              <ImagePlaceholder
                style={styles.foto}
                iconSize={26}
                source={r.parqueadero.imagen}
              />
              <View style={styles.textos}>
                <Text style={styles.nombre} numberOfLines={1}>
                  {r.parqueadero.titulo}
                </Text>
                <Text style={styles.detalle}>
                  {esPropietario
                    ? `Reservó ${r.conductor.nombre}`
                    : `${r.parqueadero.barrio} · ${r.parqueadero.direccion}`}
                </Text>
                <Text style={styles.detalle}>
                  {formatearRango(r.entrada, r.salida)}
                </Text>
                <View style={styles.vehiculo}>
                  <Feather
                    name={r.vehiculo === "carro" ? "truck" : "navigation"}
                    size={11}
                    color={colors.textLight}
                  />
                  <Text style={styles.detalle}>
                    {r.vehiculo === "carro" ? "Carro" : "Moto"} · {r.horas}{" "}
                    {r.horas === 1 ? "hora" : "horas"}
                  </Text>
                </View>

                <BookingPhaseTag fase={r.fase} />
                {r.fase === "in_progress" && (
                  <Text style={styles.restante}>
                    Termina en {tiempoRestante(r.salida)}
                  </Text>
                )}

                {esProxima(r) && confirmando !== r.id && (
                  <Pressable onPress={() => setConfirmando(r.id)}>
                    <Text style={styles.accion}>Cancelar reserva</Text>
                  </Pressable>
                )}

                {esProxima(r) && confirmando === r.id && (
                  <View style={styles.confirmar}>
                    <Text style={styles.detalle}>¿Seguro?</Text>
                    <Pressable
                      onPress={() => cancelar(r.id)}
                      disabled={cancelando === r.id}
                    >
                      <Text style={styles.accion}>
                        {cancelando === r.id ? "Cancelando..." : "Sí, cancelar"}
                      </Text>
                    </Pressable>
                    <Pressable onPress={() => setConfirmando(null)}>
                      <Text style={styles.accionSecundaria}>No</Text>
                    </Pressable>
                  </View>
                )}
              </View>
              <Text style={[styles.precio, cancelada && styles.precioTachado]}>
                {formatearPrecio(r.total)}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: colors.background,
  },
  titulo: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
    paddingHorizontal: 24,
    marginBottom: spacing.md,
  },
  chips: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: 24,
    paddingBottom: spacing.md,
  },
  lista: {
    paddingHorizontal: 24,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  vacio: {
    color: colors.textLight,
    fontSize: 12,
  },
  fila: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    marginBottom: spacing.lg,
  },
  foto: {
    width: 64,
    height: 64,
    borderRadius: radius.sm,
  },
  textos: {
    flex: 1,
  },
  nombre: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.text,
  },
  detalle: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 3,
  },
  vehiculo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
  },
  precio: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
  },
  precioTachado: {
    color: colors.textLight,
    textDecorationLine: "line-through",
  },
  error: {
    color: colors.primary,
    fontSize: 12,
    marginBottom: spacing.md,
  },
    restante: {
    fontSize: 11,
    fontWeight: "600",
    color: "#2E7D32",
    marginTop: 3,
  },
  accion: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
    marginTop: spacing.sm,
  },
  accionSecundaria: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
    marginTop: spacing.sm,
  },
  confirmar: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: spacing.md,
  },
});
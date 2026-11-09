import React, { useCallback, useEffect, useState } from "react";
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
  faseActual,
  formatearRango,
  obtenerMisReservas,
  obtenerReservasRecibidas,
  tiempoParaPagar,
  tiempoRestante,
} from "../services/bookings";
import { BookingPhaseTag } from "../components/BookingPhaseTag";
import { ReviewModal } from "../components/ReviewModal";
import { Stars } from "../components/Stars";
import { useAuth } from "../context/AuthContext";
import { Chip, ImagePlaceholder } from "../components/ui";
import { colors, radius, spacing } from "../styles/theme";

// Cada filtro muestra las reservas de uno o más estados
// (las pendientes de pago van con las próximas y las vencidas con las canceladas)
const FILTROS: { id: FaseReserva; incluye: FaseReserva[]; etiqueta: string; vacio: string }[] = [
  { id: "upcoming", incluye: ["upcoming", "pending_payment"], etiqueta: "Próximas", vacio: "No tienes reservas próximas." },
  { id: "in_progress", incluye: ["in_progress"], etiqueta: "En curso", vacio: "No hay reservas en curso ahora." },
  { id: "completed", incluye: ["completed"], etiqueta: "Completadas", vacio: "Todavía no hay reservas completadas." },
  { id: "cancelled", incluye: ["cancelled", "expired"], etiqueta: "Canceladas", vacio: "No hay reservas canceladas." },
];

// Reservas: el conductor ve las que hizo y el propietario las que recibió.
export function MyBookingsScreen({ navigation }: AppScreenProps<"MyBookings">) {
  const { usuario, token } = useAuth();
  const esPropietario = usuario?.role === "propietario";
  const [filtro, setFiltro] = useState<FaseReserva>("upcoming");
  const [reservas, setReservas] = useState<Reserva[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Reserva que está pidiendo confirmación para cancelarse.
  const [confirmando, setConfirmando] = useState<number | null>(null);
  const [cancelando, setCancelando] = useState<number | null>(null);
  // Reserva que se está calificando (abre la ventana de calificar)
  const [calificando, setCalificando] = useState<Reserva | null>(null);
  // Si hay alguna pendiente de pago, se redibuja cada segundo para la cuenta regresiva
  const hayPendientes = (reservas ?? []).some((r) => faseActual(r) === "pending_payment");
  const [, setTic] = useState(0);
  useEffect(() => {
    if (!hayPendientes) return;
    const intervalo = setInterval(() => setTic((t) => t + 1), 1000);
    return () => clearInterval(intervalo);
  }, [hayPendientes]);

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

  const incluidas = FILTROS.find((f) => f.id === filtro)?.incluye ?? [];
  const visibles = (reservas ?? [])
    .filter((r) => incluidas.includes(faseActual(r)))
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
          const fase = faseActual(r);
          const cancelada = r.estado === "cancelled" || fase === "expired";
          const pendiente = fase === "pending_payment";
          // Se puede cancelar mientras no haya empezado (pagada o pendiente de pago)
          const cancelable = esProxima(r) || pendiente;
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
                    ? `Reservó ${r.conductor.nombre}${
                        r.conductor.resenas > 0
                          ? ` · ★ ${r.conductor.calificacion.toFixed(1)}`
                          : ""
                      }`
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

                <BookingPhaseTag fase={fase} />

                {/* Pendiente de pago: el conductor paga, el propietario espera */}
                {pendiente && r.limitePago && (
                  <Text style={styles.porPagar}>
                    {esPropietario
                      ? "Esperando el pago del conductor"
                      : `Te quedan ${tiempoParaPagar(r.limitePago)} para pagar`}
                  </Text>
                )}
                {pendiente && !esPropietario && r.limitePago && (
                  <Pressable
                    onPress={() =>
                      navigation.navigate("Payment", {
                        reservaId: r.id,
                        titulo: r.parqueadero.titulo,
                        total: r.total,
                        limitePago: r.limitePago!.toISOString(),
                      })
                    }
                  >
                    <Text style={styles.accion}>Pagar ahora</Text>
                  </Pressable>
                )}

                {/* Con qué se pagó (solo lo ve el conductor) */}
                {!esPropietario && r.pago && (
                  <Text style={styles.detalle}>
                    {r.reembolsada ? "Reembolsada a" : "Pagada con"} {r.pago.marca} ••••{" "}
                    {r.pago.ultimos4}
                  </Text>
                )}
                {r.fase === "in_progress" && (
                  <Text style={styles.restante}>
                    Termina en {tiempoRestante(r.salida)}
                  </Text>
                )}

                {/* Completada: calificar una vez, o ver cuántas estrellas puse */}
                {r.fase === "completed" && r.miCalificacion !== null && (
                  <View style={styles.calificada}>
                    <Text style={styles.detalle}>Calificaste</Text>
                    <Stars value={r.miCalificacion} size={11} />
                  </View>
                )}
                {r.fase === "completed" && r.miCalificacion === null && (
                  <Pressable onPress={() => setCalificando(r)}>
                    <Text style={styles.accion}>
                      {esPropietario ? "Calificar conductor" : "Calificar"}
                    </Text>
                  </Pressable>
                )}

                {cancelable && confirmando !== r.id && (
                  <Pressable onPress={() => setConfirmando(r.id)}>
                    <Text style={styles.accion}>Cancelar reserva</Text>
                  </Pressable>
                )}

                {cancelable && confirmando === r.id && (
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
      <ReviewModal
        reservaId={calificando?.id ?? null}
        titulo={
          esPropietario
            ? `¿Cómo fue ${calificando?.conductor.nombre ?? ""} como conductor?`
            : `¿Qué tal ${calificando?.parqueadero.titulo ?? "el parqueadero"}?`
        }
        onClose={() => setCalificando(null)}
        onRated={(id, estrellas) => {
          // Se marca como calificada sin volver a pedir la lista
          setReservas((actuales) =>
            (actuales ?? []).map((r) =>
              r.id === id ? { ...r, miCalificacion: estrellas } : r,
            ),
          );
          setCalificando(null);
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
  porPagar: {
    fontSize: 11,
    fontWeight: "600",
    color: "#B26A00",
    marginTop: 3,
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
  calificada: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: spacing.sm,
  },
});
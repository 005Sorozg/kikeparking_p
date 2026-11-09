import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
  Pressable,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import type { AppScreenProps } from "../types/navigation";
import {
  Parqueadero,
  cambiarDisponibilidad,
  formatearPrecio,
  obtenerParqueadero,
} from "../services/parking";
import {
  Reserva,
  calcularEstadisticas,
  esProxima,
  formatearRango,
  obtenerReservasRecibidas,
  tiempoRestante,
} from "../services/bookings";
import { BookingPhaseTag } from "../components/BookingPhaseTag";
import { ReviewModal } from "../components/ReviewModal";
import { ReviewItem } from "../components/ReviewItem";
import { Stars } from "../components/Stars";
import { Resena, obtenerResenas } from "../services/reviews";
import { useAuth } from "../context/AuthContext";
import { ImagePlaceholder, PrimaryButton } from "../components/ui";
import { colors, radius, spacing } from "../styles/theme";

// Vista del propietario de uno de sus parqueaderos: estadísticas y reservas.
export function MyParkingDetailScreen({
  route,
  navigation,
}: AppScreenProps<"MyParkingDetail">) {
  const { token } = useAuth();
  const { parkingSpotId } = route.params;
  const [spot, setSpot] = useState<Parqueadero | null>(null);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [cambiando, setCambiando] = useState(false);
  const [errorPausa, setErrorPausa] = useState<string | null>(null);
  const [resenas, setResenas] = useState<Resena[]>([]);
  // Reserva cuyo conductor se está calificando
  const [calificando, setCalificando] = useState<Reserva | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!token) {
        setError("Debes iniciar sesión.");
        return;
      }

      let activo = true;

      Promise.all([
        obtenerParqueadero(parkingSpotId),
        obtenerReservasRecibidas(token, parkingSpotId),
        obtenerResenas(parkingSpotId),
      ])
        .then(([dato, lista, opiniones]) => {
          if (!activo) return;
          setSpot(dato);
          setReservas(lista);
          setResenas(opiniones);
        })
        .catch((e) => {
          if (activo) {
            setError(
              e instanceof Error ? e.message : "No se pudo cargar el parqueadero.",
            );
          }
        });

      return () => {
        activo = false;
      };
    }, [token, parkingSpotId]),
  );

  if (error) {
    return (
      <View style={styles.centro}>
        <Text style={styles.vacio}>{error}</Text>
      </View>
    );
  }

  if (!spot) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

// Pausar / reactivar: el interruptor cambia "available" en el backend.
  const alternarDisponible = async (disponible: boolean) => {
    if (!token) return;

    setCambiando(true);
    setErrorPausa(null);
    try {
      setSpot(await cambiarDisponibilidad(spot.id, disponible, token));
    } catch (e) {
      setErrorPausa(
        e instanceof Error ? e.message : "No se pudo cambiar la disponibilidad.",
      );
    } finally {
      setCambiando(false);
    }
  };

  const stats = calcularEstadisticas(reservas);
  const proximas = reservas
    .filter(esProxima)
    .sort((a, b) => a.entrada.getTime() - b.entrada.getTime());
    // Quién está usando el parqueadero ahora mismo
  const enCurso = reservas.filter((r) => r.fase === "in_progress");
  // Historial: completadas y canceladas, la más reciente primero
  const anteriores = reservas
    .filter((r) => r.fase === "completed" || r.fase === "cancelled")
    .sort((a, b) => b.entrada.getTime() - a.entrada.getTime());

  const TARJETAS = [
    { valor: String(stats.total), etiqueta: "Reservas" },
    { valor: String(stats.proximas), etiqueta: "Próximas" },
    { valor: String(stats.horas), etiqueta: "Horas reservadas" },
    { valor: String(stats.canceladas), etiqueta: "Canceladas" },
  ];

  return (
    <ScrollView
      style={styles.contenedor}
      contentContainerStyle={styles.contenido}
    >
      <View style={styles.cabecera}>
        <ImagePlaceholder style={styles.foto} iconSize={30} source={spot.imagen} />
        <View style={styles.cabeceraTextos}>
          <Text style={styles.titulo}>{spot.titulo}</Text>
          <Text style={styles.detalle}>
            {spot.barrio} · {spot.direccion}
          </Text>
          <Text style={styles.precio}>
            {formatearPrecio(spot.precioHora)}
            <Text style={styles.precioUnidad}> / hora</Text>
          </Text>
          <View style={styles.calificacion}>
            <Ionicons name="star" size={12} color={colors.text} />
            <Text style={styles.calificacionTexto}>
              {spot.resenas > 0 ? spot.calificacion.toFixed(1) : "Sin calificaciones todavía"}
            </Text>
          </View>
          <Text style={[styles.estado, !spot.disponible && styles.estadoPausado]}>
            {spot.disponible ? "Disponible" : "Pausado"}
          </Text>
        </View>
      </View>

      <View style={styles.botonEditar}>
        <PrimaryButton
          label="Editar información"
          onPress={() =>
            navigation.navigate("EditParking", { parkingSpotId: spot.id })
          }
        />
      </View>

      <View style={styles.pausa}>
        <View style={styles.pausaTextos}>
          <Text style={styles.pausaTitulo}>Recibir reservas</Text>
          <Text style={styles.pausaDescripcion}>
            {spot.disponible
              ? "Los conductores pueden reservar este parqueadero."
              : "Pausado: no recibe reservas nuevas. Las que ya tenías se mantienen."}
          </Text>
        </View>
        <Switch
          value={spot.disponible}
          onValueChange={alternarDisponible}
          disabled={cambiando}
          trackColor={{ false: colors.borderLight, true: colors.primary }}
          thumbColor={colors.white}
          // En web el círculo activo sale verde por defecto; así queda blanco también ahí.
          {...({ activeThumbColor: colors.white } as object)}
        />
      </View>
      {errorPausa && <Text style={styles.error}>{errorPausa}</Text>}

      <View style={styles.ingresos}>
        <Text style={styles.ingresosEtiqueta}>Ingresos</Text>
        <Text style={styles.ingresosValor}>{formatearPrecio(stats.ingresos)}</Text>
        <Text style={styles.ingresosNota}>
          Reservas confirmadas, incluidas las próximas
        </Text>
      </View>

      <View style={styles.tarjetas}>
        {TARJETAS.map((t) => (
          <View key={t.etiqueta} style={styles.tarjeta}>
            <Text style={styles.tarjetaValor}>{t.valor}</Text>
            <Text style={styles.tarjetaEtiqueta}>{t.etiqueta}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.seccion}>En este momento</Text>
      {enCurso.length === 0 && (
        <Text style={styles.vacio}>Nadie está usando el parqueadero ahora.</Text>
      )}
      {enCurso.map((r) => (
        <FilaReserva key={r.id} reserva={r} onCalificar={setCalificando} />
      ))}

      <Text style={styles.seccion}>Próximas reservas</Text>
      {proximas.length === 0 && (
        <Text style={styles.vacio}>No hay reservas próximas.</Text>
      )}
      {proximas.map((r) => (
        <FilaReserva key={r.id} reserva={r} onCalificar={setCalificando} />
      ))}

      <Text style={styles.seccion}>Historial</Text>
      {anteriores.length === 0 && (
        <Text style={styles.vacio}>Todavía no hay reservas anteriores.</Text>
      )}
      {anteriores.map((r) => (
        <FilaReserva key={r.id} reserva={r} onCalificar={setCalificando} />
      ))}
      <Text style={styles.seccion}>Reseñas de los conductores</Text>
      {resenas.length === 0 && (
        <Text style={styles.vacio}>Todavía nadie ha calificado este parqueadero.</Text>
      )}
      {resenas.map((r) => (
        <ReviewItem key={r.id} resena={r} />
      ))}

      <ReviewModal
        reservaId={calificando?.id ?? null}
        titulo={`¿Cómo fue ${calificando?.conductor.nombre ?? ""} como conductor?`}
        onClose={() => setCalificando(null)}
        onRated={(id, estrellas) => {
          setReservas((actuales) =>
            actuales.map((r) => (r.id === id ? { ...r, miCalificacion: estrellas } : r)),
          );
          setCalificando(null);
        }}
      />
    </ScrollView>
  );
}

// Una reserva: quién, cuándo, vehículo y valor.
  // Una reserva: quién (con su calificación), cuándo, vehículo y valor.
  function FilaReserva({
    reserva: r,
    onCalificar,
  }: {
    reserva: Reserva;
    onCalificar: (reserva: Reserva) => void;
  }) {
  const cancelada = r.estado === "cancelled";
  return (
    <View style={styles.fila}>
      <View style={styles.avatar}>
        <Text style={styles.avatarLetra}>
          {r.conductor.nombre.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.filaTextos}>
          <Text style={styles.nombre}>
            {r.conductor.nombre}
            {r.conductor.resenas > 0 && (
              <Text style={styles.detalle}>
                {"  "}★ {r.conductor.calificacion.toFixed(1)}
              </Text>
            )}
          </Text>
        <Text style={styles.detalle}>{formatearRango(r.entrada, r.salida)}</Text>
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
          <Text style={styles.restante}>Sale en {tiempoRestante(r.salida)}</Text>
        )}
      </View>
      {r.fase === "completed" && r.miCalificacion !== null && (
        <View style={styles.calificada}>
          <Text style={styles.detalle}>Calificaste</Text>
          <Stars value={r.miCalificacion} size={11} />
        </View>
      )}
      {r.fase === "completed" && r.miCalificacion === null && (
        <Pressable onPress={() => onCalificar(r)}>
          <Text style={styles.accion}>Calificar conductor</Text>
        </Pressable>
      )}
      <Text style={[styles.valor, cancelada && styles.valorTachado]}>
        {formatearPrecio(r.total)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contenido: {
    padding: 18,
    paddingBottom: spacing.xl,
  },
  centro: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  cabecera: {
    flexDirection: "row",
    gap: 14,
  },
  foto: {
    width: 96,
    height: 96,
    borderRadius: radius.md,
  },
  cabeceraTextos: {
    flex: 1,
  },
  titulo: {
    fontSize: 18,
    fontWeight: "700",
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
  estado: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2E7D32",
    marginTop: spacing.xs,
  },
  estadoPausado: {
    color: colors.textLight,
  },
    botonEditar: {
    marginTop: spacing.md,
  },
  pausa: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  pausaTextos: {
    flex: 1,
  },
  pausaTitulo: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  pausaDescripcion: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
  },
  error: {
    fontSize: 12,
    color: colors.primary,
    marginTop: spacing.sm,
  },
  ingresos: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.chip,
  },
  ingresosEtiqueta: {
    fontSize: 12,
    color: colors.textLight,
  },
  ingresosValor: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
    marginTop: 2,
  },
  ingresosNota: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 2,
  },
  tarjetas: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  tarjeta: {
    // Dos tarjetas por fila, descontando el espacio entre ellas
    flexBasis: "48%",
    flexGrow: 1,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  tarjetaValor: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
  },
  tarjetaEtiqueta: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
  },
  seccion: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  vacio: {
    fontSize: 12,
    color: colors.textLight,
  },
  fila: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.chip,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetra: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  filaTextos: {
    flex: 1,
  },
  nombre: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
  },
  vehiculo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  restante: {
    fontSize: 11,
    fontWeight: "600",
    color: "#2E7D32",
    marginTop: 3,
  },
  valor: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
  },
  valorTachado: {
    color: colors.textLight,
    textDecorationLine: "line-through",
  },
  calificacion: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  calificacionTexto: {
    fontSize: 12,
    color: colors.text,
  },
  calificada: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: spacing.xs,
  },
  accion: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
    marginTop: spacing.xs,
  },
});
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Calendar, LocaleConfig } from "react-native-calendars";
import type { AppScreenProps } from "../types/navigation";
import {
  Parqueadero,
  formatearPrecio,
  obtenerParqueadero,
} from "../services/parking";
import {
  HorarioOcupado,
  VehicleKind,
  crearReserva,
  formatearHora,
  formatearRango,
  obtenerHorariosOcupados,
} from "../services/bookings";
import { useAuth } from "../context/AuthContext";
import { Chip, ImagePlaceholder, PrimaryButton } from "../components/ui";
import { colors, radius, spacing } from "../styles/theme";

// Calendario en español (nombres de meses y días).
LocaleConfig.locales.es = {
  monthNames: [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ],
  monthNamesShort: [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
  ],
  dayNames: [
    "Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado",
  ],
  dayNamesShort: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"],
  today: "Hoy",
};
LocaleConfig.defaultLocale = "es";

// Hasta cuántos días hacia adelante se puede reservar.
const DIAS_ADELANTE = 60;
const MAX_HORAS = 24;
const HORA_MS = 60 * 60 * 1000;
const HORAS_DEL_DIA = Array.from({ length: 24 }, (_, h) => h);

// Date -> "2026-11-07" (lo que usa el calendario), en hora local.
const aIso = (fecha: Date) =>
  `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;

// "2026-11-07" -> Date a medianoche, en hora local.
const desdeIso = (iso: string) => {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(a, m - 1, d);
};

// Medianoche de hoy + i días.
const diaDesdeHoy = (i: number) => {
  const f = new Date();
  f.setHours(0, 0, 0, 0);
  f.setDate(f.getDate() + i);
  return f;
};

// Horas de entrada que se pueden elegir ese día: hoy solo las que aún no pasan.
const horasPosibles = (dia: Date) => {
  const ahora = new Date();
  const esHoy = dia.toDateString() === ahora.toDateString();
  return esHoy
    ? HORAS_DEL_DIA.filter((h) => h > ahora.getHours())
    : HORAS_DEL_DIA;
};

// El día elegido a la hora h en punto.
const aLaHora = (dia: Date, h: number) => {
  const f = new Date(dia);
  f.setHours(h, 0, 0, 0);
  return f;
};

// ¿El rango [inicio, fin) se cruza con alguna reserva? (misma regla que el backend)
const seCruza = (ocupados: HorarioOcupado[], inicio: Date, fin: Date) =>
  ocupados.some((o) => o.entrada < fin && o.salida > inicio);

// Horas en que se puede entrar ese día: que no hayan pasado y cuya primera hora esté libre.
const horasLibres = (dia: Date, ocupados: HorarioOcupado[]) =>
  horasPosibles(dia).filter((h) => {
    const inicio = aLaHora(dia, h);
    return !seCruza(ocupados, inicio, new Date(inicio.getTime() + HORA_MS));
  });

// Cuántas horas se pueden reservar desde "entrada" sin chocar con la siguiente reserva.
const maxHorasDesde = (entrada: Date, ocupados: HorarioOcupado[]) => {
  const siguientes = ocupados
    .filter((o) => o.entrada >= entrada)
    .map((o) => o.entrada.getTime());

  if (siguientes.length === 0) return MAX_HORAS;

  const horasHastaLaSiguiente = Math.floor(
    (Math.min(...siguientes) - entrada.getTime()) / HORA_MS,
  );
  return Math.min(MAX_HORAS, horasHastaLaSiguiente);
};

// Reserva: día, hora de entrada, horas, vehículo y resumen del precio.
export function BookingScreen({
  route,
  navigation,
}: AppScreenProps<"Booking">) {
  const { usuario, token } = useAuth();
  const [spot, setSpot] = useState<Parqueadero | null>(null);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  // Si ya pasó la última hora de hoy, el primer día que se puede elegir es mañana.
  const primerDia = useMemo(
    () => (horasPosibles(diaDesdeHoy(0)).length > 0 ? diaDesdeHoy(0) : diaDesdeHoy(1)),
    [],
  );
  const ultimoDia = useMemo(() => diaDesdeHoy(DIAS_ADELANTE), []);

  const [ocupados, setOcupados] = useState<HorarioOcupado[]>([]);
  const [dia, setDia] = useState(primerDia);
  const [hora, setHora] = useState<number | undefined>(horasPosibles(primerDia)[0]);
  const [horas, setHoras] = useState(2);
  const [vehiculo, setVehiculo] = useState<VehicleKind>("carro");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cambia al día "d" y, si la hora elegida no está libre ese día, toma la primera libre.
  const ubicar = (d: Date, lista: HorarioOcupado[]) => {
    const libres = horasLibres(d, lista);
    setDia(d);
    setHora((actual) =>
      actual !== undefined && libres.includes(actual) ? actual : libres[0],
    );
  };

  // Pide los horarios ocupados y deja elegido un día con horas libres.
  const cargarOcupados = async (diaActual: Date) => {
    if (!token) return;

    const lista = await obtenerHorariosOcupados(route.params.parkingSpotId, token);
    setOcupados(lista);

    let d = diaActual;
    while (horasLibres(d, lista).length === 0 && d < ultimoDia) {
      d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
    }
    ubicar(d, lista);
  };

  useEffect(() => {
    let activo = true;

    cargarOcupados(primerDia).catch(() => {
      if (activo) setError("No se pudieron cargar los horarios ocupados.");
    });

    obtenerParqueadero(route.params.parkingSpotId)
      .then((dato) => {
        if (activo) {
          setSpot(dato);
          // Si no recibe carros, arranca con moto
          if (!dato.caracteristicas.aceptaCarros) setVehiculo("moto");
        }
      })
      .catch((e) => {
        if (activo) {
          setErrorCarga(
            e instanceof Error ? e.message : "No se pudo cargar el parqueadero.",
          );
        }
      });

    return () => {
      activo = false;
    };
  }, [route.params.parkingSpotId]);

  const elegirDia = (iso: string) => {
    ubicar(desdeIso(iso), ocupados);
    setError(null);
  };

  // Días sin ninguna hora libre: salen deshabilitados en el calendario.
  const diasLlenos = useMemo(() => {
    const marcas: Record<string, { disabled: true; disableTouchEvent: true }> = {};
    const dias = new Set(ocupados.map((o) => aIso(o.entrada)));

    dias.forEach((iso) => {
      if (horasLibres(desdeIso(iso), ocupados).length === 0) {
        marcas[iso] = { disabled: true, disableTouchEvent: true };
      }
    });
    return marcas;
  }, [ocupados]);

  if (errorCarga) {
    return (
      <View style={styles.centro}>
        <Text style={styles.vacio}>{errorCarga}</Text>
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

  const libres = horasLibres(dia, ocupados);
  const hayHora = hora !== undefined && libres.includes(hora);
  const entrada = aLaHora(dia, hora ?? 0);
  // No se puede pasar de la siguiente reserva: si hay una en 3 horas, el máximo es 3.
  const maxHoras = hayHora ? maxHorasDesde(entrada, ocupados) : 1;
  const horasReserva = Math.min(horas, maxHoras);
  const salida = new Date(entrada.getTime() + horasReserva * HORA_MS);
  const total = spot.precioHora * horasReserva;
  const esConductor = usuario?.role === "conductor";

  const confirmar = async () => {
    if (!token) {
      setError("Debes iniciar sesión para reservar.");
      return;
    }

    setEnviando(true);
    setError(null);

    try {
      // La reserva queda pendiente de pago y la hora apartada por 10 minutos
      const reserva = await crearReserva(
        { parqueaderoId: spot.id, vehiculo, entrada, horas: horasReserva },
        token,
      );
      navigation.replace("Payment", {
        reservaId: reserva.id,
        titulo: spot.titulo,
        total: reserva.total,
        limitePago: (reserva.limitePago ?? new Date()).toISOString(),
      });
    } catch (e) {
      // Ej: "El parqueadero ya está reservado en ese horario..." si alguien reservó
      // mientras tanto. Se recargan los ocupados para que ese horario salga en gris.
      setError(e instanceof Error ? e.message : "No se pudo crear la reserva.");
      setEnviando(false);
      cargarOcupados(dia).catch(() => {});
    }
  };

  return (
    <ScrollView
      style={styles.contenedor}
      contentContainerStyle={styles.contenido}
    >
      <Text style={styles.titulo}>Confirma tu reserva</Text>

      <View style={styles.resumenSpot}>
        <ImagePlaceholder
          style={styles.foto}
          iconSize={26}
          source={spot.imagen}
        />
        <View style={styles.resumenTextos}>
          <Text style={styles.nombre} numberOfLines={1}>
            {spot.titulo}
          </Text>
          <Text style={styles.detalle}>{spot.barrio}</Text>
          <Text style={styles.detalle}>{spot.direccion}</Text>
        </View>
      </View>

      <Text style={styles.seccion}>Día</Text>
      <Calendar
        style={styles.calendario}
        current={aIso(dia)}
        minDate={aIso(primerDia)}
        maxDate={aIso(ultimoDia)}
        firstDay={1}
        onDayPress={(d) => elegirDia(d.dateString)}
        markedDates={{ ...diasLlenos, [aIso(dia)]: { selected: true } }}
        theme={{
          calendarBackground: colors.background,
          selectedDayBackgroundColor: colors.primary,
          selectedDayTextColor: colors.white,
          todayTextColor: colors.primary,
          dayTextColor: colors.text,
          textDisabledColor: colors.borderLight,
          arrowColor: colors.primary,
          monthTextColor: colors.text,
          textMonthFontWeight: "700",
          textSectionTitleColor: colors.textLight,
        }}
      />

      <Text style={styles.seccion}>Hora de entrada</Text>
      <View style={styles.horas}>
        {horasPosibles(dia).map((h) => {
          const ocupada = !libres.includes(h);
          return (
            <Chip
              key={h}
              label={formatearHora(aLaHora(dia, h))}
              selected={hora === h && !ocupada}
              disabled={ocupada}
              onPress={() => {
                setHora(h);
                setError(null);
              }}
            />
          );
        })}
      </View>

      <Text style={styles.seccion}>Horas</Text>
      <View style={styles.contador}>
        <Pressable
          style={styles.circulo}
          onPress={() => setHoras(Math.max(1, horasReserva - 1))}
        >
          <Feather name="minus" size={17} color={colors.text} />
        </Pressable>
        <Text style={styles.contadorValor}>{horasReserva}</Text>
        <Pressable
          style={styles.circulo}
          onPress={() => setHoras(Math.min(maxHoras, horasReserva + 1))}
        >
          <Feather name="plus" size={17} color={colors.text} />
        </Pressable>
      </View>
      {hayHora && maxHoras < MAX_HORAS && (
        <Text style={styles.aviso}>
          Máximo {maxHoras} {maxHoras === 1 ? "hora" : "horas"}: a las{" "}
          {formatearHora(new Date(entrada.getTime() + maxHoras * HORA_MS))} ya
          está reservado.
        </Text>
      )}

      <Text style={styles.seccion}>Vehículo</Text>
      {/* Solo los vehículos que recibe este parqueadero */}
      <View style={styles.chips}>
        {spot.caracteristicas.aceptaCarros && (
          <Chip
            label="Carro"
            icon="truck"
            selected={vehiculo === "carro"}
            onPress={() => setVehiculo("carro")}
          />
        )}
        {spot.caracteristicas.aceptaMotos && (
          <Chip
            label="Moto"
            icon="navigation"
            selected={vehiculo === "moto"}
            onPress={() => setVehiculo("moto")}
          />
        )}
      </View>

      <View style={styles.tarjeta}>
        <Text style={styles.detalle}>{formatearRango(entrada, salida)}</Text>
        <View style={styles.filaPrecio}>
          <Text style={styles.nombre}>
            {formatearPrecio(spot.precioHora)} x {horasReserva}{" "}
            {horasReserva === 1 ? "hora" : "horas"}
          </Text>
          <Text style={styles.nombre}>{formatearPrecio(total)}</Text>
        </View>
        <View style={[styles.filaPrecio, styles.filaTotal]}>
          <Text style={styles.total}>Total</Text>
          <Text style={styles.total}>{formatearPrecio(total)}</Text>
        </View>
      </View>

      {!esConductor && (
        <Text style={styles.aviso}>
          Las reservas son para cuentas de conductor.
        </Text>
      )}
      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.boton}>
        <PrimaryButton
          label={enviando ? "Reservando..." : "Continuar al pago"}
          onPress={confirmar}
          disabled={enviando || !esConductor || !spot.disponible || !hayHora}
        />
      </View>
    </ScrollView>
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
  vacio: {
    color: colors.textLight,
  },
  titulo: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.md,
  },
  resumenSpot: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  foto: {
    width: 64,
    height: 64,
    borderRadius: radius.sm,
  },
  resumenTextos: {
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
  seccion: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  chips: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  contador: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  circulo: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.chip,
    alignItems: "center",
    justifyContent: "center",
  },
  contadorValor: {
    minWidth: 24,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  tarjeta: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  filaPrecio: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.sm,
  },
  filaTotal: {
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  total: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  horas: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  calendario: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.lg,
    paddingBottom: spacing.sm,
  },
  aviso: {
    marginTop: spacing.md,
    fontSize: 12,
    color: colors.textLight,
  },
  error: {
    marginTop: spacing.md,
    fontSize: 12,
    color: colors.primary,
  },
  boton: {
    marginTop: spacing.lg,
  },
});

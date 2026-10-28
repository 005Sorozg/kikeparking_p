import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { AppScreenProps } from "../types/navigation";
import { formatearPrecio, parkingSpots } from "../services/parking";
import {
  VehicleKind,
  agregarReserva,
  aIso,
  formatearFecha,
  formatearRango,
} from "../services/bookings";
import { Chip, ImagePlaceholder, PrimaryButton } from "../components/ui";
import { colors, radius, spacing } from "../styles/theme";

const DIAS_DISPONIBLES = 7;
const MAX_DIAS = 30;

// Reserva: fecha de entrada, días, vehículo y resumen del precio.
export function BookingScreen({
  route,
  navigation,
}: AppScreenProps<"Booking">) {
  const spot = parkingSpots.find((p) => p.id === route.params.parkingSpotId);

  const fechas = useMemo(
    () =>
      Array.from({ length: DIAS_DISPONIBLES }, (_, i) => {
        const f = new Date();
        f.setDate(f.getDate() + i);
        return aIso(f);
      }),
    [],
  );
  const [entrada, setEntrada] = useState(fechas[0]);
  const [dias, setDias] = useState(1);
  const [vehiculo, setVehiculo] = useState<VehicleKind>("carro");

  if (!spot) {
    return (
      <View style={styles.centro}>
        <Text style={styles.vacio}>No encontramos este parqueadero.</Text>
      </View>
    );
  }

  const total = spot.precioDia * dias;

  const confirmar = () => {
    agregarReserva({
      parkingSpotId: spot.id,
      vehiculo,
      entrada,
      dias,
      total,
    });
    navigation.replace("MyBookings");
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
          <Text style={styles.detalle}>
            {spot.barrio}, {spot.ciudad}
          </Text>
          <Text style={styles.detalle}>{spot.direccion}</Text>
        </View>
      </View>

      <Text style={styles.seccion}>Fecha de entrada</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {fechas.map((f) => (
          <Chip
            key={f}
            label={formatearFecha(f)}
            selected={entrada === f}
            onPress={() => setEntrada(f)}
          />
        ))}
      </ScrollView>

      <Text style={styles.seccion}>Días</Text>
      <View style={styles.contador}>
        <Pressable
          style={styles.circulo}
          onPress={() => setDias((d) => Math.max(1, d - 1))}
        >
          <Feather name="minus" size={17} color={colors.text} />
        </Pressable>
        <Text style={styles.contadorValor}>{dias}</Text>
        <Pressable
          style={styles.circulo}
          onPress={() => setDias((d) => Math.min(MAX_DIAS, d + 1))}
        >
          <Feather name="plus" size={17} color={colors.text} />
        </Pressable>
      </View>

      <Text style={styles.seccion}>Vehículo</Text>
      <View style={styles.chips}>
        <Chip
          label="Carro"
          icon="truck"
          selected={vehiculo === "carro"}
          onPress={() => setVehiculo("carro")}
        />
        <Chip
          label="Moto"
          icon="navigation"
          selected={vehiculo === "moto"}
          onPress={() => setVehiculo("moto")}
        />
      </View>

      <View style={styles.tarjeta}>
        <Text style={styles.detalle}>{formatearRango(entrada, dias)}</Text>
        <View style={styles.filaPrecio}>
          <Text style={styles.nombre}>
            {formatearPrecio(spot.precioDia)} x {dias}{" "}
            {dias === 1 ? "día" : "días"}
          </Text>
          <Text style={styles.nombre}>{formatearPrecio(total)}</Text>
        </View>
        <View style={[styles.filaPrecio, styles.filaTotal]}>
          <Text style={styles.total}>Total</Text>
          <Text style={styles.total}>{formatearPrecio(total)}</Text>
        </View>
      </View>

      <View style={styles.boton}>
        <PrimaryButton label="Confirmar reserva" onPress={confirmar} />
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
  boton: {
    marginTop: spacing.lg,
  },
});

import React, { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EXTRAS, Opcion } from "./ParkingFeatures";
import { PrimaryButton } from "./ui";
import { colors, radius, spacing } from "../styles/theme";

// Filtros de la ventana (los mismos nombres que FiltrosParqueaderos)
export interface FiltrosExtra {
  vehiculo?: "carro" | "moto";
  techado?: boolean;
  vigilancia?: boolean;
  camaras?: boolean;
  cargaElectrica?: boolean;
}

// Cuántos filtros hay puestos (para el número del botón "Filtrar")
export const contarFiltros = (f: FiltrosExtra) =>
  (f.vehiculo ? 1 : 0) + EXTRAS.filter((e) => f[e.clave as keyof FiltrosExtra]).length;

type ClaveExtra = "techado" | "vigilancia" | "camaras" | "cargaElectrica";

const VEHICULOS: { valor: FiltrosExtra["vehiculo"]; texto: string }[] = [
  { valor: undefined, texto: "Cualquiera" },
  { valor: "carro", texto: "Carro" },
  { valor: "moto", texto: "Moto" },
];

// Ventana de filtros de Explorar. Los cambios solo se aplican al tocar "Ver resultados".
export function FiltersModal({
  visible,
  filtros,
  onAplicar,
  onCerrar,
}: {
  visible: boolean;
  filtros: FiltrosExtra;
  onAplicar: (nuevos: FiltrosExtra) => void;
  onCerrar: () => void;
}) {
  const insets = useSafeAreaInsets();
  // Borrador: lo que se va marcando antes de aplicar
  const [borrador, setBorrador] = useState<FiltrosExtra>(filtros);

  // Cada vez que se abre, arranca con los filtros que ya están aplicados
  useEffect(() => {
    if (visible) setBorrador(filtros);
  }, [visible, filtros]);

  const alternar = (clave: ClaveExtra) =>
    setBorrador((b) => ({ ...b, [clave]: !b[clave] || undefined }));

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onCerrar}>
      <View style={styles.fondo}>
        <View style={[styles.hoja, { paddingBottom: insets.bottom + spacing.md }]}>
          <View style={styles.encabezado}>
            <Pressable hitSlop={10} onPress={onCerrar}>
              <Feather name="x" size={20} color={colors.text} />
            </Pressable>
            <Text style={styles.titulo}>Filtros</Text>
            <Pressable hitSlop={10} onPress={() => setBorrador({})}>
              <Text style={styles.limpiar}>Limpiar</Text>
            </Pressable>
          </View>

          <Text style={styles.seccion}>Tipo de vehículo</Text>
          <View style={styles.fila}>
            {VEHICULOS.map((v) => (
              <Opcion
                key={v.texto}
                texto={v.texto}
                activa={borrador.vehiculo === v.valor}
                onPress={() => setBorrador((b) => ({ ...b, vehiculo: v.valor }))}
              />
            ))}
          </View>

          <Text style={styles.seccion}>Que tenga</Text>
          <View style={styles.fila}>
            {EXTRAS.map((e) => (
              <Opcion
                key={e.clave}
                texto={e.texto}
                icono={e.icono}
                activa={!!borrador[e.clave as ClaveExtra]}
                onPress={() => alternar(e.clave as ClaveExtra)}
              />
            ))}
          </View>

          <View style={styles.boton}>
            <PrimaryButton label="Ver resultados" onPress={() => onAplicar(borrador)} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fondo: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  hoja: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: 24,
    paddingTop: spacing.md,
  },
  encabezado: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  titulo: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  limpiar: {
    fontSize: 13,
    color: colors.text,
    textDecorationLine: "underline",
  },
  seccion: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  fila: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  boton: {
    marginTop: spacing.xl,
  },
});
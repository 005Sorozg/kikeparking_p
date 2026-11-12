import React, { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EXTRAS, Option } from "./ParkingFeatures";
import { PrimaryButton } from "./ui";
import { colors, radius, spacing } from "../styles/theme";

// Filtros de la ventana (los mismos nombres que ParkingFilters)
export interface ExtraFilters {
  vehicle?: "carro" | "moto";
  covered?: boolean;
  security?: boolean;
  cameras?: boolean;
  evCharging?: boolean;
}

// Cuántos filtros hay puestos (para el número del botón "Filtrar")
export const countFilters = (f: ExtraFilters) =>
  (f.vehicle ? 1 : 0) + EXTRAS.filter((e) => f[e.key as keyof ExtraFilters]).length;

type ExtraKey = "covered" | "security" | "cameras" | "evCharging";

const VEHICLES: { value: ExtraFilters["vehicle"]; text: string }[] = [
  { value: undefined, text: "Cualquiera" },
  { value: "carro", text: "Carro" },
  { value: "moto", text: "Moto" },
];

// Ventana de filtros de Explorar. Los cambios solo se aplican al tocar "Ver resultados".
export function FiltersModal({
  visible,
  filters,
  onApply,
  onClose,
}: {
  visible: boolean;
  filters: ExtraFilters;
  onApply: (newItems: ExtraFilters) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  // Borrador: lo que se va marcando antes de aplicar
  const [draft, setDraft] = useState<ExtraFilters>(filters);

  // Cada vez que se abre, arranca con los filtros que ya están aplicados
  useEffect(() => {
    if (visible) setDraft(filters);
  }, [visible, filters]);

  const toggle = (key: ExtraKey) =>
    setDraft((b) => ({ ...b, [key]: !b[key] || undefined }));

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }]}>
          <View style={styles.heading}>
            <Pressable hitSlop={10} onPress={onClose}>
              <Feather name="x" size={20} color={colors.text} />
            </Pressable>
            <Text style={styles.title}>Filtros</Text>
            <Pressable hitSlop={10} onPress={() => setDraft({})}>
              <Text style={styles.clear}>Limpiar</Text>
            </Pressable>
          </View>

          <Text style={styles.section}>Tipo de vehículo</Text>
          <View style={styles.row}>
            {VEHICLES.map((v) => (
              <Option
                key={v.text}
                text={v.text}
                active={draft.vehicle === v.value}
                onPress={() => setDraft((b) => ({ ...b, vehicle: v.value }))}
              />
            ))}
          </View>

          <Text style={styles.section}>Que tenga</Text>
          <View style={styles.row}>
            {EXTRAS.map((e) => (
              <Option
                key={e.key}
                text={e.text}
                icon={e.icon}
                active={!!draft[e.key as ExtraKey]}
                onPress={() => toggle(e.key as ExtraKey)}
              />
            ))}
          </View>

          <View style={styles.button}>
            <PrimaryButton label="Ver resultados" onPress={() => onApply(draft)} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: 24,
    paddingTop: spacing.md,
  },
  heading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  clear: {
    fontSize: 13,
    color: colors.text,
    textDecorationLine: "underline",
  },
  section: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  button: {
    marginTop: spacing.xl,
  },
});
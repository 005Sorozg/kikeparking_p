import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Features } from "../services/parking";
import { colors, radius, spacing } from "../styles/theme";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

// Las 4 características extra (los vehículos se manejan aparte)
export const EXTRAS: { key: keyof Features; text: string; icon: IconName }[] = [
  { key: "covered", text: "Techado", icon: "umbrella-outline" },
  { key: "security", text: "Vigilancia", icon: "shield-checkmark-outline" },
  { key: "cameras", text: "Cámaras", icon: "videocam-outline" },
  { key: "evCharging", text: "Carga para eléctricos", icon: "flash-outline" },
];

// "Carros y motos", "Solo carros" o "Solo motos"
export const vehiclesText = (c: Features) =>
  c.acceptsCars && c.acceptsMotorcycles
    ? "Carros y motos"
    : c.acceptsCars
      ? "Solo carros"
      : "Solo motos";

// Detalle del parqueadero: qué ofrece, con su ícono.
export function FeatureList({ features }: { features: Features }) {
  const extras = EXTRAS.filter((e) => features[e.key]);

  return (
    <View style={styles.list}>
      <View style={styles.item}>
        <Ionicons
          name={features.acceptsCars ? "car-outline" : "bicycle-outline"}
          size={18}
          color={colors.text}
        />
        <Text style={styles.itemText}>{vehiclesText(features)}</Text>
      </View>
      {extras.map((e) => (
        <View key={e.key} style={styles.item}>
          <Ionicons name={e.icon} size={18} color={colors.text} />
          <Text style={styles.itemText}>{e.text}</Text>
        </View>
      ))}
    </View>
  );
}

// Publicar / editar: el propietario marca lo que tiene su parqueadero.
export function FeaturesPicker({
  value,
  onChange,
}: {
  value: Features;
  onChange: (next: Features) => void;
}) {
  const toggle = (key: keyof Features) => {
    const next = { ...value, [key]: !value[key] };

    // Debe aceptar al menos un tipo de vehículo: no se deja quitar el último
    if (!next.acceptsCars && !next.acceptsMotorcycles) return;

    onChange(next);
  };

  return (
    <View>
      <Text style={styles.subtitle}>Vehículos que recibe</Text>
      <View style={styles.row}>
        <Option
          text="Carros"
          icon="car-outline"
          active={value.acceptsCars}
          onPress={() => toggle("acceptsCars")}
        />
        <Option
          text="Motos"
          icon="bicycle-outline"
          active={value.acceptsMotorcycles}
          onPress={() => toggle("acceptsMotorcycles")}
        />
      </View>

      <Text style={styles.subtitle}>¿Qué ofrece?</Text>
      <View style={styles.row}>
        {EXTRAS.map((e) => (
          <Option
            key={e.key}
            text={e.text}
            icon={e.icon}
            active={value[e.key]}
            onPress={() => toggle(e.key)}
          />
        ))}
      </View>
    </View>
  );
}

// Botón que se marca y desmarca (con borde oscuro cuando está activo).
export function Option({
  text,
  icon,
  active,
  onPress,
}: {
  text: string;
  icon?: IconName;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.option, active && styles.optionActive]} onPress={onPress}>
      {icon && (
        <Ionicons name={icon} size={16} color={active ? colors.text : colors.textLight} />
      )}
      <Text style={[styles.optionText, active && styles.optionTextActive]}>{text}</Text>
      {active && <Ionicons name="checkmark" size={14} color={colors.text} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  itemText: {
    fontSize: 14,
    color: colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  optionActive: {
    borderColor: colors.text,
    backgroundColor: colors.chip,
  },
  optionText: {
    fontSize: 13,
    color: colors.textLight,
  },
  optionTextActive: {
    color: colors.text,
    fontWeight: "600",
  },
});
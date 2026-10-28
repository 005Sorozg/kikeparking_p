import React, { useState } from "react";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, spacing } from "../styles/theme";

type FeatherName = React.ComponentProps<typeof Feather>["name"];

// Ícono de la marca (la pluma roja de las pantallas de acceso).
export function BrandIcon({ size = 40 }: { size?: number }) {
  return <Feather name="feather" size={size} color={colors.primary} />;
}

// Campo de texto de las pantallas de acceso. Al enfocarse el borde se oscurece.
export function Field({ style, onFocus, onBlur, ...props }: TextInputProps) {
  const [enfocado, setEnfocado] = useState(false);
  return (
    <TextInput
      placeholderTextColor={colors.placeholder}
      autoCapitalize="none"
      {...props}
      style={[styles.field, enfocado && styles.fieldEnfocado, style]}
      onFocus={(e) => {
        setEnfocado(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setEnfocado(false);
        onBlur?.(e);
      }}
    />
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      style={[styles.boton, disabled && styles.botonDeshabilitado]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.botonTexto}>{label}</Text>
    </Pressable>
  );
}

// Línea con una "o" en el centro.
export function OrDivider() {
  return (
    <View style={styles.divisor}>
      <View style={styles.linea} />
      <Text style={styles.divisorTexto}>o</Text>
      <View style={styles.linea} />
    </View>
  );
}

// Botones de Facebook y Twitter (por ahora sin acción).
export function SocialButtons() {
  return (
    <View style={styles.sociales}>
      <Pressable style={styles.social}>
        <Feather name="facebook" size={16} color="#9A9A9A" />
      </Pressable>
      <Pressable style={styles.social}>
        <Feather name="twitter" size={16} color="#9A9A9A" />
      </Pressable>
    </View>
  );
}

// Flecha de volver, respetando la zona segura de arriba.
export function BackButton({ onPress }: { onPress: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={12}
      style={{
        alignSelf: "flex-start",
        paddingTop: insets.top + 12,
        paddingHorizontal: 22,
      }}
    >
      <Feather name="chevron-left" size={28} color={colors.text} />
    </Pressable>
  );
}

// Botón circular gris con un ícono (buscar, ajustes, notificaciones).
export function CircleButton({
  icon,
  onPress,
}: {
  icon: FeatherName;
  onPress?: () => void;
}) {
  return (
    <Pressable style={styles.circulo} onPress={onPress}>
      <Feather name={icon} size={17} color={colors.text} />
    </Pressable>
  );
}

// Chip de filtros. "outline" = fondo blanco con borde, "filled" = fondo gris.
export function Chip({
  label,
  icon,
  selected,
  variant = "outline",
  onPress,
}: {
  label: string;
  icon?: FeatherName;
  selected?: boolean;
  variant?: "outline" | "filled";
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        variant === "outline" ? styles.chipOutline : styles.chipFilled,
        selected && styles.chipActivo,
      ]}
    >
      {icon && (
        <Feather
          name={icon}
          size={14}
          color={selected ? colors.white : colors.text}
        />
      )}
      <Text style={[styles.chipTexto, selected && styles.chipTextoActivo]}>
        {label}
      </Text>
    </Pressable>
  );
}

// Caja gris con el ícono de imagen: el lugar de las fotos que aún no existen.
export function ImagePlaceholder({
  style,
  iconSize = 28,
  round,
}: {
  style?: StyleProp<ViewStyle>;
  iconSize?: number;
  round?: boolean;
}) {
  return (
    <View
      style={[styles.placeholder, round && { borderRadius: radius.full }, style]}
    >
      <Feather name="image" size={iconSize} color={colors.imageIcon} />
    </View>
  );
}

// Avatar circular gris con una silueta de persona.
export function AvatarPlaceholder({ size = 52 }: { size?: number }) {
  return (
    <View
      style={[
        styles.placeholder,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Feather name="user" size={size * 0.42} color={colors.imageIcon} />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    width: "100%",
    height: 42,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    fontSize: 13,
    color: colors.text,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  fieldEnfocado: {
    borderColor: colors.black,
    borderWidth: 1.5,
  },
  boton: {
    width: "100%",
    height: 42,
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  botonDeshabilitado: {
    opacity: 0.5,
  },
  botonTexto: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "500",
  },
  divisor: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    marginVertical: spacing.md,
  },
  linea: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderLight,
  },
  divisorTexto: {
    marginHorizontal: spacing.sm,
    fontSize: 11,
    color: colors.text,
  },
  sociales: {
    flexDirection: "row",
    gap: 14,
    marginTop: spacing.md,
  },
  social: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: "center",
    justifyContent: "center",
  },
  circulo: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.chip,
    alignItems: "center",
    justifyContent: "center",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 30,
    paddingHorizontal: 14,
    borderRadius: radius.full,
  },
  chipOutline: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  chipFilled: {
    backgroundColor: colors.chip,
  },
  chipActivo: {
    backgroundColor: colors.black,
    borderColor: colors.black,
  },
  chipTexto: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.text,
  },
  chipTextoActivo: {
    color: colors.white,
  },
  placeholder: {
    backgroundColor: colors.imagePlaceholder,
    alignItems: "center",
    justifyContent: "center",
  },
});

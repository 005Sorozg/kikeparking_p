import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Caracteristicas } from "../services/parking";
import { colors, radius, spacing } from "../styles/theme";

type NombreIcono = React.ComponentProps<typeof Ionicons>["name"];

// Las 4 características extra (los vehículos se manejan aparte)
export const EXTRAS: { clave: keyof Caracteristicas; texto: string; icono: NombreIcono }[] = [
  { clave: "techado", texto: "Techado", icono: "umbrella-outline" },
  { clave: "vigilancia", texto: "Vigilancia", icono: "shield-checkmark-outline" },
  { clave: "camaras", texto: "Cámaras", icono: "videocam-outline" },
  { clave: "cargaElectrica", texto: "Carga para eléctricos", icono: "flash-outline" },
];

// "Carros y motos", "Solo carros" o "Solo motos"
export const textoVehiculos = (c: Caracteristicas) =>
  c.aceptaCarros && c.aceptaMotos
    ? "Carros y motos"
    : c.aceptaCarros
      ? "Solo carros"
      : "Solo motos";

// Detalle del parqueadero: qué ofrece, con su ícono.
export function FeatureList({ caracteristicas }: { caracteristicas: Caracteristicas }) {
  const extras = EXTRAS.filter((e) => caracteristicas[e.clave]);

  return (
    <View style={styles.lista}>
      <View style={styles.item}>
        <Ionicons
          name={caracteristicas.aceptaCarros ? "car-outline" : "bicycle-outline"}
          size={18}
          color={colors.text}
        />
        <Text style={styles.itemTexto}>{textoVehiculos(caracteristicas)}</Text>
      </View>
      {extras.map((e) => (
        <View key={e.clave} style={styles.item}>
          <Ionicons name={e.icono} size={18} color={colors.text} />
          <Text style={styles.itemTexto}>{e.texto}</Text>
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
  value: Caracteristicas;
  onChange: (nuevas: Caracteristicas) => void;
}) {
  const alternar = (clave: keyof Caracteristicas) => {
    const nuevas = { ...value, [clave]: !value[clave] };

    // Debe aceptar al menos un tipo de vehículo: no se deja quitar el último
    if (!nuevas.aceptaCarros && !nuevas.aceptaMotos) return;

    onChange(nuevas);
  };

  return (
    <View>
      <Text style={styles.subtitulo}>Vehículos que recibe</Text>
      <View style={styles.fila}>
        <Opcion
          texto="Carros"
          icono="car-outline"
          activa={value.aceptaCarros}
          onPress={() => alternar("aceptaCarros")}
        />
        <Opcion
          texto="Motos"
          icono="bicycle-outline"
          activa={value.aceptaMotos}
          onPress={() => alternar("aceptaMotos")}
        />
      </View>

      <Text style={styles.subtitulo}>¿Qué ofrece?</Text>
      <View style={styles.fila}>
        {EXTRAS.map((e) => (
          <Opcion
            key={e.clave}
            texto={e.texto}
            icono={e.icono}
            activa={value[e.clave]}
            onPress={() => alternar(e.clave)}
          />
        ))}
      </View>
    </View>
  );
}

// Botón que se marca y desmarca (con borde oscuro cuando está activo).
export function Opcion({
  texto,
  icono,
  activa,
  onPress,
}: {
  texto: string;
  icono?: NombreIcono;
  activa: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.opcion, activa && styles.opcionActiva]} onPress={onPress}>
      {icono && (
        <Ionicons name={icono} size={16} color={activa ? colors.text : colors.textLight} />
      )}
      <Text style={[styles.opcionTexto, activa && styles.opcionTextoActivo]}>{texto}</Text>
      {activa && <Ionicons name="checkmark" size={14} color={colors.text} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  lista: {
    gap: spacing.sm,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  itemTexto: {
    fontSize: 14,
    color: colors.text,
  },
  subtitulo: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  fila: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  opcion: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  opcionActiva: {
    borderColor: colors.text,
    backgroundColor: colors.chip,
  },
  opcionTexto: {
    fontSize: 13,
    color: colors.textLight,
  },
  opcionTextoActivo: {
    color: colors.text,
    fontWeight: "600",
  },
});
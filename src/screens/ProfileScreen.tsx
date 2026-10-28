import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AvatarPlaceholder,
  CircleButton,
  ImagePlaceholder,
} from "../components/ui";
import { colors, radius, shadow, spacing } from "../styles/theme";

// Datos ficticios: más adelante vendrán del usuario que inició sesión.
const ESTADISTICAS = [
  { valor: "4", etiqueta: "Reservas" },
  { valor: "4", etiqueta: "Reseñas" },
  { valor: "2", etiqueta: "Años en Kike Parking" },
];

const OPCIONES: { icono: "settings" | "help-circle"; texto: string }[] = [
  { icono: "settings", texto: "Configuración de la cuenta" },
  { icono: "help-circle", texto: "Obtén ayuda" },
];

export function ProfileScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.contenedor, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.acciones}>
        <CircleButton icon="bell" />
      </View>
      <Text style={styles.titulo}>Perfil</Text>

      <ScrollView contentContainerStyle={styles.contenido}>
        <View style={[styles.tarjeta, styles.tarjetaPerfil]}>
          <View style={styles.perfil}>
            <AvatarPlaceholder size={84} />
            <Text style={styles.nombre}>Daniel</Text>
            <Text style={styles.ubicacion}>Medellín, Colombia</Text>
          </View>

          <View style={styles.estadisticas}>
            {ESTADISTICAS.map((e, i) => (
              <View
                key={e.etiqueta}
                style={[styles.estadistica, i > 0 && styles.estadisticaLinea]}
              >
                <Text style={styles.estadisticaValor}>{e.valor}</Text>
                <Text style={styles.estadisticaEtiqueta}>{e.etiqueta}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.fila}>
          <View style={[styles.tarjeta, styles.tarjetaMini]}>
            <ImagePlaceholder
              style={{ width: 64, height: 64, borderRadius: radius.sm }}
              iconSize={26}
            />
            <Text style={styles.miniTexto}>Reservas anteriores</Text>
          </View>
          <View style={[styles.tarjeta, styles.tarjetaMini]}>
            <ImagePlaceholder
              style={{ width: 64, height: 64 }}
              iconSize={26}
              round
            />
            <Text style={styles.miniTexto}>Amigos</Text>
          </View>
        </View>

        <Pressable style={[styles.tarjeta, styles.host]}>
          <AvatarPlaceholder size={56} />
          <View style={styles.hostTextos}>
            <Text style={styles.hostTitulo}>Conviértete en host</Text>
            <Text style={styles.hostDescripcion}>
              Empieza a anfitrionar y genera ingresos adicionales, ¡es muy
              sencillo!
            </Text>
          </View>
        </Pressable>

        <View style={styles.opciones}>
          {OPCIONES.map((o) => (
            <Pressable key={o.texto} style={styles.opcion}>
              <Feather name={o.icono} size={18} color={colors.text} />
              <Text style={styles.opcionTexto}>{o.texto}</Text>
              <Feather name="chevron-right" size={16} color={colors.textLight} />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: colors.background,
  },
  acciones: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 24,
  },
  titulo: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
    paddingHorizontal: 24,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  contenido: {
    paddingHorizontal: 24,
    paddingBottom: spacing.xl,
  },
  tarjeta: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    ...shadow,
  },
  tarjetaPerfil: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    gap: spacing.md,
  },
  perfil: {
    flex: 1,
    alignItems: "center",
  },
  nombre: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginTop: spacing.sm,
  },
  ubicacion: {
    fontSize: 10,
    color: colors.textLight,
    marginTop: 2,
  },
  estadisticas: {
    flex: 1,
  },
  estadistica: {
    paddingVertical: 6,
  },
  estadisticaLinea: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  estadisticaValor: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
  },
  estadisticaEtiqueta: {
    fontSize: 10,
    color: colors.text,
  },
  fila: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.md,
  },
  tarjetaMini: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  miniTexto: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.text,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  host: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  hostTextos: {
    flex: 1,
  },
  hostTitulo: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
  },
  hostDescripcion: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 3,
  },
  opciones: {
    marginTop: spacing.lg,
  },
  opcion: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: 12,
  },
  opcionTexto: {
    flex: 1,
    fontSize: 12,
    color: colors.text,
  },
});

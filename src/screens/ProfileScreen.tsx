import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { CommonActions } from "@react-navigation/native";
import type { MainTabScreenProps } from "../types/navigation";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AvatarPlaceholder,
  CircleButton,
  ImagePlaceholder,
} from "../components/ui";
import { colors, radius, shadow, spacing } from "../styles/theme";
import { useAuth } from "../context/AuthContext";
import * as ImagePicker from "expo-image-picker";
import { quitarAvatar, subirAvatar } from "../services/profile";

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

export function ProfileScreen({ navigation }: MainTabScreenProps<"Profile">) {
  const insets = useSafeAreaInsets();
    const {
    usuario,
    token,
    actualizarUsuario,
    cerrarSesion: borrarSesion,
  } = useAuth();
  const [subiendoFoto, setSubiendoFoto] = useState(false);

  // Abre la galería, deja recortar en cuadrado y sube la foto elegida
  const elegirFoto = async () => {
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (resultado.canceled || !token) return;

    const foto = resultado.assets[0];
    setSubiendoFoto(true);

    try {
      const actualizado = await subirAvatar(foto.uri, foto.mimeType, token);
      await actualizarUsuario(actualizado);
    } catch (e) {
      Alert.alert(
        "No se pudo subir la foto",
        e instanceof Error ? e.message : "Inténtalo de nuevo.",
      );
    } finally {
      setSubiendoFoto(false);
    }
  };

  const quitarFoto = async () => {
    if (!token) return;

    setSubiendoFoto(true);

    try {
      const actualizado = await quitarAvatar(token);
      await actualizarUsuario(actualizado);
    } catch (e) {
      Alert.alert(
        "No se pudo quitar la foto",
        e instanceof Error ? e.message : "Inténtalo de nuevo.",
      );
    } finally {
      setSubiendoFoto(false);
    }
  };

  // Al tocar el avatar: elegir una foto nueva o quitar la actual
  const cambiarFoto = () => {
    Alert.alert("Foto de perfil", undefined, [
      { text: "Elegir de la galería", onPress: elegirFoto },
      ...(usuario?.avatarUrl
        ? [
            {
              text: "Quitar foto",
              style: "destructive" as const,
              onPress: quitarFoto,
            },
          ]
        : []),
      { text: "Cancelar", style: "cancel" as const },
    ]);
  };

  const cerrarSesion = () => {
    // Primero se borra la sesión (usuario y token) y luego se vuelve al login.
    borrarSesion();
    navigation.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name: "Login" }] }),
    );
  };
  return (
    <View style={[styles.contenedor, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.acciones}>
        <CircleButton icon="bell" />
      </View>
      <Text style={styles.titulo}>Perfil</Text>

      <ScrollView contentContainerStyle={styles.contenido}>
        <View style={[styles.tarjeta, styles.tarjetaPerfil]}>
          <View style={styles.perfil}>
                        <Pressable onPress={cambiarFoto} disabled={subiendoFoto}>
              <AvatarPlaceholder
                size={84}
                source={
                  usuario?.avatarUrl ? { uri: usuario.avatarUrl } : undefined
                }
              />
              <View style={styles.camara}>
                {subiendoFoto ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Feather name="camera" size={14} color={colors.white} />
                )}
              </View>
            </Pressable>
            <Text style={styles.nombre}>{usuario?.name ?? "Invitado"}</Text>
            <Text style={styles.ubicacion}>
              {usuario?.role === "propietario" ? "Propietario" : "Conductor"}
            </Text>
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
          <Pressable
            style={[styles.tarjeta, styles.tarjetaMini]}
            onPress={() => navigation.navigate("MyBookings")}
          >
            <ImagePlaceholder
              style={{ width: 64, height: 64, borderRadius: radius.sm }}
              iconSize={26}
              source={require("../../assets/images/laureles-2026.jpeg")}
            />
            <Text style={styles.miniTexto}>Reservas anteriores</Text>
          </Pressable>
          <View style={[styles.tarjeta, styles.tarjetaMini]}>
            <ImagePlaceholder
              style={{ width: 64, height: 64 }}
              iconSize={26}
              round
              source={require("../../assets/images/imagen-isabel.jpg")}
            />
            <Text style={styles.miniTexto}>Amigos</Text>
          </View>
        </View>

        {usuario?.role === "propietario" && (
          <Pressable
            style={[styles.tarjeta, styles.host]}
            onPress={() => navigation.navigate("AddParking")}
          >
            <Feather name="plus-circle" size={26} color={colors.primary} />
            <View style={styles.hostTextos}>
              <Text style={styles.hostTitulo}>Publica tu parqueadero</Text>
              <Text style={styles.hostDescripcion}>
                Renta tu espacio y genera ingresos.
              </Text>
            </View>
            <Feather name="chevron-right" size={16} color={colors.textLight} />
          </Pressable>
        )}
        
        <View style={styles.opciones}>
          {OPCIONES.map((o) => (
            <Pressable key={o.texto} style={styles.opcion}>
              <Feather name={o.icono} size={18} color={colors.text} />
              <Text style={styles.opcionTexto}>{o.texto}</Text>
              <Feather name="chevron-right" size={16} color={colors.textLight} />
            </Pressable>
          ))}
        </View>

        <Pressable style={styles.opcion} onPress={cerrarSesion}>
          <Feather name="log-out" size={18} color={colors.primary} />
          <Text style={[styles.opcionTexto, styles.opcionSalir]}>Cerrar sesión</Text>
        </Pressable>
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
    camara: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.black,
    borderWidth: 2,
    borderColor: colors.white,
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
  opcionSalir: {
    color: colors.primary,
    fontWeight: "600",
  },
});

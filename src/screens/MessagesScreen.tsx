import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { MainTabScreenProps } from "../types/navigation";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Conversation, conversations } from "../services/messages";
import {
  AvatarPlaceholder,
  Chip,
  CircleButton,
  ImagePlaceholder,
} from "../components/ui";
import { colors, radius, spacing } from "../styles/theme";

type Filtro = "todos" | "host" | "amigo";

const FILTROS: { id: Filtro; etiqueta: string }[] = [
  { id: "todos", etiqueta: "Todos" },
  { id: "host", etiqueta: "Mensajes con host" },
  { id: "amigo", etiqueta: "Mensajes con amigos" },
];

// Mensajes: chips para filtrar entre todos, hosts y amigos (Estados A, B y C).
export function MessagesScreen({ navigation }: MainTabScreenProps<"Messages">) {
  const insets = useSafeAreaInsets();
  const [filtro, setFiltro] = useState<Filtro>("todos");

  const visibles = conversations.filter(
    (c) => filtro === "todos" || c.tipo === filtro,
  );

  return (
    <View style={[styles.contenedor, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.acciones}>
        <CircleButton icon="search" />
        <CircleButton icon="settings" />
      </View>

      <Text style={styles.titulo}>Mensajes</Text>

      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {FILTROS.map((f) => (
            <Chip
              key={f.id}
              label={f.etiqueta}
              variant="filled"
              selected={filtro === f.id}
              onPress={() => setFiltro(f.id)}
            />
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.lista}>
        {visibles.map((c) => (
          <FilaConversacion
            key={c.id}
            conversacion={c}
            onPress={() => navigation.navigate("Chat", { conversationId: c.id })}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function FilaConversacion({
  conversacion,
  onPress,
}: {
  conversacion: Conversation;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.fila} onPress={onPress}>
      {conversacion.esGrupo ? (
        <View style={styles.avatarGrupo}>
          <ImagePlaceholder
            style={styles.avatarImagen}
            iconSize={22}
            source={conversacion.imagen}
          />
          <View style={styles.avatarMini}>
            <Feather name="user" size={10} color={colors.imageIcon} />
          </View>
        </View>
      ) : (
        <AvatarPlaceholder size={52} source={conversacion.imagen} />
      )}

      <View style={styles.textos}>
        <Text style={styles.nombre} numberOfLines={1}>
          {conversacion.titulo}
        </Text>
        <Text style={styles.detalle} numberOfLines={1}>
          {conversacion.ultimoMensaje}
        </Text>
        <Text style={styles.detalle} numberOfLines={1}>
          {conversacion.detalle}
        </Text>
      </View>

      <Text style={styles.fecha}>{conversacion.fecha}</Text>
    </Pressable>
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
    gap: spacing.sm,
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
  chips: {
    paddingHorizontal: 24,
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  lista: {
    paddingHorizontal: 24,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  fila: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    marginBottom: spacing.lg,
  },
  avatarGrupo: {
    width: 56,
    height: 56,
  },
  avatarImagen: {
    width: 48,
    height: 48,
    borderRadius: 10,
  },
  avatarMini: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.imagePlaceholder,
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  textos: {
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
  fecha: {
    fontSize: 11,
    color: colors.textLight,
  },
});

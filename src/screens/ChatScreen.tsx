import React, { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { AppScreenProps } from "../types/navigation";
import { ChatMessage, mensajesDe } from "../services/chat";
import { colors, radius, spacing } from "../styles/theme";

const horaActual = () =>
  new Date().toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit" });

// Chat de una conversación: burbujas y caja para escribir.
export function ChatScreen({ route }: AppScreenProps<"Chat">) {
  const insets = useSafeAreaInsets();
  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const [mensajes, setMensajes] = useState<ChatMessage[]>(() =>
    mensajesDe(route.params.conversationId),
  );
  const [texto, setTexto] = useState("");

  const enviar = () => {
    const limpio = texto.trim();
    if (!limpio) return;
    setMensajes((actuales) => [
      ...actuales,
      { id: String(Date.now()), autor: "yo", texto: limpio, hora: horaActual() },
    ]);
    setTexto("");
  };

  return (
    <KeyboardAvoidingView
      style={styles.contenedor}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView
        ref={scroll}
        contentContainerStyle={styles.lista}
        onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}
      >
        {mensajes.map((m) => (
          <View
            key={m.id}
            style={[styles.burbuja, m.autor === "yo" ? styles.mia : styles.otra]}
          >
            <Text style={[styles.texto, m.autor === "yo" && styles.textoMio]}>
              {m.texto}
            </Text>
            <Text style={[styles.hora, m.autor === "yo" && styles.horaMia]}>
              {m.hora}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.barra, { paddingBottom: insets.bottom + spacing.sm }]}>
        <TextInput
          style={styles.campo}
          value={texto}
          onChangeText={setTexto}
          placeholder="Escribe un mensaje"
          placeholderTextColor={colors.placeholder}
          onSubmitEditing={enviar}
          returnKeyType="send"
        />
        <Pressable style={styles.enviar} onPress={enviar}>
          <Feather name="send" size={16} color={colors.white} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: colors.background,
  },
  lista: {
    padding: 18,
    gap: spacing.sm,
  },
  burbuja: {
    maxWidth: "78%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.lg,
  },
  otra: {
    alignSelf: "flex-start",
    backgroundColor: colors.chip,
  },
  mia: {
    alignSelf: "flex-end",
    backgroundColor: colors.primary,
  },
  texto: {
    fontSize: 13,
    color: colors.text,
  },
  textoMio: {
    color: colors.white,
  },
  hora: {
    fontSize: 10,
    color: colors.textLight,
    marginTop: 4,
  },
  horaMia: {
    color: colors.white,
    opacity: 0.8,
  },
  barra: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: 18,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  campo: {
    flex: 1,
    height: 42,
    paddingHorizontal: 16,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderLight,
    fontSize: 13,
    color: colors.text,
  },
  enviar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});

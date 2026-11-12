import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
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
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { AppScreenProps } from "../types/navigation";
import {
  Message,
  sendMessage,
  formatDay,
  formatMessageTime,
  getMessages,
} from "../services/messages";
import { useAuth } from "../context/AuthContext";
import { useUnread } from "../context/UnreadContext";
import { colors, radius, spacing } from "../styles/theme";

// Cada cuánto se pregunta al backend si llegaron mensajes nuevos
const INTERVAL_MS = 4000;

// Agrega mensajes sin repetir (el mismo puede llegar al enviarlo y al revisar nuevos)
const join = (current: Message[], newItems: Message[]) => {
  const ids = new Set(current.map((m) => m.id));
  return [...current, ...newItems.filter((m) => !ids.has(m.id))];
};

// Chat de una conversación: burbujas y caja para escribir.
export function ChatScreen({ route, navigation }: AppScreenProps<"Chat">) {
  const { conversationId, title } = route.params;
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { update: refreshUnread } = useUnread();
  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Id del último mensaje recibido, para pedir solo los que lleguen después
  const lastId = useRef<number | undefined>(undefined);

  // Encabezado = nombre de la otra persona
  useEffect(() => {
    navigation.setOptions({ title: title ?? "Chat" });
  }, [navigation, title]);

  const receive = useCallback(
    (newItems: Message[]) => {
      if (newItems.length > 0) lastId.current = newItems[newItems.length - 1].id;
      setMessages((current) => join(current ?? [], newItems));
    },
    [],
  );

  // Al abrir: todos los mensajes. Luego, cada 4 s, solo los nuevos.
  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      let active = true;

      const check = async () => {
        try {
          const newItems = await getMessages(conversationId, token, lastId.current);
          if (active) {
            receive(newItems);
            setError(null);
            // Al recibirlos quedan leídos: el número de la pestaña baja de una vez
            if (newItems.length > 0) refreshUnread();
          }
        } catch (e) {
          if (active) {
            setError(e instanceof Error ? e.message : "No se pudieron cargar los mensajes.");
          }
        }
      };

      check();
      const timer = setInterval(check, INTERVAL_MS);
      return () => {
        active = false;
        clearInterval(timer);
      };
    }, [conversationId, token, receive, refreshUnread]),
  );

  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed || !token || sending) return;

    setSending(true);
    try {
      const message = await sendMessage(conversationId, trimmed, token);
      receive([message]);
      setText("");
      setError(null);
    } catch (e) {
      // El texto se queda en la caja para que pueda reintentar
      setError(e instanceof Error ? e.message : "No se pudo enviar el mensaje.");
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView
        ref={scroll}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}
      >
        {!messages && !error && <ActivityIndicator color={colors.primary} />}
        {messages && messages.length === 0 && (
          <Text style={styles.empty}>Escribe el primer mensaje.</Text>
        )}

        {(messages ?? []).map((m, i) => {
          // Separador con la fecha cuando cambia el día
          const previous = messages?.[i - 1];
          const newDay =
            !previous || previous.date.toDateString() !== m.date.toDateString();
          return (
            <React.Fragment key={m.id}>
              {newDay && (
                <Text style={styles.day}>{formatDay(m.date)}</Text>
              )}
              <View style={[styles.bubble, m.isMine ? styles.isMine : styles.other]}>
                <Text style={[styles.text, m.isMine && styles.textMine]}>{m.text}</Text>
                <Text style={[styles.hour, m.isMine && styles.myHour]}>
                  {formatMessageTime(m.date)}
                </Text>
              </View>
            </React.Fragment>
          );
        })}
      </ScrollView>

      {error && <Text style={styles.error}>{error}</Text>}

      <View style={[styles.bar, { paddingBottom: insets.bottom + spacing.sm }]}>
        <TextInput
          style={styles.field}
          value={text}
          onChangeText={setText}
          placeholder="Escribe un mensaje"
          placeholderTextColor={colors.placeholder}
          onSubmitEditing={send}
          returnKeyType="send"
          maxLength={1000}
        />
        <Pressable
          style={[styles.send, (!text.trim() || sending) && styles.sendDisabled]}
          onPress={send}
          disabled={!text.trim() || sending}
        >
          <Feather name="send" size={16} color={colors.white} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    padding: 18,
    gap: spacing.sm,
  },
  bubble: {
    maxWidth: "78%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.lg,
  },
  other: {
    alignSelf: "flex-start",
    backgroundColor: colors.chip,
  },
  isMine: {
    alignSelf: "flex-end",
    backgroundColor: colors.primary,
  },
  text: {
    fontSize: 13,
    color: colors.text,
  },
  textMine: {
    color: colors.white,
  },
  hour: {
    fontSize: 10,
    color: colors.textLight,
    marginTop: 4,
  },
  myHour: {
    color: colors.white,
    opacity: 0.8,
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: 18,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  field: {
    flex: 1,
    height: 42,
    paddingHorizontal: 16,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderLight,
    fontSize: 13,
    color: colors.text,
  },
  send: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendDisabled: {
    opacity: 0.4,
  },
  empty: {
    fontSize: 13,
    color: colors.textLight,
    textAlign: "center",
    marginTop: spacing.xl,
  },
  day: {
    alignSelf: "center",
    fontSize: 11,
    color: colors.textLight,
    marginVertical: spacing.sm,
  },
  error: {
    fontSize: 12,
    color: colors.primary,
    textAlign: "center",
    paddingHorizontal: 18,
    paddingBottom: spacing.xs,
  },
});

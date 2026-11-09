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
  Mensaje,
  enviarMensaje,
  formatearDia,
  formatearHoraMensaje,
  obtenerMensajes,
} from "../services/messages";
import { useAuth } from "../context/AuthContext";
import { useNoLeidos } from "../context/UnreadContext";
import { colors, radius, spacing } from "../styles/theme";

// Cada cuánto se pregunta al backend si llegaron mensajes nuevos
const INTERVALO_MS = 4000;

// Agrega mensajes sin repetir (el mismo puede llegar al enviarlo y al revisar nuevos)
const unir = (actuales: Mensaje[], nuevos: Mensaje[]) => {
  const ids = new Set(actuales.map((m) => m.id));
  return [...actuales, ...nuevos.filter((m) => !ids.has(m.id))];
};

// Chat de una conversación: burbujas y caja para escribir.
export function ChatScreen({ route, navigation }: AppScreenProps<"Chat">) {
  const { conversationId, titulo } = route.params;
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const { actualizar: actualizarNoLeidos } = useNoLeidos();
  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const [mensajes, setMensajes] = useState<Mensaje[] | null>(null);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Id del último mensaje recibido, para pedir solo los que lleguen después
  const ultimoId = useRef<number | undefined>(undefined);

  // Encabezado = nombre de la otra persona
  useEffect(() => {
    navigation.setOptions({ title: titulo ?? "Chat" });
  }, [navigation, titulo]);

  const recibir = useCallback(
    (nuevos: Mensaje[]) => {
      if (nuevos.length > 0) ultimoId.current = nuevos[nuevos.length - 1].id;
      setMensajes((actuales) => unir(actuales ?? [], nuevos));
    },
    [],
  );

  // Al abrir: todos los mensajes. Luego, cada 4 s, solo los nuevos.
  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      let activo = true;

      const revisar = async () => {
        try {
          const nuevos = await obtenerMensajes(conversationId, token, ultimoId.current);
          if (activo) {
            recibir(nuevos);
            setError(null);
            // Al recibirlos quedan leídos: el número de la pestaña baja de una vez
            if (nuevos.length > 0) actualizarNoLeidos();
          }
        } catch (e) {
          if (activo) {
            setError(e instanceof Error ? e.message : "No se pudieron cargar los mensajes.");
          }
        }
      };

      revisar();
      const temporizador = setInterval(revisar, INTERVALO_MS);
      return () => {
        activo = false;
        clearInterval(temporizador);
      };
    }, [conversationId, token, recibir, actualizarNoLeidos]),
  );

  const enviar = async () => {
    const limpio = texto.trim();
    if (!limpio || !token || enviando) return;

    setEnviando(true);
    try {
      const mensaje = await enviarMensaje(conversationId, limpio, token);
      recibir([mensaje]);
      setTexto("");
      setError(null);
    } catch (e) {
      // El texto se queda en la caja para que pueda reintentar
      setError(e instanceof Error ? e.message : "No se pudo enviar el mensaje.");
    } finally {
      setEnviando(false);
    }
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
        {!mensajes && !error && <ActivityIndicator color={colors.primary} />}
        {mensajes && mensajes.length === 0 && (
          <Text style={styles.vacio}>Escribe el primer mensaje.</Text>
        )}

        {(mensajes ?? []).map((m, i) => {
          // Separador con la fecha cuando cambia el día
          const anterior = mensajes?.[i - 1];
          const nuevoDia =
            !anterior || anterior.fecha.toDateString() !== m.fecha.toDateString();
          return (
            <React.Fragment key={m.id}>
              {nuevoDia && (
                <Text style={styles.dia}>{formatearDia(m.fecha)}</Text>
              )}
              <View style={[styles.burbuja, m.mio ? styles.mia : styles.otra]}>
                <Text style={[styles.texto, m.mio && styles.textoMio]}>{m.texto}</Text>
                <Text style={[styles.hora, m.mio && styles.horaMia]}>
                  {formatearHoraMensaje(m.fecha)}
                </Text>
              </View>
            </React.Fragment>
          );
        })}
      </ScrollView>

      {error && <Text style={styles.error}>{error}</Text>}

      <View style={[styles.barra, { paddingBottom: insets.bottom + spacing.sm }]}>
        <TextInput
          style={styles.campo}
          value={texto}
          onChangeText={setTexto}
          placeholder="Escribe un mensaje"
          placeholderTextColor={colors.placeholder}
          onSubmitEditing={enviar}
          returnKeyType="send"
          maxLength={1000}
        />
        <Pressable
          style={[styles.enviar, (!texto.trim() || enviando) && styles.enviarDeshabilitado]}
          onPress={enviar}
          disabled={!texto.trim() || enviando}
        >
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
  enviarDeshabilitado: {
    opacity: 0.4,
  },
  vacio: {
    fontSize: 13,
    color: colors.textLight,
    textAlign: "center",
    marginTop: spacing.xl,
  },
  dia: {
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

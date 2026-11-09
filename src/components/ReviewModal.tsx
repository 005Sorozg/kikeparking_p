import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StarPicker } from "./Stars";
import { PrimaryButton } from "./ui";
import { calificarReserva } from "../services/reviews";
import { useAuth } from "../context/AuthContext";
import { colors, radius, spacing } from "../styles/theme";

const MAX_COMENTARIO = 500;
const TEXTO_ESTRELLAS = ["", "Muy mala", "Mala", "Regular", "Buena", "Excelente"];

// Ventana para calificar una reserva completada.
// "titulo" cambia según quién califica: el parqueadero o al conductor.
export function ReviewModal({
  reservaId,
  titulo,
  onClose,
  onRated,
}: {
  // null = ventana cerrada
  reservaId: number | null;
  titulo: string;
  onClose: () => void;
  onRated: (reservaId: number, estrellas: number) => void;
}) {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const [estrellas, setEstrellas] = useState(0);
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cada vez que se abre para otra reserva, empieza en blanco
  useEffect(() => {
    setEstrellas(0);
    setComentario("");
    setError(null);
  }, [reservaId]);

  const enviar = async () => {
    if (reservaId === null || !token || estrellas === 0) return;

    setEnviando(true);
    setError(null);
    try {
      await calificarReserva(reservaId, estrellas, comentario, token);
      onRated(reservaId, estrellas);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo enviar la calificación.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal visible={reservaId !== null} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.fondo}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable style={styles.fuera} onPress={onClose} />
        <View style={[styles.hoja, { paddingBottom: insets.bottom + spacing.md }]}>
          <Text style={styles.titulo}>{titulo}</Text>

          <StarPicker value={estrellas} onChange={setEstrellas} />
          <Text style={styles.etiqueta}>{TEXTO_ESTRELLAS[estrellas] || "Toca las estrellas"}</Text>

          <TextInput
            style={styles.campo}
            value={comentario}
            onChangeText={setComentario}
            placeholder="Cuéntanos cómo te fue (opcional)"
            placeholderTextColor={colors.placeholder}
            multiline
            maxLength={MAX_COMENTARIO}
          />
          <Text style={styles.contador}>
            {comentario.length}/{MAX_COMENTARIO}
          </Text>

          <Text style={styles.aviso}>Las calificaciones no se pueden editar después.</Text>
          {error && <Text style={styles.error}>{error}</Text>}

          <PrimaryButton
            label={enviando ? "Enviando..." : "Enviar calificación"}
            onPress={enviar}
            disabled={enviando || estrellas === 0}
          />
          <Pressable style={styles.cancelar} onPress={onClose}>
            <Text style={styles.cancelarTexto}>Ahora no</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fondo: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  fuera: {
    flex: 1,
  },
  hoja: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: 24,
    paddingTop: spacing.lg,
  },
  titulo: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  etiqueta: {
    fontSize: 13,
    color: colors.textLight,
    textAlign: "center",
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  campo: {
    minHeight: 90,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 13,
    color: colors.text,
    textAlignVertical: "top",
  },
  contador: {
    fontSize: 11,
    color: colors.textLight,
    textAlign: "right",
    marginTop: 4,
  },
  aviso: {
    fontSize: 11,
    color: colors.textLight,
    marginVertical: spacing.sm,
  },
  error: {
    fontSize: 12,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  cancelar: {
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  cancelarTexto: {
    fontSize: 14,
    color: colors.textLight,
  },
});
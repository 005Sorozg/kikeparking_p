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
import { rateBooking } from "../services/reviews";
import { useAuth } from "../context/AuthContext";
import { colors, radius, spacing } from "../styles/theme";

const MAX_COMMENT = 500;
const STAR_LABELS = ["", "Muy mala", "Mala", "Regular", "Buena", "Excelente"];

// Ventana para calificar una reserva completada.
// "titulo" cambia según quién califica: el parqueadero o al conductor.
export function ReviewModal({
  bookingId,
  title,
  onClose,
  onRated,
}: {
  // null = ventana cerrada
  bookingId: number | null;
  title: string;
  onClose: () => void;
  onRated: (bookingId: number, stars: number) => void;
}) {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cada vez que se abre para otra reserva, empieza en blanco
  useEffect(() => {
    setStars(0);
    setComment("");
    setError(null);
  }, [bookingId]);

  const send = async () => {
    if (bookingId === null || !token || stars === 0) return;

    setSending(true);
    setError(null);
    try {
      await rateBooking(bookingId, stars, comment, token);
      onRated(bookingId, stars);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo enviar la calificación.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal visible={bookingId !== null} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable style={styles.outside} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }]}>
          <Text style={styles.title}>{title}</Text>

          <StarPicker value={stars} onChange={setStars} />
          <Text style={styles.label}>{STAR_LABELS[stars] || "Toca las estrellas"}</Text>

          <TextInput
            style={styles.field}
            value={comment}
            onChangeText={setComment}
            placeholder="Cuéntanos cómo te fue (opcional)"
            placeholderTextColor={colors.placeholder}
            multiline
            maxLength={MAX_COMMENT}
          />
          <Text style={styles.counter}>
            {comment.length}/{MAX_COMMENT}
          </Text>

          <Text style={styles.notice}>Las calificaciones no se pueden editar después.</Text>
          {error && <Text style={styles.error}>{error}</Text>}

          <PrimaryButton
            label={sending ? "Enviando..." : "Enviar calificación"}
            onPress={send}
            disabled={sending || stars === 0}
          />
          <Pressable style={styles.cancel} onPress={onClose}>
            <Text style={styles.cancelText}>Ahora no</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  outside: {
    flex: 1,
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: 24,
    paddingTop: spacing.lg,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 13,
    color: colors.textLight,
    textAlign: "center",
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  field: {
    minHeight: 90,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 13,
    color: colors.text,
    textAlignVertical: "top",
  },
  counter: {
    fontSize: 11,
    color: colors.textLight,
    textAlign: "right",
    marginTop: 4,
  },
  notice: {
    fontSize: 11,
    color: colors.textLight,
    marginVertical: spacing.sm,
  },
  error: {
    fontSize: 12,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  cancel: {
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  cancelText: {
    fontSize: 14,
    color: colors.textLight,
  },
});
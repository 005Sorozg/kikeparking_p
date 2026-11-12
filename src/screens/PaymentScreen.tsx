import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import type { AppScreenProps } from "../types/navigation";
import { formatPrice } from "../services/parking";
import { Booking, payBooking, timeToPay } from "../services/bookings";
import { refreshReminders } from "../services/reminders";
import { useAuth } from "../context/AuthContext";
import { Field, PrimaryButton } from "../components/ui";
import { colors, radius, spacing } from "../styles/theme";

// "4242424242424242" -> "4242 4242 4242 4242" (máximo 19 dígitos)
const formatCardNumber = (text: string) =>
  text
    .replace(/\D/g, "")
    .slice(0, 19)
    .replace(/(\d{4})(?=\d)/g, "$1 ");

// "0828" -> "08/28"
const formatExpiry = (text: string) => {
  const digits = text.replace(/\D/g, "").slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
};

// Pago de una reserva pendiente. La pasarela es simulada: no se cobra dinero real.
export function PaymentScreen({ route, navigation }: AppScreenProps<"Payment">) {
  const { bookingId, title, total } = route.params;
  const paymentDeadline = new Date(route.params.paymentDeadline);
  const { token } = useAuth();

  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [name, setName] = useState("");
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Reserva ya pagada: se muestra la confirmación
  const [paid, setPaid] = useState<Booking | null>(null);

  // Cuenta regresiva: se vuelve a dibujar cada segundo
  const [, setTic] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTic((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);
  const isExpired = paymentDeadline.getTime() <= Date.now();

  const pay = async () => {
    if (!token) return;

    // Revisión rápida antes de enviar; las reglas completas las aplica el backend
    if (cardNumber.replace(/\s/g, "").length < 13) {
      setError("Escribe el número completo de la tarjeta.");
      return;
    }
    if (expiry.length !== 5) {
      setError("Escribe el vencimiento como MM/AA.");
      return;
    }
    if (cvc.length < 3) {
      setError("El CVC tiene 3 o 4 dígitos.");
      return;
    }
    if (name.trim().length < 3) {
      setError("Escribe el nombre como aparece en la tarjeta.");
      return;
    }

    setError(null);
    setPaying(true);

    try {
      setPaid(
        await payBooking(bookingId, { cardNumber, expiry, cvc, name: name.trim() }, token),
      );
      // Ya pagada: se cambia el aviso de pago por los de inicio y fin de la reserva
      refreshReminders(token, false);
    } catch (e) {
      // Ej: "El pago fue rechazado: Tarjeta rechazada por el banco"
      setError(e instanceof Error ? e.message : "No se pudo procesar el pago.");
    } finally {
      setPaying(false);
    }
  };

  // ---- Pago aprobado ----
  if (paid) {
    return (
      <View style={[styles.container, styles.centered]}>
        <View style={styles.successCircle}>
          <Feather name="check" size={36} color={colors.white} />
        </View>
        <Text style={styles.successTitle}>¡Pago aprobado!</Text>
        <Text style={styles.successText}>
          Tu reserva en {title} quedó confirmada.
        </Text>
        {paid.payment && (
          <Text style={styles.successText}>
            {formatPrice(paid.total)} · {paid.payment.brand} •••• {paid.payment.last4}
          </Text>
        )}
        <View style={styles.successButton}>
          <PrimaryButton
            label="Ver mis reservas"
            onPress={() => navigation.replace("MyBookings")}
          />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Pagar reserva</Text>

        {/* Aviso: es una demo, no se cobra nada */}
        <View style={styles.notice}>
          <Feather name="info" size={16} color="#B26A00" />
          <View style={styles.noticeTexts}>
            <Text style={styles.noticeTitle}>Modo de prueba</Text>
            <Text style={styles.noticeText}>
              No se cobra dinero real. Usa la tarjeta 4242 4242 4242 4242, con
              cualquier vencimiento futuro y cualquier CVC. La 4000 0000 0000 0002
              simula un pago rechazado.
            </Text>
          </View>
        </View>

        <View style={styles.summary}>
          <Text style={styles.summaryTitle} numberOfLines={1}>
            {title}
          </Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryTotal}>Total</Text>
            <Text style={styles.summaryTotal}>{formatPrice(total)}</Text>
          </View>
        </View>

        <Text style={[styles.time, isExpired && styles.timeExpired]}>
          {isExpired
            ? "Se acabó el tiempo para pagar. La hora quedó libre: vuelve a reservar."
            : `Tienes ${timeToPay(paymentDeadline)} para pagar. Mientras tanto, la hora es tuya.`}
        </Text>

        <Text style={styles.fieldLabel}>Número de tarjeta</Text>
        <Field
          value={cardNumber}
          onChangeText={(t) => setCardNumber(formatCardNumber(t))}
          placeholder="1234 5678 9012 3456"
          keyboardType="number-pad"
          editable={!isExpired}
        />

        <View style={styles.fieldsRow}>
          <View style={styles.halfField}>
            <Text style={styles.fieldLabel}>Vencimiento</Text>
            <Field
              value={expiry}
              onChangeText={(t) => setExpiry(formatExpiry(t))}
              placeholder="MM/AA"
              keyboardType="number-pad"
              editable={!isExpired}
            />
          </View>
          <View style={styles.halfField}>
            <Text style={styles.fieldLabel}>CVC</Text>
            <Field
              value={cvc}
              onChangeText={(t) => setCvc(t.replace(/\D/g, "").slice(0, 4))}
              placeholder="123"
              keyboardType="number-pad"
              secureTextEntry
              editable={!isExpired}
            />
          </View>
        </View>

        <Text style={styles.fieldLabel}>Nombre en la tarjeta</Text>
        <Field
          value={name}
          onChangeText={setName}
          placeholder="Como aparece en la tarjeta"
          autoCapitalize="characters"
          editable={!isExpired}
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.button}>
          <PrimaryButton
            label={paying ? "Procesando..." : `Pagar ${formatPrice(total)}`}
            onPress={pay}
            disabled={paying || isExpired}
          />
        </View>

        <View style={styles.secure}>
          <Feather name="lock" size={12} color={colors.textLight} />
          <Text style={styles.secureText}>
            Solo guardamos la marca y los últimos 4 dígitos de la tarjeta.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: spacing.xl,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.md,
  },
  notice: {
    flexDirection: "row",
    gap: spacing.sm,
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: "#FFF4E0",
  },
  noticeTexts: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#B26A00",
  },
  noticeText: {
    fontSize: 12,
    color: "#7A4A00",
    marginTop: 2,
    lineHeight: 17,
  },
  summary: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  summaryTitle: {
    fontSize: 13,
    color: colors.textLight,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.xs,
  },
  summaryTotal: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  time: {
    fontSize: 12,
    fontWeight: "600",
    color: "#B26A00",
    marginTop: spacing.md,
  },
  timeExpired: {
    color: colors.primary,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  fieldsRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  halfField: {
    flex: 1,
  },
  error: {
    color: colors.primary,
    fontSize: 12,
    marginTop: spacing.md,
  },
  button: {
    marginTop: spacing.lg,
  },
  secure: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: spacing.md,
  },
  secureText: {
    fontSize: 11,
    color: colors.textLight,
  },
  successCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#2E7D32",
    alignItems: "center",
    justifyContent: "center",
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    marginTop: spacing.lg,
  },
  successText: {
    fontSize: 13,
    color: colors.textLight,
    marginTop: spacing.sm,
    textAlign: "center",
  },
  successButton: {
    width: "100%",
    marginTop: spacing.xl,
  },
});
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
import { formatearPrecio } from "../services/parking";
import { Reserva, pagarReserva, tiempoParaPagar } from "../services/bookings";
import { useAuth } from "../context/AuthContext";
import { Field, PrimaryButton } from "../components/ui";
import { colors, radius, spacing } from "../styles/theme";

// "4242424242424242" -> "4242 4242 4242 4242" (máximo 19 dígitos)
const formatearNumero = (texto: string) =>
  texto
    .replace(/\D/g, "")
    .slice(0, 19)
    .replace(/(\d{4})(?=\d)/g, "$1 ");

// "0828" -> "08/28"
const formatearVencimiento = (texto: string) => {
  const digitos = texto.replace(/\D/g, "").slice(0, 4);
  return digitos.length > 2 ? `${digitos.slice(0, 2)}/${digitos.slice(2)}` : digitos;
};

// Pago de una reserva pendiente. La pasarela es simulada: no se cobra dinero real.
export function PaymentScreen({ route, navigation }: AppScreenProps<"Payment">) {
  const { reservaId, titulo, total } = route.params;
  const limitePago = new Date(route.params.limitePago);
  const { token } = useAuth();

  const [numero, setNumero] = useState("");
  const [vencimiento, setVencimiento] = useState("");
  const [cvc, setCvc] = useState("");
  const [nombre, setNombre] = useState("");
  const [pagando, setPagando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Reserva ya pagada: se muestra la confirmación
  const [pagada, setPagada] = useState<Reserva | null>(null);

  // Cuenta regresiva: se vuelve a dibujar cada segundo
  const [, setTic] = useState(0);
  useEffect(() => {
    const intervalo = setInterval(() => setTic((t) => t + 1), 1000);
    return () => clearInterval(intervalo);
  }, []);
  const vencida = limitePago.getTime() <= Date.now();

  const pagar = async () => {
    if (!token) return;

    // Revisión rápida antes de enviar; las reglas completas las aplica el backend
    if (numero.replace(/\s/g, "").length < 13) {
      setError("Escribe el número completo de la tarjeta.");
      return;
    }
    if (vencimiento.length !== 5) {
      setError("Escribe el vencimiento como MM/AA.");
      return;
    }
    if (cvc.length < 3) {
      setError("El CVC tiene 3 o 4 dígitos.");
      return;
    }
    if (nombre.trim().length < 3) {
      setError("Escribe el nombre como aparece en la tarjeta.");
      return;
    }

    setError(null);
    setPagando(true);

    try {
      setPagada(
        await pagarReserva(reservaId, { numero, vencimiento, cvc, nombre: nombre.trim() }, token),
      );
    } catch (e) {
      // Ej: "El pago fue rechazado: Tarjeta rechazada por el banco"
      setError(e instanceof Error ? e.message : "No se pudo procesar el pago.");
    } finally {
      setPagando(false);
    }
  };

  // ---- Pago aprobado ----
  if (pagada) {
    return (
      <View style={[styles.contenedor, styles.centrado]}>
        <View style={styles.circuloExito}>
          <Feather name="check" size={36} color={colors.white} />
        </View>
        <Text style={styles.exitoTitulo}>¡Pago aprobado!</Text>
        <Text style={styles.exitoTexto}>
          Tu reserva en {titulo} quedó confirmada.
        </Text>
        {pagada.pago && (
          <Text style={styles.exitoTexto}>
            {formatearPrecio(pagada.total)} · {pagada.pago.marca} •••• {pagada.pago.ultimos4}
          </Text>
        )}
        <View style={styles.botonExito}>
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
      style={styles.contenedor}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
        <Text style={styles.titulo}>Pagar reserva</Text>

        {/* Aviso: es una demo, no se cobra nada */}
        <View style={styles.aviso}>
          <Feather name="info" size={16} color="#B26A00" />
          <View style={styles.avisoTextos}>
            <Text style={styles.avisoTitulo}>Modo de prueba</Text>
            <Text style={styles.avisoTexto}>
              No se cobra dinero real. Usa la tarjeta 4242 4242 4242 4242, con
              cualquier vencimiento futuro y cualquier CVC. La 4000 0000 0000 0002
              simula un pago rechazado.
            </Text>
          </View>
        </View>

        <View style={styles.resumen}>
          <Text style={styles.resumenTitulo} numberOfLines={1}>
            {titulo}
          </Text>
          <View style={styles.resumenFila}>
            <Text style={styles.resumenTotal}>Total</Text>
            <Text style={styles.resumenTotal}>{formatearPrecio(total)}</Text>
          </View>
        </View>

        <Text style={[styles.tiempo, vencida && styles.tiempoVencido]}>
          {vencida
            ? "Se acabó el tiempo para pagar. La hora quedó libre: vuelve a reservar."
            : `Tienes ${tiempoParaPagar(limitePago)} para pagar. Mientras tanto, la hora es tuya.`}
        </Text>

        <Text style={styles.etiquetaCampo}>Número de tarjeta</Text>
        <Field
          value={numero}
          onChangeText={(t) => setNumero(formatearNumero(t))}
          placeholder="1234 5678 9012 3456"
          keyboardType="number-pad"
          editable={!vencida}
        />

        <View style={styles.filaCampos}>
          <View style={styles.campoMitad}>
            <Text style={styles.etiquetaCampo}>Vencimiento</Text>
            <Field
              value={vencimiento}
              onChangeText={(t) => setVencimiento(formatearVencimiento(t))}
              placeholder="MM/AA"
              keyboardType="number-pad"
              editable={!vencida}
            />
          </View>
          <View style={styles.campoMitad}>
            <Text style={styles.etiquetaCampo}>CVC</Text>
            <Field
              value={cvc}
              onChangeText={(t) => setCvc(t.replace(/\D/g, "").slice(0, 4))}
              placeholder="123"
              keyboardType="number-pad"
              secureTextEntry
              editable={!vencida}
            />
          </View>
        </View>

        <Text style={styles.etiquetaCampo}>Nombre en la tarjeta</Text>
        <Field
          value={nombre}
          onChangeText={setNombre}
          placeholder="Como aparece en la tarjeta"
          autoCapitalize="characters"
          editable={!vencida}
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.boton}>
          <PrimaryButton
            label={pagando ? "Procesando..." : `Pagar ${formatearPrecio(total)}`}
            onPress={pagar}
            disabled={pagando || vencida}
          />
        </View>

        <View style={styles.seguro}>
          <Feather name="lock" size={12} color={colors.textLight} />
          <Text style={styles.seguroTexto}>
            Solo guardamos la marca y los últimos 4 dígitos de la tarjeta.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centrado: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  contenido: {
    paddingHorizontal: 24,
    paddingBottom: spacing.xl,
  },
  titulo: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.md,
  },
  aviso: {
    flexDirection: "row",
    gap: spacing.sm,
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: "#FFF4E0",
  },
  avisoTextos: {
    flex: 1,
  },
  avisoTitulo: {
    fontSize: 13,
    fontWeight: "700",
    color: "#B26A00",
  },
  avisoTexto: {
    fontSize: 12,
    color: "#7A4A00",
    marginTop: 2,
    lineHeight: 17,
  },
  resumen: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  resumenTitulo: {
    fontSize: 13,
    color: colors.textLight,
  },
  resumenFila: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.xs,
  },
  resumenTotal: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  tiempo: {
    fontSize: 12,
    fontWeight: "600",
    color: "#B26A00",
    marginTop: spacing.md,
  },
  tiempoVencido: {
    color: colors.primary,
  },
  etiquetaCampo: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  filaCampos: {
    flexDirection: "row",
    gap: spacing.md,
  },
  campoMitad: {
    flex: 1,
  },
  error: {
    color: colors.primary,
    fontSize: 12,
    marginTop: spacing.md,
  },
  boton: {
    marginTop: spacing.lg,
  },
  seguro: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: spacing.md,
  },
  seguroTexto: {
    fontSize: 11,
    color: colors.textLight,
  },
  circuloExito: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#2E7D32",
    alignItems: "center",
    justifyContent: "center",
  },
  exitoTitulo: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    marginTop: spacing.lg,
  },
  exitoTexto: {
    fontSize: 13,
    color: colors.textLight,
    marginTop: spacing.sm,
    textAlign: "center",
  },
  botonExito: {
    width: "100%",
    marginTop: spacing.xl,
  },
});
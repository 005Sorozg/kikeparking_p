import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Field, PrimaryButton } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { sendSupportRequest } from "../services/support";
import { colors, spacing } from "../styles/theme";

interface Question {
  question: string;
  response: string;
}

// Preguntas que ven los dos tipos de cuenta
const COMMON_QUESTIONS: Question[] = [
  {
    question: "¿Cómo cambio mi nombre, correo o contraseña?",
    response:
      "Ve a Perfil y toca \"Configuración de la cuenta\". Ahí puedes editar tus datos y cambiar la contraseña.",
  },
  {
    question: "¿Cómo cambio mi foto de perfil?",
    response:
      "En Perfil toca tu foto. Puedes elegir una de la galería o quitar la actual.",
  },
];

const DRIVER_QUESTIONS: Question[] = [
  {
    question: "¿Cómo reservo un parqueadero?",
    response:
      "En Explorar elige un parqueadero y toca \"Reservar\". Escoge el día, la hora y el tipo de vehículo (carro o moto) y confirma con \"Confirmar reserva\".",
  },
  {
    question: "¿Cómo cancelo una reserva?",
    response:
      "Ve a Perfil → \"Reservas anteriores\", toca \"Cancelar reserva\" en la que quieras y confirma con \"Sí, cancelar\". Las reservas que ya terminaron no se pueden cancelar.",
  },
  {
    question: "¿Cómo guardo un parqueadero en favoritos?",
    response:
      "Toca el corazón del parqueadero. Lo verás en la pestaña Favoritos, agrupado por barrio.",
  },
  {
    question: "¿Cómo hablo con el dueño de un parqueadero?",
    response:
      "En el detalle del parqueadero usa la opción de contactar al dueño. La conversación queda en la pestaña Mensajes.",
  },
];

const OWNER_QUESTIONS: Question[] = [
  {
    question: "¿Cómo publico mi parqueadero?",
    response:
      "En Perfil toca \"Publica tu parqueadero\". Completa el título, el barrio, la dirección y el precio por hora, y agrega hasta 5 fotos.",
  },
  {
    question: "¿Cómo edito mi parqueadero o cambio el precio?",
    response:
      "En la pestaña Parqueaderos abre el tuyo y toca \"Editar información\". Los textos se guardan con \"Guardar cambios\".",
  },
  {
    question: "¿Cómo pauso mi parqueadero?",
    response:
      "En el detalle de tu parqueadero usa el interruptor de disponibilidad. Mientras esté pausado no recibe reservas nuevas.",
  },
  {
    question: "¿Dónde veo las reservas que recibí?",
    response:
      "En el detalle de cada parqueadero ves sus reservas y estadísticas. El total aparece en tu Perfil como \"Reservas recibidas\".",
  },
];

// Pregunta que se abre y se cierra al tocarla
function QuestionItem({ question, response }: Question) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View style={styles.item}>
      <Pressable
        style={styles.itemHeader}
        onPress={() => setIsOpen((current) => !current)}
      >
        <Text style={styles.question}>{question}</Text>
        <Feather
          name={isOpen ? "chevron-up" : "chevron-down"}
          size={18}
          color={colors.textLight}
        />
      </Pressable>
      {isOpen && <Text style={styles.response}>{response}</Text>}
    </View>
  );
}

// Obtén ayuda (conductor y propietario): preguntas frecuentes según el rol y
// un formulario que guarda el mensaje en POST /support-requests.
export function HelpScreen() {
  const { user, token } = useAuth();
  const isOwner = user?.role === "propietario";

  const questions = [
    ...(isOwner ? OWNER_QUESTIONS : DRIVER_QUESTIONS),
    ...COMMON_QUESTIONS,
  ];

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const send = async () => {
    if (!token) return;

    setError(null);
    setOk(null);

    // Mismas reglas que valida el backend, para avisar antes de enviar
    if (subject.trim().length < 3) {
      setError("El asunto debe tener al menos 3 caracteres.");
      return;
    }
    if (message.trim().length < 10) {
      setError("Cuéntanos un poco más: el mensaje debe tener al menos 10 caracteres.");
      return;
    }

    setSending(true);

    try {
      await sendSupportRequest(subject.trim(), message.trim(), token);
      setSubject("");
      setMessage("");
      setOk("Recibimos tu mensaje. Gracias por escribirnos.");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo enviar el mensaje.",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Obtén ayuda</Text>

        <Text style={styles.section}>Preguntas frecuentes</Text>
        {questions.map((p) => (
          <QuestionItem key={p.question} {...p} />
        ))}

        <Text style={[styles.section, styles.sectionSeparated]}>
          ¿No encontraste lo que buscabas?
        </Text>
        <Text style={styles.description}>
          Escríbenos y revisaremos tu caso.
        </Text>
        <Field
          value={subject}
          onChangeText={setSubject}
          placeholder="Asunto"
          autoCapitalize="sentences"
          maxLength={100}
        />
        <Field
          value={message}
          onChangeText={setMessage}
          placeholder="Cuéntanos qué pasó"
          autoCapitalize="sentences"
          multiline
          maxLength={1000}
          style={styles.messageInput}
        />
        {error && <Text style={styles.error}>{error}</Text>}
        {ok && <Text style={styles.success}>{ok}</Text>}
        <PrimaryButton
          label={sending ? "Enviando..." : "Enviar mensaje"}
          onPress={send}
          disabled={sending}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: spacing.xl,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.lg,
  },
  section: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  sectionSeparated: {
    marginTop: spacing.xl,
  },
  description: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: spacing.md,
  },
  item: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: 12,
  },
  question: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
    color: colors.text,
  },
  response: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.textLight,
    paddingBottom: 12,
  },
  messageInput: {
    height: 120,
    paddingTop: 12,
    textAlignVertical: "top",
  },
  error: {
    color: colors.primary,
    fontSize: 12,
    marginBottom: spacing.sm,
  },
  success: {
    color: "#2E7D32",
    fontSize: 12,
    marginBottom: spacing.sm,
  },
});
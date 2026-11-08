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
import { enviarSolicitudAyuda } from "../services/support";
import { colors, spacing } from "../styles/theme";

interface Pregunta {
  pregunta: string;
  respuesta: string;
}

// Preguntas que ven los dos tipos de cuenta
const PREGUNTAS_COMUNES: Pregunta[] = [
  {
    pregunta: "¿Cómo cambio mi nombre, correo o contraseña?",
    respuesta:
      "Ve a Perfil y toca \"Configuración de la cuenta\". Ahí puedes editar tus datos y cambiar la contraseña.",
  },
  {
    pregunta: "¿Cómo cambio mi foto de perfil?",
    respuesta:
      "En Perfil toca tu foto. Puedes elegir una de la galería o quitar la actual.",
  },
];

const PREGUNTAS_CONDUCTOR: Pregunta[] = [
  {
    pregunta: "¿Cómo reservo un parqueadero?",
    respuesta:
      "En Explorar elige un parqueadero y toca \"Reservar\". Escoge el día, la hora y el tipo de vehículo (carro o moto) y confirma con \"Confirmar reserva\".",
  },
  {
    pregunta: "¿Cómo cancelo una reserva?",
    respuesta:
      "Ve a Perfil → \"Reservas anteriores\", toca \"Cancelar reserva\" en la que quieras y confirma con \"Sí, cancelar\". Las reservas que ya terminaron no se pueden cancelar.",
  },
  {
    pregunta: "¿Cómo guardo un parqueadero en favoritos?",
    respuesta:
      "Toca el corazón del parqueadero. Lo verás en la pestaña Favoritos, agrupado por barrio.",
  },
  {
    pregunta: "¿Cómo hablo con el dueño de un parqueadero?",
    respuesta:
      "En el detalle del parqueadero usa la opción de contactar al dueño. La conversación queda en la pestaña Mensajes.",
  },
];

const PREGUNTAS_PROPIETARIO: Pregunta[] = [
  {
    pregunta: "¿Cómo publico mi parqueadero?",
    respuesta:
      "En Perfil toca \"Publica tu parqueadero\". Completa el título, el barrio, la dirección y el precio por hora, y agrega hasta 5 fotos.",
  },
  {
    pregunta: "¿Cómo edito mi parqueadero o cambio el precio?",
    respuesta:
      "En la pestaña Parqueaderos abre el tuyo y toca \"Editar información\". Los textos se guardan con \"Guardar cambios\".",
  },
  {
    pregunta: "¿Cómo pauso mi parqueadero?",
    respuesta:
      "En el detalle de tu parqueadero usa el interruptor de disponibilidad. Mientras esté pausado no recibe reservas nuevas.",
  },
  {
    pregunta: "¿Dónde veo las reservas que recibí?",
    respuesta:
      "En el detalle de cada parqueadero ves sus reservas y estadísticas. El total aparece en tu Perfil como \"Reservas recibidas\".",
  },
];

// Pregunta que se abre y se cierra al tocarla
function ItemPregunta({ pregunta, respuesta }: Pregunta) {
  const [abierta, setAbierta] = useState(false);

  return (
    <View style={styles.item}>
      <Pressable
        style={styles.itemCabecera}
        onPress={() => setAbierta((actual) => !actual)}
      >
        <Text style={styles.pregunta}>{pregunta}</Text>
        <Feather
          name={abierta ? "chevron-up" : "chevron-down"}
          size={18}
          color={colors.textLight}
        />
      </Pressable>
      {abierta && <Text style={styles.respuesta}>{respuesta}</Text>}
    </View>
  );
}

// Obtén ayuda (conductor y propietario): preguntas frecuentes según el rol y
// un formulario que guarda el mensaje en POST /support-requests.
export function HelpScreen() {
  const { usuario, token } = useAuth();
  const esPropietario = usuario?.role === "propietario";

  const preguntas = [
    ...(esPropietario ? PREGUNTAS_PROPIETARIO : PREGUNTAS_CONDUCTOR),
    ...PREGUNTAS_COMUNES,
  ];

  const [asunto, setAsunto] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const enviar = async () => {
    if (!token) return;

    setError(null);
    setOk(null);

    // Mismas reglas que valida el backend, para avisar antes de enviar
    if (asunto.trim().length < 3) {
      setError("El asunto debe tener al menos 3 caracteres.");
      return;
    }
    if (mensaje.trim().length < 10) {
      setError("Cuéntanos un poco más: el mensaje debe tener al menos 10 caracteres.");
      return;
    }

    setEnviando(true);

    try {
      await enviarSolicitudAyuda(asunto.trim(), mensaje.trim(), token);
      setAsunto("");
      setMensaje("");
      setOk("Recibimos tu mensaje. Gracias por escribirnos.");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo enviar el mensaje.",
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.contenedor}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.contenido}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.titulo}>Obtén ayuda</Text>

        <Text style={styles.seccion}>Preguntas frecuentes</Text>
        {preguntas.map((p) => (
          <ItemPregunta key={p.pregunta} {...p} />
        ))}

        <Text style={[styles.seccion, styles.seccionSeparada]}>
          ¿No encontraste lo que buscabas?
        </Text>
        <Text style={styles.descripcion}>
          Escríbenos y revisaremos tu caso.
        </Text>
        <Field
          value={asunto}
          onChangeText={setAsunto}
          placeholder="Asunto"
          autoCapitalize="sentences"
          maxLength={100}
        />
        <Field
          value={mensaje}
          onChangeText={setMensaje}
          placeholder="Cuéntanos qué pasó"
          autoCapitalize="sentences"
          multiline
          maxLength={1000}
          style={styles.campoMensaje}
        />
        {error && <Text style={styles.error}>{error}</Text>}
        {ok && <Text style={styles.exito}>{ok}</Text>}
        <PrimaryButton
          label={enviando ? "Enviando..." : "Enviar mensaje"}
          onPress={enviar}
          disabled={enviando}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contenido: {
    paddingHorizontal: 24,
    paddingBottom: spacing.xl,
  },
  titulo: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.lg,
  },
  seccion: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  seccionSeparada: {
    marginTop: spacing.xl,
  },
  descripcion: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: spacing.md,
  },
  item: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  itemCabecera: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: 12,
  },
  pregunta: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
    color: colors.text,
  },
  respuesta: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.textLight,
    paddingBottom: 12,
  },
  campoMensaje: {
    height: 120,
    paddingTop: 12,
    textAlignVertical: "top",
  },
  error: {
    color: colors.primary,
    fontSize: 12,
    marginBottom: spacing.sm,
  },
  exito: {
    color: "#2E7D32",
    fontSize: 12,
    marginBottom: spacing.sm,
  },
});
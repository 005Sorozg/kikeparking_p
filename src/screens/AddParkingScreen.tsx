import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import type { AppScreenProps } from "../types/navigation";
import { FILTROS_RAPIDOS, crearParqueadero } from "../services/parking";
import { Chip, Field, ImagePlaceholder, PrimaryButton } from "../components/ui";
import { colors, radius, spacing } from "../styles/theme";

// Agregar parqueadero: formulario del propietario para publicar su espacio.
// Los campos título, barrio, dirección y precio por hora coinciden con lo que
// pide POST /kikeparking-api/v1/parking-spots, para conectarlo luego sin cambios.
export function AddParkingScreen({ navigation }: AppScreenProps<"AddParking">) {
  const [titulo, setTitulo] = useState("");
  const [barrio, setBarrio] = useState("");
  const [ciudad, setCiudad] = useState("Medellín");
  const [direccion, setDireccion] = useState("");
  const [precioHora, setPrecioHora] = useState("");
  const [vehiculos, setVehiculos] = useState(1);
  const [etiquetas, setEtiquetas] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const alternarEtiqueta = (etiqueta: string) =>
    setEtiquetas((actuales) =>
      actuales.includes(etiqueta)
        ? actuales.filter((e) => e !== etiqueta)
        : [...actuales, etiqueta],
    );

  const publicar = () => {
    // Mismas reglas que valida el backend, para avisar antes de enviar.
    const precio = Number(precioHora.replace(/\D/g, ""));
    if (titulo.trim().length < 3) {
      setError("El título debe tener al menos 3 caracteres.");
      return;
    }
    if (barrio.trim().length < 2) {
      setError("Escribe el barrio.");
      return;
    }
    if (ciudad.trim().length < 2) {
      setError("Escribe la ciudad.");
      return;
    }
    if (direccion.trim().length < 3) {
      setError("Escribe la dirección.");
      return;
    }
    if (!Number.isInteger(precio) || precio <= 0) {
      setError("El precio por hora debe ser un número mayor que 0.");
      return;
    }

    setError(null);
    crearParqueadero({
      titulo: titulo.trim(),
      barrio: barrio.trim(),
      ciudad: ciudad.trim(),
      direccion: direccion.trim(),
      precioHora: precio,
      vehiculos,
      etiquetas,
    });
    Alert.alert("¡Listo!", "Tu parqueadero ya está publicado.");
    navigation.goBack();
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
        <Text style={styles.titulo}>Agrega tu parqueadero</Text>
        <Text style={styles.subtitulo}>
          Cuéntanos sobre tu espacio para que los conductores puedan reservarlo.
        </Text>

        <Text style={styles.etiquetaCampo}>Fotos</Text>
        <View style={styles.foto}>
          <ImagePlaceholder style={styles.fotoImagen} iconSize={40} />
          <Text style={styles.fotoTexto}>Subir fotos estará disponible pronto</Text>
        </View>

        <Text style={styles.etiquetaCampo}>Título</Text>
        <Field
          value={titulo}
          onChangeText={setTitulo}
          placeholder="Ej: Garaje techado con vigilancia"
          autoCapitalize="sentences"
        />

        <Text style={styles.etiquetaCampo}>Ubicación</Text>
        <Field
          value={barrio}
          onChangeText={setBarrio}
          placeholder="Barrio"
          autoCapitalize="words"
        />
        <Field
          value={ciudad}
          onChangeText={setCiudad}
          placeholder="Ciudad"
          autoCapitalize="words"
        />
        <Field
          value={direccion}
          onChangeText={setDireccion}
          placeholder="Dirección (Ej: Cra. 76 #44-20)"
          autoCapitalize="sentences"
        />

        <Text style={styles.etiquetaCampo}>Precio por hora (COP)</Text>
        <Field
          value={precioHora}
          onChangeText={setPrecioHora}
          placeholder="Ej: 5000"
          keyboardType="number-pad"
        />

        <Text style={styles.etiquetaCampo}>Capacidad</Text>
        <View style={styles.contador}>
          <Pressable
            style={styles.contadorBoton}
            onPress={() => setVehiculos((v) => Math.max(1, v - 1))}
            hitSlop={8}
          >
            <Feather name="minus" size={16} color={colors.text} />
          </Pressable>
          <Text style={styles.contadorValor}>
            {vehiculos} {vehiculos === 1 ? "vehículo" : "vehículos"}
          </Text>
          <Pressable
            style={styles.contadorBoton}
            onPress={() => setVehiculos((v) => Math.min(10, v + 1))}
            hitSlop={8}
          >
            <Feather name="plus" size={16} color={colors.text} />
          </Pressable>
        </View>

        <Text style={styles.etiquetaCampo}>Características</Text>
        <View style={styles.etiquetas}>
          {FILTROS_RAPIDOS.map((etiqueta) => (
            <Chip
              key={etiqueta}
              label={etiqueta}
              selected={etiquetas.includes(etiqueta)}
              onPress={() => alternarEtiqueta(etiqueta)}
            />
          ))}
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.boton}>
          <PrimaryButton label="Publicar parqueadero" onPress={publicar} />
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
  contenido: {
    paddingHorizontal: 24,
    paddingBottom: spacing.xl,
  },
  titulo: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
  },
  subtitulo: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  etiquetaCampo: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  foto: {
    alignItems: "center",
    gap: spacing.sm,
  },
  fotoImagen: {
    width: "100%",
    height: 140,
    borderRadius: radius.md,
  },
  fotoTexto: {
    fontSize: 11,
    color: colors.textLight,
  },
  contador: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  contadorBoton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.chip,
    alignItems: "center",
    justifyContent: "center",
  },
  contadorValor: {
    fontSize: 13,
    color: colors.text,
    minWidth: 90,
    textAlign: "center",
  },
  etiquetas: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  error: {
    color: colors.primary,
    fontSize: 12,
    marginTop: spacing.md,
  },
  boton: {
    marginTop: spacing.lg,
  },
});
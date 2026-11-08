import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { MainTabScreenProps } from "../types/navigation";
import {
  Conversacion,
  archivarConversacion,
  eliminarConversacion,
  formatearFechaChat,
  obtenerConversaciones,
} from "../services/messages";
import { useAuth } from "../context/AuthContext";
import { AvatarPlaceholder, Chip, ImagePlaceholder } from "../components/ui";
import { colors, radius, spacing } from "../styles/theme";

type Filtro = "todos" | "no_leidos" | "archivados";

const FILTROS: { id: Filtro; etiqueta: string }[] = [
  { id: "todos", etiqueta: "Todos" },
  { id: "no_leidos", etiqueta: "No leídos" },
  { id: "archivados", etiqueta: "Archivados" },
];

const VACIO: Record<Filtro, string> = {
  todos: "Aún no tienes mensajes.",
  no_leidos: "No tienes mensajes sin leer.",
  archivados: "No tienes chats archivados.",
};

// Cada cuánto se actualiza la lista mientras la pantalla está abierta
const INTERVALO_MS = 10000;

// Mensajes: chats con conductores o propietarios. Mantener presionado abre el menú.
export function MessagesScreen({ navigation }: MainTabScreenProps<"Messages">) {
  const insets = useSafeAreaInsets();
  const { usuario, token } = useAuth();
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [chats, setChats] = useState<Conversacion[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Chat sobre el que se abrió el menú (y si se está confirmando la eliminación)
  const [menu, setMenu] = useState<Conversacion | null>(null);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);

  const cargar = useCallback(async () => {
    if (!token) return;
    try {
      setChats(await obtenerConversaciones(token, filtro === "archivados"));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron cargar los mensajes.");
    }
  }, [token, filtro]);

  // Se carga al entrar (o al cambiar de filtro) y se actualiza cada 10 s mientras se ve.
  useFocusEffect(
    useCallback(() => {
      cargar();
      const temporizador = setInterval(cargar, INTERVALO_MS);
      return () => clearInterval(temporizador);
    }, [cargar]),
  );

  const cambiarFiltro = (nuevo: Filtro) => {
    if (nuevo === filtro) return;
    setChats(null);
    setFiltro(nuevo);
  };

  const cerrarMenu = () => {
    setMenu(null);
    setConfirmarEliminar(false);
  };

  // Archivar / desarchivar / eliminar: el chat sale de la lista actual al instante.
  const aplicar = async (accion: "archivar" | "eliminar") => {
    if (!menu || !token) return;
    const chat = menu;
    cerrarMenu();
    setChats((actuales) => (actuales ?? []).filter((c) => c.id !== chat.id));

    try {
      if (accion === "eliminar") await eliminarConversacion(chat.id, token);
      else await archivarConversacion(chat.id, !chat.archivada, token);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo actualizar el chat.");
    }
    cargar();
  };

  const visibles = (chats ?? []).filter(
    (c) => filtro !== "no_leidos" || c.noLeidos > 0,
  );

  return (
    <View style={[styles.contenedor, { paddingTop: insets.top + spacing.sm }]}>
      <Text style={styles.titulo}>Mensajes</Text>

      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {FILTROS.map((f) => (
            <Chip
              key={f.id}
              label={f.etiqueta}
              variant="filled"
              selected={filtro === f.id}
              onPress={() => cambiarFiltro(f.id)}
            />
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.lista}>
        {error && <Text style={styles.error}>{error}</Text>}
        {!chats && !error && <ActivityIndicator color={colors.primary} />}
        {chats && visibles.length === 0 && (
          <Text style={styles.vacio}>
            {VACIO[filtro]}
            {filtro === "todos" && usuario?.role === "conductor"
              ? " Escríbele a un propietario desde el detalle de su parqueadero."
              : ""}
          </Text>
        )}

        {visibles.map((c) => (
          <FilaConversacion
            key={c.id}
            conversacion={c}
            onPress={() =>
              navigation.navigate("Chat", {
                conversationId: c.id,
                titulo: c.contacto.nombre,
              })
            }
            onLongPress={() => setMenu(c)}
          />
        ))}
      </ScrollView>

      {/* Menú al mantener presionado un chat */}
      <Modal visible={menu !== null} transparent animationType="fade" onRequestClose={cerrarMenu}>
        <Pressable style={styles.fondoMenu} onPress={cerrarMenu}>
          <Pressable style={[styles.menu, { paddingBottom: insets.bottom + spacing.md }]}>
            {menu && !confirmarEliminar && (
              <>
                <Text style={styles.menuTitulo} numberOfLines={1}>
                  {menu.contacto.nombre} · {menu.parqueadero.titulo}
                </Text>
                <Pressable style={styles.menuOpcion} onPress={() => aplicar("archivar")}>
                  <Text style={styles.menuTexto}>
                    {menu.archivada ? "Desarchivar" : "Archivar"}
                  </Text>
                </Pressable>
                <Pressable style={styles.menuOpcion} onPress={() => setConfirmarEliminar(true)}>
                  <Text style={[styles.menuTexto, styles.menuPeligro]}>Eliminar</Text>
                </Pressable>
                <Pressable style={styles.menuOpcion} onPress={cerrarMenu}>
                  <Text style={styles.menuCancelar}>Cancelar</Text>
                </Pressable>
              </>
            )}
            {menu && confirmarEliminar && (
              <>
                <Text style={styles.menuTitulo}>¿Eliminar este chat?</Text>
                <Text style={styles.menuAviso}>
                  Se borrará solo para ti. {menu.contacto.nombre} conservará los
                  mensajes. Si te vuelve a escribir, el chat reaparecerá.
                </Text>
                <Pressable style={styles.menuOpcion} onPress={() => aplicar("eliminar")}>
                  <Text style={[styles.menuTexto, styles.menuPeligro]}>Eliminar</Text>
                </Pressable>
                <Pressable style={styles.menuOpcion} onPress={cerrarMenu}>
                  <Text style={styles.menuCancelar}>Cancelar</Text>
                </Pressable>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// Fila de la lista: foto del parqueadero con la foto de la otra persona en la esquina.
function FilaConversacion({
  conversacion: c,
  onPress,
  onLongPress,
}: {
  conversacion: Conversacion;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const sinLeer = c.noLeidos > 0;
  const ultimo = c.ultimoMensaje
    ? `${c.ultimoMensaje.mio ? "Tú: " : ""}${c.ultimoMensaje.texto}`
    : "Sin mensajes todavía";

  return (
    <Pressable
      style={styles.fila}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={350}
    >
      <View style={styles.avatarGrupo}>
        <ImagePlaceholder
          style={styles.avatarImagen}
          iconSize={22}
          source={c.parqueadero.foto}
        />
        <View style={styles.avatarMini}>
          <AvatarPlaceholder size={24} source={c.contacto.foto} />
        </View>
      </View>

      <View style={styles.textos}>
        <Text style={[styles.nombre, sinLeer && styles.negrita]} numberOfLines={1}>
          {c.contacto.nombre}
        </Text>
        <Text
          style={[styles.detalle, sinLeer && styles.mensajeSinLeer]}
          numberOfLines={1}
        >
          {ultimo}
        </Text>
        <Text style={styles.detalle} numberOfLines={1}>
          {c.parqueadero.titulo} · {c.parqueadero.barrio}
        </Text>
      </View>

      <View style={styles.derecha}>
        <Text style={styles.fecha}>{formatearFechaChat(c.fecha)}</Text>
        {sinLeer && (
          <View style={styles.contador}>
            <Text style={styles.contadorTexto}>{c.noLeidos}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: colors.background,
  },
  titulo: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
    paddingHorizontal: 24,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  chips: {
    paddingHorizontal: 24,
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  lista: {
    paddingHorizontal: 24,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  fila: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    marginBottom: spacing.lg,
  },
  avatarGrupo: {
    width: 56,
    height: 56,
  },
  avatarImagen: {
    width: 48,
    height: 48,
    borderRadius: 10,
  },
  avatarMini: {
    position: "absolute",
    right: 0,
    bottom: 0,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.white,
  },
  textos: {
    flex: 1,
  },
  nombre: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.text,
  },
  detalle: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 3,
  },
  fecha: {
    fontSize: 11,
    color: colors.textLight,
  },
  negrita: {
    fontWeight: "700",
  },
  mensajeSinLeer: {
    color: colors.text,
    fontWeight: "600",
  },
  derecha: {
    alignItems: "flex-end",
    gap: 6,
  },
  contador: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  contadorTexto: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.white,
  },
  error: {
    fontSize: 12,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  vacio: {
    fontSize: 13,
    color: colors.textLight,
    textAlign: "center",
    marginTop: spacing.xl,
  },
  fondoMenu: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  menu: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingTop: spacing.md,
    paddingHorizontal: 24,
  },
  menuTitulo: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  menuAviso: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: spacing.sm,
  },
  menuOpcion: {
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  menuTexto: {
    fontSize: 15,
    color: colors.text,
  },
  menuPeligro: {
    color: colors.primary,
    fontWeight: "600",
  },
  menuCancelar: {
    fontSize: 15,
    color: colors.textLight,
  },
});
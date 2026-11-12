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
  Conversation,
  archiveConversation,
  deleteConversation,
  formatChatDate,
  getConversations,
} from "../services/messages";
import { useAuth } from "../context/AuthContext";
import { useUnread } from "../context/UnreadContext";
import { AvatarPlaceholder, Chip, ImagePlaceholder } from "../components/ui";
import { colors, radius, spacing } from "../styles/theme";

type Filter = "all" | "unread" | "archived";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "unread", label: "No leídos" },
  { id: "archived", label: "Archivados" },
];

const EMPTY_MESSAGES: Record<Filter, string> = {
  all: "Aún no tienes mensajes.",
  unread: "No tienes mensajes sin leer.",
  archived: "No tienes chats archivados.",
};

// Cada cuánto se actualiza la lista mientras la pantalla está abierta
const INTERVAL_MS = 10000;

// Mensajes: chats con conductores o propietarios. Mantener presionado abre el menú.
export function MessagesScreen({ navigation }: MainTabScreenProps<"Messages">) {
  const insets = useSafeAreaInsets();
  const { user, token } = useAuth();
  const { update: refreshUnread } = useUnread();
  const [filter, setFilter] = useState<Filter>("all");
  const [chats, setChats] = useState<Conversation[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Chat sobre el que se abrió el menú (y si se está confirmando la eliminación)
  const [menu, setMenu] = useState<Conversation | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setChats(await getConversations(token, filter === "archived"));
      setError(null);
      // La lista y el número de la pestaña se actualizan juntos
      refreshUnread();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron cargar los mensajes.");
    }
  }, [token, filter, refreshUnread]);

  // Se carga al entrar (o al cambiar de filtro) y se actualiza cada 10 s mientras se ve.
  useFocusEffect(
    useCallback(() => {
      load();
      const timer = setInterval(load, INTERVAL_MS);
      return () => clearInterval(timer);
    }, [load]),
  );

  const changeFilter = (created: Filter) => {
    if (created === filter) return;
    setChats(null);
    setFilter(created);
  };

  const closeMenu = () => {
    setMenu(null);
    setConfirmingDelete(false);
  };

  // Archivar / desarchivar / eliminar: el chat sale de la lista actual al instante.
  const apply = async (action: "archive" | "delete") => {
    if (!menu || !token) return;
    const chat = menu;
    closeMenu();
    setChats((current) => (current ?? []).filter((c) => c.id !== chat.id));

    try {
      if (action === "delete") await deleteConversation(chat.id, token);
      else await archiveConversation(chat.id, !chat.archived, token);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo actualizar el chat.");
    }
    load();
  };

  const visibleItems = (chats ?? []).filter(
    (c) => filter !== "unread" || c.unread > 0,
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <Text style={styles.title}>Mensajes</Text>

      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {FILTERS.map((f) => (
            <Chip
              key={f.id}
              label={f.label}
              variant="filled"
              selected={filter === f.id}
              onPress={() => changeFilter(f.id)}
            />
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {error && <Text style={styles.error}>{error}</Text>}
        {!chats && !error && <ActivityIndicator color={colors.primary} />}
        {chats && visibleItems.length === 0 && (
          <Text style={styles.empty}>
            {EMPTY_MESSAGES[filter]}
            {filter === "all" && user?.role === "conductor"
              ? " Escríbele a un propietario desde el detalle de su parqueadero."
              : ""}
          </Text>
        )}

        {visibleItems.map((c) => (
          <ConversationRow
            key={c.id}
            conversation={c}
            onPress={() =>
              navigation.navigate("Chat", {
                conversationId: c.id,
                title: c.contact.name,
              })
            }
            onLongPress={() => setMenu(c)}
          />
        ))}
      </ScrollView>

      {/* Menú al mantener presionado un chat */}
      <Modal visible={menu !== null} transparent animationType="fade" onRequestClose={closeMenu}>
        <Pressable style={styles.menuBackdrop} onPress={closeMenu}>
          <Pressable style={[styles.menu, { paddingBottom: insets.bottom + spacing.md }]}>
            {menu && !confirmingDelete && (
              <>
                <Text style={styles.menuTitle} numberOfLines={1}>
                  {menu.contact.name} · {menu.parkingSpot.title}
                </Text>
                <Pressable style={styles.menuOption} onPress={() => apply("archive")}>
                  <Text style={styles.menuText}>
                    {menu.archived ? "Desarchivar" : "Archivar"}
                  </Text>
                </Pressable>
                <Pressable style={styles.menuOption} onPress={() => setConfirmingDelete(true)}>
                  <Text style={[styles.menuText, styles.menuDanger]}>Eliminar</Text>
                </Pressable>
                <Pressable style={styles.menuOption} onPress={closeMenu}>
                  <Text style={styles.menuCancel}>Cancelar</Text>
                </Pressable>
              </>
            )}
            {menu && confirmingDelete && (
              <>
                <Text style={styles.menuTitle}>¿Eliminar este chat?</Text>
                <Text style={styles.menuNotice}>
                  Se borrará solo para ti. {menu.contact.name} conservará los
                  mensajes. Si te vuelve a escribir, el chat reaparecerá.
                </Text>
                <Pressable style={styles.menuOption} onPress={() => apply("delete")}>
                  <Text style={[styles.menuText, styles.menuDanger]}>Eliminar</Text>
                </Pressable>
                <Pressable style={styles.menuOption} onPress={closeMenu}>
                  <Text style={styles.menuCancel}>Cancelar</Text>
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
function ConversationRow({
  conversation: c,
  onPress,
  onLongPress,
}: {
  conversation: Conversation;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const unread = c.unread > 0;
  const last = c.lastMessage
    ? `${c.lastMessage.isMine ? "Tú: " : ""}${c.lastMessage.text}`
    : "Sin mensajes todavía";

  return (
    <Pressable
      style={styles.row}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={350}
    >
      <View style={styles.avatarGroup}>
        <ImagePlaceholder
          style={styles.avatarImage}
          iconSize={22}
          source={c.parkingSpot.photo}
        />
        <View style={styles.avatarMini}>
          <AvatarPlaceholder size={24} source={c.contact.photo} />
        </View>
      </View>

      <View style={styles.texts}>
        <Text style={[styles.name, unread && styles.bold]} numberOfLines={1}>
          {c.contact.name}
        </Text>
        <Text
          style={[styles.detail, unread && styles.unreadMessage]}
          numberOfLines={1}
        >
          {last}
        </Text>
        <Text style={styles.detail} numberOfLines={1}>
          {c.parkingSpot.title} · {c.parkingSpot.neighborhood}
        </Text>
      </View>

      <View style={styles.rightSide}>
        <Text style={styles.date}>{formatChatDate(c.date)}</Text>
        {unread && (
          <View style={styles.counter}>
            <Text style={styles.counterText}>{c.unread}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  title: {
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
  list: {
    paddingHorizontal: 24,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    marginBottom: spacing.lg,
  },
  avatarGroup: {
    width: 56,
    height: 56,
  },
  avatarImage: {
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
  texts: {
    flex: 1,
  },
  name: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.text,
  },
  detail: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 3,
  },
  date: {
    fontSize: 11,
    color: colors.textLight,
  },
  bold: {
    fontWeight: "700",
  },
  unreadMessage: {
    color: colors.text,
    fontWeight: "600",
  },
  rightSide: {
    alignItems: "flex-end",
    gap: 6,
  },
  counter: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  counterText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.white,
  },
  error: {
    fontSize: 12,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  empty: {
    fontSize: 13,
    color: colors.textLight,
    textAlign: "center",
    marginTop: spacing.xl,
  },
  menuBackdrop: {
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
  menuTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  menuNotice: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: spacing.sm,
  },
  menuOption: {
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  menuText: {
    fontSize: 15,
    color: colors.text,
  },
  menuDanger: {
    color: colors.primary,
    fontWeight: "600",
  },
  menuCancel: {
    fontSize: 15,
    color: colors.textLight,
  },
});
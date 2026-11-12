import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import {
  Booking,
  currentPhase,
  formatHour,
  getMyBookings,
  getReceivedBookings,
} from "./bookings";

// Recordatorios de reservas: notificaciones que programa el mismo celular,
// así suenan a su hora aunque la app esté cerrada. No pasan por el backend.

const CHANNEL_ID = "reminders";
const MINUTE_MS = 60 * 1000;
// Android deja programar un número limitado: se guardan solo los más próximos
const MAX_REMINDERS = 50;

// En el navegador no hay notificaciones programadas: todo esto no hace nada
const supported = Platform.OS !== "web";

// Mientras la app está abierta, la notificación también se muestra arriba
if (supported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

interface Reminder {
  date: Date;
  title: string;
  body: string;
}

// Qué recordatorios tiene una reserva, según quién la mira.
function remindersFor(booking: Booking, isOwner: boolean): Reminder[] {
  const phase = currentPhase(booking);
  const place = booking.parkingSpot.title;
  const reminders: Reminder[] = [];
  // formatHour ya termina en punto ("3:00 p. m."), por eso esos textos no llevan otro

  if (isOwner) {
    // Al propietario: avisarle que llega un conductor
    if (phase === "upcoming") {
      reminders.push({
        date: new Date(booking.start.getTime() - 30 * MINUTE_MS),
        title: "Llega un conductor pronto",
        body: `${booking.driver.name} llega a ${place} a las ${formatHour(booking.start)}`,
      });
    }
    return reminders;
  }

  // Al conductor: que no se le pase el tiempo para pagar
  if (phase === "pending_payment" && booking.paymentDeadline) {
    reminders.push({
      date: new Date(booking.paymentDeadline.getTime() - 3 * MINUTE_MS),
      title: "Tu reserva aún no está pagada",
      body: `Te quedan 3 minutos para pagar ${place}. Si no, la hora queda libre.`,
    });
  }

  // Ya pagada: cuándo empieza y cuándo se acaba
  if (phase === "upcoming") {
    reminders.push({
      date: new Date(booking.start.getTime() - 30 * MINUTE_MS),
      title: "Tu reserva empieza pronto",
      body: `${place} te espera a las ${formatHour(booking.start)}`,
    });
  }
  if (phase === "upcoming" || phase === "in_progress") {
    reminders.push({
      date: new Date(booking.end.getTime() - 15 * MINUTE_MS),
      title: "Tu reserva termina en 15 minutos",
      body: `Recuerda salir de ${place} antes de las ${formatHour(booking.end)}`,
    });
  }

  return reminders;
}

// Pide permiso la primera vez. Devuelve si se pueden mostrar notificaciones.
async function askPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;

  const answer = await Notifications.requestPermissionsAsync();
  return answer.granted;
}

// Borra los recordatorios que había y programa los de estas reservas.
// Así siempre quedan al día, aunque la reserva se haya pagado o cancelado.
export async function syncReminders(bookings: Booking[], isOwner: boolean): Promise<void> {
  if (!supported) return;

  try {
    if (!(await askPermission())) return;

    // Canal propio en Android. Si no se puede crear (ej: en Expo Go),
    // se usa el canal por defecto y los recordatorios salen igual.
    let channelId: string | undefined;
    if (Platform.OS === "android") {
      try {
        await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
          name: "Recordatorios de reservas",
          importance: Notifications.AndroidImportance.HIGH,
        });
        channelId = CHANNEL_ID;
      } catch {
        channelId = undefined;
      }
    }

    await Notifications.cancelAllScheduledNotificationsAsync();

    const now = Date.now();
    const upcoming = bookings
      .flatMap((b) => remindersFor(b, isOwner))
      .filter((r) => r.date.getTime() > now)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, MAX_REMINDERS);

    for (const r of upcoming) {
      await Notifications.scheduleNotificationAsync({
        content: { title: r.title, body: r.body },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: r.date,
          channelId,
        },
      });
    }
  } catch {
    // Si algo falla con las notificaciones, la app sigue funcionando normal
  }
}

// Trae las reservas del usuario y actualiza sus recordatorios.
export async function refreshReminders(token: string, isOwner: boolean): Promise<void> {
  if (!supported) return;

  try {
    const bookings = await (isOwner ? getReceivedBookings(token) : getMyBookings(token));
    await syncReminders(bookings, isOwner);
  } catch {
    // Sin conexión no se actualizan; quedan los que ya estaban programados
  }
}

// Al cerrar sesión no deben quedar avisos de la cuenta anterior.
export async function clearReminders(): Promise<void> {
  if (!supported) return;

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // Nada que hacer
  }
}

// Avisa cuando el usuario toca un recordatorio, también si la app estaba cerrada
// y se abrió por tocarlo. Devuelve la función para dejar de escuchar.
export function onReminderTapped(callback: () => void): () => void {
  if (!supported) return () => {};

  // La app se abrió tocando una notificación
  if (Notifications.getLastNotificationResponse()) {
    Notifications.clearLastNotificationResponse();
    callback();
  }

  const subscription = Notifications.addNotificationResponseReceivedListener(() => {
    Notifications.clearLastNotificationResponse();
    callback();
  });
  return () => subscription.remove();
}
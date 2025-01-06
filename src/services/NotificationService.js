import * as Notifications from "expo-notifications";

class NotificationService {
  static async scheduleBookingReminder(bookingDate, seatInfo) {
    const trigger = new Date(bookingDate);
    trigger.setHours(trigger.getHours() - 1);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Upcoming Office Booking",
        body: `You have a booking for seat ${seatInfo.name} in 1 hour.`,
        data: { seatInfo },
      },
      trigger,
    });
  }

  static async sendBookingConfirmation(bookingDetails) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Booking Confirmed",
        body: `Your booking for seat ${bookingDetails.seatName} on ${bookingDetails.date} is confirmed.`,
      },
      trigger: null,
    });
  }

  static async sendCancellationNotification(bookingDetails) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Booking Cancelled",
        body: `Your booking for seat ${bookingDetails.seatName} has been cancelled.`,
      },
      trigger: null,
    });
  }
}

export default NotificationService;

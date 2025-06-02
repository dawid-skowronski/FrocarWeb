import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { notificationService } from './NotificationService'; // Popraw ścieżkę do serwisu!

interface Notification {
  notificationId: number;
  message: string;
}

const NotificationList: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Ta funkcja będzie wywoływana przez NotificationService
  // za każdym razem, gdy pojawią się nowe/aktualne powiadomienia.
  const handleNewNotifications = useCallback((newNotifications: Notification[]) => {
    setNotifications(newNotifications);
    // Możesz dodać tu toast, jeśli chcesz, aby każde powiadomienie na liście
    // również miało swój globalny toast (obecnie App.tsx już to robi).
    // newNotifications.forEach(n => toast.info(`Lista aktualna: ${n.message}`));
  }, []);

  useEffect(() => {
    // Subskrybujemy do serwisu powiadomień.
    // Oznacza to, że nasz komponent będzie "nasłuchiwał" na zmiany w NotificationService.
    notificationService.subscribe(handleNewNotifications);

    // Opcjonalnie: Jeśli chcesz, aby lista powiadomień była widoczna od razu po załadowaniu
    // komponentu, możesz wywołać ręczne pobranie powiadomień.
    // Jednak system pollingu w App.tsx już to zrobi, więc to może być zbędne.
    // notificationService.fetchNotifications(); // Zastanów się, czy to jest potrzebne

    // Funkcja czyszcząca: Ważne, aby usunąć subskrypcję, gdy komponent jest odmontowywany,
    // aby zapobiec wyciekom pamięci.
    return () => {
      notificationService.unsubscribe(handleNewNotifications);
    };
  }, [handleNewNotifications]); // Zależność od handleNewNotifications jest kluczowa

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      // Wywołujemy metodę serwisu, aby oznaczyć powiadomienie jako przeczytane.
      await notificationService.markNotificationAsRead(notificationId);

      // Usuwamy powiadomienie z lokalnego stanu po sukcesie
      setNotifications(prevNotifications => 
        prevNotifications.filter(notification => notification.notificationId !== notificationId)
      );
      toast.success('Powiadomienie zostało oznaczone jako przeczytane.');

      // Opcjonalnie: Jeśli chcesz, aby lista natychmiastowo zsynchronizowała się z serwerem
      // po oznaczeniu jednego powiadomienia jako przeczytane, możesz wywołać:
      // notificationService.fetchNotifications(); // To ponownie pobierze wszystkie powiadomienia
    } catch (error) {
      toast.error('Wystąpił błąd podczas oznaczania powiadomienia jako przeczytanego.');
    }
  };

  return (
    <div>
      <h2>Twoje Powiadomienia</h2>
      {notifications.length === 0 ? (
        <p>Brak nowych powiadomień.</p>
      ) : (
        <ul>
          {notifications.map(notification => (
            <li key={notification.notificationId}>
              {notification.message}
              <button onClick={() => handleMarkAsRead(notification.notificationId)}>
                Oznacz jako przeczytane
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default NotificationList;
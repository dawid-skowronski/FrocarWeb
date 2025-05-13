// NotificationList.tsx
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import markNotificationAsRead from './markNotificationAsRead';
import Cookies from 'js-cookie';

interface Notification {
  notificationId: number;
  message: string;
}

const NotificationList: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = Cookies.get('token'); // Pobierz token z ciasteczka
        const response = await fetch('https://localhost:5001/api/Account/Notification', {
          headers: {
            'Authorization': `Bearer ${token}` // Dodaj token do nagłówka
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch notifications');
        }

        const data = await response.json();

        if (data.message === "Brak nowych powiadomień.") {
          toast.info(data.message);
        } else {
          setNotifications(data);
        }
      } catch (error) {
        toast.error('Wystąpił błąd podczas pobierania powiadomień.');
      }
    };

    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await markNotificationAsRead(notificationId);
      // Odśwież listę powiadomień lub usuń przeczytane powiadomienie z listy
      setNotifications(notifications.filter(notification => notification.notificationId !== notificationId));
      toast.success('Powiadomienie zostało oznaczone jako przeczytane.');
    } catch (error) {
      toast.error('Wystąpił błąd podczas oznaczania powiadomienia jako przeczytanego.');
    }
  };

  return (
    <div>
      <h2>Powiadomienia</h2>
      <ul>
        {notifications.map(notification => (
          <li key={notification.notificationId}>
            {notification.message}
            <button onClick={() => handleMarkAsRead(notification.notificationId)}>Oznacz jako przeczytane</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NotificationList;

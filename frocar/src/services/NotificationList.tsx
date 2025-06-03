import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { notificationService } from './NotificationService'; 

interface Notification {
  notificationId: number;
  message: string;
}

const NotificationList: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const handleNewNotifications = useCallback((newNotifications: Notification[]) => {
    setNotifications(newNotifications);

  }, []);

  useEffect(() => {
    notificationService.subscribe(handleNewNotifications);
    return () => {
      notificationService.unsubscribe(handleNewNotifications);
    };
  }, [handleNewNotifications]); 

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await notificationService.markNotificationAsRead(notificationId);
      setNotifications(prevNotifications => 
        prevNotifications.filter(notification => notification.notificationId !== notificationId)
      );
      toast.success('Powiadomienie zostało oznaczone jako przeczytane.');
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
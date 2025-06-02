import Cookies from 'js-cookie'; 
import { toast } from 'react-toastify'; 


interface Notification {
  message: string;
  notificationId: number;
}


type NotificationCallback = (notifications: Notification[]) => void;

class NotificationService {
  private observers: NotificationCallback[] = []; 
  private apiUrl: string = 'https://localhost:5001/api/Account/Notification'; 
  private intervalId: NodeJS.Timeout | null = null; 

 
   
  subscribe(callback: NotificationCallback): void {
    this.observers.push(callback);
    console.log('Subskrybent dodany. Obecna liczba obserwatorów:', this.observers.length);
  }

 
   
  unsubscribe(callback: NotificationCallback): void {
    this.observers = this.observers.filter(observer => observer !== callback);
    console.log('Subskrybent usunięty. Obecna liczba obserwatorów:', this.observers.length);
  }
  
  private notifyObservers(notifications: Notification[]): void {
    this.observers.forEach(callback => callback(notifications));
  }

  
   
   
  async fetchNotifications(): Promise<void> {
    const token = Cookies.get('token');
    if (!token) {
      console.warn('Brak tokena, nie można pobrać powiadomień. Zatrzymuję polling.');
      this.stopPolling(); 
      
      return;
    }

    try {
      const response = await fetch(this.apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data: Notification[] | { message: string } = await response.json();

      
      if ('message' in data && data.message === "Brak nowych powiadomień.") {
        this.notifyObservers([]); 
        
      } else if (Array.isArray(data) && data.length > 0) {
        
        this.notifyObservers(data);

        
        await Promise.all(data.map(notification =>
          this.markNotificationAsRead(notification.notificationId)
        ));
        console.log('Nowe powiadomienia przetworzone i oznaczone jako przeczytane.');
      } else {
        
        this.notifyObservers([]);
      }
    } catch (error) {
      console.error('Wystąpił błąd podczas pobierania powiadomień:', error);
      toast.error('Wystąpił błąd podczas pobierania powiadomień.'); 
    }
  }

  async markNotificationAsRead(notificationId: number): Promise<void> {
    try {
      const token = Cookies.get('token');
      if (!token) {
        throw new Error('Brak tokena, nie można oznaczyć powiadomienia jako przeczytanego.');
      }

      const response = await fetch(`${this.apiUrl}/${notificationId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to mark notification as read: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log(`Powiadomienie ${notificationId} oznaczone jako przeczytane:`, data.message);

    
    } catch (error) {
      console.error('Błąd podczas oznaczania powiadomienia jako przeczytanego:', error);
      toast.error('Wystąpił błąd podczas oznaczania powiadomienia jako przeczytanego.'); 
      throw error; 
    }
  }

   
  startPolling(intervalTime: number = 10000): void {
    if (this.intervalId) {
      clearInterval(this.intervalId); 
    }
    this.intervalId = setInterval(() => this.fetchNotifications(), intervalTime);
    console.log(`Rozpoczęto polling powiadomień co ${intervalTime / 1000} sekund.`);
    this.fetchNotifications(); 
  }

 
  stopPolling(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Zatrzymano polling powiadomień.');
    }
  }
}


export const notificationService = new NotificationService();
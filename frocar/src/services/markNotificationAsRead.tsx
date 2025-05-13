import Cookies from 'js-cookie';

const markNotificationAsRead = async (notificationId: number): Promise<void> => {
  try {
    const token = Cookies.get('token'); 
    const response = await fetch(`https://localhost:5001/api/Account/Notification/${notificationId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to mark notification as read');
    }

    const data = await response.json();
    console.log(data.message);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

export default markNotificationAsRead;

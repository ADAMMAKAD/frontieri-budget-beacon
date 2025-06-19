
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Bell, Check, Trash2, AlertCircle, Info, CheckCircle } from 'lucide-react';

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

interface NotificationCenterProps {
  onNotificationUpdate?: () => void;
}

const NotificationCenter = ({ onNotificationUpdate }: NotificationCenterProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const data = await apiClient.getNotifications(user?.id || '');
      setNotifications(data?.notifications || data?.data || data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: "Error",
        description: "Failed to load notifications",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await apiClient.markNotificationAsRead(id);
      
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, read: true } : notif
        )
      );
      onNotificationUpdate?.();
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive"
      });
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await apiClient.deleteNotification(id);
      
      setNotifications(prev => prev.filter(notif => notif.id !== id));
      onNotificationUpdate?.();
      
      toast({
        title: "Success",
        description: "Notification deleted"
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({
        title: "Error",
        description: "Failed to delete notification",
        variant: "destructive"
      });
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
      
      if (unreadIds.length === 0) return;

      await apiClient.markAllNotificationsAsRead(unreadIds);
      
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      );
      onNotificationUpdate?.();
      
      toast({
        title: "Success",
        description: "All notifications marked as read"
      });
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark all as read",
        variant: "destructive"
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning': return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'error': return <AlertCircle className="h-5 w-5 text-red-600" />;
      default: return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getNotificationBg = (type: string, read: boolean) => {
    const base = read ? 'bg-gray-50' : 'bg-white';
    switch (type) {
      case 'success': return `${base} border-l-4 border-green-500`;
      case 'warning': return `${base} border-l-4 border-yellow-500`;
      case 'error': return `${base} border-l-4 border-red-500`;
      default: return `${base} border-l-4 border-blue-500`;
    }
  };

  const unreadCount = Array.isArray(notifications) ? notifications.filter(n => !n.read).length : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Bell className="h-6 w-6" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
            <p className="text-gray-600 mt-1">
              {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <Button onClick={markAllAsRead} variant="outline">
            <Check className="mr-2 h-4 w-4" />
            Mark All Read
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {!Array.isArray(notifications) || notifications.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
              <p className="text-gray-600">You're all caught up! New notifications will appear here.</p>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-lg ${getNotificationBg(notification.type, notification.read)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  {getNotificationIcon(notification.type)}
                  <div className="flex-1">
                    <h4 className={`font-medium ${notification.read ? 'text-gray-700' : 'text-gray-900'}`}>
                      {notification.title}
                    </h4>
                    <p className={`text-sm mt-1 ${notification.read ? 'text-gray-500' : 'text-gray-600'}`}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2 ml-4">
                  {!notification.read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAsRead(notification.id)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteNotification(notification.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export { NotificationCenter };
export default NotificationCenter;

import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { io } from 'socket.io-client';
import config from '../config';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (!user.id) {
      console.log('❌ No user ID found in localStorage');
      return;
    }

    console.log('👤 Initializing NotificationBell for user:', user.id);

    // Connect to Socket.io
    const socket = io(config.socketUrl);

    socket.on('connect', () => {
      console.log('🔔 Connected to notification server, socket ID:', socket.id);
      console.log('📝 Registering user:', user.id);
      // Register user for notifications
      socket.emit('register', user.id);
    });

    // Listen for notifications
    socket.on('notification', (notification) => {
      console.log('📬 Received notification:', notification);
      console.log('🆔 My user ID:', user.id);
      console.log('🎯 Notification for user ID:', notification.userId);
      
      // Add to notifications list (no need to filter, server already sent it to correct user)
      setNotifications(prev => [notification, ...prev].slice(0, 10)); // Keep last 10
      setUnreadCount(prev => prev + 1);

      // Show browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/vite.svg'
        });
      }
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from notification server');
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error);
    });

    // Request browser notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      console.log('🔌 Disconnecting socket');
      socket.disconnect();
    };
  }, [user.id]);

  const markAllAsRead = () => {
    setUnreadCount(0);
  };

  const handleNotificationClick = (notification) => {
    if (notification.link) {
      window.location.href = notification.link;
    }
    setShowDropdown(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => {
          setShowDropdown(!showDropdown);
          if (!showDropdown) markAllAsRead();
        }}
        className="relative p-2 rounded-full hover:bg-white/10 transition-colors"
      >
        <Bell className="text-white" size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl z-50 max-h-96 overflow-y-auto">
            <div className="p-4 border-b border-white/10">
              <h3 className="text-white font-semibold">Notifications</h3>
            </div>
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-zinc-500">
                No notifications yet
              </div>
            ) : (
              <div>
                {notifications.map((notif, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleNotificationClick(notif)}
                    className="p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        notif.type === 'assignment' ? 'bg-blue-500' :
                        notif.type === 'poll' ? 'bg-purple-500' :
                        'bg-green-500'
                      }`} />
                      <div className="flex-1">
                        <p className="text-white font-medium text-sm">{notif.title}</p>
                        <p className="text-zinc-400 text-xs mt-1">{notif.message}</p>
                        <p className="text-zinc-600 text-xs mt-1">
                          {new Date(notif.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;

import React, { useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface SessionManagerProps {
  children: React.ReactNode;
}

const SessionManager: React.FC<SessionManagerProps> = ({ children }) => {
  const { logout, isAuthenticated } = useAuth();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sessionTimeout = 30 * 60 * 1000; // 30 minutes

  // Reset session timeout
  const resetSessionTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      if (isAuthenticated) {
        logout();
      }
    }, sessionTimeout);
  };

  useEffect(() => {
    if (isAuthenticated) {
      // Reset timeout on any user activity
      window.addEventListener('mousemove', resetSessionTimeout);
      window.addEventListener('keypress', resetSessionTimeout);
      window.addEventListener('click', resetSessionTimeout);
      window.addEventListener('scroll', resetSessionTimeout);

      resetSessionTimeout();

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        window.removeEventListener('mousemove', resetSessionTimeout);
        window.removeEventListener('keypress', resetSessionTimeout);
        window.removeEventListener('click', resetSessionTimeout);
        window.removeEventListener('scroll', resetSessionTimeout);
      };
    }
  }, [isAuthenticated]);

  return <>{children}</>;
};

export default SessionManager;
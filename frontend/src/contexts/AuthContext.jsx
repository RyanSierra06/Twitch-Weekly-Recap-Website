import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;

  const fetchUser = async (isRetry = false) => {
    try {
      console.log('Fetching user data...', isRetry ? '(retry attempt)' : '');
      
      const res = await fetch(`${BACKEND_BASE_URL}/api/user`, { 
        credentials: 'include'
      });
      
      console.log('User fetch response status:', res.status);
      
      if (res.ok) {
        const data = await res.json();
        console.log('User data received:', data);
        setUser(data);
        setRetryCount(0); // Reset retry count on success
      } else {
        console.log('User fetch failed with status:', res.status);
        const errorData = await res.json().catch(() => ({}));
        console.log('Error data:', errorData);
        
        // If this is a retry and we're still getting 401, try session recovery
        if (isRetry && retryCount >= 2) {
          console.log('Attempting session recovery...');
          const recoverySuccess = await attemptSessionRecovery();
          if (recoverySuccess) {
            // Try fetching user again after recovery
            const retryRes = await fetch(`${BACKEND_BASE_URL}/api/user`, { 
              credentials: 'include'
            });
            
            if (retryRes.ok) {
              const retryData = await retryRes.json();
              console.log('User data received after recovery:', retryData);
              setUser(retryData);
              setRetryCount(0);
              return;
            }
          }
          
          console.log('Session recovery failed, setting user to null');
          setUser(null);
          setRetryCount(0);
        } else if (!isRetry) {
          // First attempt failed, try retrying
          setRetryCount(prev => prev + 1);
        } else {
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      if (!isRetry && retryCount < 3) {
        setRetryCount(prev => prev + 1);
      } else {
        setUser(null);
        setRetryCount(0);
      }
    } finally {
      if (!isRetry) {
        setLoading(false);
      }
    }
  };

  const attemptSessionRecovery = async () => {
    try {
      console.log('Attempting to recover session...');
      
      // First check session health
      const healthRes = await fetch(`${BACKEND_BASE_URL}/auth/session-health`, {
        credentials: 'include'
      });
      
      if (healthRes.ok) {
        const health = await healthRes.json();
        console.log('Session health:', health);
        
        // If session exists but user data is missing, try recovery
        if (health.sessionExists && !health.hasPassportUser && !health.hasSessionUser) {
          const recoveryRes = await fetch(`${BACKEND_BASE_URL}/auth/recover-session`, {
            credentials: 'include'
          });
          
          if (recoveryRes.ok) {
            const recoveryData = await recoveryRes.json();
            console.log('Session recovery successful:', recoveryData);
            return true;
          }
        }
      }
      
      return false;
    } catch (error) {
      console.error('Session recovery error:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  // Retry logic for authentication
  useEffect(() => {
    if (retryCount > 0 && retryCount <= 3) {
      console.log(`Retrying authentication (attempt ${retryCount}/3)...`);
      const timer = setTimeout(() => {
        fetchUser(true);
      }, 1000 * retryCount); // Exponential backoff: 1s, 2s, 3s
      
      return () => clearTimeout(timer);
    }
  }, [retryCount]);

  const login = () => {
    console.log('Initiating login...');
    window.location.href = `${BACKEND_BASE_URL}/auth/twitch`;
  };

  const logout = async () => {
    try {
      console.log('Logging out...');
      await fetch(`${BACKEND_BASE_URL}/auth/logout`, { credentials: 'include' });
    } catch (error) {
      console.error('Logout error:', error);
    }
    setUser(null);
    setRetryCount(0);
    window.location.href = '/';
  };

  const refreshAuth = () => {
    console.log('Manually refreshing authentication...');
    setRetryCount(0);
    setLoading(true);
    fetchUser();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
} 
import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch(`${BACKEND_BASE_URL}/api/user`, { 
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        if (res.ok) {
          const data = await res.json();
          setUser(data);
          setRetryCount(0); // Reset retry count on success
        } else {
          setUser(null);
          // Retry a few times if we get a 401, as the session might still be initializing
          if (res.status === 401 && retryCount < 3) {
            setTimeout(() => {
              setRetryCount(prev => prev + 1);
            }, 1000 * (retryCount + 1)); // Exponential backoff
            return;
          }
        }
      } catch (error) {
        console.error('Auth fetch error:', error);
        setUser(null);
        // Retry on network errors
        if (retryCount < 3) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 1000 * (retryCount + 1));
          return;
        }
      } finally {
        if (retryCount >= 3 || user !== null) {
          setLoading(false);
        }
      }
    }
    
    fetchUser();
  }, [retryCount]);

  const login = () => {
    // Clear any existing user state before redirecting
    setUser(null);
    setLoading(true);
    window.location.href = `${BACKEND_BASE_URL}/auth/twitch`;
  };

  const logout = async () => {
    try {
      await fetch(`${BACKEND_BASE_URL}/auth/logout`, { 
        credentials: 'include',
        method: 'GET'
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    setUser(null);
    setLoading(false);
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
} 
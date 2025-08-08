import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;

  const fetchUser = useCallback(async (retryCount = 0) => {
    const maxRetries = 5; // Increased for production reliability
    
    try {
      console.log(`AuthContext: Attempting to fetch user (attempt ${retryCount + 1}/${maxRetries + 1})`);
      console.log(`AuthContext: Backend URL: ${BACKEND_BASE_URL}`);
      
      const res = await fetch(`${BACKEND_BASE_URL}/api/user`, { 
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log(`AuthContext: Response status: ${res.status}`);
      
      if (res.ok) {
        const data = await res.json();
        console.log('AuthContext: User data fetched successfully:', data);
        setUser(data);
        setLoading(false);
        setInitialized(true);
      } else {
        // If we get a 401 and we're still within retry limit, try again
        if (res.status === 401 && retryCount < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, retryCount), 8000); // Increased max delay
          console.log(`AuthContext: Got 401, retrying in ${delay}ms (${retryCount + 1}/${maxRetries})`);
          setTimeout(() => {
            fetchUser(retryCount + 1);
          }, delay);
          return;
        }
        console.log('AuthContext: Max retries reached or non-401 error, setting user to null');
        setUser(null);
        setLoading(false);
        setInitialized(true);
      }
    } catch (error) {
      console.log('AuthContext: Network error:', error);
      // If there's a network error and we're still within retry limit, try again
      if (retryCount < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 8000); // Increased max delay
        console.log(`AuthContext: Network error, retrying in ${delay}ms (${retryCount + 1}/${maxRetries})`);
        setTimeout(() => {
          fetchUser(retryCount + 1);
        }, delay);
        return;
      }
      console.log('AuthContext: Max retries reached, setting user to null');
      setUser(null);
      setLoading(false);
      setInitialized(true);
    }
  }, [BACKEND_BASE_URL]);

  useEffect(() => {
    // Add initial delay for OAuth redirect case
    const initialDelay = setTimeout(() => {
      fetchUser();
    }, 1000); // Increased to 1 second for production stability
    
    // Add a timeout to ensure loading doesn't get stuck
    const timeout = setTimeout(() => {
      if (loading && !initialized) {
        console.log('AuthContext: Loading timeout reached, setting user to null');
        setUser(null);
        setLoading(false);
        setInitialized(true);
      }
    }, 10000); // Increased to 10 seconds for production
    
    return () => {
      clearTimeout(timeout);
      clearTimeout(initialDelay);
    };
  }, [fetchUser, loading, initialized]);

  const login = () => {
    window.location.href = `${BACKEND_BASE_URL}/auth/twitch`;
  };

  const logout = async () => {
    try {
      await fetch(`${BACKEND_BASE_URL}/auth/logout`, { credentials: 'include' });
    } catch {}
    setUser(null);
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
import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;

  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 5; // Increased retries for OAuth redirect case
    let isMounted = true;
    
    async function fetchUser() {
      try {
        console.log(`AuthContext: Attempting to fetch user (attempt ${retryCount + 1}/${maxRetries + 1})`);
        const res = await fetch(`${BACKEND_BASE_URL}/api/user`, { credentials: 'include' });
        console.log(`AuthContext: Response status: ${res.status}`);
        
        if (res.ok) {
          const data = await res.json();
          console.log('AuthContext: User data fetched successfully:', data);
          if (isMounted) {
            setUser(data);
            setLoading(false);
          }
        } else {
          // If we get a 401 and we're still within retry limit, try again
          if (res.status === 401 && retryCount < maxRetries) {
            const delay = Math.min(1000 * Math.pow(2, retryCount), 8000);
            console.log(`AuthContext: Got 401, retrying in ${delay}ms (${retryCount + 1}/${maxRetries})`);
            retryCount++;
            setTimeout(() => {
              if (isMounted) fetchUser();
            }, delay);
            return;
          }
          console.log('AuthContext: Max retries reached or non-401 error, setting user to null');
          if (isMounted) {
            setUser(null);
            setLoading(false);
          }
        }
      } catch (error) {
        console.log('AuthContext: Network error:', error);
        // If there's a network error and we're still within retry limit, try again
        if (retryCount < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, retryCount), 8000);
          console.log(`AuthContext: Network error, retrying in ${delay}ms (${retryCount + 1}/${maxRetries})`);
          retryCount++;
          setTimeout(() => {
            if (isMounted) fetchUser();
          }, delay);
          return;
        }
        console.log('AuthContext: Max retries reached, setting user to null');
        if (isMounted) {
          setUser(null);
          setLoading(false);
        }
      }
    }
    fetchUser();
    
    return () => {
      isMounted = false;
    };
  }, []);

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
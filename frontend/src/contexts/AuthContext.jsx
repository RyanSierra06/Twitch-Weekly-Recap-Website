import { createContext, useContext, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();

  const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;

  useEffect(() => {
    // Check if we just returned from OAuth with success
    const authSuccess = searchParams.get('auth');
    const sessionId = searchParams.get('session');
    
    if (authSuccess === 'success' && sessionId) {
      console.log('Auth success detected, session ID:', sessionId);
      // Clear the URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [searchParams]);

  useEffect(() => {
    async function fetchUser() {
      try {
        console.log('Fetching user from:', `${BACKEND_BASE_URL}/api/user`);
        const res = await fetch(`${BACKEND_BASE_URL}/api/user`, { 
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        console.log('User fetch response status:', res.status);
        
        if (res.ok) {
          const data = await res.json();
          console.log('User data received:', data);
          setUser(data);
        } else {
          console.log('User fetch failed, status:', res.status);
          setUser(null);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    
    fetchUser();
  }, [BACKEND_BASE_URL]);

  const login = () => {
    console.log('Initiating login, redirecting to:', `${BACKEND_BASE_URL}/auth/twitch`);
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
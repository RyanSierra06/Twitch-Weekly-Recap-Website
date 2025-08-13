import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;

  useEffect(() => {
    async function fetchUser() {
      try {
        console.log('Frontend: Fetching user from:', `${BACKEND_BASE_URL}/api/user`);
        
        const res = await fetch(`${BACKEND_BASE_URL}/api/user`, { 
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Frontend: Response status:', res.status);
        console.log('Frontend: Response headers:', Object.fromEntries(res.headers.entries()));
        
        if (res.ok) {
          const data = await res.json();
          console.log('Frontend: User data received:', data);
          setUser(data);
          setError(null);
        } else {
          const errorData = await res.json().catch(() => ({}));
          console.error('Frontend: Authentication failed:', res.status, errorData);
          setUser(null);
          setError(errorData.error || 'Authentication failed');
        }
      } catch (err) {
        console.error('Frontend: Network error:', err);
        setUser(null);
        setError('Network error');
      } finally {
        setLoading(false);
      }
    }
    
    // Check if we're coming from OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const authSuccess = urlParams.get('auth');
    
    if (authSuccess === 'success') {
      console.log('Frontend: OAuth success detected, fetching user...');
      // Clear the URL parameter
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    fetchUser();
  }, []);

  const login = () => {
    console.log('Frontend: Initiating login...');
    window.location.href = `${BACKEND_BASE_URL}/auth/twitch`;
  };

  const logout = async () => {
    console.log('Frontend: Logging out...');
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/auth/logout`, { 
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      console.log('Frontend: Logout response:', res.status);
    } catch (err) {
      console.error('Frontend: Logout error:', err);
    }
    setUser(null);
    setError(null);
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
} 
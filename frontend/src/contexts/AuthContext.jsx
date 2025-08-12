import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;

  console.log('Frontend AuthContext initialized');
  console.log('BACKEND_BASE_URL:', BACKEND_BASE_URL);

  useEffect(() => {
    async function fetchUser() {
      try {
        console.log('Fetching user authentication status...');
        const res = await fetch(`${BACKEND_BASE_URL}/api/user`, { 
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        console.log('Auth response status:', res.status);
        
        if (res.ok) {
          const data = await res.json();
          console.log('User authenticated:', data);
          setUser(data);
          setRetryCount(0); // Reset retry count on success
          setLoading(false);
        } else {
          console.log('User not authenticated, status:', res.status);
          
          // Try the auth status endpoint as a fallback
          try {
            const statusRes = await fetch(`${BACKEND_BASE_URL}/auth/status`, { 
              credentials: 'include',
              headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
              }
            });
            
            if (statusRes.ok) {
              const statusData = await statusRes.json();
              console.log('Auth status fallback:', statusData);
              
              if (statusData.authenticated && statusData.user) {
                console.log('User authenticated via fallback:', statusData.user);
                setUser(statusData.user);
                setRetryCount(0);
                setLoading(false);
                return;
              }
            }
          } catch (fallbackError) {
            console.error('Fallback auth check failed:', fallbackError);
          }
          
          setUser(null);
          // Retry a few times if we get a 401, as the session might still be initializing
          if (res.status === 401 && retryCount < 3) {
            console.log(`Retrying authentication (attempt ${retryCount + 1}/3)...`);
            setTimeout(() => {
              setRetryCount(prev => prev + 1);
            }, 1000 * (retryCount + 1)); // Exponential backoff
            return;
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth fetch error:', error);
        setUser(null);
        // Retry on network errors
        if (retryCount < 3) {
          console.log(`Retrying due to network error (attempt ${retryCount + 1}/3)...`);
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 1000 * (retryCount + 1));
          return;
        }
        setLoading(false);
      }
    }
    
    fetchUser();
  }, [retryCount]);

  const login = () => {
    console.log('Initiating login...');
    // Clear any existing user state before redirecting
    setUser(null);
    setLoading(true);
    window.location.href = `${BACKEND_BASE_URL}/auth/twitch`;
  };

  const logout = async () => {
    console.log('Initiating logout...');
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
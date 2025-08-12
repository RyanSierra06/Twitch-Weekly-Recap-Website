import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;

  console.log('🔧 Frontend AuthContext initialized');
  console.log('🔧 BACKEND_BASE_URL:', BACKEND_BASE_URL);
  console.log('🔧 Current user state:', user);
  console.log('🔧 Current loading state:', loading);
  console.log('🔧 Current retry count:', retryCount);

  // Check if we're on the dashboard page and force refresh auth if needed
  useEffect(() => {
    const isOnDashboard = window.location.pathname === '/dashboard';
    const hasNoUser = !user;
    const isNotLoading = !loading;
    
    console.log('🔍 Location check - isOnDashboard:', isOnDashboard, 'hasNoUser:', hasNoUser, 'isNotLoading:', isNotLoading);
    
    if (isOnDashboard && hasNoUser && isNotLoading) {
      console.log('🔄 On dashboard with no user, forcing auth refresh...');
      setRetryCount(0);
      setLoading(true);
    }
  }, [user, loading, window.location.pathname]);

  useEffect(() => {
    async function fetchUser() {
      console.log('🔄 Starting fetchUser...');
      console.log('🔄 Retry count:', retryCount);
      
      try {
        console.log('🔄 Fetching user authentication status...');
        console.log('🔄 URL:', `${BACKEND_BASE_URL}/api/user`);
        
        const res = await fetch(`${BACKEND_BASE_URL}/api/user`, { 
          credentials: 'include'
        });
        
        console.log('🔄 Auth response status:', res.status);
        console.log('🔄 Auth response headers:', Object.fromEntries(res.headers.entries()));
        
        if (res.ok) {
          const data = await res.json();
          console.log('✅ User authenticated:', data);
          setUser(data);
          setRetryCount(0); // Reset retry count on success
          setLoading(false);
          console.log('✅ Authentication state updated successfully');
        } else {
          console.log('❌ User not authenticated, status:', res.status);
          
          // Try the auth status endpoint as a fallback
          try {
            console.log('🔄 Trying auth status fallback...');
            const statusRes = await fetch(`${BACKEND_BASE_URL}/auth/status`, { 
              credentials: 'include'
            });
            
            console.log('🔄 Status response status:', statusRes.status);
            
            if (statusRes.ok) {
              const statusData = await statusRes.json();
              console.log('🔄 Auth status fallback:', statusData);
              
              if (statusData.authenticated && statusData.user) {
                console.log('✅ User authenticated via fallback:', statusData.user);
                setUser(statusData.user);
                setRetryCount(0);
                setLoading(false);
                console.log('✅ Authentication state updated via fallback');
                return;
              }
            }
          } catch (fallbackError) {
            console.error('❌ Fallback auth check failed:', fallbackError);
          }
          
          setUser(null);
          // Retry a few times if we get a 401, as the session might still be initializing
          if (res.status === 401 && retryCount < 3) {
            console.log(`🔄 Retrying authentication (attempt ${retryCount + 1}/3)...`);
            setTimeout(() => {
              setRetryCount(prev => prev + 1);
            }, 1000 * (retryCount + 1)); // Exponential backoff
            return;
          }
          setLoading(false);
          console.log('❌ Authentication failed, setting loading to false');
        }
      } catch (error) {
        console.error('❌ Auth fetch error:', error);
        setUser(null);
        // Retry on network errors
        if (retryCount < 3) {
          console.log(`🔄 Retrying due to network error (attempt ${retryCount + 1}/3)...`);
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 1000 * (retryCount + 1));
          return;
        }
        setLoading(false);
        console.log('❌ Network error, setting loading to false');
      }
    }
    
    fetchUser();
  }, [retryCount]);

  const login = () => {
    console.log('🚀 Initiating login...');
    console.log('🚀 Redirecting to:', `${BACKEND_BASE_URL}/auth/twitch`);
    // Clear any existing user state before redirecting
    setUser(null);
    setLoading(true);
    window.location.href = `${BACKEND_BASE_URL}/auth/twitch`;
  };

  const logout = async () => {
    console.log('🚪 Initiating logout...');
    try {
      await fetch(`${BACKEND_BASE_URL}/auth/logout`, { 
        credentials: 'include',
        method: 'GET'
      });
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
    setUser(null);
    setLoading(false);
    window.location.href = '/';
  };

  console.log('🔧 AuthContext render - user:', user, 'loading:', loading);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
} 
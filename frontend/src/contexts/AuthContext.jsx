import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);

  const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL;

  const handleUrlTokens = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const refreshToken = urlParams.get('refresh_token');
    
    if (token) {
      console.log('Token found in URL, storing for authentication');
      localStorage.setItem('twitch_access_token', token);
      
      if (refreshToken) {
        localStorage.setItem('twitch_refresh_token', refreshToken);
      }

      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
      
      return token;
    }
    
    return null;
  };

  const fetchUser = async () => {
    try {
      console.log('Fetching user data...');

      const urlToken = handleUrlTokens();

      const storedAccessToken = localStorage.getItem('twitch_access_token');
      const storedRefreshToken = localStorage.getItem('twitch_refresh_token');

      const accessToken = urlToken || storedAccessToken;
      
      if (!accessToken) {
        console.log('No access token found');
        setUser(null);
        setLoading(false);
        return;
      }

      const res = await fetch(`${BACKEND_BASE_URL}/api/user`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      console.log('User fetch response status:', res.status);
      
      if (res.ok) {
        const data = await res.json();
        console.log('User data received:', data);
        setUser(data);
        setAccessToken(accessToken);
        setRefreshToken(storedRefreshToken);
      } else if (res.status === 401 && storedRefreshToken) {
        console.log('Access token expired, attempting refresh...');
        const refreshSuccess = await refreshAccessToken(storedRefreshToken);
        if (refreshSuccess) {
          const newToken = localStorage.getItem('twitch_access_token');
          const retryRes = await fetch(`${BACKEND_BASE_URL}/api/user`, {
            headers: {
              'Authorization': `Bearer ${newToken}`
            }
          });
          
          if (retryRes.ok) {
            const retryData = await retryRes.json();
            console.log('User data received after token refresh:', retryData);
            setUser(retryData);
            setAccessToken(newToken);
            setRefreshToken(localStorage.getItem('twitch_refresh_token'));
          } else {
            console.log('Token refresh failed, clearing tokens');
            clearTokens();
            setUser(null);
          }
        } else {
          console.log('Token refresh failed, clearing tokens');
          clearTokens();
          setUser(null);
        }
      } else {
        console.log('Authentication failed, clearing tokens');
        clearTokens();
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      clearTokens();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshAccessToken = async (refreshToken) => {
    try {
      const response = await fetch(`${BACKEND_BASE_URL}/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken })
      });
      
      if (response.ok) {
        const tokenData = await response.json();
        localStorage.setItem('twitch_access_token', tokenData.access_token);
        if (tokenData.refresh_token) {
          localStorage.setItem('twitch_refresh_token', tokenData.refresh_token);
        }
        console.log('Access token refreshed successfully');
        return true;
      } else {
        console.error('Token refresh failed:', response.status);
        return false;
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      return false;
    }
  };

  const clearTokens = () => {
    localStorage.removeItem('twitch_access_token');
    localStorage.removeItem('twitch_refresh_token');
    setAccessToken(null);
    setRefreshToken(null);
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = () => {
    console.log('Initiating login...');
    window.location.href = `${BACKEND_BASE_URL}/auth/twitch`;
  };

  const logout = async () => {
    try {
      console.log('Logging out...');
      await fetch(`${BACKEND_BASE_URL}/auth/logout`);
    } catch (error) {
      console.error('Logout error:', error);
    }
    clearTokens();
    setUser(null);
    window.location.href = '/';
  };

  const refreshAuth = () => {
    console.log('Manually refreshing authentication...');
    setLoading(true);
    fetchUser();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshAuth, accessToken, setAccessToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
} 
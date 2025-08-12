import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionInfo, setSessionInfo] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://twitch-weekly-recap-website.onrender.com';

  // Check for session info in URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionParam = urlParams.get('session');
    
    if (sessionParam) {
      try {
        const sessionData = JSON.parse(decodeURIComponent(sessionParam));
        console.log('Found session info in URL:', sessionData);
        setSessionInfo(sessionData);
        
        // Store session info in localStorage as fallback
        localStorage.setItem('twitch_session_info', JSON.stringify(sessionData));
        
        // Clean up URL
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      } catch (error) {
        console.error('Error parsing session info from URL:', error);
      }
    } else {
      // Check localStorage for existing session info
      const storedSession = localStorage.getItem('twitch_session_info');
      if (storedSession) {
        try {
          const sessionData = JSON.parse(storedSession);
          console.log('Found session info in localStorage:', sessionData);
          setSessionInfo(sessionData);
        } catch (error) {
          console.error('Error parsing stored session info:', error);
          localStorage.removeItem('twitch_session_info');
        }
      }
    }
  }, []);

  const fetchUser = async (retryCount = 0) => {
    try {
      console.log('Fetching user data...');
      
      const response = await fetch(`${API_BASE_URL}/api/user`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          // Add session info as header if available
          ...(sessionInfo && { 'X-Session-Info': JSON.stringify(sessionInfo) })
        }
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const userData = await response.json();
        console.log('User data received:', userData);
        setUser(userData);
        setLoading(false);
        return userData;
      } else if (response.status === 401) {
        console.log('User not authenticated (401)');
        
        // Try fallback auth status endpoint
        if (retryCount === 0) {
          console.log('Trying fallback auth status endpoint...');
          return await fetchAuthStatus(retryCount + 1);
        }
        
        setUser(null);
        setLoading(false);
        return null;
      } else {
        console.error('Unexpected response status:', response.status);
        setUser(null);
        setLoading(false);
        return null;
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      
      if (retryCount < 3) {
        console.log(`Retrying fetchUser (attempt ${retryCount + 1})...`);
        setTimeout(() => fetchUser(retryCount + 1), Math.pow(2, retryCount) * 1000);
        return null;
      }
      
      setUser(null);
      setLoading(false);
      return null;
    }
  };

  const fetchAuthStatus = async (retryCount = 0) => {
    try {
      console.log('Fetching auth status...');
      
      const response = await fetch(`${API_BASE_URL}/auth/status`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          // Add session info as header if available
          ...(sessionInfo && { 'X-Session-Info': JSON.stringify(sessionInfo) })
        }
      });

      console.log('Auth status response:', response.status);

      if (response.ok) {
        const authData = await response.json();
        console.log('Auth status data:', authData);
        
        if (authData.authenticated && authData.user) {
          setUser(authData.user);
          setLoading(false);
          return authData.user;
        }
      }
      
      setUser(null);
      setLoading(false);
      return null;
    } catch (error) {
      console.error('Error fetching auth status:', error);
      
      if (retryCount < 2) {
        console.log(`Retrying fetchAuthStatus (attempt ${retryCount + 1})...`);
        setTimeout(() => fetchAuthStatus(retryCount + 1), Math.pow(2, retryCount) * 1000);
        return null;
      }
      
      setUser(null);
      setLoading(false);
      return null;
    }
  };

  useEffect(() => {
    console.log('AuthContext: Initializing...');
    fetchUser();
  }, [sessionInfo]);

  const login = () => {
    console.log('Initiating login...');
    setUser(null);
    setLoading(true);
    window.location.href = `${API_BASE_URL}/auth/twitch`;
  };

  const logout = async () => {
    console.log('Logging out...');
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'GET',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setUser(null);
      setSessionInfo(null);
      localStorage.removeItem('twitch_session_info');
      window.location.href = '/';
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    sessionInfo
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 
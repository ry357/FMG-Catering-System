import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { googleAuthService } from '../services/googleAuthService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedCustomer = localStorage.getItem('customer');
    if (savedCustomer) {
      try { setCustomer(JSON.parse(savedCustomer)); } catch { localStorage.removeItem('customer'); }
    }
    if (token) {
      verifyToken(token);
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async (token) => {
    try {
      const response = await axios.get('/api/auth/verify', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data.user);
    } catch (error) {
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

const login = async (username, password) => {
  const response = await axios.post('/api/auth/login', { username, password });
  localStorage.setItem('token', response.data.token);
  setUser(response.data.user);
  return response.data;
};

// TEMP: OTP flow disabled for testing. verifyOTP/sendOTP kept for re-wiring later.
const verifyOTP = async (otpId, otp) => {
  const response = await axios.post('/api/auth/otp/verify', { otpId, otp });
  localStorage.setItem('token', response.data.token);
  setUser(response.data.user);
  return response.data;
};

const sendOTP = async (username) => {
  await axios.post('/api/auth/otp/send', { username });
};

const loginWithGoogle = useCallback(async (credential) => {
  const response = await googleAuthService.verifyCredential(credential);
  if (response.success) {
    setCustomer(response.customer);
    localStorage.setItem('customer', JSON.stringify(response.customer));
    return response;
  }
  throw new Error(response.error || 'Google sign-in failed');
}, []);

const logoutCustomer = useCallback(() => {
  setCustomer(null);
  localStorage.removeItem('customer');
}, []);

const logout = () => {
  localStorage.removeItem('token');
  setUser(null);
};

return (
  <AuthContext.Provider value={{ user, customer, login, loginWithGoogle, logoutCustomer, verifyOTP, sendOTP, logout, loading }}>
    {children}
  </AuthContext.Provider>
);
};

export const useAuth = () => useContext(AuthContext);

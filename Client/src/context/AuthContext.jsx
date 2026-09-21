import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { googleAuthService } from '../services/googleAuthService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [customerToken, setCustomerToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedCustomer = localStorage.getItem('customer');
    const savedToken = localStorage.getItem('customerToken');

    if (savedCustomer) {
      try { setCustomer(JSON.parse(savedCustomer)); } catch { localStorage.removeItem('customer'); }
    }
    if (savedToken) {
      setCustomerToken(savedToken);
    }

    if (token) {
      verifyToken(token);
    } else if (savedToken) {
      verifyCustomerToken(savedToken);
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

  const verifyCustomerToken = async (token) => {
    try {
      const response = await axios.get('/api/customer/verify', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCustomer(response.data.customer);
      localStorage.setItem('customer', JSON.stringify(response.data.customer));
    } catch (error) {
      setCustomerToken(null);
      setCustomer(null);
      localStorage.removeItem('customerToken');
      localStorage.removeItem('customer');
    } finally {
      setLoading(false);
    }
  };

  const setCustomerSession = (tokenValue, customerValue) => {
    setCustomerToken(tokenValue);
    setCustomer(customerValue);
    localStorage.setItem('customerToken', tokenValue);
    localStorage.setItem('customer', JSON.stringify(customerValue));
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

// ── Customer email + password login ────────────────────────────
const customerLogin = async (email, password) => {
  const response = await axios.post('/api/customer/login', { email, password });
  setCustomerSession(response.data.token, response.data.customer);
  return response.data;
};

// ── Customer email + password registration ─────────────────────
const customerRegister = async (name, email, password) => {
  const response = await axios.post('/api/customer/register', { name, email, password });
  setCustomerSession(response.data.token, response.data.customer);
  return response.data;
};

// ── Customer OTP login ─────────────────────────────────────────
const sendCustomerOtp = async (email) => {
  const response = await axios.post('/api/customer/otp/send', { email });
  return response.data;
};

const verifyCustomerOtp = async (otpId, otp) => {
  const response = await axios.post('/api/customer/otp/verify', { otpId, otp });
  setCustomerSession(response.data.token, response.data.customer);
  return response.data;
};

const loginWithGoogle = useCallback(async (credential) => {
  const response = await googleAuthService.verifyCredential(credential);
  if (response.success) {
    setCustomerSession(response.token, response.customer);
    return response;
  }
  throw new Error(response.error || 'Google sign-in failed');
}, []);

const logoutCustomer = useCallback(() => {
  setCustomer(null);
  setCustomerToken(null);
  localStorage.removeItem('customerToken');
  localStorage.removeItem('customer');
}, []);

const logout = () => {
  localStorage.removeItem('token');
  setUser(null);
};

return (
  <AuthContext.Provider value={{ user, customer, customerToken, login, customerLogin, customerRegister, sendCustomerOtp, verifyCustomerOtp, loginWithGoogle, logoutCustomer, verifyOTP, sendOTP, logout, loading }}>
    {children}
  </AuthContext.Provider>
);
};

export const useAuth = () => useContext(AuthContext);
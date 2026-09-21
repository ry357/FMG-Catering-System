import { createContext, useContext, useState, useCallback } from 'react';
import LoginModal from '../components/auth/LoginModal';

const LoginModalContext = createContext(null);

export const LoginModalProvider = ({ children }) => {
  const [open, setOpen] = useState(false);

  const openLogin = useCallback(() => setOpen(true), []);
  const closeLogin = useCallback(() => setOpen(false), []);

  return (
    <LoginModalContext.Provider value={{ openLogin, closeLogin }}>
      {children}
      <LoginModal open={open} onClose={closeLogin} />
    </LoginModalContext.Provider>
  );
};

export const useLoginModal = () => useContext(LoginModalContext);
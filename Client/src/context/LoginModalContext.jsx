import { createContext, useContext, useState, useCallback, useRef } from 'react';
import LoginModal from '../components/auth/LoginModal';

const LoginModalContext = createContext(null);

export const LoginModalProvider = ({ children }) => {
  const [open, setOpen] = useState(false);
  const afterAuthRef = useRef(null);

  const openLogin = useCallback((afterAuth) => {
    afterAuthRef.current = afterAuth || null;
    setOpen(true);
  }, []);

  const closeLogin = useCallback(() => {
    afterAuthRef.current = null;
    setOpen(false);
  }, []);

  const handleAuthenticated = useCallback(() => {
    const afterAuth = afterAuthRef.current;
    afterAuthRef.current = null;
    setOpen(false);
    if (typeof afterAuth === 'function') afterAuth();
  }, []);

  return (
    <LoginModalContext.Provider value={{ openLogin, closeLogin }}>
      {children}
      <LoginModal open={open} onClose={closeLogin} onAuthenticated={handleAuthenticated} />
    </LoginModalContext.Provider>
  );
};

export const useLoginModal = () => useContext(LoginModalContext);
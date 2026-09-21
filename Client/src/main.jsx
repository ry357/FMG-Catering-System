import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { LoginModalProvider } from './context/LoginModalContext.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <LoginModalProvider>
        <App />
      </LoginModalProvider>
    </AuthProvider>
  </StrictMode>
);

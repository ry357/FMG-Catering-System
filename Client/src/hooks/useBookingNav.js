import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLoginModal } from '../context/LoginModalContext';

export default function useBookingNav() {
  const navigate = useNavigate();
  const { customer } = useAuth();
  const { openLogin } = useLoginModal();

  return useCallback(
    (to = '/book') => {
      if (customer) {
        navigate(to);
      } else {
        openLogin(() => navigate(to));
      }
    },
    [customer, navigate, openLogin]
  );
}
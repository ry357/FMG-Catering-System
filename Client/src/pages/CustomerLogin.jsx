import { Link, useNavigate, useLocation } from 'react-router-dom';
import AuthCard from '../components/auth/AuthCard';

export default function CustomerLogin() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleAuthenticated = () => {
    const from = location.state?.from?.pathname || '/reviews';
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-white via-gold-50/60 to-gold-100/60">
      <div className="w-full max-w-md">
        <nav className="mb-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="font-display text-2xl font-semibold text-charcoal">
              FMG <span className="text-gold-600">Catering</span>
            </span>
          </Link>
          <Link to="/" className="text-sm font-medium text-gold-700 hover:text-gold-800">
            ← Back to site
          </Link>
        </nav>

        <div className="bg-white rounded-2xl p-8 shadow-elevated border border-gold-100">
          <AuthCard onAuthenticated={handleAuthenticated} />
        </div>

        <p className="mt-6 text-center text-xs text-charcoal-muted">
          Staff or admin? <Link to="/login" className="text-gold-700 hover:text-gold-800 font-medium">Staff portal</Link>
        </p>
      </div>
    </div>
  );
}
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import BookingPage from './pages/BookingPage';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCancel from './pages/PaymentCancel';
import Login from './pages/Login';
import CustomerLogin from './pages/CustomerLogin';
import AboutPage from './pages/AboutPage';
import ServicesPage from './pages/ServicesPage';
import DiscoverPage from './pages/DiscoverPage';
import MenusPage from './pages/MenusPage';
import ReviewsPage from './pages/ReviewsPage';
import ContactPage from './pages/ContactPage';
import StaffDashboard from './pages/StaffDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/layout/ScrollToTop';

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/discover" element={<DiscoverPage />} />
        <Route path="/menus" element={<MenusPage />} />
        <Route path="/reviews" element={<ReviewsPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/book" element={<BookingPage />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/payment/cancel" element={<PaymentCancel />} />
        <Route path="/login" element={<Login />} />
        <Route path="/customer/login" element={<CustomerLogin />} />
        <Route
          path="/staff/dashboard"
          element={
            <ProtectedRoute allowedRoles={['staff', 'admin']}>
              <StaffDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

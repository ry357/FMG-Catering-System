import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import MenuSection from '../components/landing/MenuSection';
import BookNow from '../components/landing/BookNow';
import { PACKAGES } from '../data/landingData';
import { scrollToSection } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';
import ClientSkeleton from '../components/ui/ClientSkeleton';

export default function BookingPage() {
  const { customer, loading } = useAuth();
  const navigate = useNavigate();
  const [bookingDetails, setBookingDetails] = useState(null);
  const [searchParams] = useSearchParams();
  const packageId = searchParams.get('package');
  const selectedPackage = PACKAGES.find((pkg) => String(pkg.id) === packageId) || null;

  useEffect(() => {
    if (!loading && !customer) {
      navigate('/', { replace: true });
    }
  }, [customer, loading, navigate]);

  useEffect(() => {
    const handleStartBooking = (event) => setBookingDetails(event.detail);
    window.addEventListener('startMenuBooking', handleStartBooking);
    return () => window.removeEventListener('startMenuBooking', handleStartBooking);
  }, []);

  useEffect(() => {
    if (bookingDetails) requestAnimationFrame(() => scrollToSection('#book'));
  }, [bookingDetails]);

  if (loading) {
    return <ClientSkeleton type="booking" />;
  }

  if (!customer) {
    return null;
  }

  return (
    <>
      <Navbar />
      <main className="pt-16 md:pt-20">

        {!bookingDetails ? (
          <div className="animate-in fade-in duration-500">
            <MenuSection initialPackage={selectedPackage} />
          </div>
        ) : (
          <div className="animate-in slide-in-from-bottom-8 fade-in duration-500">
            <BookNow 
              initialMenuBooking={bookingDetails} 
              onBackToPackages={() => {
                setBookingDetails(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }} 
            />
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

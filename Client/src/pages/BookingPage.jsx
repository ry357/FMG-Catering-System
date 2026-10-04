import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import MenuSection from '../components/landing/MenuSection';
import BookNow from '../components/landing/BookNow';
import { PACKAGES } from '../data/landingData';
import { scrollToSection } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';

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

  if (!loading && !customer) {
    return null;
  }

  return (
    <>
      <Navbar />
      <main className="pt-16 md:pt-20">
        <div className="bg-white/80 border-b border-gold-100 py-4 px-4 sticky top-16 md:top-20 z-40 backdrop-blur-md">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
             <div className="flex flex-col items-center w-24">
               <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${!bookingDetails ? 'bg-gold-500 text-white shadow-md' : 'bg-gold-100 text-gold-600'}`}>1</div>
               <span className={`text-[10px] uppercase tracking-wider mt-2 font-semibold text-center ${!bookingDetails ? 'text-charcoal' : 'text-charcoal-muted'}`}>Package</span>
             </div>
             <div className={`flex-1 h-0.5 mx-2 rounded-full ${bookingDetails ? 'bg-gold-400' : 'bg-gold-100'}`}></div>
             <div className="flex flex-col items-center w-24">
               <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${bookingDetails ? 'bg-gold-500 text-white shadow-md' : 'bg-gold-100 text-gold-600'}`}>2</div>
               <span className={`text-[10px] uppercase tracking-wider mt-2 font-semibold text-center ${bookingDetails ? 'text-charcoal' : 'text-charcoal-muted'}`}>Details</span>
             </div>
             <div className={`flex-1 h-0.5 mx-2 rounded-full bg-gold-100`}></div>
             <div className="flex flex-col items-center w-24">
               <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm bg-gold-100 text-gold-600`}>3</div>
               <span className={`text-[10px] uppercase tracking-wider mt-2 font-semibold text-center text-charcoal-muted`}>Payment</span>
             </div>
          </div>
        </div>
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

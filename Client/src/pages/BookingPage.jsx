import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import MenuSection from '../components/landing/MenuSection';
import BookNow from '../components/landing/BookNow';
import { PACKAGES } from '../data/landingData';
import { scrollToSection } from '../utils/helpers';

export default function BookingPage() {
  const [bookingDetails, setBookingDetails] = useState(null);
  const [searchParams] = useSearchParams();
  const packageId = searchParams.get('package');
  const selectedPackage = PACKAGES.find((pkg) => String(pkg.id) === packageId) || null;

  useEffect(() => {
    const handleStartBooking = (event) => setBookingDetails(event.detail);
    window.addEventListener('startMenuBooking', handleStartBooking);
    return () => window.removeEventListener('startMenuBooking', handleStartBooking);
  }, []);

  useEffect(() => {
    if (bookingDetails) requestAnimationFrame(() => scrollToSection('#book'));
  }, [bookingDetails]);

  return (
    <>
      <Navbar />
      <main className="pt-16 md:pt-20">
        <MenuSection initialPackage={selectedPackage} />
        <BookNow initialMenuBooking={bookingDetails} />
      </main>
      <Footer />
    </>
  );
}

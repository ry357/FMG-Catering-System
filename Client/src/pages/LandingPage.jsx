import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLoginModal } from '../context/LoginModalContext';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Hero from '../components/landing/Hero';
import OffersSection from '../components/landing/OffersSection';
import HowItWorks from '../components/landing/HowItWorks';
import ReadySection from '../components/landing/ReadySection';
import Gallery from '../components/landing/Gallery';
import FeaturedDishes from '../components/landing/FeaturedDishes';
import Testimonials from '../components/landing/Testimonials';

export default function LandingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { openLogin } = useLoginModal();

  useEffect(() => {
    if (searchParams.get('login') === 'true') {
      openLogin();
      searchParams.delete('login');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, openLogin, setSearchParams]);
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <FeaturedDishes />
        <Gallery />
        <OffersSection />
        <HowItWorks />
        <Testimonials />
        <ReadySection />
      </main>
      <Footer />
    </>
  );
}
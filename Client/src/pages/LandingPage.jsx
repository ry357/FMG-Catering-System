import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Hero from '../components/landing/Hero';
import OffersSection from '../components/landing/OffersSection';
import HowItWorks from '../components/landing/HowItWorks';
import ReadySection from '../components/landing/ReadySection';
import Gallery from '../components/landing/Gallery';

import Testimonials from '../components/landing/Testimonials';

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
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
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Hero from '../components/landing/Hero';
import About from '../components/landing/About';
import Services from '../components/landing/Services';
import Packages from '../components/landing/Packages';
import Testimonials from '../components/landing/Testimonials';
import Contact from '../components/landing/Contact';

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <About />
        <Services />
<Packages />
        <Testimonials />
        <Contact />
      </main>
      <Footer />
    </>
  );
}

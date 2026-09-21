import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Contact from '../components/landing/Contact';

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main className="pt-16 md:pt-20">
        <Contact />
      </main>
      <Footer />
    </>
  );
}
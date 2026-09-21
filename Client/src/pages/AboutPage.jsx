import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import About from '../components/landing/About';

const STATS = [
  { value: '500+', label: 'Events Catered' },
  { value: '15+', label: 'Years Experience' },
  { value: '98%', label: 'Client Satisfaction' },
];

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="pt-16 md:pt-20">
        <About />
        <section className="bg-white pb-16 md:pb-24">
          <div className="section-container">
            <div className="grid gap-6 sm:grid-cols-3">
              {STATS.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-gold-100 bg-gold-50/60 p-8 text-center"
                >
                  <p className="font-display text-4xl font-bold text-gold-600">{stat.value}</p>
                  <p className="mt-2 text-sm text-charcoal-muted">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
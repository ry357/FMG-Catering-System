import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Discover from '../components/landing/Discover';
import MarketGrid from '../components/landing/MarketGrid';

export default function DiscoverPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const updateQuery = (value) => {
    setSearchParams(value ? { q: value } : {}, { replace: true });
  };

  return (
    <>
      <Navbar />
      <main className="pt-16 md:pt-20">
        <Discover query={query} onChange={updateQuery} onPick={updateQuery} />
        <MarketGrid query={query} onClear={() => updateQuery('')} />
      </main>
      <Footer />
    </>
  );
}
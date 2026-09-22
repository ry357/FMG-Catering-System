import { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import SectionHeading from '../components/ui/SectionHeading';
import Button from '../components/ui/Button';
import { TESTIMONIALS } from '../data/landingData';
import { useAuth } from '../context/AuthContext';
import { useLoginModal } from '../context/LoginModalContext';
import Skeleton from '../components/ui/Skeleton';
import reviewsBackground from '../assets/reviews-background.jpg';

function StarRating({ rating, onChange = null, size = 'h-5 w-5' }) {
  return (
    <div className={`flex gap-1 ${onChange ? 'justify-center' : ''}`} aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <button
          key={i}
          type="button"
          disabled={!onChange}
          onClick={() => onChange && onChange(i + 1)}
          className={`${size} ${i < rating ? 'text-gold-500' : 'text-gray-200'} ${onChange ? 'cursor-pointer transition-transform hover:scale-110' : ''}`}
          aria-label={`${i + 1} star${i === 0 ? '' : 's'}`}
        >
          <svg className="h-full w-full" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function ReviewsPage() {
  const { customer, customerToken } = useAuth();
  const { openLogin } = useLoginModal();
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  const [rating, setRating] = useState(5);
  const [eventType, setEventType] = useState('');
  const [quote, setQuote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState('');
  const [formError, setFormError] = useState('');

  const fetchReviews = async () => {
    setLoadingReviews(true);
    try {
      const response = await axios.get('/api/reviews');
      setReviews(response.data.reviews || []);
    } catch (error) {
      console.error('Failed to load reviews:', error);
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setFormMessage('');
    setFormError('');
    setSubmitting(true);
    try {
      const response = await axios.post(
        '/api/reviews',
        { rating, event_type: eventType, quote },
        { headers: { Authorization: `Bearer ${customerToken}` } }
      );
      setReviews((prev) => [response.data.review, ...prev]);
      setRating(5);
      setEventType('');
      setQuote('');
      setFormMessage('Your review was submitted successfully. Thank you!');
    } catch (error) {
      setFormError(error.response?.data?.error || 'Failed to submit your review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const displayReviews = reviews.length > 0 ? reviews : TESTIMONIALS;

  return (
    <>
      <Navbar />
      <main className="pt-16 md:pt-20">
        <section id="testimonials" className="section-padding relative overflow-hidden bg-charcoal">
          <img
            src={reviewsBackground}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover opacity-40"
            loading="lazy"
          />
          <div className="section-container relative z-10">
            <SectionHeading
              label="Testimonials"
              title="What Our Clients Say"
              description="Trusted for weddings, corporate events, and celebrations. Leave a review after booking with us."
              light
            />

            {/* Review submission */}
            <div className="max-w-2xl mx-auto mb-16">
              {customer ? (
                <form
                  onSubmit={handleSubmitReview}
                  className="bg-white rounded-2xl p-8 shadow-card border border-gold-100"
                >
                  <h3 className="font-display text-2xl font-semibold text-charcoal mb-2">
                    Share your experience
                  </h3>
                  <p className="text-sm text-charcoal-muted mb-6">
                    Logged in as <span className="font-medium text-gold-700">{customer.name}</span> ({customer.email})
                  </p>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-charcoal-light mb-2">Your rating</label>
                      <StarRating rating={rating} onChange={setRating} size="h-7 w-7" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-charcoal-light mb-2">Event type (optional)</label>
                      <input
                        type="text"
                        value={eventType}
                        onChange={(e) => setEventType(e.target.value)}
                        placeholder="e.g. Wedding Reception"
                        className="w-full px-4 py-3 bg-white border border-gold-200 text-charcoal placeholder:text-charcoal-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500/40 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-charcoal-light mb-2">Your review</label>
                      <textarea
                        value={quote}
                        onChange={(e) => setQuote(e.target.value)}
                        placeholder="Tell others about your FMG Catering experience..."
                        rows={4}
                        required
                        className="w-full px-4 py-3 bg-white border border-gold-200 text-charcoal placeholder:text-charcoal-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500/40 focus:border-transparent transition-all"
                      />
                    </div>

                    {formError && (
                      <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl text-sm">
                        {formError}
                      </div>
                    )}
                    {formMessage && (
                      <div className="bg-gold-50 border border-gold-200 text-gold-700 px-4 py-3 rounded-xl text-sm">
                        {formMessage}
                      </div>
                    )}

                    <Button type="submit" disabled={submitting}>
                      {submitting ? 'Submitting...' : 'Submit review'}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="bg-white rounded-2xl p-8 shadow-card border border-gold-100 text-center">
                  <h3 className="font-display text-2xl font-semibold text-charcoal mb-2">
                    Booked with us before?
                  </h3>
                  <p className="text-sm text-charcoal-muted mb-6">
                    Log in with your email to leave a review.
                  </p>
                  <Button onClick={openLogin}>Log in to leave a review</Button>
                </div>
              )}
            </div>

            {loadingReviews ? (
              <div className="grid animate-pulse gap-8 md:grid-cols-2 lg:grid-cols-3">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="rounded-2xl bg-white p-8 shadow-card">
                    <div className="flex gap-1">
                      {[0, 1, 2, 3, 4].map((s) => (
                        <Skeleton key={s} className="h-4 w-4 rounded-full" />
                      ))}
                    </div>
                    <Skeleton className="mt-5 h-4 w-full" />
                    <Skeleton className="mt-2 h-4 w-5/6" />
                    <Skeleton className="mt-2 h-4 w-4/6" />
                    <div className="mt-6 border-t border-gold-100 pt-6">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="mt-2 h-3 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {displayReviews.map((review) => (
                  <article
                    key={review.id || review.name}
                    className="bg-white rounded-2xl p-8 shadow-card hover:shadow-elevated transition-shadow duration-300"
                  >
                    <StarRating rating={review.rating || 5} />
                    <blockquote className="mt-5">
                      <p className="text-charcoal-light leading-relaxed italic">
                        &ldquo;{review.quote}&rdquo;
                      </p>
                    </blockquote>
                    <div className="mt-6 pt-6 border-t border-gold-100">
                      <p className="font-semibold text-charcoal">{review.name}</p>
                      <p className="text-sm text-gold-600 mt-1">{review.event_type || review.event}</p>
                      {review.created_at && (
                        <p className="text-xs text-charcoal-muted mt-1">{formatDate(review.created_at)}</p>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
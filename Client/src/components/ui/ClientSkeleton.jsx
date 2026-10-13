import Skeleton from './Skeleton';

/**
 * Navbar Skeleton matching public header
 */
export function NavbarSkeleton() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-white/95 shadow-[0_8px_30px_rgba(36,27,18,0.06)] backdrop-blur-md">
      <nav className="section-container flex h-16 items-center justify-between md:h-20">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl md:h-12 md:w-12" variant="gold" />
            <Skeleton className="h-6 w-44 rounded-md" />
          </div>
          <div className="hidden items-center gap-7 lg:flex">
            {[72, 60, 68, 56, 64, 60].map((width, i) => (
              <Skeleton key={i} className={`h-4 w-[${width}px] rounded`} style={{ width: `${width}px` }} />
            ))}
          </div>
        </div>
        <div className="hidden items-center gap-5 lg:flex">
          <Skeleton className="h-4 w-14 rounded" />
          <Skeleton className="h-10 w-28 !rounded-full" variant="gold" />
        </div>
        <div className="lg:hidden">
          <Skeleton className="h-9 w-9 rounded-xl" />
        </div>
      </nav>
    </header>
  );
}

/**
 * Dish Card Skeleton matching FoodDishCard
 */
export function DishCardSkeleton({ compact = false }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-gold-100 bg-white p-3 shadow-card">
      <Skeleton className={`w-full rounded-lg ${compact ? 'aspect-[4/3]' : 'aspect-[16/11]'}`} />
      <div className="mt-3 flex items-center justify-between">
        <Skeleton className="h-3 w-16 rounded-full" variant="warm" />
        <Skeleton className="h-3 w-10 rounded" />
      </div>
      <Skeleton className="mt-2 h-4 w-4/5 rounded" />
      <Skeleton className="mt-2 h-4 w-1/3 rounded font-bold" variant="gold" />
    </div>
  );
}

/**
 * Dish Grid Skeleton for menu sections, platter catalogs, and featured dishes
 */
export function DishGridSkeleton({
  count = 10,
  compact = true,
  columns = 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
}) {
  return (
    <div className={`grid gap-3.5 ${columns}`}>
      {Array.from({ length: count }).map((_, index) => (
        <DishCardSkeleton key={index} compact={compact} />
      ))}
    </div>
  );
}

/**
 * Package Card Skeleton matching Packages.jsx
 */
export function PackageCardSkeleton({ count = 3 }) {
  return (
    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="flex flex-col rounded-2xl border border-gold-100 bg-white p-8 shadow-card"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-28 rounded-full" variant="warm" />
            {index === 1 && <Skeleton className="h-5 w-24 rounded-full" variant="gold" />}
          </div>
          <Skeleton className="mt-4 h-7 w-3/4 rounded" />
          <Skeleton className="mt-2 h-4 w-full rounded" />
          <div className="mt-6 flex items-baseline gap-2">
            <Skeleton className="h-9 w-32 rounded" variant="gold" />
            <Skeleton className="h-4 w-14 rounded" />
          </div>
          <Skeleton className="mt-2 h-3 w-40 rounded" />
          <div className="mt-6 space-y-3 flex-grow">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <Skeleton className="h-3.5 w-3.5 rounded-full" variant="gold" />
                <Skeleton className="h-3.5 flex-1 rounded" />
              </div>
            ))}
          </div>
          <Skeleton className="mt-8 h-11 w-full rounded-full" variant="gold" />
        </div>
      ))}
    </div>
  );
}

/**
 * Step Progress Indicator Skeleton for booking flows
 */
export function BookingStepIndicatorSkeleton() {
  return (
    <div className="sticky top-16 z-40 border-b border-gold-100 bg-white/80 px-4 py-4 backdrop-blur-md md:top-20">
      <div className="mx-auto flex max-w-2xl items-center justify-between">
        {[1, 2, 3].map((step, idx) => (
          <div key={step} className="flex flex-1 items-center">
            <div className="flex flex-col items-center w-24">
              <Skeleton className="h-8 w-8 rounded-full" variant={idx === 0 ? 'gold' : 'default'} />
              <Skeleton className="mt-2 h-2.5 w-14 rounded" />
            </div>
            {idx < 2 && <Skeleton className="mx-2 h-0.5 flex-1 rounded-full" variant="warm" />}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Booking Page Skeleton matching the BookingPage structure
 */
export function BookingSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      <NavbarSkeleton />
      <main className="pt-16 md:pt-20">
        <BookingStepIndicatorSkeleton />
        <section className="section-container py-12 md:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <Skeleton className="mx-auto h-4 w-32 rounded-full" variant="warm" />
            <Skeleton className="mx-auto mt-3 h-8 w-64 rounded-lg md:h-10 md:w-80" />
            <Skeleton className="mx-auto mt-2 h-4 w-96 max-w-full rounded" />
          </div>

          <div className="mx-auto mt-10 max-w-4xl rounded-2xl border border-gold-100 bg-white p-6 shadow-card md:p-8">
            <div className="grid gap-6 sm:grid-cols-2">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-3.5 w-24 rounded" />
                  <Skeleton className="h-11 w-full rounded-xl" />
                </div>
              ))}
            </div>
            <div className="mt-6 space-y-2">
              <Skeleton className="h-3.5 w-32 rounded" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <Skeleton className="h-11 w-32 rounded-full" />
              <Skeleton className="h-11 w-40 rounded-full" variant="gold" />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

/**
 * Full Page Skeleton matching public landing or content page
 */
export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      <NavbarSkeleton />
      <main className="pt-16 md:pt-20">
        {/* Hero Section Skeleton */}
        <section className="relative overflow-hidden bg-gradient-to-b from-gold-50/60 to-white py-16 md:py-24">
          <div className="section-container text-center">
            <Skeleton className="mx-auto h-6 w-44 rounded-full" variant="warm" />
            <Skeleton className="mx-auto mt-5 h-10 w-4/5 max-w-2xl rounded-lg md:h-14" />
            <Skeleton className="mx-auto mt-3 h-10 w-3/5 max-w-xl rounded-lg md:h-14" />
            <Skeleton className="mx-auto mt-4 h-4 w-full max-w-md rounded" />
            <div className="mt-8 flex justify-center gap-4">
              <Skeleton className="h-12 w-36 rounded-full" variant="gold" />
              <Skeleton className="h-12 w-36 rounded-full" />
            </div>
          </div>
        </section>

        {/* Content Section Skeleton */}
        <section className="section-container section-padding">
          <div className="mx-auto max-w-2xl text-center">
            <Skeleton className="mx-auto h-4 w-28 rounded-full" variant="warm" />
            <Skeleton className="mx-auto mt-2 h-8 w-64 rounded-lg md:h-9" />
            <Skeleton className="mx-auto mt-2 h-4 w-80 max-w-full rounded" />
          </div>
          <div className="mt-10">
            <DishGridSkeleton count={8} compact={false} columns="grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4" />
          </div>
        </section>
      </main>
    </div>
  );
}

/**
 * Unified Client Skeleton Loader for the customer-facing website
 * Supports 'page', 'booking', 'dishes', 'packages'
 */
export default function ClientSkeleton({ type = 'page', count, compact, columns }) {
  switch (type) {
    case 'booking':
      return <BookingSkeleton />;
    case 'dishes':
    case 'menu':
      return <DishGridSkeleton count={count || 10} compact={compact ?? true} columns={columns} />;
    case 'packages':
      return <PackageCardSkeleton count={count || 3} />;
    case 'page':
    default:
      return <PageSkeleton />;
  }
}

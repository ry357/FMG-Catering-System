import Skeleton from './Skeleton';

const KPI_CARDS = 4;
const TABLE_ROWS = 5;

export default function DashboardSkeleton({ tabletOpen = true }) {
  return (
    <div
      className="min-h-screen"
      style={{
        background:
          'radial-gradient(1200px 560px at 85% -12%, rgba(34,211,238,0.12), transparent 60%), radial-gradient(1000px 520px at -5% 110%, rgba(255,45,120,0.09), transparent 55%), #0B1220',
      }}
    >
      <div className="sticky top-0 z-40 animate-pulse border-b border-[#1E2A45] bg-[#0B1220]/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-4">
          <Skeleton dark className="h-5 w-44" />
          <div className="flex items-center gap-4">
            <Skeleton dark className="h-4 w-32" />
            <Skeleton dark className="h-8 w-20 rounded-md" />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1600px] px-4 py-5">
        {tabletOpen && (
          <div className="mb-6 flex animate-pulse gap-1 border-b border-[#1E2A45]">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} dark className="h-9 w-24 rounded-t-md" />
            ))}
          </div>
        )}

        <div className="mb-8 grid animate-pulse grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: KPI_CARDS }).map((_, i) => (
            <div key={i} className="h-32 rounded-xl border border-[#1E2A45] bg-[#101A2E] p-5">
              <Skeleton dark className="mb-4 h-3 w-1/2" />
              <Skeleton dark className="h-7 w-2/3" />
            </div>
          ))}
        </div>

        <div className="animate-pulse overflow-hidden rounded-xl border border-[#1E2A45] bg-[#101A2E]">
          <div className="flex gap-3 border-b border-[#1E2A45] p-4">
            <Skeleton dark className="h-4 w-40" />
            <Skeleton dark className="ml-auto h-4 w-24" />
          </div>
          <div className="space-y-4 p-4">
            {Array.from({ length: TABLE_ROWS }).map((_, i) => (
              <Skeleton key={i} dark className="h-10 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}